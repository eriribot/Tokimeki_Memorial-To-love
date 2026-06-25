import { ImageWithPlaceholder } from '../utils/placeholderGenerator'

export default function CharacterCard({ character, isActive, onClick }) {
  if (!character) return null

  return (
    <div
      className={`character-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="character-card-portrait">
        <ImageWithPlaceholder
          src={character.portrait}
          alt={character.name}
          character={character}
          type="portrait"
          className="portrait-img"
        />
      </div>

      <div className="character-card-info">
        <h3 className="character-card-name">{character.name}</h3>
        <span className="character-card-type" style={{ color: character.color }}>
          {character.type}
        </span>

        {/* 好感度心形显示 */}
        <div className="affection-hearts">
          {[...Array(5)].map((_, i) => {
            const heartValue = (i + 1) * 20
            const isFilled = character.affection >= heartValue
            const isPartial = character.affection >= heartValue - 10 && character.affection < heartValue

            return (
              <svg
                key={i}
                className={`heart-icon ${isFilled ? 'filled' : ''} ${isPartial ? 'partial' : ''}`}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill={isFilled ? character.color : 'none'}
                  stroke={character.color}
                  strokeWidth="2"
                  opacity={isFilled ? 1 : (isPartial ? 0.5 : 0.3)}
                />
              </svg>
            )
          })}
        </div>

        {/* 好感度数值 */}
        <div className="affection-value">
          好感度 <span style={{ color: character.color, fontWeight: 'bold' }}>{character.affection}</span>
        </div>

        {/* 问候语 */}
        {isActive && (
          <p className="character-greeting">"{character.greeting}"</p>
        )}
      </div>
    </div>
  )
}
