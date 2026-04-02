import React from 'react';
import { Text, Box } from 'ink';
import type { PetState } from '../types.js';

interface StatsProps {
  state: PetState;
}

function bar(value: number, max: number = 100, width: number = 20): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function statColor(value: number): string {
  if (value >= 60) return 'green';
  if (value >= 30) return 'yellow';
  return 'red';
}

export function Stats({ state }: StatsProps) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text>🍖 Hunger:    </Text>
        <Text color={statColor(state.hunger)}>
          {bar(state.hunger)} {Math.round(state.hunger)}/100
        </Text>
      </Box>
      <Box>
        <Text>😊 Happiness: </Text>
        <Text color={statColor(state.happiness)}>
          {bar(state.happiness)} {Math.round(state.happiness)}/100
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text bold color="yellow">
          💰 {state.coins} coins
        </Text>
        <Text dimColor>
          {'  '}(total tokens: {state.totalTokensEarned.toLocaleString()})
        </Text>
      </Box>
    </Box>
  );
}
