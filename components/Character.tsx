import { ImageWithPlaceholder } from '../utils/placeholderGenerator';
import type { GameCharacter } from '../types';

const AVATAR_SIZE = 76;

interface CharacterProps {
  character: GameCharacter;
  x: number;
  y: number;
  onInteract?: (character: GameCharacter) => void;
}

export default function Character({ character, x, y, onInteract }: CharacterProps) {
  return (
    <button
      type="button"
      className="character-avatar"
      title={`${character.name}（${character.type}）`}
      aria-label={`与${character.name}互动`}
      onClick={() => onInteract?.(character)}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        zIndex: 50,
        minHeight: 0,
        padding: 0,
        border: 0,
        background: 'transparent',
        boxShadow: 'none',
        cursor: onInteract ? 'pointer' : 'default',
      }}
    >
      <ImageWithPlaceholder
        src={character.chibi}
        alt={character.name}
        character={character}
        type="chibi"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.25))',
        }}
      />
    </button>
  );
}
