# Digital Pets 🐱🐶🪿

A terminal pet that lives off your Claude Code token usage. The harder the problem, the more coins your pet earns.

```
    __
   / ^> ♪
  |  |
 /|  |\
/ |  | \
  ~~  ~~ HONK!

  💰 42 coins
  🍖 Hunger:    ████████████████░░░░ 80/100
  😊 Happiness: ██████████████░░░░░░ 70/100
```

## What it does

Every token Claude Code burns becomes coins for your pet. Feed it, play with it, keep it happy. Your pet is proof of your investment in building.

- **3 pet types** — Cat, Dog, Goose. Each with unique ASCII art and 7 mood states.
- **Token economy** — Monitors `~/.claude/projects/` for active sessions. All token types counted, weighted by API cost.
- **Shop** — Buy food (Bread, Fish) and toys (Ball, Yarn) with earned coins.
- **Offline-friendly** — Stats only decay while Claude Code is active. Close your laptop, your pet sleeps. No punishment.

## Install

```bash
npm install -g digital-pets
```

Or try it once:

```bash
npx digital-pets
```

> Requires Node.js 20+. Run in a **separate terminal** from Claude Code.

## Usage

```bash
digital-pets
```

First run asks you to pick a pet and name it. After that, just open it and go.

### Controls

| Key | Action |
|-----|--------|
| `s` | Open shop |
| `↑↓` | Navigate shop |
| `Enter` | Buy item |
| `Esc` | Close shop |
| `q` | Quit (state auto-saves) |

## How it works

1. **Token monitor** polls `~/.claude/projects/**/*.jsonl` every 2 seconds for new session data
2. **Economy engine** converts tokens to coins at 10,000:1 (weighted by API cost — cache reads count 0.1x)
3. **Game loop** ticks once per second, draining a command queue for all state mutations
4. **Persistence** uses atomic writes (write-to-tmp + rename) so your pet state never corrupts

### Stat decay

| Stat | Decay rate (online) | Offline |
|------|-------------------|---------|
| Hunger | -15/hour | Paused |
| Happiness | -10/hour | Paused |

Pets can't die. At 0 hunger they look sad, but one feeding brings them back.

### Shop items

| Item | Price | Effect |
|------|-------|--------|
| 🍞 Bread | 10 coins | +20 hunger |
| 🐟 Fish | 25 coins | +40 hunger |
| ⚽ Ball | 20 coins | +25 happiness |
| 🧶 Yarn | 15 coins | +15 happiness |

## Development

```bash
git clone https://github.com/oliverxuzy-ai/claude-digital-pet.git
cd claude-digital-pet
npm install
npm run dev      # run with tsx (no build needed)
npm test         # 71 tests
npm run build    # compile TypeScript
```

## State file

Pet state lives at `~/.digital-pets/state.json`. Delete it to start over with a new pet.

## License

MIT
