import { useGameStore, PERIODS } from '../stores/gameStore'
import { useMapStore } from '../stores/mapStore'
import { usePlayerStore } from '../stores/playerStore'
import { useCardStore } from '../stores/cardStore'

export default function Controls() {
  const currentLocationId = useGameStore((state) => state.currentLocationId)
  const periodIndex = useGameStore((state) => state.periodIndex)
  const isPlaying = useGameStore((state) => state.isPlaying)
  const nextPeriod = useGameStore((state) => state.nextPeriod)
  const startGame = useGameStore((state) => state.startGame)
  const pauseGame = useGameStore((state) => state.pauseGame)
  const resetGame = useGameStore((state) => state.resetGame)
  const enterScene = useGameStore((state) => state.enterScene)
  const addLog = useGameStore((state) => state.addLog)

  const locations = useMapStore((state) => state.locations)

  const study = usePlayerStore((state) => state.study)
  const exercise = usePlayerStore((state) => state.exercise)
  const practiceArt = usePlayerStore((state) => state.practiceArt)
  const rest = usePlayerStore((state) => state.rest)
  const socialize = usePlayerStore((state) => state.socialize)
  const buySnack = usePlayerStore((state) => state.buySnack)
  const isTired = usePlayerStore((state) => state.isTired)

  const targets = useCardStore((state) => state.targets)
  const addAffection = useCardStore((state) => state.addAffection)
  const activeTargetId = useCardStore((state) => state.activeTargetId)
  const spawnTargetsForPeriod = useCardStore((state) => state.spawnTargetsForPeriod)

  const currentLocation = locations[currentLocationId]
  const hereCharacters = targets.filter(
    (c) => c.currentLocationId === currentLocationId
  )

  const handleAction = (action, label) => {
    if (isTired()) {
      addLog('你太累了，先休息一下吧。')
      return
    }
    action()
    addLog(`你进行了${label}。`)
  }

  const handleTalk = (character) => {
    addAffection(character.id, 5)
    addLog(`你和 ${character.name} 聊了一会儿，好感度上升了！`)
  }

  const handleNextPeriod = () => {
    const nextIndex = (periodIndex + 1) % PERIODS.length
    nextPeriod()
    spawnTargetsForPeriod(PERIODS[nextIndex].key)
  }

  const handleEnterScene = () => {
    enterScene(currentLocationId)
    addLog(`你进入了${currentLocation?.name ?? '当前地点'}。`)
  }

  return (
    <div className="controls">
      <div className="control-group">
        <h3>时间</h3>
        <div className="buttons">
          {!isPlaying ? (
            <button onClick={startGame}>继续</button>
          ) : (
            <button onClick={pauseGame}>暂停</button>
          )}
          <button onClick={handleNextPeriod}>推进时间</button>
          <button onClick={resetGame}>重新开始</button>
        </div>
      </div>

      <div className="control-group">
        <h3>个人行动（{currentLocation?.name}）</h3>
        <div className="buttons grid">
          {currentLocationId === 'classroom' && (
            <button onClick={handleEnterScene}>进入场景</button>
          )}
          <button onClick={() => handleAction(study, '学习')}>📖 学习</button>
          <button onClick={() => handleAction(exercise, '运动')}>🏃 运动</button>
          <button onClick={() => handleAction(practiceArt, '艺术练习')}>
            🎨 艺术
          </button>
          <button onClick={() => handleAction(socialize, '社交')}>💬 社交</button>
          <button onClick={() => handleAction(rest, '休息')}>😴 休息</button>
          <button onClick={() => handleAction(buySnack, '买零食')}>
            🍱 买零食
          </button>
        </div>
      </div>

      {hereCharacters.length > 0 && (
        <div className="control-group">
          <h3>附近角色</h3>
          <div className="character-list">
            {hereCharacters.map((c) => (
              <button
                key={c.id}
                className="character-action"
                onClick={() => handleTalk(c)}
                style={{
                  borderColor: c.color,
                  background: activeTargetId === c.id ? `${c.color}22` : '#fff'
                }}
              >
                <span
                  className="dot"
                  style={{ backgroundColor: c.color }}
                />
                {c.name}（{c.type}）好感 {c.affection}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
