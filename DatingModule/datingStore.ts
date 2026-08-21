import { create } from 'zustand';
import { isCalendarDateValue } from '../CalendarModule/date';
import { calendarDateKey } from '../CalendarModule/specialDates';
import {
  applyDatingRelationshipDeltaToState,
  createInitialDatingRelationshipState,
  isDatingRelationshipDelta,
  isDatingRelationshipState,
  normalizeDatingRelationshipState,
} from './datingRelationships';
import type { CharacterRelationshipDelta } from '../types';
import type {
  DatingAppointment,
  DatingArchive,
  DatingDirectorPlan,
  DatingGenerationState,
  DatingInvitationAttempt,
  DatingRelationshipDelta,
  DatingRun,
  DatingStageContent,
  DatingState,
  WalkHomeRecord,
} from './types';
import { DATING_STATE_VERSION } from './types';

const INITIAL_GENERATION: DatingGenerationState = {
  status: 'idle',
  appointmentId: null,
  stageId: null,
  content: null,
  error: null,
  requestId: null,
};

export function createInitialDatingState(): DatingState {
  return {
    version: DATING_STATE_VERSION,
    run: null,
    generation: { ...INITIAL_GENERATION },
    relationships: createInitialDatingRelationshipState(),
    appointments: [],
    invitationAttempts: [],
    archives: [],
    walkHomeByDate: {},
    feePromptAppointmentId: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(value).every(key => allowed.has(key));
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 4096;
}

function isGeneratedOption(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ['id', 'label']) &&
    isString(value.id) &&
    isString(value.label) &&
    value.label.length >= 2 &&
    value.label.length <= 80
  );
}

function isDate(value: unknown): boolean {
  return isCalendarDateValue(value);
}

function isDelta(value: unknown): value is CharacterRelationshipDelta {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ['friendship', 'romance']) &&
    (value.friendship === undefined || (typeof value.friendship === 'number' && Number.isFinite(value.friendship))) &&
    (value.romance === undefined || (typeof value.romance === 'number' && Number.isFinite(value.romance)))
  );
}

function isStageContent(value: unknown): value is DatingStageContent {
  if (!isRecord(value) || !hasOnlyKeys(value, ['stageId', 'source', 'lines', 'options', 'createdAt'])) return false;
  if (
    (value.stageId !== 'main' && value.stageId !== 'return') ||
    (value.source !== 'tavern' && value.source !== 'fallback')
  ) {
    return false;
  }
  if (!Array.isArray(value.lines) || !isString(value.createdAt)) return false;
  if (value.options !== undefined) {
    if (Array.isArray(value.options) === false || value.options.length !== 3 || !value.options.every(isGeneratedOption)) {
      return false;
    }
    const optionIds = value.options.map(option => (option as { id: string }).id);
    if (new Set(optionIds).size !== optionIds.length) return false;
  }
  return value.lines.every(line => {
    if (
      !isRecord(line) ||
      !hasOnlyKeys(line, ['speaker', 'text', 'sceneId', 'focus', 'portrait', 'expression', 'effect'])
    )
      return false;
    return (
      (line.speaker === null || isString(line.speaker)) &&
      isString(line.text) &&
      ['park', 'riverbank', 'townStreet', 'schoolRoad'].includes(String(line.sceneId)) &&
      (line.focus === null || isString(line.focus)) &&
      (line.portrait === null || isString(line.portrait)) &&
      (line.expression === null || isString(line.expression)) &&
      ['none', 'flash', 'shake'].includes(String(line.effect))
    );
  });
}

function isAppointment(value: unknown): value is DatingAppointment {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['id', 'date', 'characterId', 'locationId', 'fee', 'status', 'createdAt', 'accepted'])
  ) {
    return false;
  }
  return (
    isString(value.id) &&
    isDate(value.date) &&
    isString(value.characterId) &&
    ['park', 'riverbank', 'townStreet'].includes(String(value.locationId)) &&
    typeof value.fee === 'number' &&
    Number.isFinite(value.fee) &&
    value.fee >= 0 &&
    ['booked', 'active', 'completed', 'cancelled', 'overridden'].includes(String(value.status)) &&
    isString(value.createdAt) &&
    value.accepted === true
  );
}

function isInvitationAttempt(value: unknown): value is DatingInvitationAttempt {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'id',
      'date',
      'characterId',
      'locationId',
      'attemptNumber',
      'acceptanceRate',
      'roll',
      'accepted',
      'apSpent',
      'reason',
      'createdAt',
    ])
  ) {
    return false;
  }
  const attemptNumber = value.attemptNumber;
  const apSpent = value.apSpent;
  return (
    isString(value.id) &&
    isDate(value.date) &&
    isString(value.characterId) &&
    ['park', 'riverbank', 'townStreet'].includes(String(value.locationId)) &&
    typeof attemptNumber === 'number' &&
    Number.isSafeInteger(attemptNumber) &&
    attemptNumber >= 1 &&
    typeof value.acceptanceRate === 'number' &&
    value.acceptanceRate >= 0.1 &&
    value.acceptanceRate <= 0.9 &&
    typeof value.roll === 'number' &&
    value.roll >= 0 &&
    value.roll < 1 &&
    typeof value.accepted === 'boolean' &&
    typeof apSpent === 'number' &&
    Number.isSafeInteger(apSpent) &&
    apSpent === (value.accepted ? 1 : 0) &&
    isString(value.reason) &&
    isString(value.createdAt)
  );
}

function isPlan(value: unknown): value is DatingDirectorPlan {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'id',
      'appointmentId',
      'characterId',
      'characterName',
      'playerName',
      'date',
      'locationId',
      'quality',
      'stages',
    ])
  )
    return false;
  if (
    !isString(value.id) ||
    !isString(value.appointmentId) ||
    !isString(value.characterId) ||
    !isString(value.characterName) ||
    !isString(value.playerName) ||
    !isDate(value.date)
  )
    return false;
  if (
    !['park', 'riverbank', 'townStreet'].includes(String(value.locationId)) ||
    !['awkward', 'good', 'great'].includes(String(value.quality))
  )
    return false;
  if (!Array.isArray(value.stages) || value.stages.length !== 2) return false;
  return value.stages.every(stage => {
    if (!isRecord(stage) || !hasOnlyKeys(stage, ['id', 'label', 'sceneId', 'options'])) return false;
    if (
      (stage.id !== 'main' && stage.id !== 'return') ||
      !isString(stage.label) ||
      !['park', 'riverbank', 'townStreet', 'schoolRoad'].includes(String(stage.sceneId)) ||
      !Array.isArray(stage.options) ||
      stage.options.length !== 3
    )
      return false;
    return stage.options.every(
      option =>
        isRecord(option) &&
        hasOnlyKeys(option, ['id', 'label', 'relationshipDelta', 'datingDelta', 'qualityWeight']) &&
        isString(option.id) &&
        isString(option.label) &&
        isDelta(option.relationshipDelta) &&
        (option.datingDelta === undefined || isDatingRelationshipDelta(option.datingDelta)) &&
        typeof option.qualityWeight === 'number' &&
        Number.isFinite(option.qualityWeight),
    );
  });
}

function isRun(value: unknown): value is DatingRun {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'appointmentId',
      'plan',
      'stageIndex',
      'pageIndex',
      'selectedOptionIds',
      'stageContents',
      'status',
      'startedAt',
    ])
  )
    return false;
  const pageIndex = value.pageIndex;
  const stageContents = value.stageContents;
  if (
    !isString(value.appointmentId) ||
    !isPlan(value.plan) ||
    (value.plan as DatingDirectorPlan).appointmentId !== value.appointmentId ||
    (value.stageIndex !== 0 && value.stageIndex !== 1) ||
    typeof pageIndex !== 'number' ||
    !Number.isSafeInteger(pageIndex) ||
    pageIndex < 0 ||
    !Array.isArray(value.selectedOptionIds) ||
    !value.selectedOptionIds.every(isString) ||
    !isRecord(stageContents) ||
    value.status !== 'active' ||
    !isString(value.startedAt)
  )
    return false;
  const plan = value.plan as DatingDirectorPlan;
  const contents = stageContents as Partial<Record<'main' | 'return', DatingStageContent>>;
  if (value.selectedOptionIds.length !== value.stageIndex) return false;
  if (
    !value.selectedOptionIds.every((optionId, index) =>
      plan.stages[index]?.options.some(option => option.id === optionId),
    )
  )
    return false;
  if (
    !Object.keys(stageContents).every(key => (key === 'main' || key === 'return') && isStageContent(stageContents[key]))
  )
    return false;
  if (contents.main !== undefined && contents.main.stageId !== 'main') return false;
  if (contents.return !== undefined && contents.return.stageId !== 'return') return false;
  if (value.stageIndex === 0 && contents.return !== undefined) return false;
  if (value.stageIndex === 1 && contents.main === undefined) return false;
  if (
    plan.stages.some(stage => {
      const generatedOptions = contents[stage.id]?.options;
      if (!generatedOptions) return false;
      const localIds = new Set(stage.options.map(option => option.id));
      return generatedOptions.some(option => !localIds.has(option.id));
    })
  ) {
    return false;
  }
  const activeContent = contents[plan.stages[value.stageIndex].id];
  return activeContent ? pageIndex <= activeContent.lines.length : pageIndex === 0;
}

function isArchive(value: unknown): value is DatingArchive {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'id',
      'appointmentId',
      'date',
      'characterId',
      'locationId',
      'quality',
      'selectedOptionIds',
      'contents',
      'relationshipDelta',
      'datingRelationshipDelta',
      'createdAt',
    ])
  )
    return false;
  return (
    isString(value.id) &&
    isString(value.appointmentId) &&
    isDate(value.date) &&
    isString(value.characterId) &&
    ['park', 'riverbank', 'townStreet'].includes(String(value.locationId)) &&
    ['awkward', 'good', 'great'].includes(String(value.quality)) &&
    Array.isArray(value.selectedOptionIds) &&
    value.selectedOptionIds.length === 2 &&
    value.selectedOptionIds.every(isString) &&
    Array.isArray(value.contents) &&
    value.contents.length === 2 &&
    value.contents.every(isStageContent) &&
    value.contents[0].stageId === 'main' &&
    value.contents[1].stageId === 'return' &&
    isDelta(value.relationshipDelta) &&
    (value.datingRelationshipDelta === undefined || isDatingRelationshipDelta(value.datingRelationshipDelta)) &&
    isString(value.createdAt)
  );
}

function isWalkHomeRecord(value: unknown): value is WalkHomeRecord {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'dateKey',
      'characterId',
      'status',
      'probability',
      'roll',
      'choice',
      'generated',
      'content',
      'createdAt',
    ])
  )
    return false;
  return (
    isString(value.dateKey) &&
    (value.characterId === null || isString(value.characterId)) &&
    ['skipped', 'offered', 'chosen', 'declined'].includes(String(value.status)) &&
    typeof value.probability === 'number' &&
    value.probability >= 0 &&
    value.probability <= 0.1 &&
    (value.roll === null || (typeof value.roll === 'number' && value.roll >= 0 && value.roll < 1)) &&
    (value.choice === null || value.choice === 'together' || value.choice === 'alone') &&
    typeof value.generated === 'boolean' &&
    (value.content === null || isStageContent(value.content)) &&
    isString(value.createdAt)
  );
}

function isGeneration(value: unknown): value is DatingGenerationState {
  if (!isRecord(value) || !hasOnlyKeys(value, ['status', 'appointmentId', 'stageId', 'content', 'error', 'requestId']))
    return false;
  return (
    ['idle', 'loading', 'ready', 'error'].includes(String(value.status)) &&
    (value.appointmentId === null || isString(value.appointmentId)) &&
    (value.stageId === null || value.stageId === 'main' || value.stageId === 'return') &&
    (value.content === null || isStageContent(value.content)) &&
    (value.error === null || isString(value.error)) &&
    (value.requestId === null || isString(value.requestId))
  );
}

export function validateDatingState(value: unknown): value is DatingState {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'version',
      'run',
      'generation',
      'relationships',
      'appointments',
      'invitationAttempts',
      'archives',
      'walkHomeByDate',
      'feePromptAppointmentId',
    ])
  )
    return false;
  if (
    value.version !== DATING_STATE_VERSION ||
    (value.run !== null && !isRun(value.run)) ||
    !isGeneration(value.generation) ||
    (value.relationships !== undefined && !isDatingRelationshipState(value.relationships)) ||
    !Array.isArray(value.appointments) ||
    !value.appointments.every(isAppointment) ||
    !Array.isArray(value.invitationAttempts) ||
    !value.invitationAttempts.every(isInvitationAttempt) ||
    !Array.isArray(value.archives) ||
    !value.archives.every(isArchive) ||
    !isRecord(value.walkHomeByDate) ||
    (value.feePromptAppointmentId !== null && !isString(value.feePromptAppointmentId))
  )
    return false;
  if (!Object.values(value.walkHomeByDate).every(isWalkHomeRecord)) return false;

  const state = value as unknown as DatingState;
  const appointmentIds = state.appointments.map(appointment => appointment.id);
  const activeAppointments = state.appointments.filter(appointment => appointment.status === 'active');
  const openDateKeys = state.appointments
    .filter(appointment => appointment.status === 'booked' || appointment.status === 'active')
    .map(appointment => calendarDateKey(appointment.date));
  if (new Set(appointmentIds).size !== appointmentIds.length || new Set(openDateKeys).size !== openDateKeys.length)
    return false;
  if (new Set(state.invitationAttempts.map(attempt => attempt.id)).size !== state.invitationAttempts.length)
    return false;
  if (new Set(state.archives.map(archive => archive.id)).size !== state.archives.length) return false;
  if (new Set(state.archives.map(archive => archive.appointmentId)).size !== state.archives.length) return false;

  if (state.run) {
    const appointment = state.appointments.find(candidate => candidate.id === state.run?.appointmentId);
    if (!appointment || appointment.status !== 'active' || activeAppointments.length !== 1) return false;
    if (
      appointment.characterId !== state.run.plan.characterId ||
      appointment.locationId !== state.run.plan.locationId ||
      calendarDateKey(appointment.date) !== calendarDateKey(state.run.plan.date)
    ) {
      return false;
    }
  } else if (activeAppointments.length > 0) {
    return false;
  }

  for (const archive of state.archives) {
    if (
      !state.appointments.some(
        appointment => appointment.id === archive.appointmentId && appointment.status === 'completed',
      )
    ) {
      return false;
    }
  }

  for (const [dateKey, record] of Object.entries(state.walkHomeByDate)) {
    if (record.dateKey !== dateKey) return false;
    if (
      record.status === 'offered' &&
      (!record.characterId || record.choice !== null || record.generated || record.content !== null)
    )
      return false;
    if (
      record.status === 'chosen' &&
      (!record.characterId || record.choice !== 'together' || !record.generated || record.content === null)
    )
      return false;
    if (
      record.status === 'declined' &&
      (!record.characterId || record.choice !== 'alone' || record.generated || record.content !== null)
    )
      return false;
    if (record.status === 'skipped' && (record.choice !== null || record.generated || record.content !== null))
      return false;
  }

  if (
    state.feePromptAppointmentId !== null &&
    !state.appointments.some(
      appointment => appointment.id === state.feePromptAppointmentId && appointment.status === 'booked',
    )
  ) {
    return false;
  }

  if (state.generation.status === 'loading') {
    if (
      !state.run ||
      state.generation.appointmentId !== state.run.appointmentId ||
      !state.generation.requestId ||
      state.generation.content !== null ||
      state.generation.error !== null
    )
      return false;
  }
  if (state.generation.status === 'ready') {
    if (
      !state.run ||
      state.generation.appointmentId !== state.run.appointmentId ||
      !state.generation.content ||
      state.generation.content.stageId !== state.generation.stageId
    )
      return false;
  }
  if (state.generation.appointmentId && state.run && state.generation.appointmentId !== state.run.appointmentId)
    return false;
  if (
    state.generation.stageId &&
    state.run &&
    state.generation.stageId !== state.run.plan.stages[state.run.stageIndex].id
  )
    return false;
  return true;
}

export function normalizeDatingState(value: unknown): DatingState {
  if (value === undefined || value === null) return createInitialDatingState();
  if (!validateDatingState(value)) throw new Error('约会存档字段格式无效。');
  const cloned = JSON.parse(JSON.stringify(value)) as DatingState;
  return {
    ...cloned,
    relationships: normalizeDatingRelationshipState(cloned.relationships),
    archives: cloned.archives.map(archive => ({
      ...archive,
      ...(archive.datingRelationshipDelta === undefined ? { datingRelationshipDelta: {} } : {}),
    })),
  };
}

export function createDatingStateSnapshot(state: DatingState): DatingState {
  return normalizeDatingState({
    version: state.version,
    run: state.run,
    generation: state.generation,
    relationships: state.relationships,
    appointments: state.appointments,
    invitationAttempts: state.invitationAttempts,
    archives: state.archives,
    walkHomeByDate: state.walkHomeByDate,
    feePromptAppointmentId: state.feePromptAppointmentId,
  });
}

export interface DatingStore extends DatingState {
  resetDatingState: () => void;
  replaceDatingState: (value: unknown) => void;
  applyDatingRelationshipDelta: (characterId: string, delta: DatingRelationshipDelta) => void;
  recordInvitationAttempt: (attempt: DatingInvitationAttempt) => void;
  bookAppointment: (appointment: DatingAppointment) => boolean;
  removeBookedAppointment: (appointmentId: string) => boolean;
  setAppointmentStatus: (appointmentId: string, status: DatingAppointment['status']) => void;
  updateAppointmentLocation: (appointmentId: string, locationId: DatingAppointment['locationId'], fee: number) => void;
  startRun: (run: DatingRun) => boolean;
  setGeneration: (generation: DatingGenerationState) => void;
  setStageContent: (stageId: 'main' | 'return', content: DatingStageContent) => void;
  advanceToReturn: (optionId: string) => boolean;
  setRunPosition: (stageIndex: 0 | 1, pageIndex: number) => void;
  completeRun: (archive: DatingArchive) => boolean;
  recordWalkHome: (record: WalkHomeRecord) => void;
  settleWalkHome: (record: WalkHomeRecord) => boolean;
  setFeePrompt: (appointmentId: string | null) => void;
  getAppointmentForDate: (date: { year: number; month: number; day: number }) => DatingAppointment | null;
}

export const useDatingStore = create<DatingStore>((set, get) => ({
  ...createInitialDatingState(),

  resetDatingState: () => set(createInitialDatingState()),
  replaceDatingState: value => set(normalizeDatingState(value)),
  applyDatingRelationshipDelta: (characterId, delta) =>
    set(state => ({
      relationships: applyDatingRelationshipDeltaToState(state.relationships, characterId, delta),
    })),
  recordInvitationAttempt: attempt => set(state => ({ invitationAttempts: [...state.invitationAttempts, attempt] })),
  bookAppointment: appointment => {
    const key = calendarDateKey(appointment.date);
    if (
      appointment.status !== 'booked' ||
      get().appointments.some(
        item =>
          item.id === appointment.id ||
          (calendarDateKey(item.date) === key && ['booked', 'active'].includes(item.status)),
      )
    ) {
      return false;
    }
    set(state => ({ appointments: [...state.appointments, appointment] }));
    return true;
  },
  removeBookedAppointment: appointmentId => {
    const appointment = get().appointments.find(item => item.id === appointmentId);
    if (!appointment || appointment.status !== 'booked') return false;
    set(state => ({ appointments: state.appointments.filter(item => item.id !== appointmentId) }));
    return true;
  },
  setAppointmentStatus: (appointmentId, status) =>
    set(state => ({
      appointments: state.appointments.map(item => (item.id === appointmentId ? { ...item, status } : item)),
    })),
  updateAppointmentLocation: (appointmentId, locationId, fee) =>
    set(state => ({
      appointments: state.appointments.map(item => (item.id === appointmentId ? { ...item, locationId, fee } : item)),
    })),
  startRun: run => {
    let started = false;
    set(state => {
      const appointment = state.appointments.find(item => item.id === run.appointmentId);
      if (
        state.run ||
        !appointment ||
        appointment.status !== 'booked' ||
        run.status !== 'active' ||
        run.stageIndex !== 0 ||
        run.selectedOptionIds.length !== 0
      )
        return state;
      started = true;
      return {
        appointments: state.appointments.map(item =>
          item.id === run.appointmentId ? { ...item, status: 'active' as const } : item,
        ),
        run,
      };
    });
    return started;
  },
  setGeneration: generation => set({ generation }),
  setStageContent: (stageId, content) =>
    set(state => ({
      run: state.run ? { ...state.run, stageContents: { ...state.run.stageContents, [stageId]: content } } : state.run,
      generation: { ...state.generation, status: 'ready', stageId, content, error: null },
    })),
  advanceToReturn: optionId => {
    let accepted = false;
    set(state => {
      const run = state.run;
      const stage = run?.plan.stages[0];
      if (
        !run ||
        run.status !== 'active' ||
        run.stageIndex !== 0 ||
        !stage?.options.some(option => option.id === optionId) ||
        run.selectedOptionIds.length !== 0
      )
        return state;
      accepted = true;
      return {
        run: { ...run, selectedOptionIds: [optionId], stageIndex: 1, pageIndex: 0 },
        generation: {
          status: 'idle',
          appointmentId: run.appointmentId,
          stageId: 'return',
          content: null,
          error: null,
          requestId: null,
        },
      };
    });
    return accepted;
  },
  setRunPosition: (stageIndex, pageIndex) =>
    set(state => ({
      run: state.run ? { ...state.run, stageIndex, pageIndex: Math.max(0, Math.trunc(pageIndex)) } : null,
    })),
  completeRun: archive => {
    let completed = false;
    set(state => {
      const run = state.run;
      const appointment = state.appointments.find(item => item.id === archive.appointmentId);
      const contents = run?.plan.stages.map(stage => run.stageContents[stage.id]) ?? [];
      if (
        !run ||
        run.status !== 'active' ||
        run.stageIndex !== 1 ||
        run.appointmentId !== archive.appointmentId ||
        appointment?.status !== 'active' ||
        contents.some(content => !content) ||
        state.archives.some(item => item.id === archive.id || item.appointmentId === archive.appointmentId) ||
        archive.selectedOptionIds.length !== run.plan.stages.length ||
        archive.selectedOptionIds[0] !== run.selectedOptionIds[0] ||
        !run.plan.stages[1].options.some(option => option.id === archive.selectedOptionIds[1]) ||
        archive.contents.length !== contents.length ||
        archive.contents.some((content, index) => content !== contents[index]) ||
        archive.characterId !== run.plan.characterId ||
        archive.locationId !== run.plan.locationId ||
        archive.quality !== run.plan.quality ||
        calendarDateKey(archive.date) !== calendarDateKey(run.plan.date)
      ) {
        return state;
      }
      completed = true;
      return {
        appointments: state.appointments.map(item =>
          item.id === archive.appointmentId ? { ...item, status: 'completed' as const } : item,
        ),
        archives: [...state.archives, archive],
        run: null,
        generation: { ...INITIAL_GENERATION },
      };
    });
    return completed;
  },
  recordWalkHome: record => set(state => ({ walkHomeByDate: { ...state.walkHomeByDate, [record.dateKey]: record } })),
  settleWalkHome: record => {
    let settled = false;
    set(state => {
      const previous = state.walkHomeByDate[record.dateKey];
      if (!previous || previous.status !== 'offered' || previous.characterId !== record.characterId) return state;
      settled = true;
      return { walkHomeByDate: { ...state.walkHomeByDate, [record.dateKey]: record } };
    });
    return settled;
  },
  setFeePrompt: appointmentId => set({ feePromptAppointmentId: appointmentId }),
  getAppointmentForDate: date => {
    const key = calendarDateKey(date);
    return (
      get().appointments.find(
        item => calendarDateKey(item.date) === key && ['booked', 'active'].includes(item.status),
      ) ?? null
    );
  },
}));
