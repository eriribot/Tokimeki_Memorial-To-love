# webgame-ui — 校园心动回忆 (Tokimeki Memorial × To Love)

## Repository Purpose

A dating-sim-style web game frontend (`校园心动回忆`) that runs as an embedded UI within SillyTavern via the Tavern Helper plugin. Players navigate a school map, interact with characters, build affection, and advance through daily time periods.

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `components/` | React TSX components (SchoolMap, ClassroomScene, Controls, StatPanel, SpecialSkillPanel, etc.) |
| `stores/` | Zustand stores (cardStore, characterStore, gameStore, mapStore, playerStore) |
| `data/` | Card schema (`cardSchema.ts`), skills data (`skills.ts`), default character JSON cards |
| `utils/` | `assetPath.ts`, `cardLoader.ts`, `placeholderGenerator.tsx` |
| `artsource/` | Art assets: `backgrounds/`, `characters/`, `chibis/`, `Tachie/`, `ui/` |
| `assets/` | Additional static assets |
| `.agents/` | (empty — reserved for agent instructions) |
| `artsource/backgrounds/` | School map background and scene backgrounds |

## Build & Dev Commands

Commands are run from the **repo root** (`D:\webgame\tavern_helper_template-main\`), not this subdirectory:

| Command | Action |
|---------|--------|
| `pnpm build:dev` | Webpack dev build (unminified) |
| `pnpm build` | Webpack production build |
| `pnpm watch` | Dev build with file watching |
| `pnpm format` | Prettier format all source files |
| `pnpm lint` | ESLint check |
| `pnpm lint:fix` | ESLint auto-fix |

**Package manager:** pnpm (see `pnpm-lock.yaml` at repo root)

## Architecture & Conventions

### State Management
- All stores use **Zustand** (`create()` from `zustand`)
- **gameStore** — Day/period/location/scene state, event system, game lifecycle
- **cardStore** — SillyTavern-compatible character cards (V2 spec), targets management, affection
- **characterStore** — Character display/positioning on map
- **mapStore** — Map grid dimensions, locations coordinate data
- **playerStore** — Player stats

### Card System
- Follows **SillyTavern chara_card_v2** spec (`data/cardSchema.ts`)
- Cards loaded from JSON, PNG (embedded metadata), or URL via `utils/cardLoader.ts`
- Game-specific data lives in `extensions.game_data` (id, color, type, favoriteLocations, stats)
- `cardToCharacter()` converts loaded cards into game character objects

### Asset Resolution
- All asset paths use `resolveAssetPath()` from `utils/assetPath.ts`
- `window.__WEBGAME_ASSET_BASE__` global (defaults to `'../'`) prepended to paths starting with `/`
- Missing assets fall back to SVG placeholders generated in `placeholderGenerator.tsx`

### Time System
- 6 periods per day: morning → class1 → lunch → class2 → afterSchool → evening
- Characters auto-assign locations per period via `getTargetLocationForPeriod()`
- Stored in `PERIODS` constant in `gameStore.ts`

### Styling
- CSS custom properties with `--tm-*` prefix (pink theme) defined in `App.css`
- `enhancements.css` and `map-enhancements.css` for additional styling layers
- `App.css` — main layout and component styles (~29KB)

### UI Pattern
- Main layout: header → map/scene area → bottom panel (stats + controls)
- Modal overlays: `SpecialSkillPanel`, `CardImporter`
- `EventLog` rendered as overlay
- `map-scale` hook dynamically resizes the map to fit viewport

## Git

- Single branch: `main`
- Remote: `origin https://github.com/eriribot/Tokimeki_Memorial-To-love.git`
- The root `AGENTS.md` is a symlink -> `CLAUDE.md` (contains tavern_helper template rules)
- Recent commits: skill tree system, school background, art asset optimization

## Gotchas

1. **This is a subdirectory workspace** — the `package.json`, `webpack.config.ts`, `tsconfig.json`, and `node_modules` all live at the **repo root** level (`D:\webgame\tavern_helper_template-main\`). Do not look for them here.
2. **Asset paths** in code start with `/` (e.g. `/artsource/backgrounds/map.png`) — they get resolved by `resolveAssetPath()` at runtime.
3. **No routing library** — scene switching is done via `currentSceneId` state (null = school map, string = classroom/other scene).
4. **Character data** is loaded from JSON cards at runtime via `CardImporter` component — default cards live in `data/default-cards/`.
5. **Skills system** defined in `data/skills.ts` and rendered by `SpecialSkillPanel`.
6. The game is **embedded in SillyTavern** — `window.render_game_to_text()` exports game state as JSON for the tavern AI to read.
7. `index.tsx` sets `window.advanceTime` as a no-op placeholder for external integration.
