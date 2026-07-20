import type { SkillExperienceSource } from './types';

/**
 * Tokimeki Memorial 4 accumulates skill experience through command execution.
 * This project's accepted AP actions are the matching deterministic command boundary.
 */
export const SKILL_EXPERIENCE_PER_ACCEPTED_ACTION = 1;

export function getSkillExperienceReward(_source: SkillExperienceSource): number {
  return SKILL_EXPERIENCE_PER_ACCEPTED_ACTION;
}
