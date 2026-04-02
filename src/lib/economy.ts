import type { PetState, ShopItem } from '../types.js';

// 10,000 tokens = 1 coin (calibrated from eng review)
export const TOKENS_PER_COIN = 10_000;

export function tokensToCoins(
  tokens: number,
  remainder: number
): { coins: number; newRemainder: number } {
  const total = tokens + remainder;
  const coins = Math.floor(total / TOKENS_PER_COIN);
  const newRemainder = total % TOKENS_PER_COIN;
  return { coins, newRemainder };
}

export function canAfford(state: PetState, item: ShopItem): boolean {
  return state.coins >= item.price;
}

export function purchaseItem(
  state: PetState,
  item: ShopItem
): PetState | null {
  if (!canAfford(state, item)) return null;

  let newState = { ...state, coins: state.coins - item.price };

  for (const effect of item.effects) {
    const current = newState[effect.stat];
    newState = {
      ...newState,
      [effect.stat]: clampStat(current + effect.value),
    };
  }

  return newState;
}

export function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}
