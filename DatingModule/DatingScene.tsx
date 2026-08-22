import { useEffect, useMemo, useRef, useState } from 'react';
import { calendarDateKey } from '../CalendarModule/specialDates';
import { getStoryPortraitRig, isStoryCharacterId } from '../GalMainStory/characters';
import GalStoryPage, { GalStoryPagePager } from '../GalMainStory/GalStoryPage';
import { getStoryScene } from '../GalMainStory/scenes';
import { resolveAssetPath } from '../utils/assetPath';
import { isCharacterAvailable } from '../data/characterAvailability';
import { captureGameMessages } from '../message';
import { createGameSnapshot } from '../save/snapshot';
import { getEquippedSkillIds, useSkillStore } from '../skilllogic';
import { useCardStore } from '../stores/cardStore';
import { PERIODS, useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { settleDatingChoices, settleDatingRelationshipChoices } from './datingDirector';
import { shouldAdvanceDatingDialogueClick } from './datingDialoguePaging';
import { createDatingGenerationContextProjection } from './datingGenerationContext';
import { resolveDatingFeeChoice } from './datingCoordinator';
import {
  getDatingCharacterProgress,
  getDatingGirlRelations,
  getDatingHurtBand,
  getDatingSubBand,
} from './datingRelationships';
import { evaluateWalkHome } from './datingRules';
import { createDatingFallbackContent, generateDatingStage } from './datingStoryGeneration';
import { getDatingOptionVisual } from './datingOptionVisuals';
import { useDatingStore } from './datingStore';
import type { DatingStageContent, DatingStoryLine, WalkHomeRecord } from './types';
import './DatingModule.css';

function getPortrait(line: DatingStoryLine, beatKey: number) {
  if (!line.focus || !line.portrait || !isStoryCharacterId(line.focus)) return null;
  try {
    const rig = getStoryPortraitRig(line.focus, line.portrait);
    return {
      rig,
      expressionId:
        line.expression && Object.hasOwn(rig.expressions, line.expression) ? line.expression : rig.defaultExpressionId,
      isSpeaking: Boolean(line.speaker),
      beatKey,
    };
  } catch {
    return null;
  }
}

function getGenerationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function DatingRelationshipStrip({
  characterId,
  characterName,
  relationships,
  targets,
}: {
  characterId: string;
  characterName: string;
  relationships: Parameters<typeof getDatingCharacterProgress>[0];
  targets: readonly { id: string; name: string }[];
}) {
  const progress = getDatingCharacterProgress(relationships, characterId);
  const names = new Map(targets.map(target => [target.id, target.name]));
  const relationEntries = Object.entries(getDatingGirlRelations(relationships, characterId)).slice(0, 2);
  return (
    <aside className="dating-relationship-strip" aria-label={`${characterName}关系账本`}>
      <span className="dating-relationship-strip__axis">
        <b>主导平衡</b>
        <strong>{progress.sub}</strong>
        <small>{getDatingSubBand(progress.sub)}</small>
      </span>
      <span className="dating-relationship-strip__axis">
        <b>受伤</b>
        <strong>{progress.hurt}</strong>
        <small>{getDatingHurtBand(progress.hurt)}</small>
      </span>
      {relationEntries.length > 0 ? (
        relationEntries.map(([otherId, relation]) => (
          <span className="dating-relationship-strip__pair" key={otherId}>
            <b>
              {characterName} → {names.get(otherId) ?? otherId}
            </b>
            <small>
              包容 {relation.tolerance} · 竞争 {relation.rivalry} · 羁绊 {relation.yuriBond}
            </small>
          </span>
        ))
      ) : (
        <span className="dating-relationship-strip__pair">
          <b>多人关系</b>
          <small>尚未建立共同关系线</small>
        </span>
      )}
    </aside>
  );
}

function createWalkHomeContent(characterName: string, characterId: string, playerName: string): DatingStageContent {
  return {
    stageId: 'return',
    source: 'fallback',
    createdAt: new Date().toISOString(),
    lines: [
      {
        speaker: null,
        text: `放学的人流渐渐散开，${characterName}在校门旁放慢了脚步。`,
        sceneId: 'schoolRoad',
        focus: null,
        portrait: null,
        expression: null,
        effect: 'none',
      },
      {
        speaker: characterName,
        text: '如果方向差不多，要不要一起走一段？',
        sceneId: 'schoolRoad',
        focus: characterId,
        portrait: null,
        expression: null,
        effect: 'none',
      },
      {
        speaker: playerName,
        text: '好啊，正好还有一点时间。',
        sceneId: 'schoolRoad',
        focus: null,
        portrait: null,
        expression: null,
        effect: 'none',
      },
      {
        speaker: null,
        text: '两个人聊着今天的小事走过街角，这段偶然的同行没有让谁赶时间。',
        sceneId: 'schoolRoad',
        focus: null,
        portrait: null,
        expression: null,
        effect: 'none',
      },
    ],
  };
}

interface DatingSceneProps {
  onOpenContextPreview: () => void;
}

export default function DatingScene({ onOpenContextPreview }: DatingSceneProps) {
  const date = useGameStore(state => state.date);
  const periodIndex = useGameStore(state => state.periodIndex);
  const currentLocationId = useGameStore(state => state.currentLocationId);
  const wholeDayActivity = useGameStore(state => state.wholeDayActivity);
  const mainStoryRun = useGameStore(state => state.mainStory.run);
  const completedEventIds = useGameStore(state => state.mainStory.completedEventIds);
  const finishWholeDayActivity = useGameStore(state => state.finishWholeDayActivity);
  const markDatingSettlementPending = useGameStore(state => state.markDatingSettlementPending);
  const targets = useCardStore(state => state.targets);
  const activeTargetId = useCardStore(state => state.activeTargetId);
  const applyRelationshipDelta = useCardStore(state => state.applyRelationshipDelta);
  const playerName = usePlayerStore(state => state.name);
  const run = useDatingStore(state => state.run);
  const generation = useDatingStore(state => state.generation);
  const relationships = useDatingStore(state => state.relationships);
  const walkHomeByDate = useDatingStore(state => state.walkHomeByDate);
const feePromptAppointmentId = useDatingStore(state => state.feePromptAppointmentId);
const pendingDatingCompletion = useDatingStore(state => state.pendingDatingCompletion);
const appointments = useDatingStore(state => state.appointments);
  const setGeneration = useDatingStore(state => state.setGeneration);
  const setStageContent = useDatingStore(state => state.setStageContent);
  const setRunPosition = useDatingStore(state => state.setRunPosition);
  const advanceToReturn = useDatingStore(state => state.advanceToReturn);
const completeRun = useDatingStore(state => state.completeRun);
const applyDatingRelationshipDelta = useDatingStore(state => state.applyDatingRelationshipDelta);
const recordDatingCompletion = useDatingStore(state => state.recordDatingCompletion);
const clearDatingCompletion = useDatingStore(state => state.clearDatingCompletion);
  const recordWalkHome = useDatingStore(state => state.recordWalkHome);
  const settleWalkHome = useDatingStore(state => state.settleWalkHome);
  const skillProgression = useSkillStore();
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [walkPlayback, setWalkPlayback] = useState<{ content: DatingStageContent; pageIndex: number } | null>(null);
  const [walkNotice, setWalkNotice] = useState<string | null>(null);
  const generationRequestRef = useRef<{ key: string; requestId: string } | null>(null);

  const dateKey = calendarDateKey(date);
  const currentWalk = walkHomeByDate[dateKey] ?? null;
  const period = PERIODS[periodIndex] ?? PERIODS[0];
  const equippedSkillIds = useMemo(() => getEquippedSkillIds(skillProgression), [skillProgression]);

  useEffect(() => {
    if (
      period.key !== 'afterSchool' ||
      currentWalk ||
      run ||
      feePromptAppointmentId ||
      wholeDayActivity !== null ||
      mainStoryRun?.phase === 'playing'
    ) {
      return;
    }
    const candidates = targets
      .filter(
        target => target.currentLocationId === currentLocationId && isCharacterAvailable(target.id, completedEventIds),
      )
      .sort((left, right) => {
        if (left.id === activeTargetId) return -1;
        if (right.id === activeTargetId) return 1;
        return left.id.localeCompare(right.id);
      });
    const candidate = candidates[0] ?? null;
    const result = evaluateWalkHome(date, candidate?.id ?? null, candidate?.affection ?? 0, equippedSkillIds);
    recordWalkHome({
      ...result,
      choice: null,
      generated: false,
      content: null,
      createdAt: new Date().toISOString(),
    });
  }, [
    activeTargetId,
    completedEventIds,
    currentLocationId,
    currentWalk,
    date,
    equippedSkillIds,
    feePromptAppointmentId,
    mainStoryRun?.phase,
    period.key,
    recordWalkHome,
    run,
    targets,
    wholeDayActivity,
  ]);

  const stage = run?.plan.stages[run.stageIndex] ?? null;
  const content = stage && run ? (run.stageContents[stage.id] ?? null) : null;

  useEffect(() => {
    if (!run || !stage || content) {
      return;
    }
    const generationKey = `${run.appointmentId}-${stage.id}`;
    if (
      generation.status === 'error' &&
      generation.appointmentId === run.appointmentId &&
      generation.stageId === stage.id
    ) {
      return;
    }
    if (generationRequestRef.current?.key === generationKey) return;
    const requestId = `${run.appointmentId}-${stage.id}-${Date.now()}`;
    generationRequestRef.current = { key: generationKey, requestId };
    setGeneration({
      status: 'loading',
      appointmentId: run.appointmentId,
      stageId: stage.id,
      content: null,
      error: null,
      requestId,
    });
    const contextProjection = createDatingGenerationContextProjection({
      snapshot: createGameSnapshot(),
      mainStoryMessages: captureGameMessages(),
      plan: run.plan,
      stageId: stage.id,
    });
    void generateDatingStage(run.plan, stage.id, {
      recentArchives: contextProjection.recentArchives,
      recentBody: contextProjection.recentBody,
      selectedOptionLabel: contextProjection.selectedOptionLabel,
      relationshipContext: contextProjection.relationshipContext,
      continuityMessages: contextProjection.contextMessages,
    })
      .then(generated => {
        const current = useDatingStore.getState();
        if (
          current.generation.requestId !== requestId ||
          current.run?.appointmentId !== run.appointmentId ||
          current.run.plan.stages[current.run.stageIndex]?.id !== stage.id
        )
          return;
        generationRequestRef.current = null;
        current.setStageContent(stage.id, generated);
      })
      .catch(error => {
        const current = useDatingStore.getState();
        if (
          current.generation.requestId !== requestId ||
          current.run?.appointmentId !== run.appointmentId ||
          current.run.plan.stages[current.run.stageIndex]?.id !== stage.id
        )
          return;
        generationRequestRef.current = null;
        current.setGeneration({
          status: 'error',
          appointmentId: run.appointmentId,
          stageId: stage.id,
          content: null,
          error: getGenerationErrorMessage(error),
          requestId,
        });
      });
  }, [
    content,
    generation.appointmentId,
    generation.stageId,
    generation.status,
    run,
    relationships,
    setGeneration,
    setStageContent,
    stage,
    targets,
  ]);

  const finishDate = (optionId: string) => {
    const dating = useDatingStore.getState();
    const activeRun = dating.run;
    const activeStage = activeRun?.plan.stages[activeRun.stageIndex];
    const mainContent = activeRun?.stageContents.main;
    const returnContent = activeRun?.stageContents.return;
    if (
      !activeRun ||
      activeRun.status !== 'active' ||
      activeRun.stageIndex !== 1 ||
      activeRun.selectedOptionIds.length !== 1 ||
      activeRun.appointmentId !== run?.appointmentId ||
      !activeStage?.options.some(option => option.id === optionId) ||
      !mainContent ||
      !returnContent ||
      useGameStore.getState().wholeDayActivity !== 'dating'
    ) {
      return;
    }
    const selectedOptionIds = [...activeRun.selectedOptionIds, optionId];
    const relationshipDelta = settleDatingChoices(activeRun.plan, selectedOptionIds);
    const datingRelationshipDelta = settleDatingRelationshipChoices(activeRun.plan, selectedOptionIds);
    const contents = [mainContent, returnContent];
    const completed = completeRun({
      id: `dating-archive-${activeRun.appointmentId}`,
      appointmentId: activeRun.appointmentId,
      date: { ...activeRun.plan.date },
      characterId: activeRun.plan.characterId,
      locationId: activeRun.plan.locationId,
      quality: activeRun.plan.quality,
      selectedOptionIds,
      contents,
      relationshipDelta,
      datingRelationshipDelta,
      createdAt: new Date().toISOString(),
    });
    if (!completed) return;
    applyRelationshipDelta(activeRun.plan.characterId, relationshipDelta);
    applyDatingRelationshipDelta(activeRun.plan.characterId, datingRelationshipDelta);
    // 先把 store 切到 'dating-completing'：这一步保留日期、AP、periodIndex 不动，
    // 仅清掉 `wholeDayActivity` 标志，避免与未推进日期的状态产生校验冲突。
    // 实际的"推进日期 + 跳天动画"留给玩家在评价页点击"返回地图"后再触发。
    const settledProgress = getDatingCharacterProgress(
      useDatingStore.getState().relationships,
      activeRun.plan.characterId,
    );
    const completionMessage = `和${activeRun.plan.characterName}的约会结束了。今天的相处节奏：${getDatingSubBand(settledProgress.sub)}。`;
    const marked = markDatingSettlementPending();
    recordDatingCompletion({ message: completionMessage, appointmentId: activeRun.appointmentId });
    if (!marked) {
      // 极端情况：store 已经不在 'dating' 状态（例如中途被存档恢复覆盖），直接走标准结算。
      finishWholeDayActivity({ source: 'dating-complete' });
      clearDatingCompletion();
    }
  };

  const handleDatingChoice = (optionId: string) => {
    const activeRun = useDatingStore.getState().run;
    const activeStage = activeRun?.plan.stages[activeRun.stageIndex];
    if (!activeRun || activeRun.appointmentId !== run?.appointmentId || !activeStage) return;
    if (!activeStage.options.some(option => option.id === optionId)) return;
    if (activeRun.stageIndex === 0) {
      if (!advanceToReturn(optionId)) return;
      return;
    }
    finishDate(optionId);
  };

  const handleWalkChoice = (choice: 'together' | 'alone') => {
    if (!currentWalk || currentWalk.status !== 'offered' || !currentWalk.characterId) return;
    const character = targets.find(target => target.id === currentWalk.characterId);
    if (!character) return;
    if (choice === 'alone') {
      const settled = settleWalkHome({
        ...currentWalk,
        status: 'declined',
        choice: 'alone',
        generated: false,
        content: null,
      });
      if (!settled) return;
      applyDatingRelationshipDelta(character.id, { sub: -4, hurt: -1 });
      setWalkNotice(`${character.name}点点头，和你在路口道别。`);
      return;
    }
    const walkContent = createWalkHomeContent(character.name, character.id, playerName);
    const record: WalkHomeRecord = {
      ...currentWalk,
      status: 'chosen',
      choice: 'together',
      generated: true,
      content: walkContent,
    };
    if (!settleWalkHome(record)) return;
    applyRelationshipDelta(character.id, { friendship: 3, romance: 1 });
    setWalkPlayback({ content: walkContent, pageIndex: 0 });
  };

  const advanceWalkPlayback = () => {
    setWalkPlayback(value => {
      if (!value) return null;
      if (value.pageIndex >= value.content.lines.length - 1) return null;
      return { ...value, pageIndex: value.pageIndex + 1 };
    });
  };

  if (feePromptAppointmentId) {
    const appointment = appointments.find(candidate => candidate.id === feePromptAppointmentId);
    const character = targets.find(target => target.id === appointment?.characterId);
    return (
      <section className="dating-overlay dating-fee-prompt" data-dating-overlay="fee-choice" aria-label="约会费用不足">
        <div className="dating-modal-panel">
          <span className="dating-eyebrow">出发前</span>
          <h2>余额不足</h2>
          <p>{character?.name ?? '对方'}已经在等你，但商店街需要 100 金钱。</p>
          <div className="dating-modal-actions">
            <button type="button" className="dating-button is-primary" onClick={() => resolveDatingFeeChoice('park')}>
              改去公园
            </button>
            <button type="button" className="dating-button is-quiet" onClick={() => resolveDatingFeeChoice('cancel')}>
              取消约会
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (pendingDatingCompletion || completionMessage || walkNotice) {
    const noticeText = pendingDatingCompletion?.message ?? completionMessage ?? walkNotice;
    return (
      <section className="dating-overlay dating-notice" data-dating-overlay="notice" aria-live="polite">
        <div className="dating-modal-panel">
          <span className="dating-eyebrow">回忆</span>
          <p>{noticeText}</p>
          <button
            type="button"
            className="dating-button is-primary"
            onClick={() => {
              if (pendingDatingCompletion) {
                finishWholeDayActivity({ source: 'dating-complete' });
                clearDatingCompletion();
              }
              setCompletionMessage(null);
              setWalkNotice(null);
            }}
          >
            返回地图
          </button>
        </div>
      </section>
    );
  }

  if (walkPlayback) {
    const line = walkPlayback.content.lines[walkPlayback.pageIndex];
    const scene = getStoryScene(line?.sceneId ?? 'schoolRoad');
    return (
      <section
        className="dating-overlay gal-main-story dating-scene"
        data-dating-overlay="walk-home"
        onClick={event => {
          if (shouldAdvanceDatingDialogueClick(event)) advanceWalkPlayback();
        }}
      >
        <GalStoryPage
          backgroundAsset={scene.asset}
          backgroundAlt={scene.alt}
          speaker={line?.speaker ?? null}
          text={line?.text ?? ''}
          actLabel="放学同行"
          theme="pink"
          controls={
            <nav className="gal-main-story__controls" aria-label="放学同行翻页">
              <GalStoryPagePager
                currentPage={walkPlayback.pageIndex}
                pageCount={walkPlayback.content.lines.length}
                onSelectPage={pageIndex => setWalkPlayback(value => (value ? { ...value, pageIndex } : null))}
              />
              <button
                type="button"
                className="gal-main-story__icon-button is-primary"
                aria-label={walkPlayback.pageIndex >= walkPlayback.content.lines.length - 1 ? '结束同行' : '下一句'}
                onClick={advanceWalkPlayback}
              >
                {walkPlayback.pageIndex >= walkPlayback.content.lines.length - 1 ? '✓' : '→'}
              </button>
            </nav>
          }
        />
      </section>
    );
  }

  if (currentWalk?.status === 'offered' && currentWalk.characterId) {
    const character = targets.find(target => target.id === currentWalk.characterId);
    return (
      <section
        className="dating-overlay dating-walk-prompt"
        data-dating-overlay="walk-home-choice"
        aria-label="放学同行选择"
      >
        <div className="dating-modal-panel">
          <span className="dating-eyebrow">放学后</span>
          <h2>{character?.name ?? '她'}似乎在等你</h2>
          <p>今天要一起走一段吗？这不会消耗 AP。</p>
          <div className="dating-modal-actions">
            <button type="button" className="dating-button is-primary" onClick={() => handleWalkChoice('together')}>
              同行
            </button>
            <button type="button" className="dating-button is-quiet" onClick={() => handleWalkChoice('alone')}>
              独自回家
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!run || !stage) return null;
  const line = content?.lines[Math.min(run.pageIndex, Math.max(0, (content?.lines.length ?? 1) - 1))] ?? null;
  const scene = getStoryScene(line?.sceneId ?? stage.sceneId);
  const choiceVisible = Boolean(content && run.pageIndex >= content.lines.length);
  const portrait = line ? getPortrait(line, run.pageIndex) : null;
  const isRiverbankDate = run.plan.locationId === 'riverbank';
  const isCurrentGeneration = generation.appointmentId === run.appointmentId && generation.stageId === stage.id;
  const isGenerationError = !content && isCurrentGeneration && generation.status === 'error';
  const isGenerating = !content && !isGenerationError;
  const displayOptions = stage.options.map(option => {
    const generated = content?.options?.find(candidate => candidate.id === option.id);
    return {
      id: option.id,
      label: generated?.label ?? option.label,
      visual: getDatingOptionVisual(option.id),
    };
  });

  const advanceDatingPage = () => {
    if (!content || choiceVisible) return;
    setRunPosition(run.stageIndex, run.pageIndex + 1);
  };

  const retryGeneration = () => {
    setGeneration({
      status: 'idle',
      appointmentId: run.appointmentId,
      stageId: stage.id,
      content: null,
      error: null,
      requestId: null,
    });
  };

  const useFallback = () => {
    const activeRun = useDatingStore.getState().run;
    if (
      !activeRun ||
      activeRun.appointmentId !== run.appointmentId ||
      activeRun.plan.stages[activeRun.stageIndex]?.id !== stage.id
    ) {
      return;
    }
    const previousOptionId = activeRun.selectedOptionIds.at(-1);
    const previousOptionLabel =
      activeRun.plan.stages.flatMap(item => item.options).find(option => option.id === previousOptionId)?.label ?? null;
    setStageContent(stage.id, createDatingFallbackContent(activeRun.plan, stage.id, previousOptionLabel));
  };

  if (isGenerating || isGenerationError) {
    return (
      <section
        className={`dating-overlay gal-main-story dating-scene is-generating${isRiverbankDate ? ' dating-riverbank' : ''}`}
        data-dating-overlay="date-generation"
        data-stage={stage.id}
        data-source="pending"
        data-generation-status={isGenerationError ? 'error' : 'loading'}
        aria-busy={!isGenerationError}
        aria-label={isGenerationError ? `${run.plan.characterName}约会生成失败` : `${run.plan.characterName}约会生成中`}
      >
        <img className="gal-main-story__background" src={resolveAssetPath(scene.asset)} alt={scene.alt} />
        <div className="gal-main-story__shade" aria-hidden="true" />
        <div className={`gal-main-story__generation-panel${isGenerationError ? ' is-error' : ''}`}>
          {!isGenerationError && (
            <span className="gal-main-story__scanner" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          )}
          <strong>{isGenerationError ? '这一幕生成失败' : '沛凯正在策划这一幕'}</strong>
          <p>
            {isGenerationError
              ? (generation.error ?? '酒馆没有返回可播放的约会正文。')
              : `正在调用酒馆当前预设生成${stage.label}……`}
          </p>
          {isGenerationError && (
            <div className="gal-main-story__generation-actions">
              <button type="button" onClick={retryGeneration}>
                重新生成
              </button>
              <button type="button" onClick={useFallback}>
                使用保底版
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          className="gal-main-story__icon-button dating-context-button"
          aria-label="打开本次约会的上下文预览"
          title="上下文预览"
          onClick={onOpenContextPreview}
        >
          i
        </button>
        {isRiverbankDate && (
          <DatingRelationshipStrip
            characterId={run.plan.characterId}
            characterName={run.plan.characterName}
            relationships={relationships}
            targets={targets}
          />
        )}
      </section>
    );
  }

  return (
    <section
      className={`dating-overlay gal-main-story dating-scene${isRiverbankDate ? ' dating-riverbank' : ''}${isGenerating ? ' is-generating' : ''} effect-${line?.effect ?? 'none'}`}
      data-dating-overlay="date"
      data-stage={stage.id}
      data-source={content?.source ?? 'pending'}
      data-generation-status={isGenerating ? 'loading' : content ? 'ready' : generation.status}
      aria-busy={isGenerating}
      aria-label={`${run.plan.characterName}约会`}
      onClick={event => {
        if (shouldAdvanceDatingDialogueClick(event)) advanceDatingPage();
      }}
    >
      <GalStoryPage
        backgroundAsset={scene.asset}
        backgroundAlt={scene.alt}
        backgroundKey={`${run.appointmentId}-${stage.id}-${scene.id}`}
        speaker={line?.speaker ?? null}
        text={content ? (choiceVisible ? '' : (line?.text ?? '')) : '正在调用酒馆当前预设生成今天的约会……'}
        portrait={portrait}
        actLabel={`${run.plan.characterName} · ${stage.label}`}
        theme="pink"
        choice={
          choiceVisible
            ? {
                prompt: '你打算怎么回应？',
                options: displayOptions,
                optionSource: content?.source === 'tavern' ? 'ai' : 'fallback',
                selectedOptionId: null,
                onSelect: handleDatingChoice,
                allowCustomChoice: false,
                showSource: false,
                showPrompt: true,
                autoFocusFirstOption: true,
              }
            : null
        }
        controls={
          content && !choiceVisible ? (
            <nav className="gal-main-story__controls" aria-label="约会正文翻页">
              <button
                type="button"
                className="gal-main-story__icon-button"
                disabled={run.pageIndex <= 0}
                aria-label="上一句"
                onClick={() => setRunPosition(run.stageIndex, Math.max(0, run.pageIndex - 1))}
              >
                ←
              </button>
              <GalStoryPagePager
                currentPage={run.pageIndex}
                pageCount={content.lines.length}
                onSelectPage={pageIndex => setRunPosition(run.stageIndex, pageIndex)}
              />
              <button
                type="button"
                className="gal-main-story__icon-button is-primary"
                aria-label={run.pageIndex >= content.lines.length - 1 ? '显示回应选项' : '下一句'}
                onClick={advanceDatingPage}
              >
                {run.pageIndex >= content.lines.length - 1 ? '✓' : '→'}
              </button>
            </nav>
          ) : null
        }
      />
      <button
        type="button"
        className="gal-main-story__icon-button dating-context-button"
        aria-label="打开本次约会的上下文预览"
        title="上下文预览"
        onClick={onOpenContextPreview}
      >
        i
      </button>
      {isRiverbankDate && (
        <DatingRelationshipStrip
          characterId={run.plan.characterId}
          characterName={run.plan.characterName}
          relationships={relationships}
          targets={targets}
        />
      )}
    </section>
  );
}
