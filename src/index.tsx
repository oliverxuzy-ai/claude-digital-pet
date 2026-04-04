#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

// Switch to alternate screen buffer (like vim/htop) so the pet stays fixed
process.stdout.write('\x1b[?1049h');
process.stdout.write('\x1b[H');

const { unmount } = render(React.createElement(App));

// Restore terminal on exit
function cleanup() {
  unmount();
  process.stdout.write('\x1b[?1049l');
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
