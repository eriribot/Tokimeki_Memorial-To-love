import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useCardStore } from '../stores/cardStore'
import { resolveAssetPath } from '../utils/assetPath'
import { ImageWithPlaceholder } from '../utils/placeholderGenerator'

export default function ClassroomScene() {
  const exitScene = useGameStore((state) => state.exitScene)
  const addLog = useGameStore((state) => state.addLog)
  const targets = useCardStore((state) => state.targets)
  const activeTargetId = useCardStore((state) => state.activeTargetId)
  const setActiveTarget = useCardStore((state) => state.setActiveTarget)
  const addAffection = useCardStore((state) => state.addAffection)

  const sceneCharacters = targets.filter(
    (character) => character.currentLocationId === 'classroom'
  )
  const activeCharacter =
    sceneCharacters.find((character) => character.id === activeTargetId) ??
    sceneCharacters[0]

  useEffect(() => {
    if (activeCharacter && activeTargetId !== activeCharacter.id) {
      setActiveTarget(activeCharacter.id)
    }
  }, [activeCharacter, activeTargetId, setActiveTarget])

  const talkToActiveCharacter = () => {
    if (!activeCharacter) return

    addAffection(activeCharacter.id, 5)
    addLog(`你在教室里和 ${activeCharacter.name} 交谈，好感度上升了。`)
  }

  return (
    <div className="classroom-scene">
      <img
        className="classroom-scene-bg"
        src={resolveAssetPath('/artsource/backgrounds/classroom.jpg')}
        alt="教室"
      />

      <div className="scene-topbar">
        <div>
          <span className="scene-location-name">教室</span>
          <span className="scene-location-count">
            {sceneCharacters.length > 0
              ? `这里有 ${sceneCharacters.length} 个人`
              : '这里暂时没有人在'}
          </span>
        </div>
        <button type="button" onClick={exitScene}>
          返回学校地图
        </button>
      </div>

      <div
        className="scene-characters"
        style={{
          gridTemplateColumns: `repeat(${Math.max(sceneCharacters.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {sceneCharacters.map((character) => (
          <button
            key={character.id}
            type="button"
            className={`scene-character ${activeCharacter?.id === character.id ? 'active' : ''}`}
            onClick={() => setActiveTarget(character.id)}
          >
            <ImageWithPlaceholder
              src={character.portrait}
              alt={character.name}
              character={character}
              type="portrait"
              className="scene-character-img"
            />
            <span style={{ borderColor: character.color }}>
              {character.name}
            </span>
          </button>
        ))}
      </div>

      <div className="scene-dialogue">
        <div className="scene-speaker">
          {activeCharacter?.name ?? '教室'}
        </div>
        <p>
          {activeCharacter?.greeting ??
            '课桌整齐地排着，窗外的光落在黑板边缘。'}
        </p>
        {activeCharacter && (
          <button type="button" onClick={talkToActiveCharacter}>
            交谈
          </button>
        )}
      </div>
    </div>
  )
}
