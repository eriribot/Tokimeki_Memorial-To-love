type ModelListRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ModelListRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getModelEntries(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return null;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.models)) return value.models;
  return null;
}

export function isOpenAICompatibleModelListResponse(value: unknown): boolean {
  return getModelEntries(value) !== null;
}

export function parseOpenAICompatibleModelIds(value: unknown): string[] {
  const entries = getModelEntries(value);
  if (!entries) return [];

  const ids = entries.flatMap(entry => {
    if (typeof entry === 'string') return [entry.trim()];
    if (!isRecord(entry) || typeof entry.id !== 'string') return [];
    return [entry.id.trim()];
  });

  return [...new Set(ids.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}
