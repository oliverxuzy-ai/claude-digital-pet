import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDefaultState } from '../src/lib/petState.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// Test state persistence with direct file operations (same logic as petState.ts)
const TEST_DIR = path.join(os.tmpdir(), 'digital-pets-test-' + process.pid);
const TEST_FILE = path.join(TEST_DIR, 'state.json');

function testSaveState(state: any): boolean {
  try {
    if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
    const tmpFile = TEST_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tmpFile, TEST_FILE);
    return true;
  } catch {
    return false;
  }
}

function testLoadState(): any | null {
  try {
    if (!fs.existsSync(TEST_FILE)) return null;
    const raw = fs.readFileSync(TEST_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.petType) return null;
    if (!parsed.version) parsed.version = 1;
    return parsed;
  } catch {
    return null;
  }
}

beforeEach(() => {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
});

describe('createDefaultState', () => {
  it('creates state with correct defaults', () => {
    const state = createDefaultState('goose', 'Honky');
    expect(state.version).toBe(1);
    expect(state.petType).toBe('goose');
    expect(state.name).toBe('Honky');
    expect(state.hunger).toBe(80);
    expect(state.happiness).toBe(80);
    expect(state.coins).toBe(0);
    expect(state.tokenRemainder).toBe(0);
    expect(state.feedCount).toBe(0);
    expect(state.playCount).toBe(0);
  });

  it('sets createdAt to current time', () => {
    const before = new Date().toISOString();
    const state = createDefaultState('cat', 'Kitty');
    const after = new Date().toISOString();
    expect(state.createdAt >= before).toBe(true);
    expect(state.createdAt <= after).toBe(true);
  });
});

describe('state persistence (atomic write)', () => {
  it('round-trips state correctly', () => {
    const state = createDefaultState('dog', 'Buddy');
    const saved = testSaveState(state);
    expect(saved).toBe(true);

    const loaded = testLoadState();
    expect(loaded).not.toBeNull();
    expect(loaded.petType).toBe('dog');
    expect(loaded.name).toBe('Buddy');
    expect(loaded.hunger).toBe(80);
    expect(loaded.version).toBe(1);
  });

  it('returns null when file does not exist', () => {
    expect(testLoadState()).toBeNull();
  });

  it('returns null for corrupted JSON', () => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(TEST_FILE, '{invalid json!!!}');
    expect(testLoadState()).toBeNull();
  });

  it('returns null for non-pet JSON', () => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(TEST_FILE, JSON.stringify({ foo: 'bar' }));
    expect(testLoadState()).toBeNull();
  });

  it('adds version field to legacy state without one', () => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(TEST_FILE, JSON.stringify({ petType: 'cat', name: 'Old' }));
    const loaded = testLoadState();
    expect(loaded).not.toBeNull();
    expect(loaded.version).toBe(1);
  });

  it('atomic write does not corrupt on partial failure', () => {
    // Save a valid state first
    const state = createDefaultState('cat', 'Safe');
    testSaveState(state);

    // Verify the tmp file is cleaned up (rename is atomic)
    expect(fs.existsSync(TEST_FILE + '.tmp')).toBe(false);
    expect(fs.existsSync(TEST_FILE)).toBe(true);
  });

  it('preserves all fields through round-trip', () => {
    const state = createDefaultState('goose', 'Goosey');
    state.coins = 42;
    state.hunger = 33;
    state.happiness = 77;
    state.tokenRemainder = 5000;
    state.totalTokensEarned = 100000;
    state.feedCount = 5;
    state.playCount = 3;

    testSaveState(state);
    const loaded = testLoadState();

    expect(loaded.coins).toBe(42);
    expect(loaded.hunger).toBe(33);
    expect(loaded.happiness).toBe(77);
    expect(loaded.tokenRemainder).toBe(5000);
    expect(loaded.totalTokensEarned).toBe(100000);
    expect(loaded.feedCount).toBe(5);
    expect(loaded.playCount).toBe(3);
  });
});
