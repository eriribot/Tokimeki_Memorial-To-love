import { skills } from '../data/skills';
import type { SkillAcquisition, SkillDefinition } from './types';

export type SkillGraphErrorCode =
  | 'DUPLICATE_SKILL_ID'
  | 'MISSING_PREREQUISITE'
  | 'DUPLICATE_PREREQUISITE'
  | 'INVALID_SKILL_COST'
  | 'INVALID_ACQUISITION'
  | 'SKILL_GRAPH_CYCLE';

export class SkillGraphValidationError extends Error {
  constructor(
    readonly code: SkillGraphErrorCode,
    message: string,
    readonly skillIds: readonly string[],
  ) {
    super(message);
    this.name = 'SkillGraphValidationError';
  }
}

export interface SkillGraph<TSkill extends SkillDefinition = SkillDefinition> {
  readonly skills: readonly TSkill[];
  readonly skillById: ReadonlyMap<string, TSkill>;
  readonly topologicalOrder: readonly string[];
  readonly depthById: ReadonlyMap<string, number>;
  readonly ancestorsById: ReadonlyMap<string, ReadonlySet<string>>;
  readonly directDependentsById: ReadonlyMap<string, ReadonlySet<string>>;
  readonly dependentsById: ReadonlyMap<string, ReadonlySet<string>>;
}

export function getSkillAcquisition(skill: SkillDefinition): SkillAcquisition {
  if (skill.acquisition) return skill.acquisition;
  return skill.isLicense ? 'license' : 'experience';
}

function findCycle<TSkill extends SkillDefinition>(
  definitions: readonly TSkill[],
  skillById: ReadonlyMap<string, TSkill>,
): readonly string[] {
  const visited = new Set<string>();
  const active = new Set<string>();
  const path: string[] = [];

  const visit = (skillId: string): readonly string[] | null => {
    if (active.has(skillId)) {
      const cycleStart = path.indexOf(skillId);
      return [...path.slice(cycleStart), skillId];
    }
    if (visited.has(skillId)) return null;

    active.add(skillId);
    path.push(skillId);
    const skill = skillById.get(skillId);
    for (const prerequisiteId of skill?.prerequisites ?? []) {
      const cycle = visit(prerequisiteId);
      if (cycle) return cycle;
    }
    path.pop();
    active.delete(skillId);
    visited.add(skillId);
    return null;
  };

  for (const skill of definitions) {
    const cycle = visit(skill.id);
    if (cycle) return cycle;
  }
  return [];
}

export function createSkillGraph<TSkill extends SkillDefinition>(definitions: readonly TSkill[]): SkillGraph<TSkill> {
  const skillById = new Map<string, TSkill>();
  const duplicateIds = new Set<string>();
  for (const skill of definitions) {
    if (skillById.has(skill.id)) duplicateIds.add(skill.id);
    skillById.set(skill.id, skill);
  }
  if (duplicateIds.size > 0) {
    const ids = [...duplicateIds];
    throw new SkillGraphValidationError('DUPLICATE_SKILL_ID', `技能表存在重复 ID：${ids.join('、')}`, ids);
  }

  for (const skill of definitions) {
    if (!Number.isSafeInteger(skill.cost) || skill.cost < 0) {
      throw new SkillGraphValidationError(
        'INVALID_SKILL_COST',
        `技能「${skill.name}」的 EXP 消耗必须是非负安全整数。`,
        [skill.id],
      );
    }
    if (skill.acquisition !== undefined && skill.acquisition !== 'experience' && skill.acquisition !== 'license') {
      throw new SkillGraphValidationError('INVALID_ACQUISITION', `技能「${skill.name}」的取得方式无效。`, [skill.id]);
    }

    const seenPrerequisites = new Set<string>();
    for (const prerequisiteId of skill.prerequisites) {
      if (seenPrerequisites.has(prerequisiteId)) {
        throw new SkillGraphValidationError(
          'DUPLICATE_PREREQUISITE',
          `技能「${skill.name}」重复声明了前置技能 ${prerequisiteId}。`,
          [skill.id, prerequisiteId],
        );
      }
      seenPrerequisites.add(prerequisiteId);
      if (!skillById.has(prerequisiteId)) {
        throw new SkillGraphValidationError(
          'MISSING_PREREQUISITE',
          `技能「${skill.name}」引用了不存在的前置技能 ${prerequisiteId}。`,
          [skill.id, prerequisiteId],
        );
      }
    }
  }

  const directDependents = new Map<string, Set<string>>();
  const remainingPrerequisites = new Map<string, number>();
  const depthById = new Map<string, number>();
  for (const skill of definitions) {
    directDependents.set(skill.id, new Set());
    remainingPrerequisites.set(skill.id, skill.prerequisites.length);
    depthById.set(skill.id, 0);
  }
  for (const skill of definitions) {
    for (const prerequisiteId of skill.prerequisites) {
      directDependents.get(prerequisiteId)?.add(skill.id);
    }
  }

  const queue = definitions.filter(skill => skill.prerequisites.length === 0).map(skill => skill.id);
  const topologicalOrder: string[] = [];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const skillId = queue[cursor];
    topologicalOrder.push(skillId);
    const nextDepth = (depthById.get(skillId) ?? 0) + 1;
    for (const dependentId of directDependents.get(skillId) ?? []) {
      depthById.set(dependentId, Math.max(depthById.get(dependentId) ?? 0, nextDepth));
      const remaining = (remainingPrerequisites.get(dependentId) ?? 0) - 1;
      remainingPrerequisites.set(dependentId, remaining);
      if (remaining === 0) queue.push(dependentId);
    }
  }

  if (topologicalOrder.length !== definitions.length) {
    const cycle = findCycle(definitions, skillById);
    throw new SkillGraphValidationError('SKILL_GRAPH_CYCLE', `技能前置关系存在环：${cycle.join(' -> ')}`, cycle);
  }

  const ancestorsById = new Map<string, ReadonlySet<string>>();
  for (const skillId of topologicalOrder) {
    const ancestors = new Set<string>();
    const skill = skillById.get(skillId);
    for (const prerequisiteId of skill?.prerequisites ?? []) {
      ancestors.add(prerequisiteId);
      for (const ancestorId of ancestorsById.get(prerequisiteId) ?? []) ancestors.add(ancestorId);
    }
    ancestorsById.set(skillId, ancestors);
  }

  const dependentsById = new Map<string, ReadonlySet<string>>();
  for (const skillId of [...topologicalOrder].reverse()) {
    const dependents = new Set<string>();
    for (const dependentId of directDependents.get(skillId) ?? []) {
      dependents.add(dependentId);
      for (const descendantId of dependentsById.get(dependentId) ?? []) dependents.add(descendantId);
    }
    dependentsById.set(skillId, dependents);
  }

  return {
    skills: [...definitions],
    skillById,
    topologicalOrder,
    depthById,
    ancestorsById,
    directDependentsById: directDependents,
    dependentsById,
  };
}

/** Importing this module validates the production skill table before the UI can use it. */
export const skillGraph = createSkillGraph(skills);
