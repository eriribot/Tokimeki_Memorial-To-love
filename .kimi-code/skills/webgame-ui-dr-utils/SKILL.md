---
name: webgame-ui-dr-utils
description: Use when working with the utils module of webgame-ui — asset path resolution, card loading from JSON/PNG/URL, batch loading, and runtime SVG placeholder generation.
---

# webgame-ui `utils` module

Tracking ref: `main`

## 1. Module Purpose & Capabilities

The `utils` module (`D:/webgame/tavern_helper_template-main/src/webgame-ui/utils/`) provides cross-cutting runtime utilities for the React + TypeScript + Zustand web-game UI. It owns four main capability areas:

1. **Asset path resolution** — runtime base-path injection for bundled/deployment assets.
2. **Character-card loading** — ingestion of SillyTavern V1/V2 character cards from JSON objects, `.json` files, `.png` files (PNG `tEXt` chunk extraction), and remote URLs.
3. **Batch loading** — parallel ingestion of heterogeneous card sources with per-item success/error reporting.
4. **Placeholder generation** — runtime SVG data-URL generators and a React component that falls back to them when images fail to load.

Key files:

- `utils/assetPath.ts` — base-path resolver.
- `utils/cardLoader.ts` — card ingestion and card-to-character conversion.
- `utils/placeholderGenerator.tsx` — SVG placeholders and `ImageWithPlaceholder`.
- `data/cardSchema.ts` — (dependency) schema normalization/validation functions consumed by `cardLoader.ts`.

## 2. Core Design Logic

### 2.1 Asset path resolution is deployment-aware but non-breaking

`resolveAssetPath(src)` in `utils/assetPath.ts` only transforms absolute paths (strings starting with `/`). If `src` is falsy, relative, or already a full URL, it is returned unchanged. When `globalThis.window.__WEBGAME_ASSET_BASE__` is set, that base is concatenated with the leading `/` removed from `src`.

Design decisions:

- Uses `globalThis.window?.__WEBGAME_ASSET_BASE__` rather than an import-time env variable, so the same build can be redeployed under different base paths without recompilation.
- Trims trailing slashes from the base and leading slashes from `src` to avoid double slashes.
- Returns `src` unchanged when no base is configured, keeping local/dev behavior intact.

### 2.2 Card loading normalizes first, then validates

All loading entry points (`loadCardFromJSON`, `loadCardFromFile`, `loadCardFromURL`) eventually call `loadCardFromJSON`, which delegates to `normalizeCard` from `data/cardSchema.ts`. The loader never exposes raw user input to the rest of the app; it always produces a normalized V2 card shape or a structured `{ success: false, error }` result.

Design decisions:

- Structured `{ success, card, error }` return objects instead of thrown errors for caller-friendly batch handling.
- PNG loading reuses `loadCardFromFile` after extracting the embedded JSON, avoiding duplication of the normalization path.
- URL loading inspects the `content-type` header; PNG responses are converted to a `File` and passed to the PNG path, while everything else is parsed as JSON.

### 2.3 PNG card extraction parses the file manually

`extractCardFromPNG(file)` in `utils/cardLoader.ts` reads the PNG as an `ArrayBuffer`, skips the 8-byte PNG signature, then walks chunks using big-endian length fields. It looks for a `tEXt` chunk whose keyword is `chara` (SillyTavern's convention) and parses the text after the null separator as JSON.

Design decisions:

- Manual chunk parsing avoids adding a PNG parsing dependency for a single, well-defined use case.
- Stops at `IEND` to prevent reading past the image data unnecessarily.
- Uses `TextDecoder` for the chunk text rather than assuming ASCII.

### 2.4 Batch loading isolates failures

`loadMultipleCards(sources)` in `utils/cardLoader.ts` accepts an array where each element may be a URL string, a `File`, or a JSON object. It uses `Promise.allSettled` so one failed load does not reject the entire batch. The returned array mirrors the input order and includes `index`, `success`, `card`, and `error` for each item.

Design decisions:

- Order preservation lets callers correlate results with their original inputs.
- `allSettled` plus an explicit `success` flag distinguishes a rejected promise from a resolved-but-unsuccessful loader result.

### 2.5 Card-to-character conversion is opinionated and safe-by-default

`cardToCharacter(card, existingCharacters)` in `utils/cardLoader.ts` converts a normalized card into the in-game `Character` object. It:

- Reads `card.data.extensions.game_data` for game-specific fields.
- Generates an `id` from `gameData.id` or falls back to a lower-cased, underscore-joined form of `data.name`.
- Deduplicates the generated `id` against `existingCharacters` by appending `_1`, `_2`, etc.
- Provides default values for every gameplay field (`color`, `type`, `favoriteLocations`, `greeting`, `portrait`, `chibi`, stats, `currentLocationId`).
- Preserves the original normalized card on `_cardData` for advanced features that need the full SillyTavern payload.

Design decisions:

- All defaults are hard-coded in this function, centralizing the "missing game data" policy.
- `tachie` defaults to `null` (no placeholder), while `portrait` and `chibi` default to static SVG placeholder paths in `artsource/`.
- Deduplication keeps the store keys stable without requiring callers to pre-check.

### 2.6 Placeholders are generated as SVG data URLs

`utils/placeholderGenerator.tsx` exports three character-aware placeholder generators and one generic fallback:

- `generatePortraitPlaceholder(character)` — 180×240 portrait card.
- `generateTachiePlaceholder(character)` — 360×540 full-body illustration.
- `generateChibiPlaceholder(character)` — 64×64 circular avatar.
- `generateGenericPlaceholder(width, height, text)` — fallback for non-character images.

All SVGs use a base `color`, a brightness-adjusted gradient, the character's first initial, name label, and `type` label. `svgToDataUrl(svg)` encodes the SVG with `encodeURIComponent` and prefixes `data:image/svg+xml;charset=utf-8,`.

Design decisions:

- Data URLs avoid network requests and broken-file scenarios entirely.
- `adjustColorBrightness(color, percent)` supports 3-digit and 6-digit hex plus `rgb(...)` inputs; unsupported inputs pass through unchanged.
- Gradient IDs are derived from `name` with whitespace replaced by hyphens, so multiple placeholders on the same page do not share definitions.

### 2.7 `ImageWithPlaceholder` ties resolution and fallback together

`ImageWithPlaceholder` is a React component that combines `resolveAssetPath`, a loading state, and the placeholder generators. It resolves `src` on mount and whenever `src` changes; on `onError` it swaps in the appropriate placeholder based on `type` (`portrait` | `chibi` | `tachie`) and whether a `character` object was provided.

Design decisions:

- Keeps placeholder selection logic out of presentational components.
- `onLoad` and `onError` callbacks are forwarded so parent components can still react to image lifecycle events.
- A generic placeholder is used when no `character` is available, preventing crashes on unrelated images.

## 3. Core Data Structures

### 3.1 Loader result

```ts
{
  success: boolean;
  card?: NormalizedCard;   // present when success is true
  error?: string;          // present when success is false
}
```

Returned by `loadCardFromJSON`, `loadCardFromFile`, and `loadCardFromURL`.

### 3.2 Batch result

```ts
{
  index: number;
  success: boolean;
  card: NormalizedCard | null;
  error: string | null;
}
```

Returned by `loadMultipleCards(sources)`. `index` matches the position in the input array.

### 3.3 Normalized card shape (SillyTavern V2)

Defined by `data/cardSchema.ts` and produced by `normalizeCard`:

```ts
{
  spec: 'chara_card_v2';
  spec_version: '2.0';
  data: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creator_notes: string;
    system_prompt: string;
    post_history_instructions: string;
    alternate_greetings: string[];
    character_book: { entries: WorldbookEntry[]; ... };
    tags: string[];
    creator: string;
    character_version: string;
    extensions: {
      game_data: {
        id: string;
        color: string;          // default '#ff8fab'
        type: string;           // default '未知系'
        favoriteLocations: string[]; // default ['classroom']
        stats: { affection: number; friendship: number; romance: number };
        events: any[];
        chibi_image: string | null;
        portrait_image: string | null;
        tachie_image: string | null;
      }
    }
  }
}
```

`normalizeCard` also accepts V1 cards and upgrades them via `upgradeCardV1toV2`.

### 3.4 In-game character object

Produced by `cardToCharacter(card, existingCharacters)`:

```ts
{
  id: string;
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
  _cardData: NormalizedCard; // original normalized card
}
```

## 4. State Flow

```
External source
    │
    ├── JSON object ──→ loadCardFromJSON ──→ normalizeCard ──→ { success, card }
    │
    ├── File (.json/.png) ──→ loadCardFromFile
    │         └─ PNG ──→ extractCardFromPNG ──→ JSON ──→ loadCardFromJSON
    │
    ├── URL ──→ loadCardFromURL
    │         ├─ content-type image/png ──→ File ──→ loadCardFromFile
    │         └─ otherwise ──→ response.json() ──→ loadCardFromJSON
    │
    └── Mixed array ──→ loadMultipleCards ──→ Promise.allSettled ──→ result[]

Normalized card ──→ cardToCharacter(existingCharacters) ──→ Character object

Image src ──→ resolveAssetPath ──→ <img> / ImageWithPlaceholder
                                          │
                                          onError
                                           │
                         generatePortraitPlaceholder / generateTachiePlaceholder / generateChibiPlaceholder / generateGenericPlaceholder
```

## 5. Common Modification Scenarios

### 5.1 Adding a new card source format

If you need to support a new source (for example, YAML files or a custom binary blob):

1. Add a new exported loader in `utils/cardLoader.ts` (e.g., `loadCardFromYAML`).
2. Convert the source into a plain object and call `loadCardFromJSON(obj)` so normalization and error wrapping stay consistent.
3. If the source belongs in `loadMultipleCards`, add a type branch in the `sources.map` callback.

Do not bypass `normalizeCard`; doing so would allow invalid V1/V2 cards to reach the game store.

### 5.2 Changing default character values

Defaults for converted characters live in `cardToCharacter` inside `utils/cardLoader.ts`. For example, to change the default `currentLocationId` or add a new stat field:

1. Update the fallback expression in `cardToCharacter`.
2. Update `createCardTemplate()` and the `game_data` default object in `data/cardSchema.ts` so newly created cards have the same defaults.
3. If the field affects placeholders, update `generatePortraitPlaceholder` / `generateTachiePlaceholder` / `generateChibiPlaceholder` accordingly.

### 5.3 Supporting a new image type / size in the placeholder system

If the UI introduces a new image slot (for example, a 120×160 "list thumbnail"):

1. Add a generator function in `utils/placeholderGenerator.tsx` that mirrors the existing signature: `({ name, color, type }) => string`.
2. Reuse `adjustColorBrightness` and `svgToDataUrl` to keep color handling consistent.
3. Register the new `type` value in `ImageWithPlaceholder.handleError` so the component can select it.
4. Ensure the new SVG uses unique gradient/filter IDs if multiple instances may render on the same page.

### 5.4 Changing asset base path behavior

`resolveAssetPath` is the single source of truth. If you need to support a different injection mechanism (for example, a meta tag or environment variable):

1. Keep the function signature unchanged (`resolveAssetPath(src)`); consumers like `ImageWithPlaceholder` depend on it.
2. Add fallback reads inside `resolveAssetPath` and merge them with `__WEBGAME_ASSET_BASE__` according to your precedence rules.
3. Maintain the early-return for non-absolute `src` values so relative imports and external URLs are not accidentally rewritten.

### 5.5 Improving PNG metadata extraction

The current `extractCardFromPNG` only reads `tEXt` chunks with keyword `chara`. If you need to support newer SillyTavern conventions (for example, `chara` in a `zTXt` compressed chunk):

1. Add a `zTXt` branch after the existing `tEXt` branch.
2. Decompress the chunk data with the Compression Streams API or a small inflate library, then parse the keyword and value.
3. Keep the `IEND` break and the promise-based `FileReader` pattern to avoid changing the public async contract.

## Quick Reference

| Function / Component | File | Purpose |
| --- | --- | --- |
| `resolveAssetPath(src)` | `utils/assetPath.ts` | Inject deployment base path into absolute asset URLs. |
| `loadCardFromJSON(jsonData)` | `utils/cardLoader.ts` | Normalize and validate a raw card object. |
| `loadCardFromFile(file)` | `utils/cardLoader.ts` | Load `.json` or `.png` cards from a `File`. |
| `loadCardFromURL(url)` | `utils/cardLoader.ts` | Fetch a card from a URL and dispatch to the correct loader. |
| `extractCardFromPNG(file)` | `utils/cardLoader.ts` | Internal PNG `tEXt`/`chara` extractor. |
| `loadMultipleCards(sources)` | `utils/cardLoader.ts` | Parallel heterogeneous batch loading with per-item results. |
| `cardToCharacter(card, existingCharacters)` | `utils/cardLoader.ts` | Convert normalized card to in-game `Character`. |
| `generatePortraitPlaceholder(character)` | `utils/placeholderGenerator.tsx` | 180×240 SVG data URL. |
| `generateTachiePlaceholder(character)` | `utils/placeholderGenerator.tsx` | 360×540 SVG data URL. |
| `generateChibiPlaceholder(character)` | `utils/placeholderGenerator.tsx` | 64×64 SVG data URL. |
| `generateGenericPlaceholder(width, height, text)` | `utils/placeholderGenerator.tsx` | Generic SVG data URL. |
| `ImageWithPlaceholder(props)` | `utils/placeholderGenerator.tsx` | React `<img>` wrapper with auto-fallback. |
| `normalizeCard(rawCard)` | `data/cardSchema.ts` | Validate and normalize V1/V2 cards. |
| `isValidCard(card)` | `data/cardSchema.ts` | Basic structural validity check. |
| `upgradeCardV1toV2(v1Card)` | `data/cardSchema.ts` | V1 → V2 conversion. |
