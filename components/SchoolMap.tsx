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
  const gridCellSize = cellSize / 2
  const gridWidth = width * 2
  const gridHeight = height * 2
  const avatarSize = 76
  const avatarGap = 10

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
      {Array.from({ length: gridWidth * gridHeight }, (_, i) => {
        const x = i % gridWidth
        const y = Math.floor(i / gridWidth)
        return (
          <div
            key={i}
            className="map-grid-cell"
            style={{
              position: 'absolute',
              left: x * gridCellSize,
              top: y * gridCellSize,
              width: gridCellSize,
              height: gridCellSize,
              border: '1px solid rgba(255,255,255,0.12)',
              pointerEvents: 'none',
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
          const perRow = Math.min(2, sameLocationCharacters.length)
          const row = Math.floor(locationIndex / perRow)
          const col = locationIndex % perRow
          const rowCount = Math.min(
            perRow,
            sameLocationCharacters.length - row * perRow
          )
          const rowWidth = rowCount * avatarSize + (rowCount - 1) * avatarGap
          const centerX = loc.x * cellSize + cellSize / 2

          return (
            <Character
              key={c.id}
              character={c}
              x={centerX - rowWidth / 2 + col * (avatarSize + avatarGap)}
              y={loc.y * cellSize + cellSize + 8 + row * (avatarSize + 4)}
            />
          )
        })}
    </div>
  )
}