import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { TokenUsage } from '../types.js';

// Token Monitor: watches Claude Code session JSONL files
// ~/.claude/projects/**/*.jsonl -> chokidar watcher -> tokenBuffer
// Only assistant-type lines have usage data.
// file-history-snapshot and user lines are skipped.

const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');
const INACTIVE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

interface WatchedFile {
  path: string;
  offset: number;
}

export interface TokenMonitorOptions {
  onTokens: (usage: TokenUsage) => void;
  onSleepChange: (sleeping: boolean) => void;
}

export function parseTokenUsage(line: string): TokenUsage | null {
  try {
    const parsed = JSON.parse(line);
    // Only assistant messages have usage data
    if (parsed?.type !== 'assistant' && !parsed?.message?.usage) return null;
    const usage = parsed?.message?.usage;
    if (!usage) return null;

    return {
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      cacheCreationTokens: usage.cache_creation_input_tokens || 0,
      cacheReadTokens: usage.cache_read_input_tokens || 0,
    };
  } catch {
    return null;
  }
}

// Weight tokens by approximate API cost ratio:
// input: 1x, output: 1x, cache_creation: 1.25x, cache_read: 0.1x
export function totalTokens(usage: TokenUsage): number {
  return Math.round(
    usage.inputTokens +
    usage.outputTokens +
    usage.cacheCreationTokens * 1.25 +
    usage.cacheReadTokens * 0.1
  );
}

export function findActiveSessionFiles(): string[] {
  if (!fs.existsSync(CLAUDE_PROJECTS_DIR)) return [];

  const now = Date.now();
  const files: { path: string; mtime: number }[] = [];

  try {
    const projects = fs.readdirSync(CLAUDE_PROJECTS_DIR, { withFileTypes: true });
    for (const project of projects) {
      if (!project.isDirectory()) continue;
      const projectDir = path.join(CLAUDE_PROJECTS_DIR, project.name);
      try {
        const entries = fs.readdirSync(projectDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isFile() || !entry.name.endsWith('.jsonl')) continue;
          // Don't follow symlinks outside the projects directory
          const filePath = path.join(projectDir, entry.name);
          try {
            const stat = fs.statSync(filePath);
            if (now - stat.mtimeMs < INACTIVE_THRESHOLD_MS) {
              files.push({ path: filePath, mtime: stat.mtimeMs });
            }
          } catch {
            // Skip files we can't stat
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }
  } catch {
    return [];
  }

  // Sort by most recent first
  files.sort((a, b) => b.mtime - a.mtime);
  return files.map((f) => f.path);
}

export function readNewLines(filePath: string, offset: number): { lines: string[]; newOffset: number } {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size <= offset) return { lines: [], newOffset: offset };

    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(stat.size - offset);
    fs.readSync(fd, buf, 0, buf.length, offset);
    fs.closeSync(fd);

    const text = buf.toString('utf-8');
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    return { lines, newOffset: stat.size };
  } catch {
    return { lines: [], newOffset: offset };
  }
}

export function createTokenMonitor(options: TokenMonitorOptions) {
  const watchedFiles = new Map<string, WatchedFile>();
  let sleeping = false;
  let lastActivityTime = Date.now();
  let watcher: any = null;
  let scanInterval: ReturnType<typeof setInterval> | null = null;

  function processFile(filePath: string) {
    const watched = watchedFiles.get(filePath) || { path: filePath, offset: 0 };
    const { lines, newOffset } = readNewLines(filePath, watched.offset);
    watched.offset = newOffset;
    watchedFiles.set(filePath, watched);

    for (const line of lines) {
      const usage = parseTokenUsage(line);
      if (usage && totalTokens(usage) > 0) {
        lastActivityTime = Date.now();
        if (sleeping) {
          sleeping = false;
          options.onSleepChange(false);
        }
        options.onTokens(usage);
      }
    }
  }

  function scanForFiles() {
    const activeFiles = findActiveSessionFiles();
    for (const filePath of activeFiles) {
      if (!watchedFiles.has(filePath)) {
        // New file — start reading from current position (don't count old tokens)
        try {
          const stat = fs.statSync(filePath);
          watchedFiles.set(filePath, { path: filePath, offset: stat.size });
        } catch {
          // Skip
        }
      }
    }
  }

  function checkSleep() {
    const now = Date.now();
    const shouldSleep = now - lastActivityTime > INACTIVE_THRESHOLD_MS;
    if (shouldSleep && !sleeping) {
      sleeping = true;
      options.onSleepChange(true);
    }
  }

  function start() {
    scanForFiles();

    // Poll every 2 seconds — simple and reliable across all platforms.
    // chokidar v4+ has glob/event issues on macOS; polling at this
    // interval is negligible CPU for watching a few small files.
    scanInterval = setInterval(() => {
      scanForFiles();
      for (const [filePath] of watchedFiles) {
        processFile(filePath);
      }
      checkSleep();
    }, 2000);
  }

  function stop() {
    if (watcher) {
      watcher.close();
      watcher = null;
    }
    if (scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
    }
  }

  return { start, stop, checkSleep, isSleeping: () => sleeping };
}
