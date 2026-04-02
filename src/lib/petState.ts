import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { PetState, PetType } from '../types.js';

const STATE_DIR = path.join(os.homedir(), '.digital-pets');
const STATE_FILE = path.join(STATE_DIR, 'state.json');

export function getStatePath(): string {
  return STATE_FILE;
}

export function createDefaultState(petType: PetType, name: string): PetState {
  return {
    version: 1,
    petType,
    name,
    hunger: 80,
    happiness: 80,
    coins: 0,
    tokenRemainder: 0,
    totalTokensEarned: 0,
    feedCount: 0,
    playCount: 0,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
}

export function loadState(): PetState | null {
  try {
    if (!fs.existsSync(STATE_FILE)) return null;
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.petType) return null;
    // Ensure version field exists (migration compat)
    if (!parsed.version) parsed.version = 1;
    return parsed as PetState;
  } catch {
    // Corrupted file — return null so the app can offer a fresh start
    return null;
  }
}

export function saveState(state: PetState): boolean {
  try {
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    const tmpFile = STATE_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tmpFile, STATE_FILE);
    return true;
  } catch {
    // Disk full or permission error — caller should handle gracefully
    return false;
  }
}

export function stateExists(): boolean {
  return fs.existsSync(STATE_FILE);
}
