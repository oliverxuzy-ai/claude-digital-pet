import { describe, it, expect } from 'vitest';
import { getMood } from '../src/components/Pet.js';
import type { PetState } from '../src/types.js';

function makeState(overrides: Partial<PetState> = {}): PetState {
  return {
    version: 1,
    petType: 'cat',
    name: 'Test',
    hunger: 50,
    happiness: 50,
    coins: 0,
    tokenRemainder: 0,
    totalTokensEarned: 0,
    feedCount: 0,
    playCount: 0,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('getMood', () => {
  it('returns sleeping when sleeping flag is set', () => {
    expect(getMood(makeState(), true)).toBe('sleeping');
  });

  it('returns sad when both stats are 0', () => {
    expect(getMood(makeState({ hunger: 0, happiness: 0 }), false)).toBe('sad');
  });

  it('returns hungry when hunger is low', () => {
    expect(getMood(makeState({ hunger: 10, happiness: 50 }), false)).toBe('hungry');
  });

  it('returns happy when stats are high', () => {
    expect(getMood(makeState({ hunger: 80, happiness: 90 }), false)).toBe('happy');
  });

  it('returns idle for normal stats', () => {
    expect(getMood(makeState({ hunger: 50, happiness: 50 }), false)).toBe('idle');
  });

  it('sleeping takes priority over sad', () => {
    expect(getMood(makeState({ hunger: 0, happiness: 0 }), true)).toBe('sleeping');
  });

  it('hungry at boundary (20)', () => {
    expect(getMood(makeState({ hunger: 20, happiness: 50 }), false)).toBe('hungry');
  });

  it('not hungry at 21', () => {
    expect(getMood(makeState({ hunger: 21, happiness: 50 }), false)).toBe('idle');
  });
});
