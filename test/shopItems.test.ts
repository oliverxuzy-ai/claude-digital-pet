import { describe, it, expect } from 'vitest';
import { shopItems, getShopItem } from '../src/data/shopItems.js';

describe('shopItems', () => {
  it('has 4 items', () => {
    expect(shopItems).toHaveLength(4);
  });

  it('all items have required fields', () => {
    for (const item of shopItems) {
      expect(item.id).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.price).toBeGreaterThan(0);
      expect(item.effects.length).toBeGreaterThan(0);
      expect(item.emoji).toBeTruthy();
    }
  });

  it('all effects reference valid stat names', () => {
    const validStats = ['hunger', 'happiness'];
    for (const item of shopItems) {
      for (const effect of item.effects) {
        expect(validStats).toContain(effect.stat);
        expect(effect.value).toBeGreaterThan(0);
      }
    }
  });
});

describe('getShopItem', () => {
  it('finds item by id', () => {
    const bread = getShopItem('bread');
    expect(bread).not.toBeUndefined();
    expect(bread!.name).toBe('Bread');
  });

  it('returns undefined for unknown id', () => {
    expect(getShopItem('nonexistent')).toBeUndefined();
  });
});
