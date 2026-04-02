import React from 'react';
import { Text, Box } from 'ink';

interface HelpBarProps {
  shopOpen: boolean;
  message?: string;
}

export function HelpBar({ shopOpen, message }: HelpBarProps) {
  return (
    <Box flexDirection="column" marginTop={1}>
      {message && (
        <Text color="yellow" bold>
          {message}
        </Text>
      )}
      <Text dimColor>
        {shopOpen
          ? '↑↓ navigate | Enter buy | Esc close'
          : 's shop | q quit'}
      </Text>
    </Box>
  );
}
