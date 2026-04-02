import type { ShopItem } from '../types.js';

export const shopItems: ShopItem[] = [
  {
    id: 'bread',
    name: 'Bread',
    price: 10,
    effects: [{ stat: 'hunger', value: 20 }],
    emoji: '🍞',
  },
  {
    id: 'fish',
    name: 'Fish',
    price: 25,
    effects: [{ stat: 'hunger', value: 40 }],
    emoji: '🐟',
  },
  {
    id: 'ball',
    name: 'Ball',
    price: 20,
    effects: [{ stat: 'happiness', value: 25 }],
    emoji: '⚽',
  },
  {
    id: 'yarn',
    name: 'Yarn',
    price: 15,
    effects: [{ stat: 'happiness', value: 15 }],
    emoji: '🧶',
  },
];

export function getShopItem(id: string): ShopItem | undefined {
  return shopItems.find((item) => item.id === id);
}
