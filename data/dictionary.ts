import dictionarySource from './lore-books/dictionary/entries.json?raw';

export interface DictionaryEntry {
  id: number;
  name: string;
  title: string;
  description: string;
}

interface DictionarySource {
  entries: DictionaryEntry[];
}

function isDictionaryEntry(value: unknown): value is DictionaryEntry {
  if (!value || typeof value !== 'object') return false;

  const entry = value as Partial<DictionaryEntry>;
  return (
    Number.isInteger(entry.id) &&
    typeof entry.name === 'string' &&
    entry.name.length > 0 &&
    typeof entry.title === 'string' &&
    entry.title.length > 0 &&
    typeof entry.description === 'string' &&
    entry.description.length > 0
  );
}

function loadDictionaryEntries(): readonly DictionaryEntry[] {
  const parsed = JSON.parse(dictionarySource) as Partial<DictionarySource>;
  if (!Array.isArray(parsed.entries) || parsed.entries.length === 0 || !parsed.entries.every(isDictionaryEntry)) {
    throw new Error('官方辞典数据格式无效');
  }

  return parsed.entries;
}

export const DICTIONARY_ENTRIES = loadDictionaryEntries();
