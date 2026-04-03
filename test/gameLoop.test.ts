import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGameLoop } from '../src/lib/gameLoop.js';
import type { PetState } from '../src/types.js';

// Mock petState to avoid file system writes during tests
vi.mock('../src/lib/petState.js', () => ({
  saveState: vi.fn(() => true),
  loadState: vi.fn(() => null),
}));

function makeState(overrides: Partial<PetState> = {}): PetState {
  return {
    version: 1,
    petType: 'cat',
    name: 'Test',
    hunger: 80,
    happiness: 80,
    coins: 50,
    tokenRemainder: 0,
    totalTokensEarned: 0,
    feedCount: 0,
    playCount: 0,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('gameLoop', () => {
  let onStateChange: ReturnType<typeof vi.fn>;
  let onPurchaseFailed: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onStateChange = vi.fn();
    onPurchaseFailed = vi.fn();
  });

  it('processes token commands and converts to coins', () => {
    const state = makeState({ coins: 0, tokenRemainder: 0 });
    const loop = createGameLoop(state, { onStateChange, onPurchaseFailed });

    loop.enqueueCommand({ type: 'tokens', amount: 15000 });
    loop.tick();

    const updatedState = onStateChange.mock.calls[0][0] as PetState;
    expect(updatedState.coins).toBe(1);
    expect(updatedState.tokenRemainder).toBe(5000);
    expect(updatedState.totalTokensEarned).toBe(15000);
  });

  it('processes feed command (buy food)', () => {
    const state = makeState({ coins: 50, hunger: 50 });
    const loop = createGameLoop(state, { onStateChange, onPurchaseFailed });

    loop.enqueueCommand({ type: 'buy', itemId: 'bread' });
    loop.tick();

    const updatedState = onStateChange.mock.calls[0][0] as PetState;
    expect(updatedState.coins).toBe(40);
    expect(updatedState.hunger).toBe(70);
    expect(updatedState.feedCount).toBe(1);
  });

  it('processes play command (buy toy)', () => {
    const state = makeState({ coins: 50, happiness: 50 });
    const loop = createGameLoop(state, { onStateChange, onPurchaseFailed });

    loop.enqueueCommand({ type: 'play', itemId: 'ball' });
    loop.tick();

    const updatedState = onStateChange.mock.calls[0][0] as PetState;
    expect(updatedState.coins).toBe(30);
    expect(updatedState.happiness).toBe(75);
    expect(updatedState.playCount).toBe(1);
  });

  it('calls onPurchaseFailed when coins insufficient', () => {
    const state = makeState({ coins: 5 });
    const loop = createGameLoop(state, { onStateChange, onPurchaseFailed });

    loop.enqueueCommand({ type: 'buy', itemId: 'bread' });
    loop.tick();

    expect(onPurchaseFailed).toHaveBeenCalledWith(
      expect.stringContaining('Not enough coins')
    );
  });

  it('calls onPurchaseFailed for unknown item', () => {
    const state = makeState({ coins: 100 });
    const loop = createGameLoop(state, { onStateChange, onPurchaseFailed });

    loop.enqueueCommand({ type: 'buy', itemId: 'nonexistent' });
    loop.tick();

    expect(onPurchaseFailed).toHaveBeenCalledWith('Item not found');
  });

  it('drains token buffer into command queue', () => {
    const state = makeState({ coins: 0, tokenRemainder: 0 });
    const loop = createGameLoop(state, { onStateChange, onPurchaseFailed });

    // Weighted: 8000*1 + 4000*1 + 0*1.25 + 0*0.1 = 12000
    loop.enqueueTokens({
      inputTokens: 8000,
      outputTokens: 4000,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
    });
    loop.tick();

    const updatedState = onStateChange.mock.calls[0][0] as PetState;
    expect(updatedState.coins).toBe(1);
    expect(updatedState.totalTokensEarned).toBe(12000);
  });

  it('applies stat decay when online', () => {
    const state = makeState({ hunger: 80, happiness: 80 });
    const loop = createGameLoop(state, { onStateChange, onPurchaseFailed });

    // Simulate passage of time by calling tick
    // Default tick uses real elapsed time which is ~0, so decay is minimal
    loop.tick();
    const updatedState = onStateChange.mock.calls[0][0] as PetState;
    // Decay should be very small for ~0 seconds elapsed
    expect(updatedState.hunger).toBeLessThanOrEqual(80);
    expect(updatedState.happiness).toBeLessThanOrEqual(80);
  });

  it('pauses decay when sleeping', () => {
    const state = makeState({ hunger: 50, happiness: 50 });
    const loop = createGameLoop(state, { onStateChange, onPurchaseFailed });

    loop.setSleeping(true);
    loop.tick();

    const updatedState = onStateChange.mock.calls[0][0] as PetState;
    // Stats should not change during sleep (within rounding)
    expect(Math.round(updatedState.hunger)).toBe(50);
    expect(Math.round(updatedState.happiness)).toBe(50);
  });

  it('processes empty queue without error', () => {
    const state = makeState();
    const loop = createGameLoop(state, { onStateChange, onPurchaseFailed });

    loop.tick();
    expect(onStateChange).toHaveBeenCalled();
    expect(onPurchaseFailed).not.toHaveBeenCalled();
  });

  it('does not let stats go below 0', () => {
    const state = makeState({ hunger: 0, happiness: 0 });
    const loop = createGameLoop(state, { onStateChange, onPurchaseFailed });

    loop.tick();

    const updatedState = onStateChange.mock.calls[0][0] as PetState;
    expect(updatedState.hunger).toBe(0);
    expect(updatedState.happiness).toBe(0);
  });

  it('processes multiple commands in one tick', () => {
    const state = makeState({ coins: 100, hunger: 30, happiness: 30 });
    const loop = createGameLoop(state, { onStateChange, onPurchaseFailed });

    loop.enqueueCommand({ type: 'buy', itemId: 'bread' });
    loop.enqueueCommand({ type: 'buy', itemId: 'ball' });
    loop.tick();

    const updatedState = onStateChange.mock.calls[0][0] as PetState;
    expect(updatedState.coins).toBe(70); // -10 bread, -20 ball
    expect(updatedState.hunger).toBe(50); // +20 bread
    expect(updatedState.happiness).toBe(55); // +25 ball
  });
});
