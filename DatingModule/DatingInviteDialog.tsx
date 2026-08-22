import { useMemo, useState } from 'react';
import { DateModule } from '../CalendarModule';
import { buildCalendarSpecialDateCatalog } from '../CalendarModule/specialDates';
import { getEquippedSkillIds, useSkillStore } from '../skilllogic';
import { useGameStore } from '../stores/gameStore';
import { normalizeCharacterRelationshipStats } from '../services/characterRelationship';
import type { CalendarDateValue, GameCharacter } from '../types';
import { resolveAssetPath } from '../utils/assetPath';
import {
  DATING_LOCATIONS,
  getCharacterInvitationGate,
  getDatingLocation,
  isDatingDateEligible,
  projectDatingAppointmentSpecialDates,
  resolveInvitation,
} from './datingRules';
import { useDatingStore } from './datingStore';
import type { DatingLocationId } from './types';
import './DatingModule.css';

export interface DatingInviteDialogProps {
  character: GameCharacter;
  onClose: () => void;
}

type InviteStep = 'date' | 'invitation-result' | 'location' | 'confirm';

interface LocationFavoriteHint {
  locationId: DatingLocationId;
  preferred: boolean;
  cost: number;
}

interface InvitationRollState {
  accepted: boolean;
  acceptanceRate: number;
  roll: number;
  reason: string;
}

const STEP_SEQUENCE: readonly { id: InviteStep; label: string }[] = [
  { id: 'date', label: '选日期' },
  { id: 'invitation-result', label: '问心意' },
  { id: 'location', label: '选地点' },
  { id: 'confirm', label: '确认预约' },
] as const;

function dateLabel(date: CalendarDateValue): string {
  return `${date.year}/${date.month}/${date.day}`;
}

function formatLegacyLocationId(locationId: DatingLocationId): 'park' | 'riverbank' | 'shoppingStreet' {
  return locationId === 'townStreet' ? 'shoppingStreet' : locationId;
}

function characterInitial(name: string): string {
  const first = name.trim().charAt(0);
  return first === '' ? '?' : first;
}

export default function DatingInviteDialog({ character, onClose }: DatingInviteDialogProps) {
  const currentDate = useGameStore(state => state.date);
  const completedEventIds = useGameStore(state => state.mainStory.completedEventIds);
  const actionPointsRemaining = useGameStore(state => state.actionPointsRemaining);
  const consumeActionPoint = useGameStore(state => state.consumeActionPoint);
  const skillProgression = useSkillStore();
  const appointments = useDatingStore(state => state.appointments);
  const attempts = useDatingStore(state => state.invitationAttempts);
  const recordAttempt = useDatingStore(state => state.recordInvitationAttempt);
  const bookAppointment = useDatingStore(state => state.bookAppointment);
  const removeBookedAppointment = useDatingStore(state => state.removeBookedAppointment);

  const [step, setStep] = useState<InviteStep>('date');
  const [selectedDate, setSelectedDate] = useState<CalendarDateValue>(() => ({ ...currentDate }));
  const [invitationRoll, setInvitationRoll] = useState<InvitationRollState | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<DatingLocationId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const relationship = normalizeCharacterRelationshipStats(character);
  const gate = getCharacterInvitationGate(character.id, relationship, completedEventIds);

  const blockedDateKeys = useMemo(
    () =>
      new Set(
        buildCalendarSpecialDateCatalog()
          .filter(entry => entry.marker === 'blocked')
          .map(
            entry =>
              `${entry.date.year}-${String(entry.date.month).padStart(2, '0')}-${String(entry.date.day).padStart(2, '0')}`,
          ),
      ),
    [],
  );
  const bookedDateKeys = useMemo(
    () =>
      new Set(
        appointments
          .filter(appointment => appointment.status === 'booked' || appointment.status === 'active')
          .map(
            appointment =>
              `${appointment.date.year}-${String(appointment.date.month).padStart(2, '0')}-${String(appointment.date.day).padStart(2, '0')}`,
          ),
      ),
    [appointments],
  );
  const specialDates = useMemo(
    () => [...buildCalendarSpecialDateCatalog(), ...projectDatingAppointmentSpecialDates(appointments)],
    [appointments],
  );
  const equippedSkillIds = useMemo(() => getEquippedSkillIds(skillProgression), [skillProgression]);
  const dateRule = isDatingDateEligible(currentDate, selectedDate, blockedDateKeys, bookedDateKeys);
  const attemptNumber =
    attempts.filter(
      attempt =>
        attempt.characterId === character.id &&
        attempt.date.year === selectedDate.year &&
        attempt.date.month === selectedDate.month &&
        attempt.date.day === selectedDate.day,
    ).length + 1;

  const locationHints = useMemo<readonly LocationFavoriteHint[]>(
    () =>
      DATING_LOCATIONS.map(location => ({
        locationId: location.id,
        preferred: character.favoriteLocations.includes(formatLegacyLocationId(location.id)),
        cost: location.cost,
      })),
    [character.favoriteLocations],
  );

  const resetDialog = () => {
    setStep('date');
    setInvitationRoll(null);
    setSelectedLocation(null);
    setNotice(null);
    setSubmitting(false);
  };

  const cancelToMap = () => {
    resetDialog();
    onClose();
  };

  const handleAskInvitation = () => {
    if (!gate.available) {
      setNotice(gate.reason ?? '当前还不能发起邀约。');
      return;
    }
    if (!dateRule.eligible) {
      setNotice(dateRule.reason ?? '当前选中的日期不可预约。');
      return;
    }
    const result = resolveInvitation({
      date: selectedDate,
      characterId: character.id,
      friendship: relationship.friendship,
      romance: relationship.romance,
      locationId: null,
      favoriteLocation: false,
      faceToFace: true,
      equippedSkillIds,
      attemptNumber,
    });
    const attemptId = `dating-invite-${selectedDate.year}-${selectedDate.month}-${selectedDate.day}-${character.id}-${attemptNumber}`;
    const now = new Date().toISOString();
    if (!result.accepted) {
      recordAttempt({
        id: attemptId,
        date: { ...selectedDate },
        characterId: character.id,
        locationId: null,
        attemptNumber,
        acceptanceRate: result.acceptanceRate,
        roll: result.roll,
        accepted: false,
        apSpent: 0,
        reason: result.reason,
        createdAt: now,
      });
      setNotice(`没有约成（成功率 ${Math.round(result.acceptanceRate * 100)}%）。这次没有消耗 AP。`);
      return;
    }
    setInvitationRoll({
      accepted: true,
      acceptanceRate: result.acceptanceRate,
      roll: result.roll,
      reason: result.reason,
    });
    setNotice(null);
    setStep('invitation-result');
  };

  const handleConfirmLocation = () => {
    if (!selectedLocation) {
      setNotice('请先选择一个约会地点。');
      return;
    }
    setStep('confirm');
  };

  const handleFinalConfirm = () => {
    if (!selectedLocation || !invitationRoll) return;
    setSubmitting(true);
    const attemptId = `dating-invite-${selectedDate.year}-${selectedDate.month}-${selectedDate.day}-${character.id}-${attemptNumber}`;
    const locationDefinition = getDatingLocation(selectedLocation);
    const now = new Date().toISOString();
    const appointmentId = `dating-${attemptId}`;
    const booked = bookAppointment({
      id: appointmentId,
      date: { ...selectedDate },
      characterId: character.id,
      locationId: selectedLocation,
      fee: locationDefinition.cost,
      status: 'booked',
      createdAt: now,
      accepted: true,
    });
    if (!booked) {
      setNotice('这一天刚刚出现了其他预约，没有消耗 AP。');
      setSubmitting(false);
      return;
    }
    const settlement = consumeActionPoint(
      `你和${character.name}约好了 ${dateLabel(selectedDate)} 的${locationDefinition.label}约会。`,
    );
    if (!settlement.accepted) {
      removeBookedAppointment(appointmentId);
      setNotice('预约状态刚刚发生变化，这次没有扣除 AP。');
      setSubmitting(false);
      return;
    }
    recordAttempt({
      id: attemptId,
      date: { ...selectedDate },
      characterId: character.id,
      locationId: selectedLocation,
      attemptNumber,
      acceptanceRate: invitationRoll.acceptanceRate,
      roll: invitationRoll.roll,
      accepted: true,
      apSpent: 1,
      reason: invitationRoll.reason,
      createdAt: now,
    });
    setNotice(`约好了！${dateLabel(selectedDate)} 去${locationDefinition.label}。已消耗 1 AP。`);
    setSubmitting(false);
    setStep('date');
    setInvitationRoll(null);
    setSelectedLocation(null);
  };

  const stepIndex = STEP_SEQUENCE.findIndex(item => item.id === step);
  const portraitSrc = character.portrait ?? character.chibi ?? null;
  const acceptedRatePercent = invitationRoll ? Math.round(invitationRoll.acceptanceRate * 100) : null;

  return (
    <div className="dating-invite-dialog" role="dialog" aria-modal="true" aria-label={`邀请${character.name}约会`}>
      <header className="dating-invite-dialog__header">
        <span className="dating-invite-dialog__portrait" aria-hidden="true">
          {portraitSrc ? (
            <img src={resolveAssetPath(portraitSrc)} alt={`${character.name} 立绘`} />
          ) : (
            <span className="dating-invite-dialog__portrait-fallback">{characterInitial(character.name)}</span>
          )}
        </span>
        <div className="dating-invite-dialog__title-block">
          <span className="dating-eyebrow">{STEP_SEQUENCE[stepIndex]?.label ?? ''} · 共 4 步</span>
          <h2>邀请 {character.name}</h2>
          <p>
            友情 {relationship.friendship} · 恋爱 {relationship.romance} · 成功后消耗 1 AP
          </p>
        </div>
        <button
          type="button"
          className="dating-icon-button"
          aria-label="关闭邀约"
          title="关闭邀约"
          onClick={cancelToMap}
        >
          ×
        </button>
      </header>

      <div className="dating-invite-dialog__stepper" aria-label="邀约流程进度">
        <span className="dating-stepper-rail" aria-hidden="true" />
        {STEP_SEQUENCE.map((item, index) => {
          const state = index < stepIndex ? 'done' : index === stepIndex ? 'active' : 'todo';
          return (
            <span
              key={item.id}
              className={`dating-stepper-pip ${state === 'done' ? 'is-done' : state === 'active' ? 'is-active' : ''}`}
              aria-current={state === 'active' ? 'step' : undefined}
            >
              <span className="dating-stepper-pip__dot">{index + 1}</span>
              <span className="dating-stepper-pip__label">{item.label}</span>
            </span>
          );
        })}
      </div>

      <div className="dating-invite-dialog__body">
        {step === 'date' && (
          <>
            <div className="dating-invite-dialog__calendar">
              <DateModule
                date={currentDate}
                specialDates={specialDates}
                onClose={cancelToMap}
                onSelectDate={setSelectedDate}
                isDateSelectable={candidate =>
                  isDatingDateEligible(currentDate, candidate, blockedDateKeys, bookedDateKeys).eligible
                }
                getDateStatus={candidate => {
                  const status = isDatingDateEligible(currentDate, candidate, blockedDateKeys, bookedDateKeys);
                  return status.eligible ? '可以预约' : status.reason;
                }}
                footer={
                  <span>
                    已选：{dateLabel(selectedDate)} · {dateRule.reason ?? '日期可用'}
                  </span>
                }
              />
            </div>
            <div className="dating-invite-dialog__choices">
              <div className="dating-section-heading">
                <span>第一步 · 选择日期</span>
                <small>只决定"在哪一天"约会</small>
              </div>
              <div className="dating-info-card">
                <div className="dating-info-card__row">
                  <span>对象</span>
                  <strong>{character.name}</strong>
                </div>
                <div className="dating-info-card__row">
                  <span>已选日期</span>
                  <strong>{dateLabel(selectedDate)}</strong>
                </div>
                <div className="dating-info-card__row">
                  <span>邀约门槛</span>
                  {gate.available ? (
                    <span className="dating-chip">已满足</span>
                  ) : (
                    <span className="dating-chip is-rose">{gate.reason}</span>
                  )}
                </div>
                {notice && <p role="status">{notice}</p>}
              </div>
              <div className="dating-invite-dialog__actions">
                <button type="button" className="dating-button is-quiet" onClick={cancelToMap}>
                  返回
                </button>
                <button
                  type="button"
                  className="dating-button is-primary"
                  disabled={!gate.available || !dateRule.eligible}
                  onClick={handleAskInvitation}
                >
                  <span aria-hidden="true">♥</span> 这一天可以吗？
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'invitation-result' && invitationRoll && (
          <div className="dating-invite-dialog__choices" style={{ gridColumn: '1 / -1' }}>
            <div className="dating-section-heading">
              <span>第二步 · 对方是否答应</span>
              <small>地点尚未决定</small>
            </div>
            <div className={`dating-result-bubble ${invitationRoll.accepted ? 'is-accepted' : ''}`}>
              <p className="dating-result-bubble__lead">
                {invitationRoll.accepted
                  ? `${character.name}点了点头：${invitationRoll.reason}`
                  : `${character.name}摇了摇头：${invitationRoll.reason}`}
              </p>
              <p className="dating-result-bubble__sub">
                {dateLabel(selectedDate)} · 成功率 {acceptedRatePercent}%
              </p>
            </div>
            <div className="dating-info-card">
              <div className="dating-info-card__row">
                <span>本次掷骰</span>
                <strong>{Math.round(invitationRoll.roll * 100)}%</strong>
              </div>
              <div className="dating-info-card__row">
                <span>基础成功率</span>
                <strong>{acceptedRatePercent}%</strong>
              </div>
              <div className="dating-info-card__row">
                <span>本日内第几次尝试</span>
                <strong>第 {attemptNumber} 次</strong>
              </div>
              {notice && <p role="status">{notice}</p>}
            </div>
            <div className="dating-invite-dialog__actions">
              <button
                type="button"
                className="dating-button is-quiet"
                onClick={() => {
                  setStep('date');
                  setInvitationRoll(null);
                  setNotice(null);
                }}
              >
                换一天
              </button>
              {invitationRoll.accepted && (
                <button
                  type="button"
                  className="dating-button is-primary"
                  onClick={() => {
                    setStep('location');
                  }}
                >
                  <span aria-hidden="true">→</span> 选择约会地点
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'location' && (
          <div className="dating-invite-dialog__choices" style={{ gridColumn: '1 / -1' }}>
            <div className="dating-section-heading">
              <span>第三步 · 在地图上选地点</span>
              <small>点击照片切换查看</small>
            </div>
            <div className="dating-info-card">
              <div className="dating-info-card__row">
                <span>{dateLabel(selectedDate)}</span>
                <strong>{character.name}</strong>
              </div>
              <div className="dating-info-card__row">
                <span>当前状态</span>
                <span className="dating-chip is-rose">她已经答应了</span>
              </div>
            </div>
            <div className="dating-location-stage">
              {/* ── Full scene background ── */}
              <div className="dating-location-map" role="region" aria-label="约会地图">
                <img
                  className="dating-location-map__scene"
                  src={resolveAssetPath(getDatingLocation(selectedLocation ?? DATING_LOCATIONS[0]!.id).backgroundAsset)}
                  alt=""
                  draggable={false}
                />
                <span className="dating-location-map__vignette" aria-hidden="true" />

                {/* Route name ribbon — "市外" / "中央公园周边" / "中央站" */}
                <div className="dating-location-route-ribbon" aria-hidden="true">
                  {DATING_LOCATIONS.findIndex(l => l.id === selectedLocation) > 0
                    ? '◀ '
                    : ''}
                  {DATING_LOCATIONS.find(l => l.id === selectedLocation)?.label ?? '公园'}
                  地带
                  {DATING_LOCATIONS.findIndex(l => l.id === selectedLocation) < DATING_LOCATIONS.length - 1
                    ? ' ▶'
                    : ''}
                </div>

                {/* ── Photo grid — three location slots side by side ── */}
                <div className="dating-location-photo-grid" role="group" aria-label="可选地点照片">
                  {DATING_LOCATIONS.map(definition => {
                    const isSelected = selectedLocation === definition.id;
                    return (
                      <button
                        type="button"
                        key={definition.id}
                        className={`dating-location-photo-item ${isSelected ? 'is-selected' : ''}`}
                        aria-pressed={isSelected}
                        aria-label={definition.label}
                        onClick={() => {
                          setSelectedLocation(definition.id);
                          setNotice(null);
                        }}
                      >
                        <img
                          src={resolveAssetPath(definition.thumbnailAsset ?? definition.cardAsset)}
                          alt={`${definition.label}约会地点`}
                          draggable={false}
                        />
                        <span className="dating-location-photo-item__badge" aria-hidden="true">
                          確定 ○
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Bottom info bar ── */}
              {(() => {
                const focused = getDatingLocation(selectedLocation ?? DATING_LOCATIONS[0]!.id);
                const hint = locationHints.find(h => h.locationId === focused.id);
                return (
                  <div className="dating-location-bottom-bar">
                    <span className="dating-location-bottom-bar__location-name">
                      {focused.label}
                      {hint?.preferred && (
                        <span className="dating-location-bottom-bar__favorite-tag">♥ 她喜欢</span>
                      )}
                    </span>
                    <span
                      className={`dating-location-bottom-bar__cost ${focused.cost === 0 ? 'is-free' : ''}`}
                    >
                      {focused.cost > 0 ? `${focused.cost} 金` : '免费'}
                    </span>
                  </div>
                );
              })()}
            </div>
            {notice && <p role="status">{notice}</p>}
            <div className="dating-invite-dialog__actions">
              <button
                type="button"
                className="dating-button is-quiet"
                onClick={() => {
                  setStep('invitation-result');
                  setNotice(null);
                }}
              >
                返回上一步
              </button>
              <button
                type="button"
                className="dating-button is-primary"
                disabled={!selectedLocation}
                onClick={handleConfirmLocation}
              >
                <span aria-hidden="true">→</span> 下一步
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && selectedLocation && invitationRoll && (
          <div className="dating-invite-dialog__choices" style={{ gridColumn: '1 / -1' }}>
            <div className="dating-section-heading">
              <span>第四步 · 确认预约</span>
              <small>扣 1 AP 后写入约会</small>
            </div>
            <article className="dating-ticket" aria-label="约会预约票券">
              <div className="dating-ticket__stub">
                <span className="dating-ticket__stub-label">DATE</span>
                <span className="dating-ticket__stub-value">{dateLabel(selectedDate)}</span>
                <span className="dating-ticket__stub-meta">{character.name} · 成功率 {acceptedRatePercent}%</span>
              </div>
              <span className="dating-ticket__seal">
                ♥
                <small>AP×1</small>
              </span>
            </article>
            <article className="dating-ticket" aria-label="约会地点票券">
              <div className="dating-ticket__stub">
                <span className="dating-ticket__stub-label">PLACE</span>
                <span className="dating-ticket__stub-value">{getDatingLocation(selectedLocation).label}</span>
                <span className="dating-ticket__stub-meta">
                  费用 {getDatingLocation(selectedLocation).cost} 金钱 · 角色已知喜欢
                  {character.favoriteLocations.includes(formatLegacyLocationId(selectedLocation)) ? '：是' : '：否'}
                </span>
              </div>
              <span className="dating-ticket__seal">
                <small>费用</small>
                {getDatingLocation(selectedLocation).cost > 0
                  ? `${getDatingLocation(selectedLocation).cost} 金`
                  : '免费'}
              </span>
            </article>
            <div className="dating-info-card">
              {actionPointsRemaining <= 0 ? (
                <p role="status">今天的行动点已经用完，明天再来吧。</p>
              ) : (
                <div className="dating-info-card__row">
                  <span>本操作将消耗</span>
                  <span className="dating-chip is-rose">1 AP</span>
                  <span>，并写入约会。</span>
                </div>
              )}
            </div>
            <div className="dating-invite-dialog__actions">
              <button
                type="button"
                className="dating-button is-quiet"
                onClick={() => setStep('location')}
                disabled={submitting}
              >
                返回上一步
              </button>
              <button
                type="button"
                className="dating-button is-primary"
                disabled={actionPointsRemaining <= 0 || submitting}
                onClick={handleFinalConfirm}
              >
                <span aria-hidden="true">♥</span> 确认预约
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}