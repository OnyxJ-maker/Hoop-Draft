# Hoop Draft

A local-multiplayer basketball draft game. Draft a squad from nearly 300 hand-rated players across seven decades, then watch the games play out. Pass one screen around with as many friends as you want (up to 16 teams), or go solo against CPU GMs.

No accounts, no backend, no API keys. Everything runs in the browser and saves to `localStorage`.

## Game modes

### 82-0
Draft a super team, then sim a full 82-game season against 29 league opponents. The goal is a perfect record.

- A live **Perfect Season Odds** meter and projected record update as you draft.
- The season plays out as a race: every team gets a lane, 82 pips fill in, and playback slows down while any human team is still undefeated.
- Choose your draft style: Pack Rip (default), Snake, Cap Crunch, Starting Five, or Time Machine.

### Draft Night
Pick a format, draft against friends and CPU GMs, then a league season and playoffs (or a seeded showdown bracket) crown a champion.

| Format | The twist |
| --- | --- |
| **Snake League Draft** | The classic open-board snake draft. Full regular season, then playoffs. |
| **Ball Knowledge** | Eight rounds, eight players. Every round has a hot-take prompt such as *Most Unguardable*, *Most Predatorial Defender* or *Looks Like a Cartoon Character*. A pool is dealt, you pick who fits best, and the game scores your read at the end of each round. Your Ball Knowledge IQ becomes a chemistry bonus. |
| **Pack Rip** | Every pick opens a fresh pack of random players. Keep one. Limited mulligans to re-roll. |
| **Starting Five** | Real positional slots (PG, SG, SF, PF, C plus a bench). |
| **Time Machine** | Every round is locked to a different decade. |
| **Cap Crunch** | Every player has a price tag and every team gets the same salary cap. |

Shared options: player pool (all-time, modern, classic, active, no superstars, stars only), roster size, pick timer, CPU skill (Rookie to GOAT), playoff series length, and season length.

## Features

- Collectible-style player cards with six tiers (bronze through a GOAT holo foil)
- Team rating with real chemistry: spacing, ball handling, rim protection, rebounding, size, and redundant positions
- A scouting panel that shows exactly how each pick changes your team rating before you commit
- CPU GMs with personalities (big-man believers, old-school heads, analytics nerds, hype men)
- Draft lottery, pick announcements, hot-seat "you're up" splash, shot clock, and synthesized sound effects
- Standings with animated reordering, playoff bracket with game-by-game results and box-score stars
- Hall of Fame for perfect seasons and league titles, plus pause and resume across page reloads

## Run it

```bash
npm install
npm run dev        # http://localhost:5477
```

Other scripts:

```bash
npm run build      # type-check and production build
npm run preview    # serve the production build on :5477
npm run test       # engine and data tests (vitest)
npm run typecheck
npm run lint
```

## How it works

```
src/
  data/       player table, vibe tags, prompts, franchises
  engine/     pure TypeScript: ratings, draft state machine, CPU GMs, game/season/playoff sims
  store/      zustand stores (game flow + persisted settings and Hall of Fame)
  screens/    menu, setup, lottery, draft room, recap, finale (82-game race, season, playoffs)
  components/ player cards, team panels, shadcn/ui primitives
```

- **Players** live in `src/data/rawPlayers.ts` as one line each: height, overall, career span, nine attributes (finishing, shooting, handles, passing, rebounding, perimeter D, rim protection, athleticism, IQ), nickname, rings, MVPs. Ratings are peak-career, subjective, and run through the 2024-25 season. Edit freely.
- **Vibe tags** (`src/data/tags.ts`) power the subjective Ball Knowledge prompts: cartoon, predator, unguardable, clutch, and more. Level 3 means iconic, 1 means a little.
- **Everything is deterministic from a seed.** Drafts, packs, prompt pools, schedules, and sims all derive from a seed stored with the game, so resuming a game reproduces the same results.
- **Calibration**: `src/engine/calibration.test.ts` simulates thousands of drafts and seasons. With the default settings a typical pack draft wins roughly 70 to 77 games, and a handful of good drafts out of a hundred go 82-0.

## Dev scripts (optional)

`scripts/` has Playwright-driven smoke tests that play full games in headless Chrome and save screenshots. They need `playwright-core` (already a dev dependency) and a local Chrome at `/usr/local/bin/google-chrome` (or edit the path).

```bash
node scripts/e2e.mjs                                        # Snake league, solo
FORMAT="Ball Knowledge" HUMANS=3 node scripts/e2e.mjs       # hot-seat BK with 3 humans
MODE=82 FORMAT="Pack" node scripts/e2e.mjs                  # 82-0 mode
```

## Stack

Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), motion, zustand, canvas-confetti, vitest.
