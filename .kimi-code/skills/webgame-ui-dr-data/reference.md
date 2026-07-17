# `data` module reference

## `data/cardSchema.ts` exports

| Export | Kind | Purpose |
|--------|------|---------|
| `CARD_SPEC_VERSION` | constant | `'2.0'` |
| `createCardTemplate()` | factory | Returns a full SillyTavern V2 card with default `extensions.game_data`. |
| `createWorldbookEntry()` | factory | Returns a default `character_book.entries[]` item. |
| `isValidCard(card)` | guard | Returns `true` for V2 cards with `data.name` or V1 cards with `name`. |
| `upgradeCardV1toV2(v1Card)` | transformer | Migrates a V1 card to V2, preserving fields and adding default `game_data`. |
| `normalizeCard(rawCard)` | transformer | Validates, upgrades V1, and ensures `extensions.game_data` exists. Throws on invalid input. |

## `card.data` standard SillyTavern fields

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Required. Becomes runtime `name` and fallback id slug. |
| `description` | string | Long-form character description. |
| `personality` | string | Short personality summary. |
| `scenario` | string | Opening scenario text. |
| `first_mes` | string | First message; becomes runtime `greeting`. |
| `mes_example` | string | Example dialogue, often with `<START>` markers. |
| `creator_notes` | string | Internal notes. |
| `system_prompt` | string | Optional system prompt override. |
| `post_history_instructions` | string | Post-history instructions. |
| `alternate_greetings` | `string[]` | Alternate first messages. |
| `character_book` | object | Worldbook with `entries[]`. |
| `tags` | `string[]` | Used as fallback for `type` if `game_data.type` is missing. |
| `creator` | string | Card author. |
| `character_version` | string | Card version string. |
| `extensions` | object | Holds `game_data`. |

## `extensions.game_data` fields

| Field | Type | Default | Used by |
|-------|------|---------|---------|
| `id` | string | `''` | `cardToCharacter` → runtime `id` |
| `color` | string | `'#ff8fab'` | UI accent color |
| `type` | string | `'未知系'` | Runtime `type`; fallback to `tags[0]` |
| `favoriteLocations` | `string[]` | `['classroom']` | `currentLocationId` and period rules |
| `stats.affection` | number | `0` | Runtime `affection` |
| `stats.friendship` | number | `0` | Runtime `friendship` |
| `stats.romance` | number | `0` | Runtime `romance` |
| `events` | `any[]` | `[]` | Reserved for game events |
| `chibi_image` | `string \| null` | `null` | Runtime `chibi` |
| `portrait_image` | `string \| null` | `null` | Runtime `portrait` |
| `tachie_image` | `string \| null` | `null` | Runtime `tachie` |

## Worldbook entry fields (`createWorldbookEntry`)

| Field | Default | Purpose |
|-------|---------|---------|
| `id` | `0` | Entry id |
| `keys` | `[]` | Trigger keywords |
| `content` | `''` | Injected lore content |
| `extensions` | `{}` | Extension object |
| `enabled` | `true` | Whether entry is active |
| `insertion_order` | `100` | Insertion priority |
| `case_sensitive` | `false` | Keyword matching mode |
| `name` | `''` | Human-readable entry name |
| `priority` | `10` | Priority vs other entries |
| `comment` | `''` | Author note |
| `selective` | `true` | Selective matching flag |
| `secondary_keys` | `[]` | Secondary trigger keywords |
| `constant` | `false` | Always inject flag |
| `position` | `'after_char'` | Where to inject content |

## Default card summary

| File | Display name | `game_data.id` | Type | Favorite locations | Color |
|------|--------------|----------------|------|--------------------|-------|
| `data/default-cards/riko.json` | 夕崎梨子 | `riko` | 同班同学 | `classroom`, `courtyard` | `#e96f91` |
| `data/default-cards/haruna.json` | 西连寺春菜 | `haruna` | 同班同学 | `classroom`, `rooftop` | `#a78bfa` |
| `data/default-cards/sakura.json` | 菈菈·薩塔琳·戴比路克 | `sakura` | 第一公主 | `classroom`, `courtyard` | `#f87171` |
| `data/default-cards/rin.json` | 伊芙 | `rin` | 宇宙杀手 | `library`, `courtyard` | `#fbbf24` |
| `data/default-cards/haruka.json` | 梦梦·贝莉雅·戴比路克 | `haruka` | 第三公主 | `courtyard`, `classroom` | `#f472b6` |
| `data/default-cards/miyuki.json` | 古手川唯 | `miyuki` | 风纪委员 | `library`, `classroom` | `#818cf8` |

All default cards set `spec: 'chara_card_v2'`, `spec_version: '2.0'`, `creator: 'webgame'`, `character_version: '1.0'`, and start with all stats at `0`.
