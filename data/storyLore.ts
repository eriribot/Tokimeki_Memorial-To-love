import { readWorldbook } from './worldbook';

export interface DisabledWorldbookLoreReference {
  worldbookName: string;
  entryUid: number;
  entryName: string;
  rootTag: string;
  requiredContentMarker?: string;
  kind: 'plot' | 'character';
}

export interface LoadedStoryLore {
  worldbookName: string;
  entryUid: number;
  entryName: string;
  content: string;
  kind: 'plot' | 'character';
  entry: WorldbookEntry;
}

interface RawWorldInfoEntry extends Record<string, unknown> {
  uid: number;
  world: string;
  disable?: boolean;
  constant?: boolean;
  probability?: number;
  useProbability?: boolean;
  ignoreBudget?: boolean;
}

interface WorldInfoEntriesLoadedPayload {
  globalLore: RawWorldInfoEntry[];
  characterLore: RawWorldInfoEntry[];
  chatLore: RawWorldInfoEntry[];
  personaLore: RawWorldInfoEntry[];
}

const WORLD_INFO_POSITION = {
  before_character_definition: 0,
  after_character_definition: 1,
  before_author_note: 2,
  after_author_note: 3,
  at_depth: 4,
  before_example_messages: 5,
  after_example_messages: 6,
  outlet: 7,
} as const;

const WORLD_INFO_ROLE = {
  system: 0,
  user: 1,
  assistant: 2,
} as const;

const WORLD_INFO_SELECTIVE_LOGIC = {
  and_any: 0,
  not_all: 1,
  not_any: 2,
  and_all: 3,
} as const;

function normalizeName(value: string): string {
  return value.normalize('NFKC').trim();
}

function selectDisabledWorldbookStoryLore(
  entries: readonly WorldbookEntry[],
  reference: DisabledWorldbookLoreReference,
): LoadedStoryLore {
  const expectedName = normalizeName(reference.entryName);
  const namedEntries = entries.filter(entry => normalizeName(entry.name) === expectedName);

  if (namedEntries.length > 1) {
    throw new Error(
      `世界书「${reference.worldbookName}」中存在多个「${reference.entryName}」条目，无法安全选择剧情资料。`,
    );
  }

  const uidEntry = entries.find(entry => entry.uid === reference.entryUid);
  const entry =
    uidEntry && normalizeName(uidEntry.name) === expectedName
      ? uidEntry
      : namedEntries.length === 1
        ? namedEntries[0]
        : null;

  if (!entry) {
    throw new Error(
      `找不到世界书「${reference.worldbookName}」中的「${reference.entryName}」条目（预期 UID ${reference.entryUid}）。`,
    );
  }
  if (entry.enabled) {
    throw new Error(
      `世界书「${reference.worldbookName}」的「${reference.entryName}」条目必须保持关闭；代码会在本次扫描中临时启用副本，开启会造成重复。`,
    );
  }

  const content = entry.content.replace(/\r\n?/gu, '\n').trim();
  const openingTag = `<${reference.rootTag}>`;
  const closingTag = `</${reference.rootTag}>`;
  if (!content.startsWith(openingTag) || !content.endsWith(closingTag)) {
    throw new Error(
      `世界书「${reference.worldbookName}」的「${reference.entryName}」首尾标签应为 ${openingTag} 和 ${closingTag}。`,
    );
  }

  const body = content.slice(openingTag.length, -closingTag.length).trim();
  if (!body) {
    throw new Error(`世界书「${reference.worldbookName}」的「${reference.entryName}」标签内没有正文。`);
  }
  if (reference.requiredContentMarker && !body.includes(reference.requiredContentMarker)) {
    throw new Error(
      `世界书「${reference.worldbookName}」的「${reference.entryName}」缺少身份标记“${reference.requiredContentMarker}”。`,
    );
  }

  return {
    worldbookName: reference.worldbookName,
    entryUid: entry.uid,
    entryName: entry.name,
    content,
    kind: reference.kind,
    entry,
  };
}

export async function readDisabledWorldbookStoryLores(
  references: readonly DisabledWorldbookLoreReference[],
): Promise<LoadedStoryLore[]> {
  const bookReads = new Map<string, Promise<WorldbookEntry[]>>();

  return Promise.all(
    references.map(async reference => {
      let bookRead = bookReads.get(reference.worldbookName);
      if (!bookRead) {
        bookRead = readWorldbook(reference.worldbookName);
        bookReads.set(reference.worldbookName, bookRead);
      }
      const entries = await bookRead;
      return selectDisabledWorldbookStoryLore(entries, reference);
    }),
  );
}

function worldbookKeyToText(key: string | RegExp): string {
  return typeof key === 'string' ? key : key.source;
}

function createRawWorldInfoEntry(lore: LoadedStoryLore): RawWorldInfoEntry {
  const { entry } = lore;
  return {
    ...(entry.extra ?? {}),
    uid: entry.uid,
    world: lore.worldbookName,
    key: entry.strategy.keys.map(worldbookKeyToText),
    keysecondary: entry.strategy.keys_secondary.keys.map(worldbookKeyToText),
    comment: entry.name,
    content: entry.content,
    constant: entry.strategy.type === 'constant',
    selective: entry.strategy.type === 'selective',
    vectorized: entry.strategy.type === 'vectorized',
    selectiveLogic: WORLD_INFO_SELECTIVE_LOGIC[entry.strategy.keys_secondary.logic],
    scanDepth: entry.strategy.scan_depth === 'same_as_global' ? null : entry.strategy.scan_depth,
    order: entry.position.order,
    position: WORLD_INFO_POSITION[entry.position.type],
    role: WORLD_INFO_ROLE[entry.position.role],
    depth: entry.position.depth,
    disable: !entry.enabled,
    probability: entry.probability,
    useProbability: true,
    excludeRecursion: entry.recursion.prevent_outgoing,
    preventRecursion: entry.recursion.prevent_incoming,
    delayUntilRecursion: entry.recursion.delay_until ?? false,
    sticky: entry.effect.sticky,
    cooldown: entry.effect.cooldown,
    delay: entry.effect.delay,
  };
}

function getLoreKey(worldbookName: string, entryUid: number): string {
  return `${worldbookName}.${entryUid}`;
}

/**
 * Adds selected disabled entries to SillyTavern's next native World Info scan.
 * Only the per-scan copies are changed; the saved worldbook stays disabled.
 */
export function armStoryLoresForNextWorldInfoScan(lores: readonly LoadedStoryLore[]): () => void {
  if (typeof eventOnce !== 'function' || typeof tavern_events === 'undefined') {
    throw new Error('当前环境没有可用的 SillyTavern 世界书扫描事件。');
  }

  const selectedLores = new Map(lores.map(lore => [getLoreKey(lore.worldbookName, lore.entryUid), lore]));
  const subscription = eventOnce(tavern_events.WORLDINFO_ENTRIES_LOADED, payload => {
    const loaded = payload as WorldInfoEntriesLoadedPayload;
    const collections = [loaded.chatLore, loaded.personaLore, loaded.characterLore, loaded.globalLore];
    const matched = new Set<string>();

    for (const collection of collections) {
      for (const entry of collection) {
        const key = getLoreKey(entry.world, entry.uid);
        if (!selectedLores.has(key)) continue;
        entry.disable = false;
        entry.constant = true;
        entry.probability = 100;
        entry.useProbability = false;
        entry.ignoreBudget = true;
        matched.add(key);
      }
    }

    for (const [key, lore] of selectedLores) {
      if (matched.has(key)) continue;
      loaded.globalLore.push({
        ...createRawWorldInfoEntry(lore),
        disable: false,
        constant: true,
        probability: 100,
        useProbability: false,
        ignoreBudget: true,
      });
    }
  });

  return subscription.stop;
}
