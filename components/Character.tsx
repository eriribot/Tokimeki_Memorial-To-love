import { ImageWithPlaceholder } from '../utils/placeholderGenerator';
import type { GameCharacter } from '../types';

const AVATAR_SIZE = 76;

interface CharacterProps {
  character: GameCharacter;
  x: number;
  y: number;
}

export default function Character({ character, x, y }: CharacterProps) {
  return (
    <div
      className="character-avatar"
      title={`${character.name}（${character.type}）`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        zIndex: 50,
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
    </div>
  );
}
