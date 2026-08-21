/* eslint-disable @typescript-eslint/no-require-imports, import-x/no-nodejs-modules */
const assert = require('node:assert/strict');

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
  target: 'ES2022',
  ignoreDeprecations: '6.0',
});
require('ts-node/register/transpile-only');

const rules = require('./datingRules.ts');
const {
  createDatingDirectorPlan,
  settleDatingChoices,
  settleDatingRelationshipChoices,
} = require('./datingDirector.ts');
const {
  applyDatingRelationshipDeltaToState,
  createInitialDatingRelationshipState,
  getDatingGirlRelation,
} = require('./datingRelationships.ts');
const { createDatingFallbackContent, parseDatingContent } = require('./datingStoryGeneration.ts');
const {
  createInitialDatingState,
  normalizeDatingState,
  createDatingStateSnapshot,
  useDatingStore,
} = require('./datingStore.ts');
const { useGameStore, MAX_DAILY_ACTION_POINTS } = require('../stores/gameStore.ts');
const { usePlayerStore } = require('../stores/playerStore.ts');
const { useCardStore } = require('../stores/cardStore.ts');
const { startScheduledDatingIfNeeded, resolveDatingFeeChoice } = require('./datingCoordinator.ts');
const { createGameSnapshot, assertSnapshotShape } = require('../save/snapshot.ts');
const { isDatingDialogueControlTarget, shouldAdvanceDatingDialogueClick } = require('./datingDialoguePaging.ts');
const { selectDatingHistoryReplayContents } = require('./datingHistoryReplay.ts');

function createPagingTarget({ dialogue = false, control = false } = {}) {
  return {
    closest(selector) {
      if (selector === '.gal-main-story__dialogue') return dialogue ? this : null;
      return control ? this : null;
    },
  };
}

const dialogueTarget = createPagingTarget({ dialogue: true });
const dialogueButtonTarget = createPagingTarget({ dialogue: true, control: true });
assert.equal(shouldAdvanceDatingDialogueClick({ defaultPrevented: false, target: dialogueTarget }), true);
assert.equal(shouldAdvanceDatingDialogueClick({ defaultPrevented: true, target: dialogueTarget }), false);
assert.equal(shouldAdvanceDatingDialogueClick({ defaultPrevented: false, target: dialogueButtonTarget }), false);
assert.equal(shouldAdvanceDatingDialogueClick({ defaultPrevented: false, target: createPagingTarget() }), false);
assert.equal(isDatingDialogueControlTarget(dialogueButtonTarget), true);
assert.equal(isDatingDialogueControlTarget(dialogueTarget), false);

const mainReplayContent = { stageId: 'main', lines: [{ text: 'main-1' }, { text: 'main-2' }] };
const returnReplayContent = { stageId: 'return', lines: [{ text: 'return-1' }] };
const replayContents = [mainReplayContent, returnReplayContent];
assert.equal(selectDatingHistoryReplayContents(replayContents), replayContents);
assert.deepEqual(selectDatingHistoryReplayContents(replayContents, 1), [returnReplayContent]);
assert.deepEqual(selectDatingHistoryReplayContents(replayContents, -1), []);
assert.deepEqual(selectDatingHistoryReplayContents(replayContents, 2), []);

const current = { year: 2008, month: 4, day: 7 };
const saturday = { year: 2008, month: 4, day: 12 };
assert.equal(rules.isDatingDateEligible(current, saturday).eligible, true);
assert.equal(rules.isDatingDateEligible(current, { year: 2008, month: 4, day: 8 }).eligible, false);
assert.equal(rules.isDatingDateEligible(current, { year: 2008, month: 5, day: 6 }).eligible, false);
assert.equal(
  rules.isDatingDateEligible(current, { year: 2008, month: 4, day: 12 }, new Set(['2008-04-12'])).eligible,
  false,
);
assert.equal(rules.isDatingDateEligible(current, saturday, new Set(), new Set(['2008-04-12'])).eligible, false);
assert.equal(rules.isDatingDateEligible(current, { year: 2008, month: 4, day: 29 }).eligible, true);

const base = {
  date: saturday,
  characterId: 'riko',
  friendship: 30,
  romance: 20,
  locationId: 'park',
  favoriteLocation: true,
  faceToFace: true,
  equippedSkillIds: [],
  attemptNumber: 1,
};
// 0.25 + friendship(.09) + romance(.04) + face-to-face(.08) + preferred-place(.06)
assert.equal(rules.getInvitationAcceptanceRate(base), 0.52);
assert.equal(rules.getInvitationAcceptanceRate({ ...base, equippedSkillIds: ['three_visits'] }), 0.6);
assert.equal(rules.resolveInvitation(base).roll, rules.resolveInvitation(base).roll);
assert.equal(rules.getWalkHomeProbability(0), 0.02);
assert.equal(rules.getWalkHomeProbability(100), 0.1);
assert.equal(rules.getWalkHomeProbability(0, ['night_owl']), 0.03);
assert.equal(rules.evaluateWalkHome(saturday, null, 0).status, 'skipped');

const appointment = {
  id: 'appointment-1',
  date: saturday,
  characterId: 'riko',
  locationId: 'park',
  fee: 0,
  status: 'booked',
  createdAt: new Date(0).toISOString(),
  accepted: true,
};
const plan = createDatingDirectorPlan({
  appointment,
  characterName: '夕崎梨子',
  playerName: 'User',
  favoriteLocation: true,
});
assert.equal(plan.stages.length, 2);
assert.equal(plan.stages[0].options.length, 3);
assert.deepEqual(
  Object.keys(settleDatingChoices(plan, [plan.stages[0].options[0].id, plan.stages[1].options[1].id])).sort(),
  ['friendship', 'romance'],
);

const riverbankPlan = createDatingDirectorPlan({
  appointment: { ...appointment, id: 'riverbank-plan', locationId: 'riverbank' },
  characterName: '菈菈',
  playerName: 'User',
  favoriteLocation: true,
  relationshipState: createInitialDatingRelationshipState(),
});
assert.deepEqual(
  riverbankPlan.stages[0].options.map(option => option.id),
  ['riverbank-follow', 'riverbank-sunset', 'riverbank-shadow'],
);
const riverbankDatingDelta = settleDatingRelationshipChoices(riverbankPlan, [
  riverbankPlan.stages[0].options[0].id,
  riverbankPlan.stages[1].options[1].id,
]);
assert.equal(riverbankDatingDelta.sub, -4);
assert.equal(riverbankDatingDelta.hurt, -1);
const seededRelations = createInitialDatingRelationshipState();
assert.equal(getDatingGirlRelation(seededRelations, 'lala', 'momo').tolerance, 85);
const bondedRelations = applyDatingRelationshipDeltaToState(seededRelations, 'lala', {
  girlRelations: { lala: { momo: { yuriBond: 5 } } },
});
assert.equal(getDatingGirlRelation(bondedRelations, 'lala', 'momo').yuriBond, 30);
const fallback = createDatingFallbackContent(plan, 'main');
assert.equal(fallback.source, 'fallback');
const accepted = parseDatingContent(
  `<content>\n@旁白【scene=park;focus=none;portrait=none;expression=none;effect=none】：风吹过树梢。\n@夕崎梨子【scene=park;focus=riko;portrait=school-uniform;expression=neutral;effect=none】：今天很开心。\n@User【scene=park;focus=none;portrait=none;expression=none;effect=none】：我也是。\n</content>`,
  plan,
  'main',
);
assert.equal(accepted.lines.length, 3);
assert.throws(() => parseDatingContent('{"story":[]}', plan, 'main'));
assert.throws(() => parseDatingContent('<content>计划文本</content>', plan, 'main'));
assert.throws(() =>
  parseDatingContent(
    '<content>\n@夕崎梨子【scene=school;focus=riko;portrait=school-uniform;expression=neutral;effect=none】：错误。\n@User【scene=school;focus=none;portrait=none;expression=none;effect=none】：错误。\n@旁白【scene=school;focus=none;portrait=none;expression=none;effect=none】：错误。\n</content>',
    plan,
    'main',
  ),
);

const empty = createInitialDatingState();
assert.equal(normalizeDatingState(undefined).run, null);
assert.throws(() => normalizeDatingState({ ...empty, generation: { status: 'broken' } }));

// A booked appointment is a single-date resource and cannot be started after a
// main-story trigger is already pending on that date.
useDatingStore.getState().resetDatingState();
useGameStore.getState().resetGameState();
useGameStore.setState({
  screen: 'game',
  hasSession: true,
  isPlaying: true,
  date: { ...current },
  actionPointsRemaining: 2,
  periodIndex: 0,
});
useDatingStore.getState().bookAppointment({ ...appointment, id: 'dynamic-conflict', date: { ...current } });
const overridden = startScheduledDatingIfNeeded();
assert.equal(overridden.started, false);
assert.equal(useDatingStore.getState().appointments[0].status, 'overridden');

// Whole-day dating consumes the first action, keeps a two-stage cursor, and
// advances exactly one day after the archive is accepted.
useDatingStore.getState().resetDatingState();
useGameStore.setState({
  screen: 'game',
  hasSession: true,
  isPlaying: true,
  date: { ...saturday },
  day: 6,
  actionPointsRemaining: MAX_DAILY_ACTION_POINTS,
  periodIndex: 0,
  wholeDayActivity: null,
  mainStory: { ...useGameStore.getState().mainStory, run: null, completedEventIds: [] },
});
usePlayerStore.setState({ money: 0 });
const target = {
  id: 'riko',
  name: '夕崎梨子',
  favoriteLocations: ['park'],
  currentLocationId: 'classroom',
  friendship: 30,
  romance: 20,
  affection: 25,
};
useCardStore.setState({ targets: [target] });
const runAppointment = { ...appointment, id: 'run-appointment', date: { ...saturday }, status: 'booked', fee: 0 };
assert.equal(useDatingStore.getState().bookAppointment(runAppointment), true);
const start = startScheduledDatingIfNeeded();
assert.equal(start.started, true);
assert.equal(useGameStore.getState().actionPointsRemaining, 1);
assert.equal(useDatingStore.getState().run.stageIndex, 0);
const livePlan = useDatingStore.getState().run.plan;
const mainContent = createDatingFallbackContent(livePlan, 'main');
const returnContent = createDatingFallbackContent(livePlan, 'return');
useDatingStore.getState().setStageContent('main', mainContent);
assert.equal(useDatingStore.getState().advanceToReturn(livePlan.stages[0].options[0].id), true);
useDatingStore.getState().setStageContent('return', returnContent);
const selected = [livePlan.stages[0].options[0].id, livePlan.stages[1].options[1].id];
const delta = settleDatingChoices(livePlan, selected);
const archive = {
  id: 'dating-archive-run-appointment',
  appointmentId: 'run-appointment',
  date: { ...saturday },
  characterId: 'riko',
  locationId: 'park',
  quality: livePlan.quality,
  selectedOptionIds: selected,
  contents: [mainContent, returnContent],
  relationshipDelta: delta,
  createdAt: new Date(0).toISOString(),
};
assert.equal(useDatingStore.getState().completeRun(archive), true);
assert.equal(useDatingStore.getState().completeRun(archive), false);
assert.equal(useGameStore.getState().finishWholeDayActivity(), true);
assert.equal(useGameStore.getState().day, 7);
assert.equal(useGameStore.getState().actionPointsRemaining, MAX_DAILY_ACTION_POINTS);
assert.equal(useGameStore.getState().finishWholeDayActivity(), false);

// A paid appointment offers the local park fallback without spending AP when
// the player cannot afford the selected town street.
useDatingStore.getState().resetDatingState();
useGameStore.setState({
  date: { ...saturday },
  day: 10,
  actionPointsRemaining: 2,
  periodIndex: 0,
  wholeDayActivity: null,
});
usePlayerStore.setState({ money: 0 });
assert.equal(
  useDatingStore
    .getState()
    .bookAppointment({ ...runAppointment, id: 'fee-appointment', locationId: 'townStreet', fee: 100 }),
  true,
);
const feeStart = startScheduledDatingIfNeeded();
assert.equal(feeStart.needsFeeChoice, true);
assert.equal(useGameStore.getState().actionPointsRemaining, 2);
assert.equal(resolveDatingFeeChoice('park').started, true);
assert.equal(useDatingStore.getState().run.plan.locationId, 'park');

// The snapshot projection contains data only, and a restored walk-home roll
// is identical rather than being evaluated again.
const walk = rules.evaluateWalkHome(saturday, 'riko', 100, ['night_owl']);
const walkState = createInitialDatingState();
walkState.walkHomeByDate[walk.dateKey] = {
  ...walk,
  choice: null,
  generated: false,
  content: null,
  createdAt: new Date(0).toISOString(),
};
const projected = createDatingStateSnapshot(walkState);
assert.equal(typeof projected.resetDatingState, 'undefined');
assert.deepEqual(normalizeDatingState(projected).walkHomeByDate, projected.walkHomeByDate);
assert.throws(() =>
  normalizeDatingState({
    ...walkState,
    walkHomeByDate: { [walk.dateKey]: { ...projected.walkHomeByDate[walk.dateKey], roll: 1 } },
  }),
);

// Missing v4 dating data initializes empty; malformed data is rejected by the
// snapshot boundary instead of silently rerolling or dropping it.
useDatingStore.getState().resetDatingState();
useGameStore.setState({
  screen: 'registration',
  hasSession: false,
  isPlaying: false,
  actionPointsRemaining: 2,
  periodIndex: 0,
  wholeDayActivity: null,
});
const snapshot = createGameSnapshot();
const missingDating = { ...snapshot };
delete missingDating.dating;
assertSnapshotShape(missingDating);
assert.throws(() => assertSnapshotShape({ ...snapshot, dating: { ...projected, generation: { status: 'broken' } } }));
console.log('DatingModule verification passed.');
