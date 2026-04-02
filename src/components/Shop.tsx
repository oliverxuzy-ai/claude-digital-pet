import React from 'react';
import { Text, Box, useInput } from 'ink';
import type { PetState } from '../types.js';
import { shopItems } from '../data/shopItems.js';

interface ShopProps {
  state: PetState;
  onBuy: (itemId: string) => void;
  onClose: () => void;
}

export function Shop({ state, onBuy, onClose }: ShopProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      onClose();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(shopItems.length - 1, i + 1));
      return;
    }
    if (key.return) {
      const item = shopItems[selectedIndex];
      if (item) onBuy(item.id);
      return;
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={2}>
      <Text bold color="yellow">
        🏪 Shop (💰 {state.coins} coins)
      </Text>
      <Text dimColor>↑↓ navigate | Enter buy | Esc close</Text>
      <Box flexDirection="column" marginTop={1}>
        {shopItems.map((item, i) => {
          const selected = i === selectedIndex;
          const affordable = state.coins >= item.price;
          const effectStr = item.effects
            .map((e) => `+${e.value} ${e.stat}`)
            .join(', ');

          return (
            <Box key={item.id}>
              <Text color={selected ? 'cyan' : undefined} bold={selected}>
                {selected ? '▶ ' : '  '}
                {item.emoji} {item.name} — {item.price} coins ({effectStr})
                {!affordable ? ' ✗' : ''}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
