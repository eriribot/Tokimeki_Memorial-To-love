import { useCallback, useEffect, useRef, useState } from 'react';
import GalStoryPage from '../GalMainStory/GalStoryPage';
import { resolveAssetPath } from '../utils/assetPath';
import SephiePortrait from './SephiePortrait';
import VelvetRoomAmbience from './VelvetRoomAmbience';
import VelvetRoomChoicePanel from './VelvetRoomChoicePanel';
import {
  beginVelvetRoomInterview,
  createVelvetRoomHistory,
  sendVelvetRoomTurn,
  type VelvetRoomMessage,
  type VelvetRoomProfileResult,
  type VelvetRoomQuestionTurn,
} from './velvetRoomGeneration';
import { VELVET_ROOM_INVITATION_TEXT } from './velvetRoomPrompt';
import './VelvetRoom.css';

const VELVET_ROOM_BGM = '/artsource/music/persona.mp3';
const VELVET_ROOM_BACKGROUND = '/artsource/backgrounds/2388451597/velvet-room-runtime.jpg';
const CONSENT_OPTIONS = [
  { id: 'accept', label: '是，接受赛菲的性格画像' },
  { id: 'decline', label: '否，先去见梨子填写入学资料' },
] as const;

type VelvetRoomPhase = 'consent' | 'starting' | 'start-error' | 'question' | 'complete';

interface VelvetRoomProps {
  /** 采访完成且玩家选择采用结果时回调，把性格画像回填到登记表。 */
  onApply: (result: { personality: string }) => void;
  onClose: () => void;
  /** 「离开房间」按钮的文案，由父级按去向给出。 */
  closeLabel?: string;
}

/**
 * 天鹅绒房间的授权题固定在本地；接受后，每一题及三个回答均由 Tavern 即时生成。
 * 协议历史只存在于组件内存，不写酒馆楼层、不进存档，也不读取外部画像 JSON。
 */
export default function VelvetRoom({ onApply, onClose, closeLabel = '离开房间' }: VelvetRoomProps) {
  const historyRef = useRef<VelvetRoomMessage[]>(createVelvetRoomHistory());
  const audioRef = useRef<HTMLAudioElement>(null);
  const sceneRef = useRef<HTMLElement>(null);
  const resultCloseButtonRef = useRef<HTMLButtonElement>(null);
  const mountedRef = useRef(true);
  const [phase, setPhase] = useState<VelvetRoomPhase>('consent');
  const [questionTurn, setQuestionTurn] = useState<VelvetRoomQuestionTurn | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [editingCustomAnswer, setEditingCustomAnswer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VelvetRoomProfileResult | null>(null);
  const [closingText, setClosingText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [beatKey, setBeatKey] = useState(0);
  const [audioState, setAudioState] = useState<'pending' | 'playing' | 'blocked'>('pending');

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

  useEffect(() => {
    if (!showResult) return;
    const animationFrame = requestAnimationFrame(() => resultCloseButtonRef.current?.focus());
    return () => cancelAnimationFrame(animationFrame);
  }, [showResult]);

  const retryAudio = () => {
    audioRef.current
      ?.play()
      .then(() => setAudioState('playing'))
      .catch(() => setAudioState('blocked'));
  };

  const startInterview = useCallback(async () => {
    if (busy) return;
    historyRef.current = createVelvetRoomHistory();
    setBusy(true);
    setPhase('starting');
    setQuestionTurn(null);
    setResult(null);
    setClosingText('');
    setError(null);
    setSelectedOptionId(null);
    setEditingCustomAnswer(false);

    try {
      const turn = await beginVelvetRoomInterview(historyRef.current);
      if (!mountedRef.current) return;
      setQuestionTurn(turn);
      setPhase('question');
      setBeatKey(previous => previous + 1);
    } catch (cause) {
      if (!mountedRef.current) return;
      setError(cause instanceof Error ? cause.message : String(cause));
      setPhase('start-error');
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [busy]);

  const submitAnswer = useCallback(
    async (optionId: string, answer: string) => {
      if (busy || phase !== 'question') return;
      setSelectedOptionId(optionId);
      setBusy(true);
      setError(null);

      try {
        const turn = await sendVelvetRoomTurn(historyRef.current, answer);
        if (!mountedRef.current) return;
        if (turn.kind === 'question') {
          setQuestionTurn(turn);
          setEditingCustomAnswer(false);
          setBeatKey(previous => previous + 1);
        } else {
          setQuestionTurn(null);
          setResult(turn.result);
          setClosingText(turn.closingText);
          setEditingCustomAnswer(false);
          setPhase('complete');
          setBeatKey(previous => previous + 1);
        }
      } catch (cause) {
        if (!mountedRef.current) return;
        setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        if (mountedRef.current) {
          setSelectedOptionId(null);
          setBusy(false);
        }
      }
    },
    [busy, phase],
  );

  const phaseText =
    phase === 'consent'
      ? VELVET_ROOM_INVITATION_TEXT
      : phase === 'starting'
        ? '稍候，客人。让我先为这场访谈点亮第一盏灯。'
        : phase === 'start-error'
          ? `第一道问题没有显现：${error ?? '请稍后重试。'}`
          : phase === 'complete'
            ? closingText
            : questionTurn?.question ?? '';
  const isChoicePhase = phase === 'consent' || (phase === 'question' && Boolean(questionTurn));
  const sephieSpeaking =
    !busy && !showResult && !editingCustomAnswer && (phase === 'consent' || phase === 'question' || phase === 'complete');

  const roomControls = (
    <nav
      className="gal-main-story__controls velvet-room__controls"
      aria-label="天鹅绒房间控制"
      onClick={event => event.stopPropagation()}
    >
      {audioState === 'blocked' && (
        <button type="button" className="gal-main-story__raw-button" onClick={retryAudio}>
          播放音乐
        </button>
      )}
      {phase === 'start-error' && (
        <button type="button" className="gal-main-story__raw-button" disabled={busy} onClick={() => void startInterview()}>
          重新生成问题
        </button>
      )}
      <button type="button" className="gal-main-story__skip" disabled={busy} onClick={onClose}>
        {closeLabel}
      </button>
      {phase === 'complete' && result && (
        <button type="button" className="gal-main-story__raw-button velvet-room__result-button" onClick={() => setShowResult(true)}>
          查看画像
        </button>
      )}
    </nav>
  );

  return (
    <section
      ref={sceneRef}
      className={`gal-main-story velvet-room${busy ? ' is-generating' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="天鹅绒房间"
      tabIndex={-1}
      data-event-id={phase === 'consent' ? 'velvet-room-consent' : 'velvet-room-interview'}
      data-velvet-room-phase={phase}
      data-page-index={questionTurn?.stage ?? 0}
      data-speaker="赛菲"
      data-speaker-ui="generic-nameplate"
      data-focus-character="sephie"
      data-portrait-id="layered-atlas"
      data-expression-id="neutral"
      data-background="persona3-velvet-room"
      data-generation-source={busy ? 'tavern' : phase === 'consent' ? 'authored' : 'ai'}
    >
      <audio ref={audioRef} src={resolveAssetPath(VELVET_ROOM_BGM)} loop preload="auto" />

      <GalStoryPage
        backgroundKey="persona3-velvet-room"
        backgroundAsset={VELVET_ROOM_BACKGROUND}
        backgroundAlt="天鹅绒房间"
        speaker="赛菲"
        text={phaseText}
        actLabel={
          phase === 'consent'
            ? '天鹅绒房间 · 契约确认'
            : busy
              ? '天鹅绒房间 · 赛菲正在回应'
              : '天鹅绒房间 · 性格画像'
        }
        theme="blue"
        controls={isChoicePhase ? null : roomControls}
      />

      <VelvetRoomAmbience />
      <SephiePortrait speaking={sephieSpeaking} beatKey={beatKey} />

      {phase === 'consent' && (
        <VelvetRoomChoicePanel
          mode="consent"
          prompt={VELVET_ROOM_INVITATION_TEXT}
          options={CONSENT_OPTIONS}
          selectedOptionId={null}
          locked={busy}
          controls={audioState === 'blocked' ? roomControls : null}
          onSelect={optionId => {
            if (optionId === 'accept') void startInterview();
            else if (optionId === 'decline') onClose();
          }}
        />
      )}

      {phase === 'question' && questionTurn && (
        <VelvetRoomChoicePanel
          mode="interview"
          prompt={questionTurn.question}
          options={questionTurn.options}
          selectedOptionId={selectedOptionId}
          locked={busy}
          error={error}
          controls={roomControls}
          onSelect={(optionId, answer) => void submitAnswer(optionId, answer)}
          onEditingChange={setEditingCustomAnswer}
        />
      )}

      {busy && (
        <div className="velvet-room__thinking" role="status">
          <span className="gal-main-story__scanner" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <strong>{phase === 'starting' ? '赛菲正在生成第一道问题……' : '赛菲正在聆听并整理下一道问题……'}</strong>
        </div>
      )}

      {showResult && result && (
        <section
          className="velvet-room__result"
          role="dialog"
          aria-modal="true"
          aria-labelledby="velvet-room-result-title"
        >
          <header>
            <div>
              <p>PERSONA PROFILE</p>
              <h2 id="velvet-room-result-title">赛菲的画像</h2>
            </div>
            <button
              ref={resultCloseButtonRef}
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
              <dt>用户画像</dt>
              <dd>{result.personality}</dd>
            </div>
          </dl>
          <footer>
            <button type="button" className="is-primary" onClick={() => onApply({ personality: result.personality })}>
              将性格填入登记表
            </button>
            <button type="button" onClick={() => setShowResult(false)}>
              返回告别
            </button>
          </footer>
        </section>
      )}
    </section>
  );
}
