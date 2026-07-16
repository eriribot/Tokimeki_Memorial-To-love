import { useGameStore, PERIODS } from '../stores/gameStore';
import { useMapStore } from '../stores/mapStore';
import { usePlayerStore } from '../stores/playerStore';
import { getDaysInMonth } from '../CalendarModule/date';

export default function StatPanel() {
  const day = useGameStore(state => state.day);
  const date = useGameStore(state => state.date);
  const periodIndex = useGameStore(state => state.periodIndex);
  const currentLocationId = useGameStore(state => state.currentLocationId);
  const locations = useMapStore(state => state.locations);

  const intelligence = usePlayerStore(state => state.intelligence);
  const athletics = usePlayerStore(state => state.athletics);
  const art = usePlayerStore(state => state.art);
  const charm = usePlayerStore(state => state.charm);
  const stamina = usePlayerStore(state => state.stamina);
  const stress = usePlayerStore(state => state.stress);
  const money = usePlayerStore(state => state.money);

  const period = PERIODS[periodIndex] ?? PERIODS[0];
  const currentLocation = locations[currentLocationId];
  const daysInMonth = getDaysInMonth(date.year, date.month);

  const stats = [
    { label: '学力', value: intelligence, color: '#3b82f6' },
    { label: '运动', value: athletics, color: '#ef4444' },
    { label: '艺术', value: art, color: '#8b5cf6' },
    { label: '魅力', value: charm, color: '#f472b6' },
    { label: '体力', value: stamina, color: '#22c55e' },
    { label: '压力', value: stress, color: '#f97316' },
  ];

  return (
    <div className="stat-panel">
      <div className="calendar">
        <div className="calendar-day">{date.day}</div>
        <div className="calendar-info">
          <div>
            开学第 {day} 日 · {date.month}月{date.day}日 / {daysInMonth}日
          </div>
          <div className="time">{period.label}</div>
        </div>
      </div>

      <p className="location">当前地点：{currentLocation?.name ?? '未知'}</p>
      <p className="money">零用钱：{money} 円</p>

      <div className="stats">
        {stats.map(s => (
          <div key={s.label} className="stat-row">
            <span>{s.label}</span>
            <div className="stat-bar">
              <div
                className="stat-fill"
                style={{
                  width: `${s.value}%`,
                  backgroundColor: s.color,
                }}
              />
            </div>
            <span>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
