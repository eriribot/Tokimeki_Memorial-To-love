import { useGameStore } from '../stores/gameStore';
import { useMapStore } from '../stores/mapStore';
import { usePlayerStore } from '../stores/playerStore';
import { useCardStore } from '../stores/cardStore';
import { startNewSession } from '../services/gameSession';
import { syncCharacterPresence } from '../services/characterPresence';
import type { GameCharacter, PlayerAction } from '../types';

interface ControlsProps {
  onOpenSkills: () => void;
}

export default function Controls({ onOpenSkills }: ControlsProps) {
  const currentLocationId = useGameStore(state => state.currentLocationId);
  const actionPointsRemaining = useGameStore(state => state.actionPointsRemaining);
  const isPlaying = useGameStore(state => state.isPlaying);
  const settlePlayerAction = useGameStore(state => state.settlePlayerAction);
  const startGame = useGameStore(state => state.startGame);
  const pauseGame = useGameStore(state => state.pauseGame);
  const enterScene = useGameStore(state => state.enterScene);
  const addLog = useGameStore(state => state.addLog);

  const locations = useMapStore(state => state.locations);

  const study = usePlayerStore(state => state.study);
  const exercise = usePlayerStore(state => state.exercise);
  const practiceArt = usePlayerStore(state => state.practiceArt);
  const rest = usePlayerStore(state => state.rest);
  const socialize = usePlayerStore(state => state.socialize);
  const buySnack = usePlayerStore(state => state.buySnack);
  const isTired = usePlayerStore(state => state.isTired);

  const targets = useCardStore(state => state.targets);
  const addAffection = useCardStore(state => state.addAffection);
  const activeTargetId = useCardStore(state => state.activeTargetId);

  const currentLocation = locations[currentLocationId];
  const hereCharacters = targets.filter(c => c.currentLocationId === currentLocationId);

  const handleAction = (action: PlayerAction, label: string) => {
    if (actionPointsRemaining <= 0) {
      addLog('今天的行动点已经用完了。');
      return;
    }
    if (isTired()) {
      addLog('你太累了，先休息一下吧。');
      return;
    }
    const settlement = settlePlayerAction({ kind: 'activity', message: `你进行了${label}。` });
    if (!settlement.accepted) return;
    action();
    syncCharacterPresence();
  };

  const handleTalk = (character: GameCharacter) => {
    if (actionPointsRemaining <= 0) {
      addLog('今天的行动点已经用完了。');
      return;
    }
    const settlement = settlePlayerAction({
      kind: 'talk',
      message: `你和 ${character.name} 聊了一会儿，好感度上升了！`,
    });
    if (!settlement.accepted) return;
    addAffection(character.id, 5);
    syncCharacterPresence();
  };

  const handleEnterScene = () => {
    enterScene(currentLocationId);
    addLog(`你进入了${currentLocation?.name ?? '当前地点'}。`);
  };

  const handleRestart = () => {
    if (window.confirm('确定要重新开始吗？当前进度将被重置。')) {
      startNewSession();
    }
  };

  return (
    <div className="controls">
      <div className="control-group">
        <h3>系统</h3>
        <div className="buttons">
          {!isPlaying ? <button onClick={startGame}>继续</button> : <button onClick={pauseGame}>暂停</button>}
          <button onClick={handleRestart}>重新开始</button>
        </div>
      </div>

      <div className="control-group">
        <h3>
          个人行动（{currentLocation?.name}） · 行动点 {actionPointsRemaining}/2
        </h3>
        <div className="buttons grid">
          <button onClick={onOpenSkills}>✨ 特技</button>
          {currentLocationId === 'classroom' && <button onClick={handleEnterScene}>进入场景</button>}
          <button disabled={actionPointsRemaining <= 0} onClick={() => handleAction(study, '学习')}>
            📖 学习 <span className="action-cost">−1</span>
          </button>
          <button disabled={actionPointsRemaining <= 0} onClick={() => handleAction(exercise, '运动')}>
            🏃 运动 <span className="action-cost">−1</span>
          </button>
          <button disabled={actionPointsRemaining <= 0} onClick={() => handleAction(practiceArt, '艺术练习')}>
            🎨 艺术 <span className="action-cost">−1</span>
          </button>
          <button disabled={actionPointsRemaining <= 0} onClick={() => handleAction(socialize, '社交')}>
            💬 社交 <span className="action-cost">−1</span>
          </button>
          <button disabled={actionPointsRemaining <= 0} onClick={() => handleAction(rest, '休息')}>
            😴 休息 <span className="action-cost">−1</span>
          </button>
          <button disabled={actionPointsRemaining <= 0} onClick={() => handleAction(buySnack, '买零食')}>
            🍱 买零食 <span className="action-cost">−1</span>
          </button>
        </div>
      </div>

      {hereCharacters.length > 0 && (
        <div className="control-group">
          <h3>附近角色</h3>
          <div className="character-list">
            {hereCharacters.map(c => (
              <button
                key={c.id}
                className="character-action"
                disabled={actionPointsRemaining <= 0}
                onClick={() => handleTalk(c)}
                style={{
                  borderColor: c.color,
                  background: activeTargetId === c.id ? `${c.color}22` : '#fff',
                }}
              >
                <span className="dot" style={{ backgroundColor: c.color }} />
                {c.name}（{c.type}）好感 {c.affection}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
