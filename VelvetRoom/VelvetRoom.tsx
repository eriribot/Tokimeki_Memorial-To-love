import { useCallback, useEffect, useRef, useState } from 'react';
import GalStoryPage from '../GalMainStory/GalStoryPage';
import { resolveAssetPath } from '../utils/assetPath';
import SephiePortrait from './SephiePortrait';
import {
  createVelvetRoomHistory,
  paginateVelvetRoomText,
  sendVelvetRoomTurn,
  type VelvetRoomMessage,
  type VelvetRoomProfileResult,
} from './velvetRoomGeneration';
import { VELVET_ROOM_OPENING_TEXT } from './velvetRoomPrompt';
import VelvetRoomAmbience from './VelvetRoomAmbience';
import './VelvetRoom.css';

const VELVET_ROOM_BGM = '/artsource/music/persona.mp3';
const VELVET_ROOM_BACKGROUND = '/artsource/backgrounds/2388451597/velvet-room-runtime.jpg';

interface VelvetRoomProps {
  /** 采访完成且玩家选择采用结果时回调，把画像回填到登记表。 */
  onApply: (result: { appearance: string; personality: string }) => void;
  onClose: () => void;
  /** 「离开房间」按钮的文案，由父级按去向给出。 */
  closeLabel?: string;
}

interface ConversationPage {
  id: number;
  speaker: '赛菲' | '你';
  text: string;
}

/**
 * 天鹅绒房间使用共享 GAL 对话页展示会话。固定开场完全由本地渲染，
 * 玩家提交回答后才调用 Tavern 生成；整个采访历史只存在于当前组件内存。
 */
export default function VelvetRoom({ onApply, onClose, closeLabel = '离开房间' }: VelvetRoomProps) {
  const historyRef = useRef<VelvetRoomMessage[]>(createVelvetRoomHistory());
  const audioRef = useRef<HTMLAudioElement>(null);
  const sceneRef = useRef<HTMLElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const nextPageIdRef = useRef(1);
  const pageCountRef = useRef(1);
  const mountedRef = useRef(true);
  const [pages, setPages] = useState<ConversationPage[]>([
    { id: 0, speaker: '赛菲', text: VELVET_ROOM_OPENING_TEXT },
  ]);
  const [pageIndex, setPageIndex] = useState(0);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VelvetRoomProfileResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [audioState, setAudioState] = useState<'pending' | 'playing' | 'blocked'>('pending');

  const appendPages = useCallback((speaker: ConversationPage['speaker'], texts: readonly string[]): number => {
    const nextTexts = texts.map(text => text.trim()).filter(Boolean);
    if (nextTexts.length === 0) return -1;
    const firstIndex = pageCountRef.current;
    const nextPages = nextTexts.map(text => ({ id: nextPageIdRef.current++, speaker, text }));
    pageCountRef.current += nextPages.length;
    setPages(previous => [...previous, ...nextPages]);
    return firstIndex;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    sceneRef.current?.focus();
    const audio = audioRef.current;
    if (audio) {
      audio
        .play()
        .then(() => mountedRef.current && setAudioState('playing'))
        .catch(() => mountedRef.current && setAudioState('blocked'));
    }

    return () => {
      mountedRef.current = false;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  const retryAudio = () => {
    audioRef.current
      ?.play()
      .then(() => setAudioState('playing'))
      .catch(() => setAudioState('blocked'));
  };

  const goPrevious = useCallback(() => {
    if (busy || showResult) return;
    setPageIndex(previous => Math.max(0, previous - 1));
  }, [busy, showResult]);

  const goNext = useCallback(() => {
    if (busy || showResult) return;
    setPageIndex(previous => Math.min(pageCountRef.current - 1, previous + 1));
  }, [busy, showResult]);

  const sendReply = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;

    const guestPageIndex = appendPages('你', [text]);
    setPageIndex(guestPageIndex);
    setComposerOpen(false);
    setBusy(true);
    setError(null);

    try {
      const turn = await sendVelvetRoomTurn(historyRef.current, text);
      if (!mountedRef.current) return;
      const replyPages = paginateVelvetRoomText(turn.visibleText);
      const firstReplyIndex = appendPages('赛菲', replyPages);
      if (firstReplyIndex >= 0) setPageIndex(firstReplyIndex);
      setInput('');
      if (turn.result) {
        setResult(turn.result);
        if (firstReplyIndex < 0) setShowResult(true);
      }
    } catch (turnError) {
      if (!mountedRef.current) return;
      setError(turnError instanceof Error ? turnError.message : String(turnError));
      setComposerOpen(true);
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [appendPages, busy, input]);

  useEffect(() => {
    if (busy || showResult) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('button, input, textarea, select')) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, goNext, goPrevious, showResult]);

  const currentPage = pages[pageIndex] ?? pages[0];
  const isLastPage = pageIndex === pages.length - 1;
  const canAnswer = isLastPage && currentPage.speaker === '赛菲' && !result && !busy;

  return (
    <section
      ref={sceneRef}
      className={`gal-main-story velvet-room${busy ? ' is-generating' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="天鹅绒房间"
      tabIndex={-1}
      data-event-id="velvet-room-interview"
      data-page-index={pageIndex}
      data-speaker={currentPage.speaker}
      data-speaker-ui="generic-nameplate"
      data-focus-character="sephie"
      data-portrait-id="layered-atlas"
      data-expression-id="neutral"
      data-background="persona3-velvet-room"
      data-generation-source={busy ? 'tavern' : 'authored-or-accepted'}
      onClick={() => {
        if (pageIndex < pages.length - 1) goNext();
      }}
    >
      <audio ref={audioRef} src={resolveAssetPath(VELVET_ROOM_BGM)} loop preload="auto" />

      <GalStoryPage
        backgroundKey="persona3-velvet-room"
        backgroundAsset={VELVET_ROOM_BACKGROUND}
        backgroundAlt="天鹅绒房间"
        speaker={currentPage.speaker}
        text={currentPage.text}
        actLabel={busy ? '天鹅绒房间 · 赛菲正在回应' : '天鹅绒房间 · 画像访谈'}
        theme="blue"
        controls={
          <nav
            className="gal-main-story__controls velvet-room__controls"
            aria-label="天鹅绒房间对话控制"
            onClick={event => event.stopPropagation()}
          >
            <button
              type="button"
              className="gal-main-story__icon-button"
              disabled={pageIndex === 0 || busy}
              onClick={goPrevious}
              aria-label="上一页"
              title="上一页"
            >
              ←
            </button>
            <span className="gal-main-story__progress">
              {pageIndex + 1} / {pages.length}
            </span>
            {audioState === 'blocked' && (
              <button type="button" className="gal-main-story__raw-button" onClick={retryAudio}>
                播放音乐
              </button>
            )}
            {canAnswer && !composerOpen && (
              <button
                type="button"
                className="gal-main-story__raw-button velvet-room__answer-button"
                onClick={() => {
                  setComposerOpen(true);
                  requestAnimationFrame(() => replyRef.current?.focus());
                }}
              >
                回答
              </button>
            )}
            <button type="button" className="gal-main-story__skip" onClick={onClose}>
              {closeLabel}
            </button>
            {result && isLastPage ? (
              <button
                type="button"
                className="gal-main-story__raw-button velvet-room__result-button"
                onClick={() => setShowResult(true)}
              >
                查看画像
              </button>
            ) : (
              <button
                type="button"
                className="gal-main-story__icon-button is-primary"
                disabled={pageIndex >= pages.length - 1 || busy}
                onClick={goNext}
                aria-label="下一页"
                title="下一页"
              >
                →
              </button>
            )}
          </nav>
        }
      />

      <VelvetRoomAmbience />
      <SephiePortrait
        speaking={currentPage.speaker === '赛菲' && !busy && !showResult}
        beatKey={currentPage.id}
      />

      {busy && (
        <div className="velvet-room__thinking" role="status">
          <span className="gal-main-story__scanner" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <strong>赛菲正在凝视你的内心……</strong>
        </div>
      )}

      {composerOpen && !result && !busy && (
        <form
          className="velvet-room__composer"
          onClick={event => event.stopPropagation()}
          onSubmit={event => {
            event.preventDefault();
            void sendReply();
          }}
        >
          {error && (
            <p className="velvet-room__error" role="alert">
              {error}
            </p>
          )}
          <header className="velvet-room__composer-header">
            <strong>{error ? '重新回答赛菲' : '回答赛菲'}</strong>
            <button
              type="button"
              className="velvet-room__composer-close"
              onClick={() => {
                setComposerOpen(false);
                setError(null);
              }}
              aria-label="关闭回答输入"
              title="关闭回答输入"
            >
              ×
            </button>
          </header>
          <div className="velvet-room__input-row">
            <textarea
              ref={replyRef}
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (input.trim()) void sendReply();
                }
              }}
              placeholder="回答赛菲的问题……"
              rows={2}
              maxLength={1200}
              disabled={busy}
              aria-label="回答赛菲的问题"
            />
            <button type="submit" disabled={busy || !input.trim()}>
              回答
            </button>
          </div>
        </form>
      )}

      {showResult && result && (
        <section className="velvet-room__result" aria-labelledby="velvet-room-result-title">
          <header>
            <div>
              <p>PERSONA PROFILE</p>
              <h2 id="velvet-room-result-title">赛菲的画像</h2>
            </div>
            <button
              type="button"
              className="gal-main-story__icon-button"
              onClick={() => setShowResult(false)}
              aria-label="关闭画像"
              title="关闭画像"
            >
              ×
            </button>
          </header>
          <div className="velvet-room__report">{result.report}</div>
          <dl className="velvet-room__fields">
            <div>
              <dt>外貌</dt>
              <dd>{result.appearance}</dd>
            </div>
            <div>
              <dt>性格</dt>
              <dd>{result.personality}</dd>
            </div>
          </dl>
          <footer>
            <button
              type="button"
              className="is-primary"
              onClick={() => onApply({ appearance: result.appearance, personality: result.personality })}
            >
              填入登记表
            </button>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setShowResult(false);
                setComposerOpen(false);
              }}
            >
              继续交谈
            </button>
          </footer>
        </section>
      )}
    </section>
  );
}
