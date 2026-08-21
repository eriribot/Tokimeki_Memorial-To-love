import { calendarDateKey } from '../CalendarModule/specialDates';
import { getPendingMainStoryEntry } from '../GalMainStory/storyRegistry';
import { getEquippedSkillIds, useSkillStore } from '../skilllogic';
import { useCardStore } from '../stores/cardStore';
import { MAX_DAILY_ACTION_POINTS, useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { createDatingDirectorPlan } from './datingDirector';
import { getDatingLocation } from './datingRules';
import { useDatingStore } from './datingStore';
import type { DatingAppointment, DatingLocationId, DatingRun } from './types';

export interface StartScheduledDatingResult {
  started: boolean;
  needsFeeChoice: boolean;
  appointmentId: string | null;
  reason: string | null;
}

function findTodayAppointment(): DatingAppointment | null {
  const date = useGameStore.getState().date;
  const key = calendarDateKey(date);
  return (
    useDatingStore
      .getState()
      .appointments.find(appointment => appointment.status === 'booked' && calendarDateKey(appointment.date) === key) ??
    null
  );
}

function hasMainStoryConflictToday(): boolean {
  const game = useGameStore.getState();
  if (game.mainStory.run?.phase === 'playing') return true;
  return ([1, 2] as const).some(actionNumber =>
    Boolean(
      getPendingMainStoryEntry({
        date: game.date,
        actionNumber,
        run: game.mainStory.run,
        completedEventIds: game.mainStory.completedEventIds,
      }),
    ),
  );
}

function overrideAppointmentForMainStory(appointment: DatingAppointment): StartScheduledDatingResult {
  const dating = useDatingStore.getState();
  dating.setAppointmentStatus(appointment.id, 'overridden');
  dating.setFeePrompt(null);
  return {
    started: false,
    needsFeeChoice: false,
    appointmentId: appointment.id,
    reason: '主线剧情覆盖了今天的约会。',
  };
}

function createRun(appointment: DatingAppointment): DatingRun | null {
  const cards = useCardStore.getState();
  const character = cards.targets.find(target => target.id === appointment.characterId);
  if (!character) return null;
  const skillProgression = useSkillStore.getState();
  const mapLocationId = appointment.locationId === 'townStreet' ? 'shoppingStreet' : appointment.locationId;
  const favoriteLocation = character.favoriteLocations.includes(mapLocationId);
  const plan = createDatingDirectorPlan({
    appointment,
    characterName: character.name,
    playerName: usePlayerStore.getState().name,
    favoriteLocation,
    equippedSkillIds: getEquippedSkillIds(skillProgression),
    relationshipState: useDatingStore.getState().relationships,
    relationshipCharacterNames: Object.fromEntries(cards.targets.map(target => [target.id, target.name])),
  });
  return {
    appointmentId: appointment.id,
    plan,
    stageIndex: 0,
    pageIndex: 0,
    selectedOptionIds: [],
    stageContents: {},
    status: 'active',
    startedAt: new Date().toISOString(),
  };
}

function beginAppointment(appointment: DatingAppointment): StartScheduledDatingResult {
  const game = useGameStore.getState();
  const gameBeforeActivity = {
    actionPointsRemaining: game.actionPointsRemaining,
    periodIndex: game.periodIndex,
    currentSceneId: game.currentSceneId,
    wholeDayActivity: game.wholeDayActivity,
    log: [...game.log],
  };
  const startingMoney = usePlayerStore.getState().money;
  const run = createRun(appointment);
  if (!run) {
    useDatingStore.getState().setAppointmentStatus(appointment.id, 'overridden');
    useDatingStore.getState().setFeePrompt(null);
    return { started: false, needsFeeChoice: false, appointmentId: appointment.id, reason: '约会角色当前不可用。' };
  }
  const settlement = game.beginWholeDayActivity('dating');
  if (!settlement.accepted) {
    return {
      started: false,
      needsFeeChoice: false,
      appointmentId: appointment.id,
      reason: settlement.reason,
    };
  }
  if (appointment.fee > 0 && !usePlayerStore.getState().spendMoney(appointment.fee)) {
    useGameStore.setState({
      ...gameBeforeActivity,
    });
    useDatingStore.getState().setFeePrompt(appointment.id);
    return { started: false, needsFeeChoice: true, appointmentId: appointment.id, reason: '余额不足。' };
  }
  const dating = useDatingStore.getState();
  dating.setFeePrompt(null);
  if (!dating.startRun(run)) {
    usePlayerStore.setState({ money: startingMoney });
    useGameStore.setState({
      ...gameBeforeActivity,
    });
    return {
      started: false,
      needsFeeChoice: false,
      appointmentId: appointment.id,
      reason: '约会状态刚刚发生变化。',
    };
  }
  return { started: true, needsFeeChoice: false, appointmentId: appointment.id, reason: null };
}

/** 在普通行动真正结算前调用；没有今日预约时完全不改变状态。 */
export function startScheduledDatingIfNeeded(): StartScheduledDatingResult {
  const appointment = findTodayAppointment();
  if (!appointment) return { started: false, needsFeeChoice: false, appointmentId: null, reason: null };
  const game = useGameStore.getState();
  if (hasMainStoryConflictToday()) return overrideAppointmentForMainStory(appointment);
  if (game.actionPointsRemaining !== MAX_DAILY_ACTION_POINTS || game.wholeDayActivity !== null) {
    if (game.wholeDayActivity === null && game.actionPointsRemaining !== MAX_DAILY_ACTION_POINTS) {
      useDatingStore.getState().setAppointmentStatus(appointment.id, 'overridden');
    }
    return { started: false, needsFeeChoice: false, appointmentId: appointment.id, reason: '今天已经执行过有效行动。' };
  }
  if (appointment.fee > usePlayerStore.getState().money) {
    useDatingStore.getState().setFeePrompt(appointment.id);
    return { started: false, needsFeeChoice: true, appointmentId: appointment.id, reason: '余额不足。' };
  }
  return beginAppointment(appointment);
}

export function resolveDatingFeeChoice(choice: 'park' | 'cancel'): StartScheduledDatingResult {
  const dating = useDatingStore.getState();
  const appointmentId = dating.feePromptAppointmentId;
  const appointment = dating.appointments.find(candidate => candidate.id === appointmentId) ?? null;
  if (!appointment) {
    dating.setFeePrompt(null);
    return { started: false, needsFeeChoice: false, appointmentId: null, reason: '预约已不存在。' };
  }
  if (hasMainStoryConflictToday()) return overrideAppointmentForMainStory(appointment);
  if (calendarDateKey(appointment.date) !== calendarDateKey(useGameStore.getState().date)) {
    dating.setFeePrompt(null);
    return {
      started: false,
      needsFeeChoice: false,
      appointmentId: appointment.id,
      reason: '预约日期已经过去，无法再开始这次约会。',
    };
  }
  if (choice === 'cancel') {
    dating.setAppointmentStatus(appointment.id, 'cancelled');
    dating.setFeePrompt(null);
    return { started: false, needsFeeChoice: false, appointmentId: appointment.id, reason: '已取消今天的约会。' };
  }
  const location = getDatingLocation('park');
  dating.updateAppointmentLocation(appointment.id, location.id, location.cost);
  const updated = { ...appointment, locationId: location.id as DatingLocationId, fee: location.cost };
  return beginAppointment(updated);
}
