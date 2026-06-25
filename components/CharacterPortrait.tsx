import { useGameStore } from '../stores/gameStore'
import { useCardStore } from '../stores/cardStore'
import CharacterCard from './CharacterCard'

export default function CharacterPortrait() {
  const currentLocationId = useGameStore((state) => state.currentLocationId)
  const targets = useCardStore((state) => state.targets)
  const activeTargetId = useCardStore((state) => state.activeTargetId)
  const setActiveTarget = useCardStore((state) => state.setActiveTarget)

  const hereCharacters = targets.filter(
    (c) => c.currentLocationId === currentLocationId
  )

  if (hereCharacters.length === 0) {
    return (
      <div className="character-portrait empty">
        <div className="portrait-frame">
          <span>?</span>
        </div>
        <p>这里似乎没有人在。</p>
      </div>
    )
  }

  if (hereCharacters.length === 1) {
    const character = hereCharacters[0]
    return (
      <div className="character-portrait single">
        <CharacterCard
          character={character}
          isActive={true}
          onClick={() => setActiveTarget(character.id)}
        />
      </div>
    )
  }

  return (
    <div className="character-portrait multiple">
      <h3 className="carousel-title">这里有 {hereCharacters.length} 个人</h3>
      <div className="character-carousel">
        {hereCharacters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            isActive={activeTargetId === character.id}
            onClick={() => setActiveTarget(character.id)}
          />
        ))}
      </div>
      <div className="carousel-hint">
        点击角色卡片切换交互对象
      </div>
    </div>
  )
}
