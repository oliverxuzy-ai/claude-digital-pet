import { describe, it, expect } from 'vitest';
import { tokensToCoins, purchaseItem, canAfford, clampStat, TOKENS_PER_COIN } from '../src/lib/economy.js';
import type { PetState, ShopItem } from '../src/types.js';

function makeState(overrides: Partial<PetState> = {}): PetState {
  return {
    version: 1,
    petType: 'cat',
    name: 'Test',
    hunger: 50,
    happiness: 50,
    coins: 100,
    tokenRemainder: 0,
    totalTokensEarned: 0,
    feedCount: 0,
    playCount: 0,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    ...overrides,
  };
}

const bread: ShopItem = {
  id: 'bread',
  name: 'Bread',
  price: 10,
  effects: [{ stat: 'hunger', value: 20 }],
  emoji: '🍞',
};

const fish: ShopItem = {
  id: 'fish',
  name: 'Fish',
  price: 25,
  effects: [{ stat: 'hunger', value: 40 }],
  emoji: '🐟',
};

describe('tokensToCoins', () => {
  it('converts tokens at the correct rate', () => {
    const result = tokensToCoins(TOKENS_PER_COIN, 0);
    expect(result.coins).toBe(1);
    expect(result.newRemainder).toBe(0);
  });

  it('accumulates remainder below threshold', () => {
    const result = tokensToCoins(5000, 0);
    expect(result.coins).toBe(0);
    expect(result.newRemainder).toBe(5000);
  });

  it('combines remainder with new tokens', () => {
    const result = tokensToCoins(5000, 7000);
    expect(result.coins).toBe(1);
    expect(result.newRemainder).toBe(2000);
  });

  it('handles large token amounts without overflow', () => {
    const result = tokensToCoins(1_000_000_000, 0);
    expect(result.coins).toBe(100_000);
    expect(result.newRemainder).toBe(0);
  });

  it('handles zero tokens', () => {
    const result = tokensToCoins(0, 500);
    expect(result.coins).toBe(0);
    expect(result.newRemainder).toBe(500);
  });

  it('handles multiple coins from large input', () => {
    const result = tokensToCoins(35000, 0);
    expect(result.coins).toBe(3);
    expect(result.newRemainder).toBe(5000);
  });
});

describe('clampStat', () => {
  it('clamps to 0 minimum', () => {
    expect(clampStat(-10)).toBe(0);
  });

  it('clamps to 100 maximum', () => {
    expect(clampStat(150)).toBe(100);
  });

  it('passes through valid values', () => {
    expect(clampStat(50)).toBe(50);
  });

  it('handles boundary values', () => {
    expect(clampStat(0)).toBe(0);
    expect(clampStat(100)).toBe(100);
  });
});

describe('canAfford', () => {
  it('returns true when coins are sufficient', () => {
    const state = makeState({ coins: 50 });
    expect(canAfford(state, bread)).toBe(true);
  });

  it('returns false when coins are insufficient', () => {
    const state = makeState({ coins: 5 });
    expect(canAfford(state, bread)).toBe(false);
  });

  it('returns true when coins exactly match price', () => {
    const state = makeState({ coins: 10 });
    expect(canAfford(state, bread)).toBe(true);
  });
});

describe('purchaseItem', () => {
  it('deducts coins and applies effects', () => {
    const state = makeState({ coins: 50, hunger: 50 });
    const result = purchaseItem(state, bread);
    expect(result).not.toBeNull();
    expect(result!.coins).toBe(40);
    expect(result!.hunger).toBe(70);
  });

  it('returns null when cannot afford', () => {
    const state = makeState({ coins: 5 });
    expect(purchaseItem(state, bread)).toBeNull();
  });

  it('clamps stat at 100 when near max', () => {
    const state = makeState({ coins: 50, hunger: 90 });
    const result = purchaseItem(state, bread);
    expect(result!.hunger).toBe(100);
    expect(result!.coins).toBe(40); // coins still deducted
  });

  it('clamps stat at 100 when already at max', () => {
    const state = makeState({ coins: 50, hunger: 100 });
    const result = purchaseItem(state, bread);
    expect(result!.hunger).toBe(100);
    expect(result!.coins).toBe(40);
  });

  it('handles multi-effect items (future-proofing)', () => {
    const multiItem: ShopItem = {
      id: 'feast',
      name: 'Feast',
      price: 50,
      effects: [
        { stat: 'hunger', value: 30 },
        { stat: 'happiness', value: 20 },
      ],
      emoji: '🎉',
    };
    const state = makeState({ coins: 50, hunger: 40, happiness: 40 });
    const result = purchaseItem(state, multiItem);
    expect(result!.hunger).toBe(70);
    expect(result!.happiness).toBe(60);
    expect(result!.coins).toBe(0);
  });
});
