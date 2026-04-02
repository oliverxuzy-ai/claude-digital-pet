import { describe, it, expect } from 'vitest';
import { petDefinitions, getPetFrame } from '../src/data/pets.js';
import type { PetMood } from '../src/types.js';

const allMoods: PetMood[] = ['idle', 'happy', 'hungry', 'sleeping', 'eating', 'playing', 'sad'];

describe('petDefinitions', () => {
  it('has 3 pet types', () => {
    expect(Object.keys(petDefinitions)).toHaveLength(3);
    expect(petDefinitions.cat).toBeDefined();
    expect(petDefinitions.dog).toBeDefined();
    expect(petDefinitions.goose).toBeDefined();
  });

  it('each pet has all mood frames', () => {
    for (const [type, def] of Object.entries(petDefinitions)) {
      for (const mood of allMoods) {
        expect(def.frames[mood], `${type} missing ${mood} frames`).toBeDefined();
        expect(def.frames[mood].length, `${type} ${mood} has no frames`).toBeGreaterThan(0);
      }
    }
  });

  it('each pet has name and emoji', () => {
    for (const def of Object.values(petDefinitions)) {
      expect(def.name).toBeTruthy();
      expect(def.emoji).toBeTruthy();
    }
  });
});

describe('getPetFrame', () => {
  it('returns a frame string for valid pet and mood', () => {
    const frame = getPetFrame('cat', 'idle', 0);
    expect(typeof frame).toBe('string');
    expect(frame.length).toBeGreaterThan(0);
  });

  it('cycles through frames based on tick', () => {
    const frame0 = getPetFrame('cat', 'idle', 0);
    const frame1 = getPetFrame('cat', 'idle', 1);
    // Cat has 2 idle frames, so they should differ
    expect(frame0).not.toBe(frame1);
  });

  it('wraps around when tick exceeds frame count', () => {
    const frame0 = getPetFrame('cat', 'idle', 0);
    const frame2 = getPetFrame('cat', 'idle', 2);
    expect(frame0).toBe(frame2); // 2 % 2 = 0
  });

  it('returns ??? for unknown pet type', () => {
    expect(getPetFrame('dragon', 'idle', 0)).toBe('???');
  });

  it('falls back to idle for unknown mood', () => {
    const frame = getPetFrame('cat', 'unknown' as PetMood, 0);
    const idleFrame = getPetFrame('cat', 'idle', 0);
    expect(frame).toBe(idleFrame);
  });
});
