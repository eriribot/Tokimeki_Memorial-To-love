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

const AVATAR_SIZE = 76;
const AVATAR_COLUMN_GAP = 10;
const AVATAR_ROW_GAP = 4;
const MAP_SAFE_INSET = 12;
const MARKER_GAP = 8;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export default function SchoolMap({ hasStoryHistory, onOpenStoryHistory }: SchoolMapProps) {
  const currentLocationId = useGameStore(state => state.currentLocationId);
  const { locations, width, height, cellSize } = useMapStore();
  const characters = useCharacterStore(state => state.characters);

  const mapWidth = width * cellSize;
  const mapHeight = height * cellSize;
  const gridCellSize = cellSize / 2;
  const gridWidth = width * 2;
  const gridHeight = height * 2;

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
          const columns = Math.min(2, sameLocationCharacters.length);
          const rows = Math.ceil(sameLocationCharacters.length / columns);
          const row = Math.floor(locationIndex / columns);
          const column = locationIndex % columns;
          const groupWidth = columns * AVATAR_SIZE + (columns - 1) * AVATAR_COLUMN_GAP;
          const groupHeight = rows * AVATAR_SIZE + (rows - 1) * AVATAR_ROW_GAP;
          const markerCenterX = (loc.x + 0.5) * cellSize;
          const markerCenterY = (loc.y + 0.5) * cellSize;
          const markerSize = Math.round(cellSize * 0.74);
          const canEnterScene = currentLocationId === loc.id && ['classroom', 'library'].includes(loc.id);
          const markerHeight = markerSize + (canEnterScene ? 22 : 0);
          const belowMarker = markerCenterY + markerHeight / 2 + MARKER_GAP;
          const aboveMarker = markerCenterY - markerHeight / 2 - MARKER_GAP - groupHeight;
          const groupTop =
            belowMarker + groupHeight <= mapHeight - MAP_SAFE_INSET
              ? belowMarker
              : aboveMarker >= MAP_SAFE_INSET
                ? aboveMarker
                : clamp(belowMarker, MAP_SAFE_INSET, mapHeight - MAP_SAFE_INSET - groupHeight);
          const groupLeft = clamp(
            markerCenterX - groupWidth / 2,
            MAP_SAFE_INSET,
            mapWidth - MAP_SAFE_INSET - groupWidth,
          );
          const charactersInRow = Math.min(columns, sameLocationCharacters.length - row * columns);
          const rowWidth = charactersInRow * AVATAR_SIZE + (charactersInRow - 1) * AVATAR_COLUMN_GAP;

          return (
            <Character
              key={c.id}
              character={{ ...c, chibi: LEGACY_CHIBI_REPLACEMENTS[c.chibi] ?? c.chibi }}
              x={groupLeft + (groupWidth - rowWidth) / 2 + column * (AVATAR_SIZE + AVATAR_COLUMN_GAP)}
              y={groupTop + row * (AVATAR_SIZE + AVATAR_ROW_GAP)}
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
