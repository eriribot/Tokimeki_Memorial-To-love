import { getSkillAcquisition, type SkillGraph } from './skillGraph';
import { getAcademicTermSequenceIndex, getOpenManagementTerm, isValidSkillDate } from './skillSchedule';
import {
  MAX_PRACTICED_SKILLS,
  type AcademicTermId,
  type CalendarDateLike,
  type CommitPracticedSkillsSuccess,
  type GainExperienceSuccess,
  type LearnSkillSuccess,
  type SkillActionError,
  type SkillProgressionSnapshot,
  type SkillProgressionState,
  type SkillResult,
  type SkillStatus,
} from './types';

export interface SkillProgressionTransition<T> {
  readonly state: SkillProgressionState;
  readonly result: T;
}

export const INITIAL_SKILL_PROGRESSION_STATE: SkillProgressionState = Object.freeze({
  experience: 0,
  learningHistory: Object.freeze([]),
  termCommits: Object.freeze([]),
});

function success<T>(value: T): SkillResult<T> {
  return { ok: true, value };
}

function failure(code: SkillActionError['code'], message: string, skillIds?: readonly string[]): SkillResult<never> {
  return { ok: false, error: { code, message, ...(skillIds ? { skillIds } : {}) } };
}

function learnedIds(state: SkillProgressionState): Set<string> {
  return new Set(state.learningHistory.map(record => record.skillId));
}

export function getLearnedSkillIds(state: SkillProgressionState): readonly string[] {
  return state.learningHistory.map(record => record.skillId);
}

export function getEquippedSkillIds(state: SkillProgressionState): readonly string[] {
  return state.termCommits.at(-1)?.practicedSkillIds ?? [];
}

/** `available` means graph-unlocked; the learn command separately checks the term window and EXP balance. */
export function deriveSkillStatus(
  graph: SkillGraph,
  state: SkillProgressionState,
  skillId: string,
): SkillStatus | null {
  const skill = graph.skillById.get(skillId);
  if (!skill) return null;

  const learned = learnedIds(state);
  if (learned.has(skillId)) {
    return getEquippedSkillIds(state).includes(skillId) ? 'equipped' : 'learned';
  }
  if (getSkillAcquisition(skill) !== 'experience') return 'locked';
  return skill.prerequisites.every(prerequisiteId => learned.has(prerequisiteId)) ? 'available' : 'locked';
}

export function deriveAllSkillStatuses(
  graph: SkillGraph,
  state: SkillProgressionState,
): ReadonlyMap<string, SkillStatus> {
  const statuses = new Map<string, SkillStatus>();
  for (const skillId of graph.topologicalOrder) {
    const status = deriveSkillStatus(graph, state, skillId);
    if (status) statuses.set(skillId, status);
  }
  return statuses;
}

export function gainSkillExperience(
  state: SkillProgressionState,
  amount: number,
): SkillResult<SkillProgressionTransition<GainExperienceSuccess>> {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return failure('INVALID_EXPERIENCE', '获得的技能 EXP 必须是正安全整数。');
  }
  if (!Number.isSafeInteger(state.experience + amount)) {
    return failure('EXPERIENCE_OVERFLOW', '技能 EXP 超出安全整数范围，未写入本次增长。');
  }

  const experience = state.experience + amount;
  return success({
    state: { ...state, experience },
    result: { gained: amount, experience },
  });
}

export function learnSkillWithExperience(
  graph: SkillGraph,
  state: SkillProgressionState,
  skillId: string,
  date: CalendarDateLike,
): SkillResult<SkillProgressionTransition<LearnSkillSuccess>> {
  const skill = graph.skillById.get(skillId);
  if (!skill) return failure('UNKNOWN_SKILL', `不存在 ID 为 ${skillId} 的技能。`, [skillId]);
  if (getSkillAcquisition(skill) !== 'experience') {
    return failure(
      'EXTERNAL_ACQUISITION_REQUIRED',
      `「${skill.name}」必须通过驾照或外部事件取得，不能使用技能 EXP 学习。`,
      [skillId],
    );
  }
  if (!isValidSkillDate(date)) return failure('INVALID_DATE', '技能管理日期无效。');

  const committedTermIds = new Set(state.termCommits.map(commit => commit.termId));
  const term = getOpenManagementTerm(date, committedTermIds);
  if (!term) {
    return failure('MANAGEMENT_WINDOW_CLOSED', '当前没有已开放且尚未提交的学期技能管理窗口。');
  }

  const learned = learnedIds(state);
  if (learned.has(skillId)) {
    return failure('ALREADY_LEARNED', `「${skill.name}」已经取得，未重复扣除技能 EXP。`, [skillId]);
  }

  const missingPrerequisites = skill.prerequisites.filter(prerequisiteId => !learned.has(prerequisiteId));
  if (missingPrerequisites.length > 0) {
    const missingNames = missingPrerequisites.map(id => graph.skillById.get(id)?.name ?? id);
    return failure(
      'PREREQUISITES_NOT_MET',
      `学习「${skill.name}」前必须先取得：${missingNames.join('、')}。`,
      missingPrerequisites,
    );
  }
  if (state.experience < skill.cost) {
    return failure(
      'INSUFFICIENT_EXPERIENCE',
      `学习「${skill.name}」需要 ${skill.cost} 技能 EXP，当前只有 ${state.experience}。`,
      [skillId],
    );
  }

  const experience = state.experience - skill.cost;
  return success({
    state: {
      ...state,
      experience,
      learningHistory: [...state.learningHistory, { skillId, termId: term.id }],
    },
    result: { skillId, termId: term.id, spent: skill.cost, experience },
  });
}

export function commitSkillPractice(
  graph: SkillGraph,
  state: SkillProgressionState,
  practicedSkillIds: readonly string[],
  date: CalendarDateLike,
): SkillResult<SkillProgressionTransition<CommitPracticedSkillsSuccess>> {
  if (!isValidSkillDate(date)) return failure('INVALID_DATE', '技能管理日期无效。');
  if (!Array.isArray(practicedSkillIds) || practicedSkillIds.some(id => typeof id !== 'string')) {
    return failure('INVALID_PRACTICE_SET', '实践技能必须是技能 ID 数组。');
  }
  if (practicedSkillIds.length > MAX_PRACTICED_SKILLS) {
    return failure('PRACTICE_LIMIT_EXCEEDED', `每学期最多实践 ${MAX_PRACTICED_SKILLS} 个技能。`, practicedSkillIds);
  }

  const uniqueIds = new Set(practicedSkillIds);
  if (uniqueIds.size !== practicedSkillIds.length) {
    return failure('INVALID_PRACTICE_SET', '实践技能不能重复。', practicedSkillIds);
  }
  for (const skillId of practicedSkillIds) {
    if (!graph.skillById.has(skillId)) return failure('UNKNOWN_SKILL', `不存在 ID 为 ${skillId} 的技能。`, [skillId]);
  }

  const learned = learnedIds(state);
  const unlearnedIds = practicedSkillIds.filter(skillId => !learned.has(skillId));
  if (unlearnedIds.length > 0) {
    return failure('SKILL_NOT_LEARNED', '只能把已经取得的技能加入实践栏。', unlearnedIds);
  }

  const committedTermIds = new Set(state.termCommits.map(commit => commit.termId));
  const term = getOpenManagementTerm(date, committedTermIds);
  if (!term) {
    return failure('TERM_ALREADY_COMMITTED', '当前已开放学期的技能实践方案均已提交。');
  }

  const practiced = [...practicedSkillIds];
  const learnedThisTerm = state.learningHistory
    .filter(record => record.termId === term.id)
    .map(record => record.skillId);
  return success({
    state: {
      ...state,
      termCommits: [...state.termCommits, { termId: term.id, practicedSkillIds: practiced }],
    },
    result: { termId: term.id, practicedSkillIds: practiced, learnedThisTerm },
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalidSnapshot(message: string, skillIds?: readonly string[]): SkillResult<never> {
  return failure('INVALID_SNAPSHOT', `技能进度存档无效：${message}`, skillIds);
}

function termIndex(value: unknown): { readonly id: AcademicTermId; readonly index: number } | null {
  if (typeof value !== 'string' || !/^\d+-t[123]$/.test(value)) return null;
  const id = value as AcademicTermId;
  const index = getAcademicTermSequenceIndex(id);
  return index === null ? null : { id, index };
}

export function validateSkillProgressionSnapshot(
  graph: SkillGraph,
  value: unknown,
): SkillResult<SkillProgressionSnapshot> {
  if (!isObject(value) || value.version !== 1) return invalidSnapshot('版本号必须为 1。');
  if (!Number.isSafeInteger(value.experience) || (value.experience as number) < 0) {
    return invalidSnapshot('experience 必须是非负安全整数。');
  }
  if (!Array.isArray(value.learningHistory)) return invalidSnapshot('learningHistory 必须是数组。');
  if (!Array.isArray(value.termCommits)) return invalidSnapshot('termCommits 必须是数组。');

  const termCommits: { termId: AcademicTermId; practicedSkillIds: string[] }[] = [];
  const committedTermIds = new Set<AcademicTermId>();
  let previousCommitTermIndex = -1;
  for (let commitIndex = 0; commitIndex < value.termCommits.length; commitIndex += 1) {
    const rawCommit = value.termCommits[commitIndex];
    if (!isObject(rawCommit) || !Array.isArray(rawCommit.practicedSkillIds)) {
      return invalidSnapshot(`termCommits[${commitIndex}] 格式错误。`);
    }
    const parsedTerm = termIndex(rawCommit.termId);
    if (!parsedTerm || parsedTerm.index <= previousCommitTermIndex || committedTermIds.has(parsedTerm.id)) {
      return invalidSnapshot('学期提交必须按时间严格递增，且不能重复。');
    }
    if (rawCommit.practicedSkillIds.length > MAX_PRACTICED_SKILLS) {
      return invalidSnapshot(`每个学期最多实践 ${MAX_PRACTICED_SKILLS} 个技能。`);
    }
    if (rawCommit.practicedSkillIds.some(skillId => typeof skillId !== 'string')) {
      return invalidSnapshot(`termCommits[${commitIndex}] 含有无效技能 ID。`);
    }
    const practicedSkillIds = rawCommit.practicedSkillIds as string[];
    if (new Set(practicedSkillIds).size !== practicedSkillIds.length) {
      return invalidSnapshot(`termCommits[${commitIndex}] 含有重复实践技能。`, practicedSkillIds);
    }
    for (const skillId of practicedSkillIds) {
      if (!graph.skillById.has(skillId)) return invalidSnapshot(`实践技能 ${skillId} 不存在。`, [skillId]);
    }
    committedTermIds.add(parsedTerm.id);
    previousCommitTermIndex = parsedTerm.index;
    termCommits.push({ termId: parsedTerm.id, practicedSkillIds: [...practicedSkillIds] });
  }

  const learningHistory: { skillId: string; termId: AcademicTermId }[] = [];
  const learned = new Set<string>();
  let previousLearningTermIndex = -1;
  for (let recordIndex = 0; recordIndex < value.learningHistory.length; recordIndex += 1) {
    const rawRecord = value.learningHistory[recordIndex];
    if (!isObject(rawRecord) || typeof rawRecord.skillId !== 'string') {
      return invalidSnapshot(`learningHistory[${recordIndex}] 格式错误。`);
    }
    const skill = graph.skillById.get(rawRecord.skillId);
    if (!skill) return invalidSnapshot(`已学习技能 ${rawRecord.skillId} 不存在。`, [rawRecord.skillId]);
    if (learned.has(skill.id)) return invalidSnapshot(`技能 ${skill.id} 被重复记录为已学习。`, [skill.id]);

    const parsedTerm = termIndex(rawRecord.termId);
    if (!parsedTerm || parsedTerm.index < previousLearningTermIndex) {
      return invalidSnapshot('技能学习学期必须按时间顺序记录。', [skill.id]);
    }
    const missingPrerequisites = skill.prerequisites.filter(prerequisiteId => !learned.has(prerequisiteId));
    if (missingPrerequisites.length > 0) {
      return invalidSnapshot(`技能 ${skill.id} 的前置技能未先取得。`, missingPrerequisites);
    }

    learned.add(skill.id);
    previousLearningTermIndex = parsedTerm.index;
    learningHistory.push({ skillId: skill.id, termId: parsedTerm.id });
  }

  for (const commit of termCommits) {
    const commitTermIndex = getAcademicTermSequenceIndex(commit.termId);
    for (const skillId of commit.practicedSkillIds) {
      const record = learningHistory.find(candidate => candidate.skillId === skillId);
      const learnedTermIndex = record ? getAcademicTermSequenceIndex(record.termId) : null;
      if (commitTermIndex === null || learnedTermIndex === null || learnedTermIndex > commitTermIndex) {
        return invalidSnapshot(`学期 ${commit.termId} 实践了当时尚未取得的技能 ${skillId}。`, [skillId]);
      }
    }
  }

  return success({
    version: 1,
    experience: value.experience as number,
    learningHistory,
    termCommits,
  });
}

export function toSkillProgressionSnapshot(state: SkillProgressionState): SkillProgressionSnapshot {
  return {
    version: 1,
    experience: state.experience,
    learningHistory: state.learningHistory.map(record => ({ ...record })),
    termCommits: state.termCommits.map(commit => ({
      termId: commit.termId,
      practicedSkillIds: [...commit.practicedSkillIds],
    })),
  };
}
