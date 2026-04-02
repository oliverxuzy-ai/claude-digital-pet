import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';
import type { PetType } from '../types.js';
import { petDefinitions, getPetFrame } from '../data/pets.js';

interface SetupProps {
  onComplete: (petType: PetType, name: string) => void;
}

const petTypes: PetType[] = ['cat', 'dog', 'goose'];

type SetupStep = 'choosePet' | 'enterName';

export function Setup({ onComplete }: SetupProps) {
  const [step, setStep] = useState<SetupStep>('choosePet');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [chosenPet, setChosenPet] = useState<PetType>('cat');
  const [name, setName] = useState('');

  useInput((input, key) => {
    if (step === 'choosePet') {
      if (key.upArrow) {
        setSelectedIndex((i) => Math.max(0, i - 1));
      } else if (key.downArrow) {
        setSelectedIndex((i) => Math.min(petTypes.length - 1, i + 1));
      } else if (key.return) {
        setChosenPet(petTypes[selectedIndex]);
        setStep('enterName');
      }
    } else if (step === 'enterName') {
      if (key.return && name.trim().length > 0) {
        onComplete(chosenPet, name.trim());
      } else if (key.backspace || key.delete) {
        setName((n) => n.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setName((n) => n + input);
      }
    }
  });

  if (step === 'choosePet') {
    return (
      <Box flexDirection="column" alignItems="center">
        <Text bold color="cyan">
          🎮 Welcome to Digital Pets!
        </Text>
        <Text>Choose your companion:</Text>
        <Box flexDirection="column" marginTop={1}>
          {petTypes.map((pt, i) => {
            const def = petDefinitions[pt];
            const selected = i === selectedIndex;
            return (
              <Box key={pt} flexDirection="column" marginBottom={1}>
                <Text bold={selected} color={selected ? 'cyan' : undefined}>
                  {selected ? '▶ ' : '  '}
                  {def.emoji} {def.name}
                </Text>
                {selected && <Text>{getPetFrame(pt, 'idle', 0)}</Text>}
              </Box>
            );
          })}
        </Box>
        <Text dimColor>↑↓ to select, Enter to confirm</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" alignItems="center">
      <Text bold color="cyan">
        Name your {petDefinitions[chosenPet].emoji} {petDefinitions[chosenPet].name}:
      </Text>
      <Box marginTop={1}>
        <Text>{name}</Text>
        <Text color="cyan">█</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Type a name and press Enter</Text>
      </Box>
    </Box>
  );
}
