import { useGameStore } from '../stores/gameStore'
import { useMapStore } from '../stores/mapStore'
import { useCharacterStore } from '../stores/characterStore'

// 地点图标映射
const LOCATION_ICONS = {
  gate: '🏫',
  classroom: '📚',
  library: '📖',
  cafeteria: '🍱',
  gym: '⚽',
  musicRoom: '🎹',
  rooftop: '🌤️',
  courtyard: '🌸',
}

export default function LocationMarker({ location, isCurrent }) {
  const { cellSize } = useMapStore()
  const setLocation = useGameStore((state) => state.setLocation)
  const enterScene = useGameStore((state) => state.enterScene)
  const addLog = useGameStore((state) => state.addLog)
  const characters = useCharacterStore((state) => state.characters)
  const hereCharacters = characters.filter(
    (c) => c.currentLocationId === location.id
  )

  const icon = LOCATION_ICONS[location.id] || '📍'
  const canEnterScene = location.id === 'classroom' && isCurrent

  return (
    <div
      className={`location-marker ${isCurrent ? 'current' : ''}`}
      style={{
        position: 'absolute',
        left: location.x * cellSize + 4,
        top: location.y * cellSize + 4,
        width: cellSize - 8,
        height: cellSize - 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <button
        type="button"
        className="location-marker-main"
        onClick={() => {
          setLocation(location.id)
          const names = hereCharacters.map((c) => c.name).join('、')
          addLog(
            names
              ? `你来到了${location.name}，遇见了 ${names}。`
              : `你来到了${location.name}。`
          )
        }}
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          width: '100%',
          backgroundColor: isCurrent ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.92)',
          border: isCurrent ? '3px solid #fbbf24' : '3px solid rgba(255, 255, 255, 0.6)',
          borderRadius: canEnterScene ? '16px 16px 10px 10px' : 16,
          boxShadow: isCurrent
            ? '0 6px 20px rgba(251, 191, 36, 0.5), inset 0 2px 4px rgba(255,255,255,0.5)'
            : '0 4px 12px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.3)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: location.color,
          fontWeight: 700,
          fontSize: 14,
          padding: 4,
          gap: 4,
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: '28px', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
          {icon}
        </span>
        <span style={{
          fontSize: '13px',
          fontWeight: 700,
          textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
          color: isCurrent ? '#e0568d' : location.color
        }}>
          {location.name}
        </span>
        {hereCharacters.length > 0 && (
          <span style={{
            fontSize: '20px',
            marginTop: -2,
            animation: 'heartbeat 1.5s ease-in-out infinite',
            filter: 'drop-shadow(0 2px 4px rgba(224, 86, 141, 0.4))'
          }}>
            💕
          </span>
        )}
      </button>

      {canEnterScene && (
        <button
          type="button"
          className="enter-scene-button"
          onClick={() => {
            enterScene(location.id)
            addLog(`你进入了${location.name}。`)
          }}
        >
          进入场景
        </button>
      )}
    </div>
  )
}
