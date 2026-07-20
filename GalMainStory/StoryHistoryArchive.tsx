import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createStoryFloor,
  createStoryFloorId,
  generateStoryAct,
} from '../services/tavernStoryGeneration';
import { useGameStore } from '../stores/gameStore';
import { resolveAssetPath } from '../utils/assetPath';
import { EPISODE_01_STORY } from './episodes/episode01';
import { getStoryScene } from './scenes';
import type { GalStoryAct, GalStoryActArchive, GalStoryFloor } from './storyTypes';

interface StoryHistoryArchiveProps {
  isRawHistoryOpen: boolean;
  onExit: () => void;
  onOpenRawHistory: (floorId: string | null) => void;
  onPlayAll: () => void;
  onPreviewFloor: (floorId: string) => void;
  children?: ReactNode;
}

function getActiveFloor(archive: GalStoryActArchive): GalStoryFloor | null {
  return archive.floors.find(floor => floor.floorId === archive.activeFloorId) ?? null;
}

function getPreviousActiveFloors(
  archives: readonly GalStoryActArchive[],
  actIndex: number,
): { floors: GalStoryFloor[]; acts: GalStoryAct[] } {
  const floors = archives
    .filter(archive => archive.actIndex < actIndex)
    .sort((left, right) => left.actIndex - right.actIndex)
    .map(getActiveFloor)
    .filter((floor): floor is GalStoryFloor => floor !== null && floor.act !== null);
  return { floors, acts: floors.map(floor => floor.act as GalStoryAct) };
}

function isContextStale(archive: GalStoryActArchive, archives: readonly GalStoryActArchive[]): boolean {
  const activeFloor = getActiveFloor(archive);
  if (!activeFloor) return false;
  const expectedFloorIds = getPreviousActiveFloors(archives, archive.actIndex).floors.map(floor => floor.floorId);
  return (
    expectedFloorIds.length !== activeFloor.contextFloorIds.length ||
    expectedFloorIds.some((floorId, index) => activeFloor.contextFloorIds[index] !== floorId)
  );
}

function formatFloorTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false });
}

export default function StoryHistoryArchive({
  isRawHistoryOpen,
  onExit,
  onOpenRawHistory,
  onPlayAll,
  onPreviewFloor,
  children,
}: StoryHistoryArchiveProps) {
  const archives = useGameStore(state => state.mainStoryArchives);
  const messageHistory = useGameStore(state => state.mainStoryMessages);
  const addFloor = useGameStore(state => state.addMainStoryFloor);
  const selectFloor = useGameStore(state => state.selectMainStoryFloor);
  const deleteFloor = useGameStore(state => state.deleteMainStoryFloor);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);
  const [regeneratingActIndex, setRegeneratingActIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sortedArchives = useMemo(() => [...archives].sort((left, right) => left.actIndex - right.actIndex), [archives]);
  const hasPlayableStory = sortedArchives.some(archive => Boolean(getActiveFloor(archive)?.act));
  const rawAssistantMessageIds = useMemo(
    () =>
      new Set(
        messageHistory
          .filter(
            message => !message.is_user && message.extra.role === 'assistant' && message.extra.source === 'tavern',
          )
          .map(message => message.id),
      ),
    [messageHistory],
  );

  useEffect(() => {
    if (!isRawHistoryOpen) panelRef.current?.focus();
  }, [isRawHistoryOpen]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isRawHistoryOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRawHistoryOpen, onExit]);

  const adoptFloor = useCallback(
    (floorId: string) => {
      setNotice(selectFloor(floorId) ? '已切换当前采用楼层。' : '这个楼层没有可播放正文，不能采用。');
    },
    [selectFloor],
  );

  const removeFloor = useCallback(
    (floor: GalStoryFloor, isActive: boolean) => {
      const warning = isActive
        ? '这是当前采用楼层。删除后会自动回退到剩余的最新可播放楼层；如果没有可回退版本，本幕将变为未采用。确定删除吗？'
        : '删除后，这个楼层及其游戏内保存的 AI 原文将无法恢复。确定删除吗？';
      if (!window.confirm(warning)) return;
      setNotice(deleteFloor(floor.floorId) ? '楼层及其游戏内 AI 原文已删除。' : '没有找到要删除的楼层。');
    },
    [deleteFloor],
  );

  const regenerateAct = useCallback(
    async (archive: GalStoryActArchive) => {
      if (regeneratingActIndex !== null) return;
      const baseFloor =
        getActiveFloor(archive) ??
        archive.floors.find(floor => floor.act !== null) ??
        archive.floors[archive.floors.length - 1] ??
        null;
      if (!baseFloor) {
        setNotice('这一幕缺少可复用的原始生成上下文。');
        return;
      }

      const previous = getPreviousActiveFloors(sortedArchives, archive.actIndex);
      if (previous.floors.length !== archive.actIndex) {
        setNotice('前面的幕还没有采用版本，暂时不能重新生成这一幕。');
        return;
      }

      setRegeneratingActIndex(archive.actIndex);
      setNotice(null);
      const floorId = createStoryFloorId(archive.actIndex);
      const request = {
        floorId,
        actIndex: archive.actIndex,
        entryReason: baseFloor.context.entryReason,
        playerName: baseFloor.context.playerName,
        day: baseFloor.context.day,
        period: baseFloor.context.period,
        location: baseFloor.context.location,
        contextFloorIds: previous.floors.map(floor => floor.floorId),
        chatHistory: messageHistory,
      };
      try {
        const generated = await generateStoryAct(request);
        addFloor(generated.floor, generated.messages);
        if (generated.ok) {
          if (isMountedRef.current) {
            setNotice('新楼层已保存为候选，尚未替换当前采用版。');
            onPreviewFloor(generated.floor.floorId);
          }
        } else if (isMountedRef.current) {
          setNotice(`新楼层无法转换成 GAL：${generated.error}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        addFloor(createStoryFloor(request, null, 'tavern', [], 'request_error', message));
        if (isMountedRef.current) setNotice(`重新生成失败：${message}`);
      } finally {
        if (isMountedRef.current) setRegeneratingActIndex(null);
      }
    },
    [addFloor, messageHistory, onPreviewFloor, regeneratingActIndex, sortedArchives],
  );

  return (
    <section className="gal-main-story gal-story-archive" role="dialog" aria-modal="true" aria-label="已读剧情档案">
      <img
        className="gal-main-story__background"
        src={resolveAssetPath(getStoryScene('school').asset)}
        alt={getStoryScene('school').alt}
      />
      <div className="gal-main-story__shade" aria-hidden="true" />
      <div className="gal-story-archive__panel" ref={panelRef} tabIndex={-1}>
        <header className="gal-story-archive__header">
          <div>
            <span>按幕与内部楼层整理</span>
            <h2>已读剧情</h2>
          </div>
          <div className="gal-story-archive__header-actions">
            <button type="button" disabled={!hasPlayableStory} onClick={onPlayAll}>
              从头回放
            </button>
            <button type="button" disabled={rawAssistantMessageIds.size === 0} onClick={() => onOpenRawHistory(null)}>
              AI 原文
            </button>
            <button type="button" onClick={onExit}>
              返回地图
            </button>
          </div>
        </header>

        {notice && <p className="gal-story-archive__notice">{notice}</p>}

        <div className="gal-story-archive__acts">
          {sortedArchives.map(archive => {
            const activeFloor = getActiveFloor(archive);
            const activeFloorIndex = archive.floors.findIndex(floor => floor.floorId === archive.activeFloorId);
            const actMeta = EPISODE_01_STORY.acts[archive.actIndex];
            const stale = isContextStale(archive, sortedArchives);
            return (
              <article className="gal-story-archive__act" key={archive.actId}>
                <div className="gal-story-archive__act-heading">
                  <div>
                    <span>第 {archive.actIndex + 1} 幕</span>
                    <h3>{actMeta?.title ?? archive.actId}</h3>
                  </div>
                  <div className="gal-story-archive__act-actions">
                    <button
                      type="button"
                      disabled={!activeFloor?.act}
                      onClick={() => activeFloor && onPreviewFloor(activeFloor.floorId)}
                    >
                      回放当前版
                    </button>
                    <button
                      type="button"
                      disabled={regeneratingActIndex !== null}
                      onClick={() => void regenerateAct(archive)}
                    >
                      {regeneratingActIndex === archive.actIndex ? '生成中…' : '重新生成'}
                    </button>
                  </div>
                </div>

                <p className="gal-story-archive__summary">
                  共 {archive.floors.length} 个楼层
                  {activeFloorIndex >= 0 ? ` · 当前采用楼层 ${activeFloorIndex + 1}` : ' · 尚未采用'}
                </p>
                {stale && <p className="gal-story-archive__stale">前文采用楼层已变化，本幕不会被自动删除或重生。</p>}

                <ol className="gal-story-archive__floors">
                  {archive.floors.map((floor, floorIndex) => {
                    const isActive = floor.floorId === archive.activeFloorId;
                    const isPlayable = floor.outcome === 'accepted' && floor.act !== null;
                    const hasRawAssistant = floor.messageIds.some(messageId => rawAssistantMessageIds.has(messageId));
                    return (
                      <li key={floor.floorId} className={isActive ? 'is-active' : ''}>
                        <div className="gal-story-archive__floor-meta">
                          <strong>楼层 {floorIndex + 1}</strong>
                          <span>{floor.source === 'tavern' ? 'AI' : '保底'}</span>
                          <span>
                            {isPlayable ? '可播放' : floor.outcome === 'request_error' ? '请求失败' : '解析失败'}
                          </span>
                          {isActive && <span>当前采用</span>}
                          <time dateTime={floor.createdAt}>{formatFloorTime(floor.createdAt)}</time>
                        </div>
                        {floor.error && <p>{floor.error}</p>}
                        <div className="gal-story-archive__floor-actions">
                          <button
                            type="button"
                            disabled={!hasRawAssistant}
                            onClick={() => onOpenRawHistory(floor.floorId)}
                          >
                            AI 原文
                          </button>
                          <button type="button" disabled={!isPlayable} onClick={() => onPreviewFloor(floor.floorId)}>
                            预览
                          </button>
                          {!isActive && isPlayable && (
                            <button type="button" onClick={() => adoptFloor(floor.floorId)}>
                              {activeFloorIndex >= 0 && floorIndex < activeFloorIndex ? '回退到此楼层' : '采用此楼层'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="is-danger"
                            disabled={regeneratingActIndex !== null}
                            onClick={() => removeFloor(floor, isActive)}
                          >
                            删除
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </article>
            );
          })}
        </div>
      </div>
      {children}
    </section>
  );
}
