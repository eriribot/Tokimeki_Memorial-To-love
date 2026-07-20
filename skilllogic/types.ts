export const MAX_PRACTICED_SKILLS = 6;

export type SkillExperienceSource = 'activity' | 'talk';

export type SkillAcquisition = 'experience' | 'license';

export interface SkillDefinition {
  readonly id: string;
  readonly name: string;
  readonly cost: number;
  readonly prerequisites: readonly string[];
  readonly acquisition?: SkillAcquisition;
  /** Compatibility with the old data field while the skill table is migrated. */
  readonly isLicense?: boolean;
}

export type SkillStatus = 'locked' | 'available' | 'learned' | 'equipped';

export interface CalendarDateLike {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export type AcademicTermNumber = 1 | 2 | 3;
export type AcademicTermId = `${number}-t${AcademicTermNumber}`;

export interface AcademicTerm {
  readonly id: AcademicTermId;
  /** One-based school year: 1 is the school year beginning in 2008. */
  readonly academicYear: number;
  readonly term: AcademicTermNumber;
  readonly opensOn: CalendarDateLike;
}

export interface SkillLearningRecord {
  readonly skillId: string;
  readonly termId: AcademicTermId;
}

export interface SkillTermCommit {
  readonly termId: AcademicTermId;
  readonly practicedSkillIds: readonly string[];
}

/** Only these fields belong in a save snapshot. All statuses and graph data are derived. */
export interface SkillProgressionSnapshot {
  readonly version: 1;
  readonly experience: number;
  readonly learningHistory: readonly SkillLearningRecord[];
  readonly termCommits: readonly SkillTermCommit[];
}

export interface SkillProgressionState {
  readonly experience: number;
  readonly learningHistory: readonly SkillLearningRecord[];
  readonly termCommits: readonly SkillTermCommit[];
}

export type SkillErrorCode =
  | 'UNKNOWN_SKILL'
  | 'EXTERNAL_ACQUISITION_REQUIRED'
  | 'MANAGEMENT_WINDOW_CLOSED'
  | 'TERM_ALREADY_COMMITTED'
  | 'ALREADY_LEARNED'
  | 'PREREQUISITES_NOT_MET'
  | 'INSUFFICIENT_EXPERIENCE'
  | 'INVALID_EXPERIENCE'
  | 'EXPERIENCE_OVERFLOW'
  | 'INVALID_PRACTICE_SET'
  | 'PRACTICE_LIMIT_EXCEEDED'
  | 'SKILL_NOT_LEARNED'
  | 'INVALID_DATE'
  | 'INVALID_SNAPSHOT';

export interface SkillActionError {
  readonly code: SkillErrorCode;
  readonly message: string;
  readonly skillIds?: readonly string[];
}

export type SkillResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: SkillActionError };

export interface GainExperienceSuccess {
  readonly gained: number;
  readonly experience: number;
}

export interface LearnSkillSuccess {
  readonly skillId: string;
  readonly termId: AcademicTermId;
  readonly spent: number;
  readonly experience: number;
}

export interface CommitPracticedSkillsSuccess {
  readonly termId: AcademicTermId;
  readonly practicedSkillIds: readonly string[];
  readonly learnedThisTerm: readonly string[];
}

export interface HydrateSkillProgressionSuccess {
  readonly snapshot: SkillProgressionSnapshot;
}
