# webgame-ui — 校园心动回忆

React/TypeScript dating-sim frontend embedded in SillyTavern through Tavern Helper. Players navigate the school, spend
action points, meet characters, build affection, and play generated GAL story scenes.

## Active truth and precedence

- This subtree uses React, Zustand, and project CSS. These rules override root template defaults that prefer Vue, Pinia,
  Tailwind, or unchecked Tavern globals.
- `MODULES.md` is the current runtime/module authority.
- `ALDENT_STATUS.md` is the current human-review scope and evidence record.
- `progress.md` is historical archive only; never use an old entry as current behavior.
- When documentation conflicts with executable code, inspect the code and repair the active documentation before
  expanding scope.

## Commands

Run from `D:\webgame\tavern_helper_template-main`, where `package.json`, webpack config, TypeScript config, lockfile,
and dependencies live.

| Command          | Purpose                      |
| ---------------- | ---------------------------- |
| `pnpm build:dev` | Unminified development build |
| `pnpm build`     | Production build             |
| `pnpm watch`     | Watched development build    |
| `pnpm format`    | Prettier                     |
| `pnpm lint`      | ESLint                       |

For any Tavern inline artifact, also run:

```text
node src/webgame-ui/verify-inline-bundle.mjs dist/webgame-ui/index.html
```

## Architecture

- `stores/gameStore.ts`: date, period, action points, location/scene, main story, lifecycle.
- `stores/cardStore.ts`: SillyTavern V2 cards, targets, locations, affection.
- `stores/characterStore.ts`, `mapStore.ts`, `playerStore.ts`: presentation and player/map state.
- `services/storyGenerationPrompt.ts`: reusable runtime-stage, event-completion, completion-sentinel, and GAL output
  contracts. It contains no episode plot or character lore.
- `services/tavernStoryGeneration.ts`: current event adapter, accepted-history context, Tavern generation, and
  plain-text parsing. It does not settle AP, affection, dates, or host floors.
- `GalMainStory/`: story definitions, loading/error/fallback state, GAL rendering. It does not recalculate game state.
- `data/storyLore.ts` read-only loads the designated disabled plot entry from the real Tavern worldbook by stable
  UID/name, validates its content markers, and formats one event-scoped lore block. It never changes worldbook state.
- `data/lore-books/tolove-tv-episode-01.txt` is the recovery source used to populate that Tavern entry; it is not
  imported into the runtime bundle. `data/worldbook.ts` owns the Tavern read/diagnostic bridge.
- `save/` and `message/`: snapshots and the game-owned message mirror.

Scene switching uses `currentSceneId`; there is no routing library. Three periods exist: morning, afterSchool, evening.

## Invariants

- Zustand plus the save snapshot owns AP, date, event completion, and the current act.
- AI output is a story candidate. It must pass local extraction/normalization before GAL rendering.
- Length is not event completion. A candidate also needs the exact current event/stage completion sentinel as its last
  non-empty response line; a missing sentinel is a visible parse error and protects against hard truncation. The
  sentinel is transport evidence, not machine proof that every worldbook beat is semantically present.
- Player-settled values remain authoritative; the model must not recalculate them.
- The `出包王女 / 剧情第一集` entry must remain disabled. Main-story generation reads it directly and injects it once
  with `should_scan: false`; missing, duplicate, enabled, or malformed entries fail visibly before generation.
- `TavernHelper.generate()` proves only the generation path. It does not prove real hidden host floors, `MESSAGE_SENT`,
  shujuku/ACU, or database hooks.
- UI or local file-mirror success must not be described as real host/plugin integration.
- Asset paths start with `/` and must pass through `resolveAssetPath()`.
- `window.render_game_to_text()` exposes game state for Tavern AI. `window.advanceTime` remains an external no-op
  placeholder.

## Verification and review

- Validate the changed behavior, affected build, and exact final inline artifact when applicable.
- Browser mocks, builds, screenshots, and scripts are evidence, not human acceptance.
- Substantial prompt, host, database, option-settlement, Galgame, or inline-bundle work uses the Aldent review gate
  recorded in `ALDENT_STATUS.md`.
- Preserve unrelated dirty worktree changes.
