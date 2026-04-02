export type PetType = 'cat' | 'dog' | 'goose';

export type PetMood = 'idle' | 'happy' | 'hungry' | 'sleeping' | 'eating' | 'playing' | 'sad';

export type StatName = 'hunger' | 'happiness';

export interface Effect {
  stat: StatName;
  value: number;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  effects: Effect[];
  emoji: string;
}

export interface PetState {
  version: 1;
  petType: PetType;
  name: string;
  hunger: number;
  happiness: number;
  coins: number;
  tokenRemainder: number;
  totalTokensEarned: number;
  feedCount: number;
  playCount: number;
  createdAt: string;
  lastActiveAt: string;
}

export type CommandType =
  | { type: 'tokens'; amount: number }
  | { type: 'feed'; itemId: string }
  | { type: 'play'; itemId: string }
  | { type: 'buy'; itemId: string };

export interface PetDefinition {
  name: string;
  emoji: string;
  frames: Record<PetMood, string[]>;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}
