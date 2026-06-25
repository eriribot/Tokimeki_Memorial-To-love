import { useGameStore } from '../stores/gameStore'
import { useMapStore } from '../stores/mapStore'
import { useCharacterStore } from '../stores/characterStore'
import { resolveAssetPath } from '../utils/assetPath'
import LocationMarker from './LocationMarker'
import Character from './Character'

export default function SchoolMap() {
  const currentLocationId = useGameStore((state) => state.currentLocationId)
  const { locations, width, height, cellSize } = useMapStore()
  const characters = useCharacterStore((state) => state.characters)

  const mapWidth = width * cellSize
  const mapHeight = height * cellSize

  return (
    <div
      className="school-map"
      style={{
        position: 'relative',
        width: mapWidth,
        height: mapHeight,
        overflow: 'hidden',
      }}
    >
      {/* 地图背景图 */}
      <img
        className="map-background"
        src={resolveAssetPath('/artsource/backgrounds/map.png')}
        alt="学校地图"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.9,
        }}
      />

      {/* 背景网格 */}
      {Array.from({ length: width * height }, (_, i) => {
        const x = i % width
        const y = Math.floor(i / width)
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x * cellSize,
              top: y * cellSize,
              width: cellSize,
              height: cellSize,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          />
        )
      })}

      {/* 地点 */}
      {Object.values(locations).map((loc) => (
        <LocationMarker
          key={loc.id}
          location={loc}
          isCurrent={loc.id === currentLocationId}
        />
      ))}

      {/* 角色 Q 版立绘 */}
      {characters
        .filter((c) => c.currentLocationId)
        .map((c) => {
          const loc = locations[c.currentLocationId]
          if (!loc) return null

          const sameLocationCharacters = characters.filter(
            (other) => other.currentLocationId === c.currentLocationId
          )
          const locationIndex = sameLocationCharacters.findIndex(
            (other) => other.id === c.id
          )
          const row = Math.floor(locationIndex / 3)
          const col = locationIndex % 3

          return (
            <Character
              key={c.id}
              character={c}
              x={loc.x * cellSize + 18 + col * 34}
              y={loc.y * cellSize + cellSize - 72 - row * 34}
            />
          )
        })}
    </div>
  )
}
