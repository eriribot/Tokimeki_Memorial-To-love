import { create } from 'zustand';
import { skillGraph } from './skillGraph';
import {
  commitSkillPractice,
  deriveSkillStatus,
  gainSkillExperience,
  INITIAL_SKILL_PROGRESSION_STATE,
  learnSkillWithExperience,
  toSkillProgressionSnapshot,
  validateSkillProgressionSnapshot,
} from './skillProgression';
import { getOpenManagementTerm } from './skillSchedule';
import type {
  AcademicTerm,
  CalendarDateLike,
  CommitPracticedSkillsSuccess,
  GainExperienceSuccess,
  HydrateSkillProgressionSuccess,
  LearnSkillSuccess,
  SkillProgressionSnapshot,
  SkillProgressionState,
  SkillResult,
  SkillStatus,
} from './types';

export interface SkillStore extends SkillProgressionState {
  gainExperience: (amount: number) => SkillResult<GainExperienceSuccess>;
  learnSkill: (skillId: string, date: CalendarDateLike) => SkillResult<LearnSkillSuccess>;
  commitPracticedSkills: (
    practicedSkillIds: readonly string[],
    date: CalendarDateLike,
  ) => SkillResult<CommitPracticedSkillsSuccess>;
  getSkillStatus: (skillId: string) => SkillStatus | null;
  getManagementTerm: (date: CalendarDateLike) => AcademicTerm | null;
  createSnapshot: () => SkillProgressionSnapshot;
  hydrate: (snapshot: unknown) => SkillResult<HydrateSkillProgressionSuccess>;
  reset: () => void;
}

export const useSkillStore = create<SkillStore>((set, get) => ({
  ...INITIAL_SKILL_PROGRESSION_STATE,

  gainExperience: amount => {
    const transition = gainSkillExperience(get(), amount);
    if (!transition.ok) return transition;
    set(transition.value.state);
    return { ok: true, value: transition.value.result };
  },

  learnSkill: (skillId, date) => {
    const transition = learnSkillWithExperience(skillGraph, get(), skillId, date);
    if (!transition.ok) return transition;
    set(transition.value.state);
    return { ok: true, value: transition.value.result };
  },

  commitPracticedSkills: (practicedSkillIds, date) => {
    const transition = commitSkillPractice(skillGraph, get(), practicedSkillIds, date);
    if (!transition.ok) return transition;
    set(transition.value.state);
    return { ok: true, value: transition.value.result };
  },

  getSkillStatus: skillId => deriveSkillStatus(skillGraph, get(), skillId),
  getManagementTerm: date =>
    getOpenManagementTerm(
      date,
      get().termCommits.map(commit => commit.termId),
    ),
  createSnapshot: () => toSkillProgressionSnapshot(get()),

  hydrate: value => {
    const validated = validateSkillProgressionSnapshot(skillGraph, value);
    if (!validated.ok) return validated;
    const snapshot = validated.value;
    set({
      experience: snapshot.experience,
      learningHistory: snapshot.learningHistory,
      termCommits: snapshot.termCommits,
    });
    return { ok: true, value: { snapshot } };
  },

  reset: () => set(INITIAL_SKILL_PROGRESSION_STATE),
}));
