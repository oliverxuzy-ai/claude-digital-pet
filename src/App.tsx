import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, useInput, useApp } from 'ink';
import type { PetState, PetType } from './types.js';
import { loadState, saveState, createDefaultState } from './lib/petState.js';
import { createGameLoop } from './lib/gameLoop.js';
import { createTokenMonitor } from './lib/tokenMonitor.js';
import { Pet } from './components/Pet.js';
import { Stats } from './components/Stats.js';
import { Shop } from './components/Shop.js';
import { Setup } from './components/Setup.js';
import { HelpBar } from './components/HelpBar.js';

export function App() {
  const { exit } = useApp();
  const [state, setState] = useState<PetState | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [tick, setTick] = useState(0);

  const gameLoopRef = useRef<ReturnType<typeof createGameLoop> | null>(null);
  const tokenMonitorRef = useRef<ReturnType<typeof createTokenMonitor> | null>(null);

  // Clear message after 3 seconds
  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(undefined), 3000);
  }, []);

  // Initialize
  useEffect(() => {
    const existing = loadState();
    if (existing) {
      setState(existing);
      startGameLoop(existing);
    } else {
      setNeedsSetup(true);
    }

    return () => {
      gameLoopRef.current?.stop();
      tokenMonitorRef.current?.stop();
    };
  }, []);

  // Tick counter for animations
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  function startGameLoop(initialState: PetState) {
    const gameLoop = createGameLoop(initialState, {
      onStateChange: (newState) => setState(newState),
      onPurchaseFailed: (reason) => showMessage(`❌ ${reason}`),
    });

    const monitor = createTokenMonitor({
      onTokens: (usage) => gameLoop.enqueueTokens(usage),
      onSleepChange: (isSleeping) => {
        gameLoop.setSleeping(isSleeping);
        setSleeping(isSleeping);
      },
    });

    gameLoopRef.current = gameLoop;
    tokenMonitorRef.current = monitor;

    gameLoop.start();
    monitor.start();
  }

  function handleSetupComplete(petType: PetType, name: string) {
    const newState = createDefaultState(petType, name);
    saveState(newState);
    setState(newState);
    setNeedsSetup(false);
    startGameLoop(newState);
  }

  useInput((input, key) => {
    if (needsSetup || shopOpen) return;

    if (input === 's') {
      setShopOpen(true);
      return;
    }
    if (input === 'q') {
      gameLoopRef.current?.stop();
      tokenMonitorRef.current?.stop();
      exit();
      return;
    }
  });

  function handleBuy(itemId: string) {
    gameLoopRef.current?.enqueueCommand({ type: 'buy', itemId });
    showMessage('✨ Purchased!');
  }

  if (needsSetup) {
    return <Setup onComplete={handleSetupComplete} />;
  }

  if (!state) return null;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Pet state={state} tick={tick} sleeping={sleeping} />
      <Stats state={state} />
      {shopOpen && (
        <Shop state={state} onBuy={handleBuy} onClose={() => setShopOpen(false)} />
      )}
      <HelpBar shopOpen={shopOpen} message={message} />
    </Box>
  );
}
