import { useGameStore } from '../stores/gameStore';
import { useMapStore } from '../stores/mapStore';
import { PLAYER_RESOURCE_MAX, resolveTokimekiRadarAttributes, usePlayerStore } from '../stores/playerStore';
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

  const intelligence = usePlayerStore(state => state.intelligence);
  const athletics = usePlayerStore(state => state.athletics);
  const art = usePlayerStore(state => state.art);
  const charm = usePlayerStore(state => state.charm);
  const stamina = usePlayerStore(state => state.stamina);
  const stress = usePlayerStore(state => state.stress);
  const study = usePlayerStore(state => state.study);
  const exercise = usePlayerStore(state => state.exercise);
  const practiceArt = usePlayerStore(state => state.practiceArt);
  const rest = usePlayerStore(state => state.rest);
  const socialize = usePlayerStore(state => state.socialize);
  const buySnack = usePlayerStore(state => state.buySnack);
  const targets = useCardStore(state => state.targets);
  const addAffection = useCardStore(state => state.addAffection);
  const activeTargetId = useCardStore(state => state.activeTargetId);

  const currentLocation = locations[currentLocationId];
  const hereCharacters = targets.filter(c => c.currentLocationId === currentLocationId);
  const attributes = resolveTokimekiRadarAttributes({ intelligence, athletics, art, charm });
  const requiresRest = stamina <= 0 || stress >= PLAYER_RESOURCE_MAX;

  const handleAction = (action: PlayerAction, label: string, isRest = false) => {
    if (actionPointsRemaining <= 0) {
      addLog('今天的行动点已经用完了。');
      return;
    }
    if (requiresRest && !isRest) {
      addLog(stamina <= 0 ? '你太累了，现在只能休息。' : '压力已经到达上限，现在只能休息。');
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
    if (requiresRest) {
      addLog(stamina <= 0 ? '你太累了，现在只能休息。' : '压力已经到达上限，现在只能休息。');
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
      <div className="control-group system-control-group">
        <div className="system-control-heading">
          <h3>系统</h3>
          <dl className="control-resource-labels" aria-label="玩家资源数值">
            <div>
              <dt>
                <svg
                  className="control-resource-icon is-stamina"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.22 1.44 3.9 3 5.5l7 7Z" />
                  <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
                </svg>
                体力：
              </dt>
              <dd>{stamina}</dd>
            </div>
            <div>
              <dt>
                <svg
                  className="control-resource-icon is-stress"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m12 14 4-4" />
                  <path d="M3.34 19a10 10 0 1 1 17.32 0" />
                </svg>
                压力：
              </dt>
              <dd>{stress}</dd>
            </div>
          </dl>
        </div>
        <div className="system-control-main">
          <div className="buttons">
            {!isPlaying ? <button onClick={startGame}>继续</button> : <button onClick={pauseGame}>暂停</button>}
            <button onClick={handleRestart}>重新开始</button>
          </div>
        </div>
        <dl className="control-attribute-list" aria-label="玩家六维数值">
          <div>
            <dt>文系：</dt>
            <dd>{attributes.humanities}</dd>
          </div>
          <div>
            <dt>理系：</dt>
            <dd>{attributes.science}</dd>
          </div>
          <div>
            <dt>艺术：</dt>
            <dd>{attributes.art}</dd>
          </div>
          <div>
            <dt>运动：</dt>
            <dd>{attributes.athletics}</dd>
          </div>
          <div>
            <dt>容姿：</dt>
            <dd>{attributes.appearance}</dd>
          </div>
          <div>
            <dt>根性：</dt>
            <dd>{attributes.perseverance}</dd>
          </div>
        </dl>
      </div>

      <div className="control-group">
        <h3>
          个人行动（{currentLocation?.name}） · 行动点 {actionPointsRemaining}/2
        </h3>
        <div className="buttons grid">
          <button onClick={onOpenSkills}>✨ 特技</button>
          {currentLocationId === 'classroom' && <button onClick={handleEnterScene}>进入场景</button>}
          <button disabled={actionPointsRemaining <= 0 || requiresRest} onClick={() => handleAction(study, '学习')}>
            📖 学习 <span className="action-cost">−1</span>
          </button>
          <button disabled={actionPointsRemaining <= 0 || requiresRest} onClick={() => handleAction(exercise, '运动')}>
            🏃 运动 <span className="action-cost">−1</span>
          </button>
          <button
            disabled={actionPointsRemaining <= 0 || requiresRest}
            onClick={() => handleAction(practiceArt, '艺术练习')}
          >
            🎨 艺术 <span className="action-cost">−1</span>
          </button>
          <button disabled={actionPointsRemaining <= 0 || requiresRest} onClick={() => handleAction(socialize, '社交')}>
            💬 社交 <span className="action-cost">−1</span>
          </button>
          <button disabled={actionPointsRemaining <= 0} onClick={() => handleAction(rest, '休息', true)}>
            😴 休息 <span className="action-cost">−1</span>
          </button>
          <button disabled={actionPointsRemaining <= 0 || requiresRest} onClick={() => handleAction(buySnack, '买零食')}>
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
                disabled={actionPointsRemaining <= 0 || requiresRest}
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
