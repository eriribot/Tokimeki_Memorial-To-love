---
name: webgame-ui-dr-data
description: Use when working with the data module of webgame-ui — it defines the SillyTavern V2 character card schema, game-specific `extensions.game_data`, validation/normalization helpers, and the default character card payloads.
---

# webgame-ui `data` module

## 1. Module Purpose & Capabilities

The `data` module is the single source of truth for *what a character card looks like* in this project.

It lives under `D:/webgame/tavern_helper_template-main/src/webgame-ui/data` and provides:

- **`data/cardSchema.ts`** — the canonical SillyTavern Character Card V2 schema plus the webgame-specific `extensions.game_data` extension. Exports factory functions, validation, and normalization helpers.
- **`data/default-cards/*.json`** — four built-in character cards that ship with the game and are auto-loaded on startup.
- Backward compatibility with SillyTavern V1 cards, PNG-embedded cards, JSON files, and remote URLs via `utils/cardLoader.ts`.

Everything that consumes character data — `utils/cardLoader.ts`, `stores/cardStore.ts`, `stores/characterStore.ts`, and the UI components — ultimately depends on shapes produced by this module.

## 2. Core Design Logic

### 2.1 Plain-object factories over TS interfaces

`cardSchema.ts` exports `createCardTemplate()`, `createWorldbookEntry()`, and helper functions. They return plain JavaScript objects rather than declared TypeScript interfaces. This keeps the module runtime-friendly: cards are loaded from JSON imports, parsed from files, or extracted from PNG metadata, so the code favors defensive normalization over compile-time guarantees.

### 2.2 SillyTavern compatibility first, game data second

Standard SillyTavern fields (`name`, `description`, `personality`, `scenario`, `first_mes`, `mes_example`, `character_book`, `tags`, etc.) live in `card.data`. All game-specific additions are isolated under `card.data.extensions.game_data`. This separation means:

- Imported SillyTavern cards remain valid even if they lack game fields.
- A card can be round-tripped back to SillyTavern without losing custom game data.
- `normalizeCard()` can inject a safe default `game_data` object when it is missing.

### 2.3 Defensive normalization is the gatekeeper

`normalizeCard(rawCard)` in `data/cardSchema.ts` is the single entry point that every loader uses. It:

1. Rejects invalid inputs via `isValidCard(card)`.
2. Upgrades legacy V1 cards with `upgradeCardV1toV2(v1Card)`.
3. Ensures `data.extensions.game_data` exists, filling in defaults for `id`, `color`, `type`, `favoriteLocations`, `stats`, `events`, and image fields.

Because of this, downstream code (`cardToCharacter` in `utils/cardLoader.ts`) can assume `game_data` and its sub-fields are present.

### 2.4 Default cards are content, not code

The four default cards are static JSON files imported by `stores/characterStore.ts`. Keeping them as JSON lets writers edit character content without touching TypeScript. The filename is not authoritative — the `game_data.id` field is what becomes the runtime character id (with deduplication logic in `cardToCharacter`).

## 3. Core Data Structures

### 3.1 Top-level card shape (`createCardTemplate`)

File: `data/cardSchema.ts`

```ts
{
  spec: 'chara_card_v2',
  spec_version: '2.0',
  data: {
    name: '',
    description: '',
    personality: '',
    scenario: '',
    first_mes: '',
    mes_example: '',
    creator_notes: '',
    system_prompt: '',
    post_history_instructions: '',
    alternate_greetings: [],
    character_book: { /* see 3.2 */ },
    tags: [],
    creator: '',
    character_version: '',
    extensions: {
      game_data: { /* see 3.3 */ }
    }
  }
}
```

### 3.2 Character book / worldbook entry shape (`createWorldbookEntry`)

```ts
{
  name: '',
  description: '',
  scan_depth: 2,
  token_budget: 512,
  recursive_scanning: false,
  extensions: {},
  entries: [
    {
      id: 0,
      keys: [],
      content: '',
      extensions: {},
      enabled: true,
      insertion_order: 100,
      case_sensitive: false,
      name: '',
      priority: 10,
      comment: '',
      selective: true,
      secondary_keys: [],
      constant: false,
      position: 'after_char'
    }
  ]
}
```

### 3.3 Game-specific extension (`extensions.game_data`)

```ts
{
  id: '',              // runtime slug; used to build the character id
  color: '#ff8fab',    // UI accent color
  type: '未知系',       // short archetype label
  favoriteLocations: ['classroom'],
  stats: {
    affection: 0,
    friendship: 0,
    romance: 0
  },
  events: [],          // game event list; currently empty in defaults
  chibi_image: null,   // path to chibi art
  portrait_image: null,// path to card/portrait art
  tachie_image: null   // path to tachie/standing art
}
```

### 3.4 Runtime character object (`cardToCharacter`)

File: `utils/cardLoader.ts`

The store does not hold the raw card; it holds a flattened runtime character derived by `cardToCharacter(card, existingCharacters)`:

```ts
{
  id,                // game_data.id or slugified name; deduplicated
  name,
  color,
  type,
  favoriteLocations,
  greeting,          // from first_mes
  portrait,          // portrait_image with placeholder fallback
  chibi,             // chibi_image with placeholder fallback
  tachie,            // tachie_image, may be null
  affection,         // from stats.affection
  friendship,        // from stats.friendship
  romance,           // from stats.romance
  currentLocationId, // favoriteLocations[0]
  _cardData: card    // original card kept for advanced features
}
```

## 4. State Flow

```
JSON source
   │
   ▼
loadCardFromJSON / loadCardFromFile / loadCardFromURL  (utils/cardLoader.ts)
   │
   ▼
normalizeCard(rawCard)  (data/cardSchema.ts)
   │   • validates with isValidCard
   │   • upgrades V1 → V2 with upgradeCardV1toV2
   │   • injects default extensions.game_data
   ▼
card object (SillyTavern V2 + game_data)
   │
   ▼
cardToCharacter(card, existingCharacters)  (utils/cardLoader.ts)
   │
   ▼
character object added to cardStore.targets[] and cardStore.loadedCards[]
   │
   ▼
characterStore auto-imports default cards and mirrors cardStore.targets[]
```

Default cards are loaded once at startup by `stores/characterStore.ts`:

```ts
import harukaCard from '../data/default-cards/haruka.json'
import miyukiCard from '../data/default-cards/miyuki.json'
import rinCard from '../data/default-cards/rin.json'
import sakuraCard from '../data/default-cards/sakura.json'
```

The store loops through `[harukaCard, miyukiCard, rinCard, sakuraCard]` and calls `cardStore.addCardFromJSON(card)`. A Zustand subscription then syncs `characterStore.characters` to `cardStore.targets`.

Location scheduling uses `getTargetLocationForPeriod(target, periodKey)` in `stores/cardStore.ts`. It reads `favoriteLocations` and maps time-of-day keys (`morning`, `class1`, `lunch`, `class2`, `afterSchool`, `evening`) to a concrete `currentLocationId`.

## 5. Common Modification Scenarios

### 5.1 Adding a new default character

1. Create `data/default-cards/<your-id>.json` matching the schema in `createCardTemplate()`.
2. Fill standard SillyTavern fields (`name`, `description`, `personality`, `scenario`, `first_mes`, `mes_example`).
3. Add one or two `character_book.entries` with `keys`, `content`, `name`, and `position: 'after_char'`.
4. Set `extensions.game_data`:
   - `id` — unique runtime slug (e.g. `nana`).
   - `color` — UI accent hex.
   - `type` — archetype label.
   - `favoriteLocations` — array of location ids; order matters for `currentLocationId` and period rules.
   - `chibi_image`, `portrait_image`, `tachie_image` — paths under `/artsource/...`.
5. Import the JSON in `stores/characterStore.ts` and add it to the initialization array.

Example default cards to copy from:
- `data/default-cards/sakura.json` — 菈菈·薩塔琳·戴比路克 (`id: 'sakura'`)
- `data/default-cards/rin.json` — 伊芙 (`id: 'rin'`)
- `data/default-cards/haruka.json` — 梦梦·贝莉雅·戴比路克 (`id: 'haruka'`)
- `data/default-cards/miyuki.json` — 古手川唯 (`id: 'miyuki'`)

### 5.2 Extending the game data schema

Suppose you want to add a `trust` stat or a `birthday` field.

1. Update `createCardTemplate()` in `data/cardSchema.ts` so new cards get the field.
2. Update `upgradeCardV1toV2()` so legacy cards are migrated.
3. Update the fallback object in `normalizeCard()` where it builds a default `game_data` object.
4. Update `cardToCharacter()` in `utils/cardLoader.ts` to map the new field onto the runtime character.
5. Update any stores/components that read or write the field.

Because `normalizeCard()` is the gatekeeper, adding a default value there prevents `undefined` errors in the rest of the app.

### 5.3 Changing starting locations or period schedules

- **Initial spawn location**: `cardToCharacter()` sets `currentLocationId = gameData.favoriteLocations?.[0] || 'classroom'`. Put the desired home location first in the array.
- **Period behavior**: Edit `PERIOD_LOCATION_RULES` in `stores/cardStore.ts` (not in the `data` module). The rules reference `favoriteLocations` by index, so reordering a card's `favoriteLocations` changes where it appears at `morning`, `lunch`, and `afterSchool` without touching the store.
- **Default location fallback**: `'classroom'` is used when `favoriteLocations` is empty or missing.

### 5.4 Validating or normalizing imported cards

If you build an importer UI, pass user-provided JSON through:

```ts
import { normalizeCard, isValidCard } from '../data/cardSchema'

try {
  const card = normalizeCard(rawJson)
  // safe to use
} catch (error) {
  // invalid format
}
```

`isValidCard()` accepts:
- `chara_card_v2` objects with a truthy `data.name`.
- V1 objects with a truthy `name` (then normalized via `upgradeCardV1toV2`).

## Key files

- `D:/webgame/tavern_helper_template-main/src/webgame-ui/data/cardSchema.ts`
- `D:/webgame/tavern_helper_template-main/src/webgame-ui/data/default-cards/sakura.json`
- `D:/webgame/tavern_helper_template-main/src/webgame-ui/data/default-cards/rin.json`
- `D:/webgame/tavern_helper_template-main/src/webgame-ui/data/default-cards/haruka.json`
- `D:/webgame/tavern_helper_template-main/src/webgame-ui/data/default-cards/miyuki.json`
- Consumers:
  - `D:/webgame/tavern_helper_template-main/src/webgame-ui/utils/cardLoader.ts`
  - `D:/webgame/tavern_helper_template-main/src/webgame-ui/stores/cardStore.ts`
  - `D:/webgame/tavern_helper_template-main/src/webgame-ui/stores/characterStore.ts`
