import { useGameStore } from '../stores/gameStore';
import { useMapStore } from '../stores/mapStore';
import { usePlayerStore } from '../stores/playerStore';
import { ImageWithPlaceholder } from '../utils/placeholderGenerator';

export default function Player() {
  const currentLocationId = useGameStore(state => state.currentLocationId);
  const { locations, cellSize } = useMapStore();
  const { avatar, name, color } = usePlayerStore();

  const loc = locations[currentLocationId];
  if (!loc) return null;

  const playerCharacter = { name, color, type: '主角' };

  return (
    <div
      className="player-avatar"
      style={{
        position: 'absolute',
        left: loc.x * cellSize + cellSize / 4,
        top: loc.y * cellSize + cellSize / 4,
        width: 64,
        height: 64,
        zIndex: 50,
      }}
    >
      <ImageWithPlaceholder
        src={avatar}
        alt={name}
        character={playerCharacter}
        type="chibi"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
        }}
      />
    </div>
  );
}
