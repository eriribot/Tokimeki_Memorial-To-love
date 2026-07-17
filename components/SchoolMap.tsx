import { useGameStore } from '../stores/gameStore';
import { useMapStore } from '../stores/mapStore';
import { useCharacterStore } from '../stores/characterStore';
import { resolveAssetPath } from '../utils/assetPath';
import LocationMarker from './LocationMarker';
import Character from './Character';

interface SchoolMapProps {
  hasStoryHistory: boolean;
  onOpenStoryHistory: () => void;
}

const LEGACY_CHIBI_REPLACEMENTS: Readonly<Record<string, string>> = {
  '/artsource/chibis/Lalachibi.png': '/artsource/chibis/lala.png',
  '/artsource/chibis/yuichibi.png': '/artsource/chibis/yui.png',
  '/artsource/chibis/mengmengchibi.png': '/artsource/chibis/mengmeng.png',
  '/artsource/chibis/darknesschibi.png': '/artsource/chibis/darkness.png',
};

export default function SchoolMap({ hasStoryHistory, onOpenStoryHistory }: SchoolMapProps) {
  const currentLocationId = useGameStore(state => state.currentLocationId);
  const { locations, width, height, cellSize } = useMapStore();
  const characters = useCharacterStore(state => state.characters);

  const mapWidth = width * cellSize;
  const mapHeight = height * cellSize;
  const gridCellSize = cellSize / 2;
  const gridWidth = width * 2;
  const gridHeight = height * 2;
  const avatarSize = 76;
  const avatarGap = 10;

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
        const x = i % gridWidth;
        const y = Math.floor(i / gridWidth);
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
        );
      })}

      {/* 地点 */}
      {Object.values(locations).map(loc => (
        <LocationMarker key={loc.id} location={loc} isCurrent={loc.id === currentLocationId} />
      ))}

      {/* 角色 Q 版立绘 */}
      {characters
        .filter(c => c.currentLocationId !== null)
        .map(c => {
          if (c.currentLocationId === null) return null;
          const loc = locations[c.currentLocationId];
          if (!loc) return null;

          const sameLocationCharacters = characters.filter(other => other.currentLocationId === c.currentLocationId);
          const locationIndex = sameLocationCharacters.findIndex(other => other.id === c.id);
          const perRow = Math.min(2, sameLocationCharacters.length);
          const row = Math.floor(locationIndex / perRow);
          const col = locationIndex % perRow;
          const rowCount = Math.min(perRow, sameLocationCharacters.length - row * perRow);
          const rowWidth = rowCount * avatarSize + (rowCount - 1) * avatarGap;
          const centerX = loc.x * cellSize + cellSize / 2;

          return (
            <Character
              key={c.id}
              character={{ ...c, chibi: LEGACY_CHIBI_REPLACEMENTS[c.chibi] ?? c.chibi }}
              x={centerX - rowWidth / 2 + col * (avatarSize + avatarGap)}
              y={loc.y * cellSize + cellSize + 8 + row * (avatarSize + 4)}
            />
          );
        })}

      {hasStoryHistory && (
        <button
          type="button"
          className="school-map__story-history"
          aria-label="回放已读主线剧情"
          title="回放已读主线剧情"
          onClick={onOpenStoryHistory}
        >
          <img src={resolveAssetPath('/artsource/ui/skip_kidoku.png')} alt="" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
