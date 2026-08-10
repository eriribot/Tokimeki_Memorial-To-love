export const GAME_SNAPSHOT_SCHEMA_VERSION = 4 as const;

export function assertGameSnapshotSchemaVersion(value: unknown): asserts value is typeof GAME_SNAPSHOT_SCHEMA_VERSION {
  if (value !== GAME_SNAPSHOT_SCHEMA_VERSION) {
    throw new Error('存档版本无效；v3 及更早开发存档不再兼容，请新开档。');
  }
}
