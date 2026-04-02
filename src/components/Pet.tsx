import React from 'react';
import { Text, Box } from 'ink';
import type { PetState, PetMood } from '../types.js';
import { getPetFrame, petDefinitions } from '../data/pets.js';

interface PetProps {
  state: PetState;
  tick: number;
  sleeping: boolean;
}

export function getMood(state: PetState, sleeping: boolean): PetMood {
  if (sleeping) return 'sleeping';
  if (state.hunger <= 0 && state.happiness <= 0) return 'sad';
  if (state.hunger <= 20) return 'hungry';
  if (state.happiness >= 80 && state.hunger >= 60) return 'happy';
  return 'idle';
}

export function Pet({ state, tick, sleeping }: PetProps) {
  const mood = getMood(state, sleeping);
  const frame = getPetFrame(state.petType, mood, tick);
  const def = petDefinitions[state.petType];

  return (
    <Box flexDirection="column" alignItems="center">
      <Text bold color="cyan">
        {def?.emoji} {state.name} the {def?.name}
      </Text>
      <Text>{frame}</Text>
      <Text dimColor>({mood})</Text>
    </Box>
  );
}
