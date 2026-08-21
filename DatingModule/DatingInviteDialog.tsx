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

function dateLabel(date: CalendarDateValue): string {
  return `${date.year}/${date.month}/${date.day}`;
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
  const [selectedDate, setSelectedDate] = useState<CalendarDateValue>(() => ({ ...currentDate }));
  const [selectedLocation, setSelectedLocation] = useState<DatingLocationId>('park');
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
  const selectedLocationDefinition = getDatingLocation(selectedLocation);
  const canSubmit = gate.available && dateRule.eligible && actionPointsRemaining > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) {
      setNotice(
        gate.reason ?? dateRule.reason ?? (actionPointsRemaining <= 0 ? '今天的行动点已经用完了。' : '当前不能预约。'),
      );
      return;
    }
    setSubmitting(true);
    const attemptNumber =
      attempts.filter(
        attempt =>
          attempt.characterId === character.id &&
          attempt.date.year === selectedDate.year &&
          attempt.date.month === selectedDate.month &&
          attempt.date.day === selectedDate.day,
      ).length + 1;
    const result = resolveInvitation({
      date: selectedDate,
      characterId: character.id,
      friendship: relationship.friendship,
      romance: relationship.romance,
      locationId: selectedLocation,
      favoriteLocation: character.favoriteLocations.includes(
        selectedLocation === 'townStreet' ? 'shoppingStreet' : selectedLocation,
      ),
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
        locationId: selectedLocation,
        attemptNumber,
        acceptanceRate: result.acceptanceRate,
        roll: result.roll,
        accepted: false,
        apSpent: 0,
        reason: result.reason,
        createdAt: now,
      });
      setNotice(`没有约成（成功率 ${Math.round(result.acceptanceRate * 100)}%）。这次没有消耗 AP。`);
      setSubmitting(false);
      return;
    }

    const appointmentId = `dating-${attemptId}`;
    const booked = bookAppointment({
      id: appointmentId,
      date: { ...selectedDate },
      characterId: character.id,
      locationId: selectedLocation,
      fee: result.fee,
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
      `你和${character.name}约好了 ${dateLabel(selectedDate)} 的${selectedLocationDefinition.label}约会。`,
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
      acceptanceRate: result.acceptanceRate,
      roll: result.roll,
      accepted: true,
      apSpent: 1,
      reason: result.reason,
      createdAt: now,
    });
    setNotice(`约好了！${dateLabel(selectedDate)} 去${selectedLocationDefinition.label}。已消耗 1 AP。`);
    setSubmitting(false);
  };

  return (
    <div className="dating-invite-dialog" role="dialog" aria-modal="true" aria-label={`邀请${character.name}约会`}>
      <div className="dating-invite-dialog__header">
        <div>
          <span className="dating-eyebrow">非主线约会</span>
          <h2>邀请 {character.name}</h2>
          <p>
            友情 {relationship.friendship} · 恋爱 {relationship.romance} · 成功后消耗 1 AP
          </p>
        </div>
        <button type="button" className="dating-icon-button" aria-label="关闭邀约" title="关闭邀约" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="dating-invite-dialog__body">
        <div className="dating-invite-dialog__calendar">
          <DateModule
            date={currentDate}
            specialDates={specialDates}
            onClose={onClose}
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
            <span>地点</span>
            <small>浏览不消耗 AP</small>
          </div>
          <div className="dating-location-grid">
            {DATING_LOCATIONS.map(location => (
              <button
                type="button"
                key={location.id}
                className={`dating-location-card ${selectedLocation === location.id ? 'is-selected' : ''}`}
                aria-pressed={selectedLocation === location.id}
                onClick={() => setSelectedLocation(location.id)}
              >
                <img src={resolveAssetPath(location.cardAsset)} alt={`${location.label}约会地点`} />
                <span className="dating-location-card__copy">
                  <strong>{location.label}</strong>
                  <small>{location.cost > 0 ? `${location.cost} 金钱` : '免费'}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="dating-invite-dialog__summary">
            <span>当前选择：{selectedLocationDefinition.label}</span>
            <span>{gate.available ? '已满足邀约门槛' : gate.reason}</span>
            {notice && <p role="status">{notice}</p>}
          </div>
          <div className="dating-invite-dialog__actions">
            <button type="button" className="dating-button is-quiet" onClick={onClose}>
              返回
            </button>
            <button type="button" className="dating-button is-primary" disabled={!canSubmit} onClick={handleSubmit}>
              <span aria-hidden="true">♥</span> 发出邀约
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
