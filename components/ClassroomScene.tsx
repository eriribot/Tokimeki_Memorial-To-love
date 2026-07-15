import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useMapStore } from '../stores/mapStore';
import { useCardStore } from '../stores/cardStore';
import { resolveAssetPath } from '../utils/assetPath';
import { ImageWithPlaceholder } from '../utils/placeholderGenerator';

export default function ClassroomScene() {
  const exitScene = useGameStore(state => state.exitScene);
  const currentSceneId = useGameStore(state => state.currentSceneId);
  const locations = useMapStore(state => state.locations);
  const addLog = useGameStore(state => state.addLog);
  const targets = useCardStore(state => state.targets);
  const activeTargetId = useCardStore(state => state.activeTargetId);
  const setActiveTarget = useCardStore(state => state.setActiveTarget);
  const addAffection = useCardStore(state => state.addAffection);

  const sceneLocationId = currentSceneId || 'classroom';
  const sceneLocation = locations[sceneLocationId];
  // ponytail: 同一个场景组件，只按地点换背景。
  const sceneBackground =
    sceneLocationId === 'library' ? '/artsource/backgrounds/library.png' : '/artsource/backgrounds/classroom.jpg';
  const sceneCharacters = targets.filter(character => character.currentLocationId === sceneLocationId);
  const activeCharacter = sceneCharacters.find(character => character.id === activeTargetId) ?? sceneCharacters[0];
  const stageCharacters = sceneCharacters.filter(character => character.tachie);

  useEffect(() => {
    if (activeCharacter && activeTargetId !== activeCharacter.id) {
      setActiveTarget(activeCharacter.id);
    }
  }, [activeCharacter, activeTargetId, setActiveTarget]);

  const talkToActiveCharacter = () => {
    if (!activeCharacter) return;

    addAffection(activeCharacter.id, 5);
    addLog(`你在${sceneLocation?.name ?? '教室'}里和 ${activeCharacter.name} 交谈，好感度上升了。`);
  };

  return (
    <div className="classroom-scene">
      <img className="classroom-scene-bg" src={resolveAssetPath(sceneBackground)} alt={sceneLocation?.name ?? '教室'} />

      <div className="scene-topbar">
        <div>
          <span className="scene-location-name">{sceneLocation?.name ?? '教室'}</span>
          <span className="scene-location-count">
            {sceneCharacters.length > 0 ? `这里有 ${sceneCharacters.length} 个人` : '这里暂时没有人在'}
          </span>
        </div>
        <button type="button" onClick={exitScene}>
          返回学校地图
        </button>
      </div>

      <div
        className={`scene-characters count-${Math.min(stageCharacters.length, 4)}`}
        style={{
          gridTemplateColumns: `repeat(${Math.max(stageCharacters.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {stageCharacters.map(character => (
          <button
            key={character.id}
            type="button"
            className={`scene-character ${activeCharacter?.id === character.id ? 'active' : ''}`}
            onClick={() => setActiveTarget(character.id)}
          >
            <ImageWithPlaceholder
              src={character.tachie || character.portrait}
              alt={character.name}
              character={character}
              type={character.tachie ? 'tachie' : 'portrait'}
              className={`scene-character-img ${character.tachie ? 'tachie' : 'portrait'}`}
            />
            <span style={{ borderColor: character.color }}>{character.name}</span>
          </button>
        ))}
      </div>

      <div className="scene-dialogue">
        <div className="scene-speaker">{activeCharacter?.name ?? '教室'}</div>
        <p>{activeCharacter?.greeting ?? `${sceneLocation?.name ?? '教室'}里很安静，适合停下来看看。`}</p>
        {activeCharacter && (
          <button type="button" onClick={talkToActiveCharacter}>
            交谈
          </button>
        )}
      </div>
    </div>
  );
}
