/* eslint-disable @typescript-eslint/no-require-imports, import-x/no-nodejs-modules */
const assert = require('node:assert/strict');

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
require('ts-node/register/transpile-only');

const { categories, skills } = require('../data/skills.ts');
const {
  INITIAL_SKILL_PROGRESSION_STATE,
  commitSkillPractice,
  deriveAllSkillStatuses,
  gainSkillExperience,
  getEquippedSkillIds,
  getOpenManagementTerm,
  learnSkillWithExperience,
  skillGraph,
  useSkillStore,
  validateSkillProgressionSnapshot,
} = require('./index.ts');
const { createGameSnapshot, restoreGameSnapshot } = require('../save/snapshot.ts');
const { useGameStore } = require('../stores/gameStore.ts');

function expectFailure(result, code) {
  assert.equal(result.ok, false, `expected ${code} to fail`);
  assert.equal(result.error.code, code);
}

assert.equal(skills.length, 127);
assert.deepEqual(
  Object.fromEntries(
    categories.map(category => [category.id, skills.filter(skill => skill.category === category.id).length]),
  ),
  { 运动: 25, 沟通: 24, 学问: 20, 课外活动: 26, 其他: 24, 上位: 8 },
);
assert.equal(
  skills.reduce((total, skill) => total + skill.prerequisites.length, 0),
  130,
);
assert.equal(skillGraph.topologicalOrder.length, skills.length);

const initialStatuses = deriveAllSkillStatuses(skillGraph, INITIAL_SKILL_PROGRESSION_STATE);
for (const skill of skills) {
  const expected = skill.acquisition === 'experience' && skill.prerequisites.length === 0 ? 'available' : 'locked';
  assert.equal(initialStatuses.get(skill.id), expected, `${skill.id} has the wrong initial status`);
}
assert.deepEqual(getEquippedSkillIds(INITIAL_SKILL_PROGRESSION_STATE), []);
assert.equal(getOpenManagementTerm({ year: 2008, month: 5, day: 8 }, []), null);
assert.equal(getOpenManagementTerm({ year: 2008, month: 5, day: 9 }, [])?.id, '2008-t1');
assert.equal(getOpenManagementTerm({ year: 2008, month: 9, day: 1 }, [])?.id, '2008-t2');

const managementDate = { year: 2008, month: 5, day: 9 };
const gained = gainSkillExperience(INITIAL_SKILL_PROGRESSION_STATE, 100);
assert.equal(gained.ok, true);
let progression = gained.value.state;

expectFailure(
  learnSkillWithExperience(skillGraph, progression, 'sports_sense', managementDate),
  'PREREQUISITES_NOT_MET',
);
const learnedStamina = learnSkillWithExperience(skillGraph, progression, 'basic_stamina', managementDate);
assert.equal(learnedStamina.ok, true);
progression = learnedStamina.value.state;
expectFailure(
  learnSkillWithExperience(skillGraph, progression, 'sports_sense', managementDate),
  'PREREQUISITES_NOT_MET',
);

const learnedReflex = learnSkillWithExperience(skillGraph, progression, 'reflex', managementDate);
assert.equal(learnedReflex.ok, true);
progression = learnedReflex.value.state;

const learnedSportsSense = learnSkillWithExperience(skillGraph, progression, 'sports_sense', managementDate);
assert.equal(learnedSportsSense.ok, true);
progression = learnedSportsSense.value.state;
assert.equal(progression.experience, 60);

const licenseSkill = skills.find(skill => skill.acquisition === 'license');
assert.ok(licenseSkill);
expectFailure(
  learnSkillWithExperience(skillGraph, progression, licenseSkill.id, managementDate),
  'EXTERNAL_ACQUISITION_REQUIRED',
);
expectFailure(
  commitSkillPractice(
    skillGraph,
    progression,
    Array.from({ length: 7 }, () => 'basic_stamina'),
    managementDate,
  ),
  'PRACTICE_LIMIT_EXCEEDED',
);

const committed = commitSkillPractice(
  skillGraph,
  progression,
  ['basic_stamina', 'reflex', 'sports_sense'],
  managementDate,
);
assert.equal(committed.ok, true);
progression = committed.value.state;
assert.deepEqual(getEquippedSkillIds(progression), ['basic_stamina', 'reflex', 'sports_sense']);
expectFailure(commitSkillPractice(skillGraph, progression, [], managementDate), 'TERM_ALREADY_COMMITTED');
assert.equal(
  getOpenManagementTerm(
    { year: 2008, month: 9, day: 1 },
    progression.termCommits.map(item => item.termId),
  )?.id,
  '2008-t2',
);

expectFailure(
  validateSkillProgressionSnapshot(skillGraph, {
    version: 1,
    experience: 0,
    learningHistory: [{ skillId: 'sports_sense', termId: '2008-t1' }],
    termCommits: [],
  }),
  'INVALID_SNAPSHOT',
);

useSkillStore.getState().reset();
useGameStore.getState().resetGameState();
const accepted = useGameStore.getState().settlePlayerAction({ kind: 'activity', message: 'skill smoke accepted' });
assert.equal(accepted.accepted, true);
assert.equal(useSkillStore.getState().experience, 1);
const rejected = useGameStore.getState().settlePlayerAction({ kind: 'activity', message: 'skill smoke rejected' });
assert.equal(rejected.accepted, false);
assert.equal(useSkillStore.getState().experience, 1);

assert.equal(
  useSkillStore.getState().hydrate({ version: 1, experience: 42, learningHistory: [], termCommits: [] }).ok,
  true,
);
const snapshot = createGameSnapshot();
useSkillStore.getState().reset();
restoreGameSnapshot(snapshot);
assert.equal(useSkillStore.getState().experience, 42);

const legacySnapshot = JSON.parse(JSON.stringify(snapshot));
delete legacySnapshot.skills;
assert.equal(
  useSkillStore.getState().hydrate({ version: 1, experience: 99, learningHistory: [], termCommits: [] }).ok,
  true,
);
restoreGameSnapshot(legacySnapshot);
assert.equal(useSkillStore.getState().experience, 0);

console.log(
  JSON.stringify({
    skills: skills.length,
    prerequisites: 130,
    initialLearned: 0,
    acceptedActionExperience: 1,
    rejectedActionExperience: 1,
    restoredExperience: 42,
    legacyExperience: 0,
  }),
);
