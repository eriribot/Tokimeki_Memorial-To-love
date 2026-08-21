import type {
  DatingCharacterProgress,
  DatingGirlRelation,
  DatingRelationshipDelta,
  DatingRelationshipState,
} from './types';

const DEFAULT_CHARACTER_PROGRESS: DatingCharacterProgress = { sub: 0, hurt: 0 };
const DEFAULT_GIRL_RELATION: DatingGirlRelation = { tolerance: 50, rivalry: 0, yuriBond: 0 };

// These are directed, pair-specific starting tendencies. Unknown pairs remain neutral.
const SEEDED_GIRL_RELATIONS: Record<string, Record<string, DatingGirlRelation>> = {
  lala: {
    momo: { tolerance: 85, rivalry: 10, yuriBond: 25 },
    nana: { tolerance: 85, rivalry: 10, yuriBond: 25 },
  },
  saki: {
    lala: { tolerance: 20, rivalry: 80, yuriBond: 0 },
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Math.round(Number.isFinite(value) ? value : minimum)));
}

function cloneGirlRelations(
  relations: Record<string, Record<string, DatingGirlRelation>>,
): Record<string, Record<string, DatingGirlRelation>> {
  return Object.fromEntries(
    Object.entries(relations).map(([fromId, targets]) => [
      fromId,
      Object.fromEntries(Object.entries(targets).map(([toId, relation]) => [toId, { ...relation }])),
    ]),
  );
}

export function createInitialDatingRelationshipState(): DatingRelationshipState {
  return {
    characterProgress: {},
    girlRelations: cloneGirlRelations(SEEDED_GIRL_RELATIONS),
  };
}

export function isDatingRelationshipDelta(value: unknown): value is DatingRelationshipDelta {
  if (!isRecord(value)) return false;
  if (
    (value.sub !== undefined && (typeof value.sub !== 'number' || !Number.isFinite(value.sub))) ||
    (value.hurt !== undefined && (typeof value.hurt !== 'number' || !Number.isFinite(value.hurt)))
  ) {
    return false;
  }
  if (value.girlRelations === undefined) return true;
  if (!isRecord(value.girlRelations)) return false;
  return Object.values(value.girlRelations).every(targets => {
    if (!isRecord(targets)) return false;
    return Object.values(targets).every(relation => {
      if (!isRecord(relation)) return false;
      return Object.entries(relation).every(
        ([key, field]) =>
          ['tolerance', 'rivalry', 'yuriBond'].includes(key) && typeof field === 'number' && Number.isFinite(field),
      );
    });
  });
}

export function isDatingRelationshipState(value: unknown): value is DatingRelationshipState {
  if (!isRecord(value) || !isRecord(value.characterProgress) || !isRecord(value.girlRelations)) return false;
  const validProgress = Object.values(value.characterProgress).every(progress => {
    if (!isRecord(progress)) return false;
    return (
      typeof progress.sub === 'number' &&
      Number.isFinite(progress.sub) &&
      progress.sub >= -100 &&
      progress.sub <= 100 &&
      typeof progress.hurt === 'number' &&
      Number.isFinite(progress.hurt) &&
      progress.hurt >= 0 &&
      progress.hurt <= 100
    );
  });
  const validRelations = Object.values(value.girlRelations).every(targets => {
    if (!isRecord(targets)) return false;
    return Object.values(targets).every(relation => {
      if (!isRecord(relation)) return false;
      return (
        typeof relation.tolerance === 'number' &&
        Number.isFinite(relation.tolerance) &&
        relation.tolerance >= 0 &&
        relation.tolerance <= 100 &&
        typeof relation.rivalry === 'number' &&
        Number.isFinite(relation.rivalry) &&
        relation.rivalry >= 0 &&
        relation.rivalry <= 100 &&
        typeof relation.yuriBond === 'number' &&
        Number.isFinite(relation.yuriBond) &&
        relation.yuriBond >= 0 &&
        relation.yuriBond <= 100
      );
    });
  });
  return validProgress && validRelations;
}

export function normalizeDatingRelationshipState(value: unknown): DatingRelationshipState {
  if (value === undefined || value === null) return createInitialDatingRelationshipState();
  if (!isDatingRelationshipState(value)) throw new Error('约会关系账本字段格式无效。');
  return {
    characterProgress: Object.fromEntries(
      Object.entries(value.characterProgress).map(([characterId, progress]) => [
        characterId,
        {
          sub: clamp(progress.sub, -100, 100),
          hurt: clamp(progress.hurt, 0, 100),
        },
      ]),
    ),
    girlRelations: Object.fromEntries(
      Object.entries(value.girlRelations).map(([fromId, targets]) => [
        fromId,
        Object.fromEntries(
          Object.entries(targets).map(([toId, relation]) => [
            toId,
            {
              tolerance: clamp(relation.tolerance, 0, 100),
              rivalry: clamp(relation.rivalry, 0, 100),
              yuriBond: clamp(relation.yuriBond, 0, 100),
            },
          ]),
        ),
      ]),
    ),
  };
}

export function getDatingCharacterProgress(
  state: DatingRelationshipState,
  characterId: string,
): DatingCharacterProgress {
  return state.characterProgress[characterId] ?? { ...DEFAULT_CHARACTER_PROGRESS };
}

export function getDatingGirlRelations(
  state: DatingRelationshipState,
  fromCharacterId: string,
): Record<string, DatingGirlRelation> {
  return state.girlRelations[fromCharacterId] ?? {};
}

export function getDatingGirlRelation(
  state: DatingRelationshipState,
  fromCharacterId: string,
  toCharacterId: string,
): DatingGirlRelation {
  return state.girlRelations[fromCharacterId]?.[toCharacterId] ?? { ...DEFAULT_GIRL_RELATION };
}

export function applyDatingRelationshipDeltaToState(
  state: DatingRelationshipState,
  characterId: string,
  delta: DatingRelationshipDelta,
): DatingRelationshipState {
  const currentProgress = getDatingCharacterProgress(state, characterId);
  const characterProgress = {
    ...state.characterProgress,
    [characterId]: {
      sub: clamp(currentProgress.sub + (delta.sub ?? 0), -100, 100),
      hurt: clamp(currentProgress.hurt + (delta.hurt ?? 0), 0, 100),
    },
  };
  const girlRelations = cloneGirlRelations(state.girlRelations);
  for (const [fromId, targets] of Object.entries(delta.girlRelations ?? {})) {
    const nextTargets = girlRelations[fromId] ?? {};
    for (const [toId, relationDelta] of Object.entries(targets)) {
      const currentRelation = nextTargets[toId] ?? { ...DEFAULT_GIRL_RELATION };
      nextTargets[toId] = {
        tolerance: clamp(currentRelation.tolerance + (relationDelta.tolerance ?? 0), 0, 100),
        rivalry: clamp(currentRelation.rivalry + (relationDelta.rivalry ?? 0), 0, 100),
        yuriBond: clamp(currentRelation.yuriBond + (relationDelta.yuriBond ?? 0), 0, 100),
      };
    }
    girlRelations[fromId] = nextTargets;
  }
  return { characterProgress, girlRelations };
}

export function getDatingSubBand(value: number): string {
  if (value <= -34) return '她更擅长带节奏';
  if (value >= 34) return '你更擅长带节奏';
  return '相处节奏平衡';
}

export function getDatingHurtBand(value: number): string {
  if (value <= 10) return '情绪平稳';
  if (value <= 35) return '还有一点在意';
  if (value <= 65) return '明显介意';
  return '需要认真修复';
}
