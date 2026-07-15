import { useGameStore } from '../stores/gameStore';

export default function EventLog() {
  const log = useGameStore(state => state.log);

  return (
    <div className="event-log">
      <h3>事件日志</h3>
      <ul>
        {log.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}
