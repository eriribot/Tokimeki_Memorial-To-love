---
name: webgame-ui-dr-stores
description: Use when working with the stores module of webgame-ui — Zustand stores that manage game loop, map config, player stats, and character cards/targets for a React TypeScript school-life game.
---

# webgame-ui stores

## 1. Module Purpose & Capabilities

The `stores/` module is the centralized Zustand state layer for the webgame-ui React application. It owns five independent stores that together drive a school-life / Tokimeki Memorial-style visual game loop:

| Store | File | Responsibility |
|-------|------|----------------|
| `useGameStore` | `stores/gameStore.ts` | Day/period clock, current location/scene, event spawning, event log. |
| `useMapStore` | `stores/mapStore.ts` | Static map grid and location metadata. |
| `usePlayerStore` | `stores/playerStore.ts` | Player profile, avatar, and Tokimeki-style stats (intelligence, athletics, art, charm, stamina, stress, money). |
| `useCardStore` | `stores/cardStore.ts` | Dynamic character roster loaded from SillyTavern character cards; tracks `targets[]`, `activeTargetId`, and card loading state. |
| `useCharacterStore` | `stores/characterStore.ts` | Backward-compatibility facade that re-exports `cardStore` data and auto-loads default cards on first mount. |

Capabilities provided by the module:

- **Time progression**: `nextPeriod()` advances through six daily periods; rolling past evening starts a new day and spawns random events.
- **Location navigation**: `setLocation(id)`, `enterScene(id)`, `exitScene()`.
- **Event system**: `spawnEvents()`, `resolveEvent(eventId)` with a capped 20-entry `log`.
- **Player activities**: `study()`, `exercise()`, `practiceArt()`, `rest()`, `socialize()`, `buySnack()`.
- **Card import**: `addCardFromJSON`, `addCardFromFile`, `addCardFromURL` support JSON files, PNG files with embedded SillyTavern `tEXt` chunks, and remote URLs.
- **NPC scheduling**: `spawnTargetsForPeriod(periodKey)` places characters at favorite locations based on `PERIOD_LOCATION_RULES`.
- **Cross-store sync**: `useCharacterStore` subscribes to `useCardStore` so legacy `characters` consumers stay reactive.

## 2. Core Design Logic

### 2.1 Plain Zustand stores, no middleware

Every store is created with the basic `create((set, get) => ({ ... }))` API from `zustand`. There is no persistence middleware, no devtools middleware, and no slice pattern. State updates are explicit `set(...)` calls, and derived values are computed by action functions or selectors at call sites.

Design rationale: the domain is small and the stores are flat. Avoiding middleware keeps bundle size and mental overhead low.

### 2.2 `cardStore` is the single source of truth for characters

The codebase deliberately migrated from a hard-coded `characters` array to a card-driven `targets[]` model. `useCardStore` is the owner; `useCharacterStore` is only a compatibility shim.

Key consequences:

- New characters are **never** added by editing a store file; they are loaded through `addCardFromJSON`, `addCardFromFile`, or `addCardFromURL`.
- `characterStore.ts` imports default cards (`haruka.json`, `miyuki.json`, `rin.json`, `sakura.json`) and seeds `cardStore` on first initialization.
- `useCardStore.subscribe((state) => { useCharacterStore.setState({ characters: state.targets }) })` keeps legacy consumers reactive without manual synchronization.

### 2.3 Static configuration vs. runtime state

`useMapStore` is read-only: `create(() => ({ locations: LOCATIONS, width: 10, height: 6, cellSize: 140 }))`. Locations, grid size, and tile size are authored as constants, not loaded or mutated at runtime. If you need procedurally generated maps or dynamic map state, you must change the store shape.

### 2.4 Time as index, not absolute time

Game time is modeled as `day: number` plus `periodIndex: number` (an index into `PERIODS`). The `nextPeriod()` action increments `periodIndex`; when it exceeds the last period it resets to `0`, increments `day`, and calls `spawnRandomEvents(day)`.

This design makes save/load trivial (two numbers) and guarantees deterministic event seeding per day.

### 2.5 Log and events are capped

Both `nextPeriod()` and `addLog()` slice the log with `state.log.slice(-19)` before appending, keeping the array at 20 entries maximum. This prevents unbounded growth during long play sessions.

### 2.6 Card normalization before storage

`cardStore` does not store raw uploaded JSON. It delegates to `loadCardFromJSON` → `normalizeCard` (`data/cardSchema.ts`) to upgrade V1 cards to V2 and ensure `extensions.game_data` exists. Only then does `cardToCharacter` produce a runtime `Character` object.

This decouples the SillyTavern card spec from the in-game character shape and lets the UI rely on normalized fields such as `favoriteLocations`, `stats`, and image paths.

## 3. Core Data Structures

### 3.1 `useGameStore` (`stores/gameStore.ts`)

```ts
{
  day: number;                 // current in-game day, starts at 1
  periodIndex: number;         // index into PERIODS, starts at 0 (morning)
  currentLocationId: string;   // e.g. 'classroom'
  currentSceneId: string | null;
  isPlaying: boolean;
  log: string[];               // capped to 20 entries
  events: Array<{             // spawned once per new day
    id: string;
    label: string;
    message: string;
    locationId: string;
  }>;
}
```

Constants:

- `PERIODS`: `{ key: 'morning' | 'class1' | 'lunch' | 'class2' | 'afterSchool' | 'evening', label: string, time: string }[]`
- `LOCATION_IDS`: string array used to randomly place events.
- `EVENTS`: template pool for `spawnRandomEvents(day)`.

Actions: `startGame`, `pauseGame`, `setLocation`, `enterScene`, `exitScene`, `nextPeriod`, `addLog`, `spawnEvents`, `resolveEvent`, `resetGame`.

### 3.2 `useMapStore` (`stores/mapStore.ts`)

```ts
{
  locations: Record<string, {
    id: string;
    name: string;
    x: number;
    y: number;
    color: string;
    description: string;
  }>;
  width: number;   // 10
  height: number;  // 6
  cellSize: number; // 140
}
```

`LOCATIONS` currently includes: `gate`, `classroom`, `library`, `cafeteria`, `gym`, `musicRoom`, `rooftop`, `courtyard`.

### 3.3 `usePlayerStore` (`stores/playerStore.ts`)

```ts
{
  name: string;        // '主角'
  color: string;
  avatar: string;      // path to chibi asset
  intelligence: number;
  athletics: number;
  art: number;
  charm: number;
  stamina: number;
  stress: number;
  money: number;
}
```

Getters (implemented as functions because Zustand state is not class-based):

- `isTired(): boolean` — `stamina <= 0`
- `isStressed(): boolean` — `stress >= 80`

Actions: `setColor`, `study`, `exercise`, `practiceArt`, `rest`, `socialize`, `buySnack`.

### 3.4 `useCardStore` (`stores/cardStore.ts`)

```ts
{
  targets: Target[];        // runtime characters
  activeTargetId: string | null;
  loadedCards: Card[];      // normalized original card data
  isLoading: boolean;
  error: string | null;
}
```

A `Target` is produced by `cardToCharacter(card, existingCharacters)` in `utils/cardLoader.ts`:

```ts
{
  id: string;               // slug, deduplicated against existing targets
  name: string;
  color: string;
  type: string;
  favoriteLocations: string[];
  greeting: string;
  portrait: string;
  chibi: string;
  tachie: string | null;
  affection: number;
  friendship: number;
  romance: number;
  currentLocationId: string;
  _cardData: Card;          // full normalized card retained for advanced use
}
```

Key actions:

- `addCardFromJSON(jsonData)` / `addCardFromFile(file)` / `addCardFromURL(url)` — async loaders that set `isLoading`, normalize the card, push to `targets` and `loadedCards`, and auto-select the first loaded target.
- `removeTarget(targetId)` — filters `targets` and falls back the active target.
- `setActiveTarget(targetId)` / `getActiveTarget()` / `getTargetsByLocation(locationId)`.
- `updateTarget(targetId, updates)` — shallow merge into one target.
- `addAffection(targetId, amount)` — caps at 100.
- `spawnTargetsForPeriod(periodKey)` — repositions every target using `getTargetLocationForPeriod`.
- `clearTargets()` — wipes roster and cards.
- `resetTargets()` — resets stats to 0 and locations to first favorite.

Location scheduling is driven by `PERIOD_LOCATION_RULES` and `getTargetLocationForPeriod(target, periodKey)`:

- `morning` → first favorite location, fallback `classroom`
- `class1` / `class2` → always `classroom`
- `lunch` → second favorite, fallback first favorite, fallback `cafeteria`
- `afterSchool` → first favorite unless it is `classroom`, then second favorite, fallback `courtyard`
- `evening` → `null` (characters leave the map)

### 3.5 `useCharacterStore` (`stores/characterStore.ts`)

```ts
{
  characters: Target[];     // mirrored from cardStore.targets
  spawnForPeriod: (periodKey) => void;
  addAffection: (id, amount) => void;
  resetCharacters: () => void;
  getCardStore: () => CardStoreState;
}
```

This store exists purely for backward compatibility. On creation it runs `initializeDefaultCards()` exactly once (guarded by `cardStore.targets.length === 0`) to load the four default cards. It then subscribes to `cardStore` updates and mirrors `targets` into `characters`.

## 4. State Flow

### 4.1 Boot sequence

1. `index.tsx` mounts `App`.
2. A component imports `useCharacterStore`, triggering `create()`.
3. `initializeDefaultCards()` awaits `useCardStore.getState()` and loops over `[harukaCard, miyukiCard, rinCard, sakuraCard]`, calling `addCardFromJSON(card)` for each.
4. `addCardFromJSON` normalizes the card, converts it to a `Target`, and appends it to `targets` and `loadedCards`.
5. `useCardStore.subscribe` fires after each mutation and pushes the new `targets` array into `characterStore.characters`.

### 4.2 Typical turn flow

1. The player is at a location (`gameStore.currentLocationId`).
2. The player triggers `nextPeriod()` in `gameStore`.
3. `nextPeriod()` advances `periodIndex` (or rolls over the day) and appends a log entry.
4. The game UI or orchestrator calls `cardStore.spawnTargetsForPeriod(periodKey)`.
5. `spawnTargetsForPeriod` updates every target's `currentLocationId` according to `PERIOD_LOCATION_RULES`.
6. Components re-render: `Map` shows icons at new coordinates, `Character` list filters by `currentLocationId`, etc.
7. The player chooses an action such as `study()` or `socialize()` from `playerStore`.
8. If a target is present at the current location, UI can call `cardStore.addAffection(targetId, amount)`.
9. `addLog(message)` records narrative feedback.

### 4.3 Card import flow

```
File/URL/JSON input
  → addCardFromFile / addCardFromURL / addCardFromJSON
    → loadCardFromJSON / loadCardFromFile / loadCardFromURL (utils/cardLoader.ts)
      → normalizeCard (data/cardSchema.ts)
        → cardToCharacter
          → targets[] / loadedCards[]
            → useCardStore.subscribe
              → characterStore.characters
```

### 4.4 Cross-store read patterns

- `cardStore` reads its own state via `get()` inside actions (`getActiveTarget`, `getTargetsByLocation`).
- `characterStore` reads `useCardStore.getState()` during initialization and proxies actions to `useCardStore.getState()`.
- No store directly imports another store except `characterStore` importing `cardStore`.

## 5. Common Modification Scenarios

### 5.1 Adding a new player stat or activity

Files: `stores/playerStore.ts`.

Example: add a `courage` stat and a `faceFear()` activity.

1. Add `courage: 20` to the initial state.
2. Add getter `isBrave: () => get().courage >= 80` if needed.
3. Add action:

```ts
faceFear: () =>
  set((state) => ({
    courage: Math.min(100, state.courage + 5),
    stress: Math.max(0, state.stress - 10),
    stamina: Math.max(0, state.stamina - 8),
  })),
```

Design note: stats are always clamped with `Math.min(100, ...)` and `Math.max(0, ...)`. Keep this convention so UI meters never overflow. `buySnack()` shows the guard pattern: return `state` unchanged if preconditions are not met.

### 5.2 Adding a new map location

Files: `stores/mapStore.ts`, `stores/gameStore.ts` (if events should spawn there), `stores/cardStore.ts` (if NPCs should visit it).

1. Append a new entry to `LOCATIONS` with `id`, `name`, `x`, `y`, `color`, `description`.
2. Add the `id` to `LOCATION_IDS` in `gameStore.ts` so `spawnRandomEvents` can place events there.
3. If characters should schedule themselves there, update `PERIOD_LOCATION_RULES` or default card `favoriteLocations` in `data/default-cards/*.json`.

Design note: because `useMapStore` is a static `create(() => ({...}))` store, no action is needed to read new locations; existing components will see the new key automatically.

### 5.3 Adding a new period or changing NPC scheduling

Files: `stores/gameStore.ts`, `stores/cardStore.ts`.

1. Insert a new object into `PERIODS` (e.g. `{ key: 'nightStudy', label: '晚自习', time: '20:00' }`).
2. Add a matching resolver in `PERIOD_LOCATION_RULES` in `cardStore.ts`. If the period is omitted, `getTargetLocationForPeriod` falls back to the target's existing `currentLocationId`.
3. Ensure any UI that consumes `PERIODS` is updated; `nextPeriod()` will handle the new length automatically.

Design note: scheduling rules intentionally avoid hard-coded character names. They operate on `favoriteLocations`, so new cards automatically follow the same daily rhythm.

### 5.4 Adding a new field to the runtime character object

Files: `utils/cardLoader.ts`, optionally `data/cardSchema.ts`.

Example: add a `trait` field.

1. Update `cardToCharacter` to read `gameData.trait` and default it:

```ts
trait: gameData.trait || '普通',
```

2. If the field should be authorable in cards, add it to the `game_data` template in `createCardTemplate` and `normalizeCard` fallback in `data/cardSchema.ts`.

Design note: runtime objects keep a `_cardData` reference, so advanced features can always reach back into the original card without bloating the runtime shape.

### 5.5 Loading cards from a new source (e.g. IndexedDB or drag-and-drop)

Files: `stores/cardStore.ts`, `utils/cardLoader.ts`.

1. Add the loader helper in `utils/cardLoader.ts` that returns `{ success, card, error }`.
2. Add an action in `cardStore.ts` that sets `isLoading`/`error`, calls the loader, and uses the same `set((state) => ({ targets: [...], loadedCards: [...] }))` pattern as `addCardFromJSON`.

Design note: always normalize through `loadCardFromJSON` (which calls `normalizeCard`) rather than pushing raw data directly into `targets`. This guarantees V1 compatibility and default field injection.
