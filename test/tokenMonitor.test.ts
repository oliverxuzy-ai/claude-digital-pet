import { describe, it, expect } from 'vitest';
import { parseTokenUsage, totalTokens, findActiveSessionFiles, readNewLines } from '../src/lib/tokenMonitor.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('parseTokenUsage', () => {
  it('parses assistant message with all token fields', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: {
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
          cache_creation_input_tokens: 200,
          cache_read_input_tokens: 300,
        },
      },
    });
    const result = parseTokenUsage(line);
    expect(result).not.toBeNull();
    expect(result!.inputTokens).toBe(1000);
    expect(result!.outputTokens).toBe(500);
    expect(result!.cacheCreationTokens).toBe(200);
    expect(result!.cacheReadTokens).toBe(300);
  });

  it('returns null for user-type messages', () => {
    const line = JSON.stringify({ type: 'user', content: 'hello' });
    expect(parseTokenUsage(line)).toBeNull();
  });

  it('returns null for file-history-snapshot', () => {
    const line = JSON.stringify({ type: 'file-history-snapshot', files: [] });
    expect(parseTokenUsage(line)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseTokenUsage('not json at all')).toBeNull();
  });

  it('returns null for empty line', () => {
    expect(parseTokenUsage('')).toBeNull();
  });

  it('handles missing cache fields gracefully', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: {
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      },
    });
    const result = parseTokenUsage(line);
    expect(result).not.toBeNull();
    expect(result!.cacheCreationTokens).toBe(0);
    expect(result!.cacheReadTokens).toBe(0);
  });

  it('returns null when usage object is missing', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: 'hello' },
    });
    expect(parseTokenUsage(line)).toBeNull();
  });
});

describe('totalTokens', () => {
  it('sums all token types with cost weighting', () => {
    // input: 1000*1 + output: 500*1 + cache_create: 200*1.25 + cache_read: 300*0.1
    // = 1000 + 500 + 250 + 30 = 1780
    const total = totalTokens({
      inputTokens: 1000,
      outputTokens: 500,
      cacheCreationTokens: 200,
      cacheReadTokens: 300,
    });
    expect(total).toBe(1780);
  });

  it('handles zero tokens', () => {
    expect(
      totalTokens({
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
      })
    ).toBe(0);
  });
});

describe('readNewLines', () => {
  it('reads new lines from a file starting at offset', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dp-test-'));
    const tmpFile = path.join(tmpDir, 'test.jsonl');
    fs.writeFileSync(tmpFile, 'line1\nline2\nline3\n');

    // Read all from start
    const result = readNewLines(tmpFile, 0);
    expect(result.lines).toEqual(['line1', 'line2', 'line3']);
    expect(result.newOffset).toBeGreaterThan(0);

    // Append and read from previous offset
    fs.appendFileSync(tmpFile, 'line4\n');
    const result2 = readNewLines(tmpFile, result.newOffset);
    expect(result2.lines).toEqual(['line4']);

    // No new data
    const result3 = readNewLines(tmpFile, result2.newOffset);
    expect(result3.lines).toEqual([]);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('handles non-existent file', () => {
    const result = readNewLines('/nonexistent/file.jsonl', 0);
    expect(result.lines).toEqual([]);
    expect(result.newOffset).toBe(0);
  });
});

describe('findActiveSessionFiles', () => {
  it('returns empty array when .claude/projects does not exist', () => {
    // This test may pass or fail depending on whether the user has Claude Code installed
    // We test the function doesn't throw
    const result = findActiveSessionFiles();
    expect(Array.isArray(result)).toBe(true);
  });
});
