# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0.0] - 2026-04-01

Your terminal pet is alive. Run `npx digital-pets` and pick a cat, dog, or goose. It earns coins while you use Claude Code, gets hungry over time, and you can feed it from the shop.

### Added

- **Token monitor** that watches Claude Code session files and converts token usage into coins. Tracks all token types (input, output, cache creation, cache read).
- **Pet system** with 3 pet types (Cat, Dog, Goose), each with 7 mood states and unique ASCII art animations.
- **Stat decay** that only runs while Claude Code is active. Offline? Your pet sleeps. No punishment for closing your laptop.
- **Shop** with 4 items (Bread, Fish, Ball, Yarn). Buy food to feed your pet, toys to play with it.
- **Command queue game loop** at 1 tick/second. All state mutations (tokens, keypresses) flow through a single queue for consistency.
- **Atomic persistence** via write-to-tmp + rename. State only saves when it actually changes.
- **First-run setup** that lets you choose your pet type and name it.
- **71 unit tests** covering economy math, token parsing, state persistence, game loop, pet definitions, and mood logic.
- **CI/CD** with GitHub Actions for testing (every push) and npm publishing (on version tags).
