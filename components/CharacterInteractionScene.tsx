import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { getSpeakerNameplateAsset } from '../GalMainStory/characters';
import { GALBOX_ASSETS } from '../GalMainStory/galAssets';
import GalStoryPage from '../GalMainStory/GalStoryPage';
import {
  createCharacterInteractionSeed,
  hashCharacterInteractionText,
  interpolateCharacterInteractionSequence,
  resolveCharacterInteractionProfile,
  selectStableTalkTopics,
  type CharacterInteractionActionId,
  type CharacterInteractionBeat,
  type CharacterInteractionSequence,
  type CharacterTalkTopic,
} from '../data/characterInteractionProfiles';
import { getLocationSceneBackground } from '../data/locationSceneBackgrounds';
import {
  executeCharacterInteraction,
  getCharacterInteractionGate,
  type PaidCharacterInteractionId,
} from '../services/characterInteractionRuntime';
import { normalizeCharacterRelationshipStats } from '../services/characterRelationship';
import { useCardStore } from '../stores/cardStore';
import { MAX_DAILY_ACTION_POINTS, PERIODS, useGameStore } from '../stores/gameStore';
import { useMapStore } from '../stores/mapStore';
import { PLAYER_RESOURCE_MAX, usePlayerStore } from '../stores/playerStore';
import type { GameCharacter } from '../types';
import { resolveAssetPath } from '../utils/assetPath';
import { ImageWithPlaceholder } from '../utils/placeholderGenerator';
import './CharacterInteractionScene.css';

export type CharacterInteractionSceneMode = 'menu' | 'topics' | 'message';

interface ActiveInteractionSequence {
  actionId: CharacterInteractionActionId;
  sequence: CharacterInteractionSequence;
  topicId: string | null;
  paid: boolean;
}

const ACTION_TITLES: Readonly<Record<CharacterInteractionActionId, string>> = {
  talk: '聊一聊',
  observe: '观察',
  together: '一起行动',
  closer: '拉近距离',
};

export function getCharacterInteractionModeClass(mode: CharacterInteractionSceneMode): string {
  return `is-${mode}-mode`;
}

function getSequencePool(
  profile: ReturnType<typeof resolveCharacterInteractionProfile>,
  actionId: Exclude<CharacterInteractionActionId, 'talk'>,
): readonly CharacterInteractionSequence[] {
  if (actionId === 'observe') return profile.observeSequences;
  if (actionId === 'together') return profile.togetherSequences;
  return profile.closerSequences;
}

function selectStableSequence(
  profile: ReturnType<typeof resolveCharacterInteractionProfile>,
  actionId: Exclude<CharacterInteractionActionId, 'talk'>,
  context: {
    date: { year: number; month: number; day: number };
    phase: string;
    locationId: string;
    characterId: string;
  },
): CharacterInteractionSequence {
  const pool = getSequencePool(profile, actionId);
  const seed = createCharacterInteractionSeed({
    ...context,
    action: actionId,
    version: profile.version,
  });
  const selected = pool[hashCharacterInteractionText(seed) % pool.length];
  if (!selected) throw new Error(`角色互动包缺少 ${actionId} 事件。`);
  return selected;
}

function getPaidResourceReason(actionPointsRemaining: number, stamina: number, stress: number): string | null {
  if (actionPointsRemaining <= 0) return '今天的行动点已经用完了';
  if (stamina <= 0) return '体力耗尽，现在只能休息';
  if (stress >= PLAYER_RESOURCE_MAX) return '压力已满，现在只能休息';
  return null;
}

function resolveBeatSpeaker(
  beat: CharacterInteractionBeat | null,
  playerName: string,
  characterName: string,
): string | null {
  if (!beat || beat.speaker === 'narrator') return null;
  return beat.speaker === 'user' ? playerName : characterName;
}

function getFallbackSource(character: GameCharacter) {
  return {
    greeting: character.greeting,
    alternateGreetings: character._cardData.data.alternate_greetings,
  };
}

function getSpeakerUi(speaker: string | null): 'narration' | 'galbox-nameplate' | 'generic-nameplate' {
  if (speaker === null) return 'narration';
  return getSpeakerNameplateAsset(speaker) ? 'galbox-nameplate' : 'generic-nameplate';
}

export default function CharacterInteractionScene() {
  const currentSceneId = useGameStore(state => state.currentSceneId);
  const currentLocationId = useGameStore(state => state.currentLocationId);
  const actionPointsRemaining = useGameStore(state => state.actionPointsRemaining);
  const periodIndex = useGameStore(state => state.periodIndex);
  const date = useGameStore(state => state.date);
  const exitScene = useGameStore(state => state.exitScene);
  const locations = useMapStore(state => state.locations);
  const targets = useCardStore(state => state.targets);
  const activeTargetId = useCardStore(state => state.activeTargetId);
  const setActiveTarget = useCardStore(state => state.setActiveTarget);
  const playerName = usePlayerStore(state => state.name);
  const stamina = usePlayerStore(state => state.stamina);
  const stress = usePlayerStore(state => state.stress);

  const [mode, setMode] = useState<CharacterInteractionSceneMode>('menu');
  const [activeSequence, setActiveSequence] = useState<ActiveInteractionSequence | null>(null);
  const [beatIndex, setBeatIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const isSettlingRef = useRef(false);
  const sceneRootRef = useRef<HTMLElement | null>(null);
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);

  const sceneLocationId = currentSceneId ?? currentLocationId;
  const sceneLocation = locations[sceneLocationId];
  const period = PERIODS[periodIndex] ?? PERIODS[0];
  const sceneCharacters = useMemo(
    () => targets.filter(character => character.currentLocationId === sceneLocationId).slice(0, 4),
    [sceneLocationId, targets],
  );
  const activeCharacter =
    sceneCharacters.find(character => character.id === activeTargetId) ?? sceneCharacters[0] ?? null;
  const activeRelationship = activeCharacter ? normalizeCharacterRelationshipStats(activeCharacter) : null;
  const background = getLocationSceneBackground(sceneLocationId, period.key);
  const backgroundAlt = `${sceneLocation?.name ?? '地点'}背景${background.visualNote ? `，${background.visualNote}` : ''}`;

  useEffect(() => {
    if (activeCharacter && activeTargetId !== activeCharacter.id) setActiveTarget(activeCharacter.id);
  }, [activeCharacter, activeTargetId, setActiveTarget]);

  useEffect(() => {
    setMode('menu');
    setActiveSequence(null);
    setBeatIndex(0);
    setNotice(null);
    isSettlingRef.current = false;
  }, [activeCharacter?.id, sceneLocationId]);

  useEffect(() => {
    const frame = globalThis.requestAnimationFrame(() => {
      if (mode === 'message') continueButtonRef.current?.focus();
      else if (mode === 'menu') sceneRootRef.current?.focus();
    });
    return () => globalThis.cancelAnimationFrame(frame);
  }, [beatIndex, mode, notice]);

  const profile = useMemo(
    () =>
      activeCharacter
        ? resolveCharacterInteractionProfile(activeCharacter.id, getFallbackSource(activeCharacter))
        : null,
    [activeCharacter],
  );
  const interpolationValues = useMemo(
    () => ({
      user: playerName,
      char: activeCharacter?.name ?? '对方',
      location: sceneLocation?.name ?? '这里',
    }),
    [activeCharacter?.name, playerName, sceneLocation?.name],
  );
  const seedContext = useMemo(
    () => ({
      date,
      phase: period.key,
      locationId: sceneLocationId,
      characterId: activeCharacter?.id ?? 'none',
    }),
    [activeCharacter?.id, date, period.key, sceneLocationId],
  );
  const talkTopics = useMemo((): CharacterTalkTopic[] => {
    if (!profile || !activeCharacter) return [];
    return selectStableTalkTopics(profile, seedContext, 3).map(topic =>
      interpolateCharacterInteractionSequence(topic, interpolationValues),
    );
  }, [activeCharacter, interpolationValues, profile, seedContext]);

  const paidResourceReason = getPaidResourceReason(actionPointsRemaining, stamina, stress);
  const togetherGate = activeRelationship ? getCharacterInteractionGate(activeRelationship, 'together') : null;
  const closerGate = activeRelationship ? getCharacterInteractionGate(activeRelationship, 'closer') : null;
  const currentBeat = activeSequence?.sequence.beats[beatIndex] ?? null;
  const isFinalBeat = Boolean(activeSequence && beatIndex >= activeSequence.sequence.beats.length - 1);
  const storySpeaker = notice
    ? '系统提示'
    : resolveBeatSpeaker(currentBeat, playerName, activeCharacter?.name ?? '对方');
  const storyText = notice ?? currentBeat?.text ?? '';

  const beginSequence = (
    actionId: CharacterInteractionActionId,
    sequence: CharacterInteractionSequence,
    topicId: string | null = null,
  ) => {
    if (!activeCharacter) return;
    setNotice(null);
    setActiveSequence({
      actionId,
      sequence: interpolateCharacterInteractionSequence(sequence, interpolationValues),
      topicId,
      paid: actionId !== 'observe',
    });
    setBeatIndex(0);
    setMode('message');
  };

  const beginStableAction = (actionId: Exclude<CharacterInteractionActionId, 'talk'>) => {
    if (!profile || !activeCharacter) return;
    beginSequence(actionId, selectStableSequence(profile, actionId, seedContext));
  };

  const handleTopicSelect = (topicId: string) => {
    const topic = talkTopics.find(candidate => candidate.id === topicId);
    if (topic) beginSequence('talk', topic, topic.id);
  };

  const handleDialogueContinue = () => {
    if (notice) {
      setNotice(null);
      setMode('menu');
      setActiveSequence(null);
      setBeatIndex(0);
      return;
    }
    if (!activeSequence) return;
    if (!isFinalBeat) {
      setBeatIndex(index => index + 1);
      return;
    }
    if (!activeSequence.paid) {
      setMode('menu');
      setActiveSequence(null);
      setBeatIndex(0);
      return;
    }
    if (!activeCharacter || isSettlingRef.current) return;

    isSettlingRef.current = true;
    const result = executeCharacterInteraction({
      actionId: activeSequence.actionId as PaidCharacterInteractionId,
      targetId: activeCharacter.id,
      locationId: sceneLocationId,
    });
    if (!result.ok) {
      isSettlingRef.current = false;
      setNotice(result.reason);
    }
  };

  const portraitStage: ReactNode = activeCharacter ? (
    <div className="character-interaction-scene__portrait-stage" aria-hidden="true">
      <div key={activeCharacter.id} className="character-interaction-scene__portrait">
        <ImageWithPlaceholder
          className="character-interaction-scene__portrait-image"
          src={activeCharacter.tachie ?? activeCharacter.portrait}
          alt=""
          character={activeCharacter}
          type={activeCharacter.tachie ? 'tachie' : 'portrait'}
        />
      </div>
    </div>
  ) : null;

  const rootStyle = {
    '--character-color': activeCharacter?.color ?? '#e0568d',
  } as CSSProperties;
  const storyControls =
    mode === 'topics' ? (
      <nav
        className="gal-main-story__controls character-interaction-scene__story-controls is-topics"
        aria-label="话题选择控制"
        onClick={event => event.stopPropagation()}
      >
        <button
          type="button"
          className="gal-main-story__icon-button"
          aria-label="返回互动行动"
          title="返回互动行动"
          onClick={() => setMode('menu')}
        >
          ←
        </button>
        <span className="gal-main-story__progress">三个话题</span>
        <span className="character-interaction-scene__gal-cost">1 AP</span>
      </nav>
    ) : (
      <nav
        className="gal-main-story__controls character-interaction-scene__story-controls"
        aria-label="互动正文翻页"
        onClick={event => event.stopPropagation()}
      >
        <button
          type="button"
          className="gal-main-story__icon-button"
          disabled={Boolean(notice) || beatIndex <= 0}
          aria-label="上一句"
          title="上一句"
          onClick={() => setBeatIndex(index => Math.max(0, index - 1))}
        >
          ←
        </button>
        <span className="gal-main-story__progress">
          {notice ? '结算提示' : `${beatIndex + 1} / ${activeSequence?.sequence.beats.length ?? 0}`}
        </span>
        <span className="character-interaction-scene__gal-cost">
          {notice ? '尚未结算' : activeSequence?.paid ? '完成时 1 AP' : '0 AP'}
        </span>
        <button
          ref={continueButtonRef}
          type="button"
          className="gal-main-story__icon-button is-primary"
          aria-label={
            notice
              ? '返回互动行动'
              : isFinalBeat && activeSequence?.paid
                ? '完成互动并消耗 1 AP'
                : isFinalBeat
                  ? '结束观察并返回互动行动'
                  : '下一句'
          }
          title={isFinalBeat && activeSequence?.paid ? '完成互动 · 消耗 1 AP' : '下一句'}
          onClick={handleDialogueContinue}
        >
          {notice ? '↩' : isFinalBeat ? '✓' : '→'}
        </button>
      </nav>
    );

  return (
    <section
      ref={sceneRootRef}
      tabIndex={-1}
      className={`character-interaction-scene ${getCharacterInteractionModeClass(mode)}`}
      style={rootStyle}
      data-character-interaction="true"
      data-mode={mode}
      data-target-id={activeCharacter?.id ?? 'none'}
      data-action-id={activeSequence?.actionId ?? 'none'}
      data-topic-id={activeSequence?.topicId ?? 'none'}
      data-beat-index={mode === 'message' ? beatIndex : -1}
      data-dialogue-renderer={mode === 'message' ? 'gal-story-page' : 'none'}
      aria-label={`${sceneLocation?.name ?? '场景'}人物互动`}
    >
      {mode === 'menu' ? (
        <>
          <img
            className="character-interaction-scene__background"
            src={resolveAssetPath(background.asset)}
            alt={backgroundAlt}
          />
          <div className="character-interaction-scene__menu-shade" aria-hidden="true" />
          <div className="gal-main-story__act-label is-pink character-interaction-scene__act-label">
            <img src={resolveAssetPath(GALBOX_ASSETS.headings.pink)} alt="" aria-hidden="true" />
            <span>{sceneLocation?.name ?? '人物互动'}</span>
          </div>
          <nav
            className="character-interaction-scene__stage-controls"
            data-hud-layout="independent-flex"
            aria-label="人物互动状态"
            onClick={event => event.stopPropagation()}
          >
            <span className="character-interaction-scene__hud-pill is-relationship">
              友情 {activeRelationship?.friendship ?? 0} · 恋爱 {activeRelationship?.romance ?? 0}
            </span>
            <span className="character-interaction-scene__hud-pill is-ap">
              {period.label} · AP {actionPointsRemaining}/{MAX_DAILY_ACTION_POINTS}
            </span>
            <button
              type="button"
              className="gal-main-story__icon-button"
              aria-label="返回地图"
              title="返回地图"
              onClick={exitScene}
            >
              ↩
            </button>
          </nav>

          {sceneCharacters.length > 1 && (
            <nav className="character-interaction-scene__switcher" aria-label="切换同地点人物">
              {sceneCharacters.map(character => (
                <button
                  key={character.id}
                  type="button"
                  className={`character-interaction-scene__chip ${character.id === activeCharacter?.id ? 'is-active' : ''}`}
                  aria-pressed={character.id === activeCharacter?.id}
                  onClick={() => setActiveTarget(character.id)}
                >
                  <ImageWithPlaceholder
                    className="character-interaction-scene__chip-image"
                    src={character.chibi}
                    alt=""
                    character={character}
                    type="chibi"
                  />
                  <span className="character-interaction-scene__chip-name">{character.name}</span>
                </button>
              ))}
            </nav>
          )}

          {portraitStage}

          <div className="character-interaction-scene__menu" aria-label="人物互动行动">
            <button
              type="button"
              className={`character-interaction-scene__action is-primary ${paidResourceReason ? 'is-locked' : ''}`}
              disabled={!activeCharacter || Boolean(paidResourceReason)}
              title={paidResourceReason ?? '从三个本地手写话题中选择一个'}
              onClick={() => {
                setNotice(null);
                setMode('topics');
              }}
            >
              <span className="character-interaction-scene__action-icon" aria-hidden="true">
                💬
              </span>
              <span className="character-interaction-scene__action-copy">
                <strong>聊一聊</strong>
                <small>{paidResourceReason ?? '1 AP · 三个话题中选择一个'}</small>
              </span>
            </button>

            <button type="button" className="character-interaction-scene__action is-locked" disabled>
              <span className="character-interaction-scene__action-icon" aria-hidden="true">
                🎁
              </span>
              <span className="character-interaction-scene__action-copy">
                <strong>送礼</strong>
                <small>礼物系统尚未接入</small>
              </span>
            </button>

            <button
              type="button"
              className={`character-interaction-scene__action is-special ${
                paidResourceReason || !togetherGate?.available ? 'is-locked' : ''
              }`}
              disabled={!activeCharacter || Boolean(paidResourceReason) || !togetherGate?.available}
              title={paidResourceReason ?? togetherGate?.reason ?? '一起完成一段较长互动'}
              onClick={() => beginStableAction('together')}
            >
              <span className="character-interaction-scene__action-icon" aria-hidden="true">
                ✨
              </span>
              <span className="character-interaction-scene__action-copy">
                <strong>一起行动</strong>
                <small>
                  {paidResourceReason ??
                    (togetherGate?.available ? '1 AP · 友情事件' : (togetherGate?.reason ?? '需要人物'))}
                </small>
              </span>
            </button>

            <button
              type="button"
              className="character-interaction-scene__action is-secondary"
              disabled={!activeCharacter}
              title="不消耗 AP，也不会提升关系"
              onClick={() => beginStableAction('observe')}
            >
              <span className="character-interaction-scene__action-icon" aria-hidden="true">
                👀
              </span>
              <span className="character-interaction-scene__action-copy">
                <strong>观察</strong>
                <small>0 AP · 不提升关系</small>
              </span>
            </button>

            <button
              type="button"
              className={`character-interaction-scene__action is-primary ${
                paidResourceReason || !closerGate?.available ? 'is-locked' : ''
              }`}
              disabled={!activeCharacter || Boolean(paidResourceReason) || !closerGate?.available}
              title={paidResourceReason ?? closerGate?.reason ?? '非露骨的关系事件'}
              onClick={() => beginStableAction('closer')}
            >
              <span className="character-interaction-scene__action-icon" aria-hidden="true">
                💕
              </span>
              <span className="character-interaction-scene__action-copy">
                <strong>拉近距离</strong>
                <small>
                  {paidResourceReason ??
                    (closerGate?.available ? '1 AP · 恋爱事件' : (closerGate?.reason ?? '需要人物'))}
                </small>
              </span>
            </button>

            <button type="button" className="character-interaction-scene__action is-exit" onClick={exitScene}>
              <span className="character-interaction-scene__action-icon" aria-hidden="true">
                ↩
              </span>
              <span className="character-interaction-scene__action-copy">
                <strong>离开</strong>
                <small>0 AP · 返回地图</small>
              </span>
            </button>
          </div>
        </>
      ) : (
        <div
          className={`gal-main-story character-interaction-scene__story-surface ${
            mode === 'message' ? 'is-dialogue' : 'is-topics'
          }`}
          data-speaker-ui={mode === 'message' ? getSpeakerUi(storySpeaker) : 'none'}
          data-speaker={storySpeaker ?? 'narration'}
          onClick={mode === 'message' ? handleDialogueContinue : undefined}
        >
          <GalStoryPage
            backgroundKey={`${sceneLocationId}-${period.key}-${activeCharacter?.id ?? 'none'}`}
            backgroundAsset={background.asset}
            backgroundAlt={backgroundAlt}
            speaker={mode === 'message' ? storySpeaker : null}
            text={mode === 'message' ? storyText : ''}
            actLabel={
              mode === 'topics'
                ? `${sceneLocation?.name ?? '这里'} · 选择话题`
                : `${activeCharacter?.name ?? '人物互动'} · ${activeSequence ? ACTION_TITLES[activeSequence.actionId] : '互动'}`
            }
            controls={storyControls}
            theme="pink"
            choice={
              mode === 'topics'
                ? {
                    prompt: `想和${activeCharacter?.name ?? '对方'}聊什么？`,
                    options: talkTopics.map(topic => ({ id: topic.id, label: topic.label })),
                    optionSource: 'authored',
                    selectedOptionId: null,
                    onSelect: handleTopicSelect,
                    allowCustomChoice: false,
                    showSource: false,
                    showPrompt: true,
                    autoFocusFirstOption: true,
                  }
                : null
            }
          />
          {portraitStage}
        </div>
      )}
    </section>
  );
}
