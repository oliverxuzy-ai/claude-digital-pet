import type { CommandType, PetState, TokenUsage } from '../types.js';
import { tokensToCoins, purchaseItem, clampStat } from './economy.js';
import { getShopItem } from '../data/shopItems.js';
import { saveState } from './petState.js';
import { totalTokens } from './tokenMonitor.js';

/*
  Game Loop — single tick-based orchestrator

  ┌─────────────┐     ┌──────────────┐     ┌──────────┐
  │ tokenMonitor │────▶│ commandQueue │────▶│ gameLoop │
  │ (file I/O)  │     │              │     │ (1s tick)│
  └─────────────┘     │              │     └────┬─────┘
  ┌─────────────┐     │              │          │
  │ user input  │────▶│              │     setState()
  │ (keypresses)│     └──────────────┘          │
  └─────────────┘                               ▼
                                          ┌──────────┐
                                          │ Ink App  │
                                          └──────────┘

  All state mutations go through the command queue.
  The game loop drains the queue once per tick.
*/

// Decay rates (per hour, applied proportionally per tick)
const HUNGER_DECAY_PER_HOUR = 15;
const HAPPINESS_DECAY_PER_HOUR = 10;

// Max decay catch-up: 30 minutes (for system wake from sleep)
const MAX_DECAY_SECONDS = 30 * 60;

export interface GameLoopCallbacks {
  onStateChange: (state: PetState) => void;
  onPurchaseFailed: (reason: string) => void;
}

export function createGameLoop(
  initialState: PetState,
  callbacks: GameLoopCallbacks
) {
  let state = { ...initialState };
  const commandQueue: CommandType[] = [];
  let tokenBuffer: TokenUsage[] = [];
  let lastTickTime = Date.now();
  let interval: ReturnType<typeof setInterval> | null = null;
  let sleeping = false;
  let dirty = false;

  function enqueueCommand(cmd: CommandType) {
    commandQueue.push(cmd);
  }

  function enqueueTokens(usage: TokenUsage) {
    tokenBuffer.push(usage);
  }

  function setSleeping(isSleeping: boolean) {
    sleeping = isSleeping;
  }

  function processCommands() {
    while (commandQueue.length > 0) {
      const cmd = commandQueue.shift()!;

      switch (cmd.type) {
        case 'tokens': {
          const { coins, newRemainder } = tokensToCoins(cmd.amount, state.tokenRemainder);
          if (coins > 0 || newRemainder !== state.tokenRemainder) {
            state = {
              ...state,
              coins: state.coins + coins,
              tokenRemainder: newRemainder,
              totalTokensEarned: state.totalTokensEarned + cmd.amount,
            };
            dirty = true;
          }
          break;
        }

        case 'feed':
        case 'buy': {
          const item = getShopItem(cmd.itemId);
          if (!item) {
            callbacks.onPurchaseFailed('Item not found');
            break;
          }
          const newState = purchaseItem(state, item);
          if (!newState) {
            callbacks.onPurchaseFailed(`Not enough coins (need ${item.price}, have ${state.coins})`);
            break;
          }
          state = {
            ...newState,
            feedCount: state.feedCount + (item.effects.some((e) => e.stat === 'hunger') ? 1 : 0),
            playCount: state.playCount + (item.effects.some((e) => e.stat === 'happiness') ? 1 : 0),
          };
          dirty = true;
          break;
        }

        case 'play': {
          const item = getShopItem(cmd.itemId);
          if (!item) {
            callbacks.onPurchaseFailed('Item not found');
            break;
          }
          const newState = purchaseItem(state, item);
          if (!newState) {
            callbacks.onPurchaseFailed(`Not enough coins (need ${item.price}, have ${state.coins})`);
            break;
          }
          state = {
            ...newState,
            playCount: state.playCount + 1,
          };
          dirty = true;
          break;
        }
      }
    }
  }

  function drainTokenBuffer() {
    if (tokenBuffer.length === 0) return;
    let totalAmount = 0;
    for (const usage of tokenBuffer) {
      totalAmount += totalTokens(usage);
    }
    tokenBuffer = [];
    if (totalAmount > 0) {
      enqueueCommand({ type: 'tokens', amount: totalAmount });
    }
  }

  function applyDecay(elapsedSeconds: number) {
    // Decay only when online (not sleeping)
    if (sleeping) return;

    // Cap decay to MAX_DECAY_SECONDS (handles system wake from sleep)
    const cappedSeconds = Math.min(elapsedSeconds, MAX_DECAY_SECONDS);

    const hungerDecay = (HUNGER_DECAY_PER_HOUR / 3600) * cappedSeconds;
    const happinessDecay = (HAPPINESS_DECAY_PER_HOUR / 3600) * cappedSeconds;

    const newHunger = clampStat(state.hunger - hungerDecay);
    const newHappiness = clampStat(state.happiness - happinessDecay);

    if (newHunger !== state.hunger || newHappiness !== state.happiness) {
      state = { ...state, hunger: newHunger, happiness: newHappiness };
      dirty = true;
    }
  }

  function tick() {
    const now = Date.now();
    const elapsedSeconds = (now - lastTickTime) / 1000;
    lastTickTime = now;

    // 1. Drain token buffer into command queue
    drainTokenBuffer();

    // 2. Process all commands
    processCommands();

    // 3. Apply stat decay
    applyDecay(elapsedSeconds);

    // 4. Update lastActiveAt
    if (!sleeping) {
      state = { ...state, lastActiveAt: new Date().toISOString() };
    }

    // 5. Persist if state changed
    if (dirty) {
      saveState(state);
      dirty = false;
    }

    // 6. Notify UI
    callbacks.onStateChange(state);
  }

  function start() {
    lastTickTime = Date.now();
    interval = setInterval(tick, 1000);
    // Initial render
    callbacks.onStateChange(state);
  }

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    // Final save
    saveState(state);
  }

  function getState(): PetState {
    return state;
  }

  return {
    start,
    stop,
    enqueueCommand,
    enqueueTokens,
    setSleeping,
    getState,
    tick, // exposed for testing
  };
}
