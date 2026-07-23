import { useEffect, useMemo, useRef, useState } from 'react';
import { getMainStoryEpisode, getMainStoryActIndex } from '../GalMainStory/storyRegistry';
import {
  getPreviewConnectionLabels,
  getPreviewWindowMessages,
  createLocalContextPreview,
  type LocalContextPreview,
} from '../services/localContextPreview';
import { loadOpenAICompatibleConfig } from '../config/openaiCompatible';
import {
  canRetryRejectedMemorySummary,
  generateNextMemorySmallSummary,
  getMemorySourceLabel,
  getNextMemorySmallSummaryBatch,
  retryMemoryJob,
  retryRejectedMemorySummary,
  reviewMemorySummaryCandidate,
} from '../memory/summaryRuntime';
import { useMemorySummaryArchiveStore, type MemorySummaryCandidate } from '../memory/summaryArchive';
import {
  LARGE_SUMMARY_MIN_LENGTH,
  LARGE_SUMMARY_MAX_LENGTH,
  LARGE_SUMMARY_SOURCE_COUNT,
  RECENT_CONTEXT_MESSAGE_LIMIT,
  SMALL_SUMMARY_MIN_LENGTH,
  SMALL_SUMMARY_MAX_LENGTH,
  SMALL_SUMMARY_SOURCE_FLOOR_COUNT,
} from '../memory/summaryPolicy';
import { getCanonicalStoryTimeline } from '../memory/storyTimeline';
import { PERIODS } from '../stores/gameStore';
import { LOCATIONS } from '../stores/mapStore';
import './ContextPreviewModal.css';

type ContextPreviewTab = 'context' | 'snapshot' | 'summaries' | 'archive';

interface ContextPreviewModalProps {
  onClose: () => void;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function formatCalendarDate(value: { year: number; month: number; day: number }): string {
  return `${value.year}年${value.month}月${value.day}日`;
}

function getLocationLabel(locationId: string): string {
  return LOCATIONS[locationId as keyof typeof LOCATIONS]?.name ?? locationId;
}

function getPeriodLabel(periodIndex: number): string {
  return PERIODS[periodIndex]?.label ?? `时段 ${periodIndex + 1}`;
}

function getFloorLabel(preview: LocalContextPreview): string {
  const generation = preview.generation;
  if (!generation) return '当前没有可审查的生成记录';
  const { projection } = generation;
  const episode = getMainStoryEpisode(projection.eventId);
  const actIndex = getMainStoryActIndex(projection.eventId, projection.actId);
  const scope = generation.source === 'active-run' ? '当前生成' : '最近楼层';
  return `${scope} · ${episode?.title ?? projection.eventId} · 第 ${actIndex + 1} 幕`;
}

function ConnectionBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="context-preview__connection">
      <b>{label}</b>
      <span>{value}</span>
    </span>
  );
}

export default function ContextPreviewModal({ onClose }: ContextPreviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [tab, setTab] = useState<ContextPreviewTab>('context');
  const [preview, setPreview] = useState<LocalContextPreview>(() => createLocalContextPreview());
  const connections = useMemo(() => getPreviewConnectionLabels(), [preview.capturedAt]);
  const windowMessages = useMemo(() => getPreviewWindowMessages(preview), [preview]);
  const pendingSummaryCount = useMemorySummaryArchiveStore(
    state =>
      state.summaries.filter(summary => summary.saveUuid === state.activeSaveUuid && summary.status === 'pending').length,
  );
  const failedJobCount = useMemorySummaryArchiveStore(
    state => state.jobs.filter(job => job.saveUuid === state.activeSaveUuid && job.status === 'failed').length,
  );

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const refresh = () => setPreview(createLocalContextPreview());
  const snapshot = preview.snapshot;

  return (
    <div className="context-preview__overlay" role="presentation">
      <section className="context-preview" role="dialog" aria-modal="true" aria-labelledby="context-preview-title">
        <header className="context-preview__header">
          <div>
            <span className="context-preview__eyebrow">LOCAL MEMORY / REVIEW</span>
            <h2 id="context-preview-title">上下文预览</h2>
            <p>{getFloorLabel(preview)}</p>
          </div>
          <div className="context-preview__header-actions">
            <button type="button" onClick={refresh} title="重新读取当前本地状态">
              刷新
            </button>
            <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="关闭上下文预览">
              ×
            </button>
          </div>
        </header>

        <div className="context-preview__connections" aria-label="当前接通状态">
          <ConnectionBadge
            label="快照"
            value={connections.snapshot === 'local-state' ? '本地状态' : connections.snapshot}
          />
          <ConnectionBadge label="摘要" value="本浏览器候选" />
          <ConnectionBadge
            label="原文"
            value={connections.messageArchive === 'local-mirror' ? '本地镜像' : connections.messageArchive}
          />
          <ConnectionBadge
            label="生成"
            value={connections.generation === 'tavern-generate' ? 'Tavern generate' : 'fallback'}
          />
          <ConnectionBadge label="宿主消息" value="未接通" />
          <ConnectionBadge label="shujuku" value="未接通" />
        </div>

        <nav className="context-preview__tabs" aria-label="上下文数据视图">
          <button type="button" className={tab === 'context' ? 'is-active' : ''} onClick={() => setTab('context')}>
            注入上下文
          </button>
          <button type="button" className={tab === 'snapshot' ? 'is-active' : ''} onClick={() => setTab('snapshot')}>
            本地快照
          </button>
          <button
            type="button"
            className={tab === 'summaries' ? 'is-active' : ''}
            onClick={() => setTab('summaries')}
          >
            总结与重试 <span>{pendingSummaryCount + failedJobCount}</span>
          </button>
          <button type="button" className={tab === 'archive' ? 'is-active' : ''} onClick={() => setTab('archive')}>
            原文归档 <span>{preview.messages.length}</span>
          </button>
        </nav>

        <div className="context-preview__body">
          {tab === 'context' && <ContextTab preview={preview} messages={windowMessages} />}
          {tab === 'snapshot' && <SnapshotTab preview={preview} />}
          {tab === 'summaries' && <SummaryReviewTab preview={preview} />}
          {tab === 'archive' && <ArchiveTab preview={preview} />}
        </div>

        <footer className="context-preview__footer">
          <span>读取时间 {formatDateTime(preview.capturedAt)}</span>
          <span>GameSnapshot v{snapshot.schemaVersion} · MessageArchive v2</span>
          <span>{tab === 'summaries' ? '候选审查视图' : '只读审查视图'}</span>
        </footer>
      </section>
    </div>
  );
}

function getSummaryStatusLabel(status: MemorySummaryCandidate['status']): string {
  if (status === 'accepted') return '已接受';
  if (status === 'rejected') return '已拒绝';
  return '待确认';
}

type SummarySourceReference = Pick<MemorySummaryCandidate, 'mode' | 'sourceMessageIds' | 'sourceSummaryIds'>;

function getSourceMessageScope(message: LocalContextPreview['messages'][number]): string {
  const episode = getMainStoryEpisode(message.extra.eventId);
  const actIndex = getMainStoryActIndex(message.extra.eventId, message.extra.actId);
  const actLabel = actIndex >= 0 ? `第 ${actIndex + 1} 幕` : message.extra.actId;
  return `${episode?.title ?? message.extra.eventId} · ${actLabel} · ${message.extra.floorId}`;
}

function SummarySourceEvidence({
  source,
  messages,
  summaries,
  canonicalFloorIds,
}: {
  source: SummarySourceReference;
  messages: LocalContextPreview['messages'];
  summaries: readonly MemorySummaryCandidate[];
  canonicalFloorIds: ReadonlySet<string>;
}) {
  if (source.mode === 'small') {
    const messagesById = new Map(messages.map(message => [message.id, message]));
    return (
      <ul className="context-preview__summary-source-list">
        {source.sourceMessageIds.map(messageId => {
          const message = messagesById.get(messageId);
          return message ? (
            <li key={messageId}>
              <div className="context-preview__summary-source-meta">
                <b>{message.extra.role === 'user' ? 'User' : 'Assistant'}</b>
                <span>{getSourceMessageScope(message)}</span>
                <span>{message.extra.source === 'fallback' ? 'fallback' : 'Tavern'}</span>
                <span className={canonicalFloorIds.has(message.extra.floorId) ? undefined : 'is-stale'}>
                  {canonicalFloorIds.has(message.extra.floorId) ? '当前采用' : '非当前采用'}
                </span>
                <time dateTime={message.send_date}>{formatDateTime(message.send_date)}</time>
                <code>{message.id}</code>
              </div>
              <pre>{message.mes}</pre>
            </li>
          ) : (
            <li className="is-missing" key={messageId}>
              <b>原文当前不可用</b>
              <code>{messageId}</code>
            </li>
          );
        })}
      </ul>
    );
  }

  const summariesById = new Map(summaries.map(summary => [summary.summaryId, summary]));
  return (
    <ul className="context-preview__summary-source-list">
      {source.sourceSummaryIds.map(summaryId => {
        const summary = summariesById.get(summaryId);
        const isValidSource = summary?.mode === 'small' && summary.status === 'accepted';
        return summary ? (
          <li className={isValidSource ? undefined : 'is-missing'} key={summaryId}>
            <div className="context-preview__summary-source-meta">
              <b>{summary.title}</b>
              <span>{getSummaryStatusLabel(summary.status)}</span>
              <span>{summary.origin === 'player-edited' ? '玩家编辑' : summary.model}</span>
              {!isValidSource && <span className="is-stale">不是可用的已接受小总结</span>}
              <code>{summary.summaryId}</code>
            </div>
            <pre>{summary.text}</pre>
          </li>
        ) : (
          <li className="is-missing" key={summaryId}>
            <b>来源小总结当前不可用</b>
            <code>{summaryId}</code>
          </li>
        );
      })}
    </ul>
  );
}

function SummaryReviewTab({ preview }: { preview: LocalContextPreview }) {
  const activeSaveUuid = useMemorySummaryArchiveStore(state => state.activeSaveUuid);
  const storedSummaries = useMemorySummaryArchiveStore(state => state.summaries);
  const storedJobs = useMemorySummaryArchiveStore(state => state.jobs);
  const summaries = useMemo(
    () =>
      storedSummaries
        .filter(summary => summary.saveUuid === activeSaveUuid)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [activeSaveUuid, storedSummaries],
  );
  const jobs = useMemo(
    () =>
      storedJobs
        .filter(
          job => job.saveUuid === activeSaveUuid && (job.status === 'failed' || job.status === 'running'),
        )
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [activeSaveUuid, storedJobs],
  );
  const canonicalFloorIds = useMemo(
    () => new Set(getCanonicalStoryTimeline(preview.snapshot.game.mainStory.archives).map(floor => floor.floorId)),
    [preview],
  );
  const nextSmallBatch = getNextMemorySmallSummaryBatch();
  const config = loadOpenAICompatibleConfig();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const beginEdit = (summary: MemorySummaryCandidate) => {
    setEditingId(summary.summaryId);
    setEditTitle(summary.title);
    setEditText(summary.text);
    setActionError(null);
  };

  const review = (
    summaryId: string,
    decision: 'accept' | 'reject' | 'edit',
    edits?: { title: string; text: string },
  ) => {
    if (!reviewMemorySummaryCandidate(summaryId, decision, edits)) {
      setActionError('候选状态已经变化，或编辑内容不符合长度限制。');
      return;
    }
    setEditingId(null);
    setActionError(null);
  };

  const retry = async (jobId: string) => {
    setBusyJobId(jobId);
    setActionError(null);
    try {
      await retryMemoryJob(jobId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyJobId(null);
    }
  };

  const retryRejected = async (summaryId: string) => {
    setBusyJobId(summaryId);
    setActionError(null);
    try {
      await retryRejectedMemorySummary(summaryId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyJobId(null);
    }
  };

  const generateSmallSummary = async () => {
    setBusyJobId('manual-small');
    setActionError(null);
    try {
      await generateNextMemorySmallSummary();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyJobId(null);
    }
  };

  const hasBlockingJob = jobs.some(job => job.status === 'running' || job.status === 'failed');
  const smallBatchRange = nextSmallBatch
    ? `第 ${nextSmallBatch.startFloorNumber} 楼至第 ${nextSmallBatch.endFloorNumber} 楼`
    : '等待权威自动存档';

  return (
    <div className="context-preview__sections">
      <section className="context-preview__section">
        <div className="context-preview__section-heading">
          <div>
            <span>AUTO SUMMARY</span>
            <h3>自动总结队列</h3>
          </div>
          <small>{activeSaveUuid ? `存档 ${activeSaveUuid}` : '等待第一次权威自动存档'}</small>
        </div>
        <dl className="context-preview__facts">
          <div>
            <dt>副 API</dt>
            <dd>{config.enabled ? '已启用' : '已关闭'}</dd>
          </div>
          <div>
            <dt>小总结</dt>
            <dd>每 {SMALL_SUMMARY_SOURCE_FLOOR_COUNT} 个完整楼层</dd>
          </div>
          <div>
            <dt>大总结</dt>
            <dd>每 {LARGE_SUMMARY_SOURCE_COUNT} 条已接受小总结</dd>
          </div>
        </dl>
        <div className="context-preview__manual-summary">
          <div>
            <strong>手动生成小总结</strong>
            <small>
              {nextSmallBatch
                ? `${smallBatchRange} · ${nextSmallBatch.availableFloorCount}/${nextSmallBatch.requiredFloorCount} 楼`
                : smallBatchRange}
            </small>
          </div>
          <button
            type="button"
            disabled={
              busyJobId !== null ||
              !config.enabled ||
              hasBlockingJob ||
              !nextSmallBatch?.ready
            }
            onClick={() => void generateSmallSummary()}
          >
            {busyJobId === 'manual-small' ? '生成中…' : `总结 ${smallBatchRange}`}
          </button>
        </div>
        <p className="context-preview__summary-note">
          最近 {RECENT_CONTEXT_MESSAGE_LIMIT} 条原文固定保留作校准；每累计 {SMALL_SUMMARY_SOURCE_FLOOR_COUNT}{' '}
          个尚未归档的完整楼层触发一批小总结，每 {LARGE_SUMMARY_SOURCE_COUNT}{' '}
          条已接受小总结组成一批大总结。小总结{' '}
          {SMALL_SUMMARY_MIN_LENGTH}–{SMALL_SUMMARY_MAX_LENGTH} 字，大总结 {LARGE_SUMMARY_MIN_LENGTH}–
          {LARGE_SUMMARY_MAX_LENGTH}{' '}
          字；手动生成可提前封存当前已有的 1–{SMALL_SUMMARY_SOURCE_FLOOR_COUNT}{' '}
          个楼层，自动队列仍在凑满 {SMALL_SUMMARY_SOURCE_FLOOR_COUNT}{' '}
          楼后触发。副 API 只返回摘要正文，本地程序封装候选并保存到当前浏览器，本轮尚未注入剧情生成。
        </p>
      </section>

      {actionError && (
        <p className="context-preview__review-error" role="alert">
          {actionError}
        </p>
      )}

      {jobs.length > 0 && (
        <section className="context-preview__section">
          <div className="context-preview__section-heading">
            <div>
              <span>JOBS</span>
              <h3>运行与失败任务</h3>
            </div>
            <small>失败任务不会自动循环重试</small>
          </div>
          <div className="context-preview__job-list">
            {jobs.map(job => (
              <article className={`context-preview__job is-${job.status}`} key={job.jobId}>
                <div>
                  <strong>{job.mode === 'small' ? '小总结' : '大总结'}</strong>
                  <span>{job.status === 'running' ? '正在处理' : `失败 · 第 ${job.attempt} 次`}</span>
                </div>
                {job.error && <p>{job.error}</p>}
                <small>
                  {job.mode === 'small'
                    ? `${job.sourceMessageIds.length / 2} 个来源楼层`
                    : `${job.sourceSummaryIds.length} 条来源小总结`}
                </small>
                {job.status === 'failed' && (
                  <button type="button" disabled={busyJobId !== null} onClick={() => void retry(job.jobId)}>
                    {busyJobId === job.jobId ? '重试中…' : '重试'}
                  </button>
                )}
                <details className="context-preview__summary-source">
                  <summary>冻结来源</summary>
                  <SummarySourceEvidence
                    source={job}
                    messages={preview.messages}
                    summaries={summaries}
                    canonicalFloorIds={canonicalFloorIds}
                  />
                </details>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="context-preview__section">
        <div className="context-preview__section-heading">
          <div>
            <span>CANDIDATES</span>
            <h3>总结候选</h3>
          </div>
          <small>{summaries.length} 条记录</small>
        </div>
        {summaries.length === 0 ? (
          <p className="context-preview__empty">
            尚无总结。有尚未归档的完整楼层即可手动生成；累计 {SMALL_SUMMARY_SOURCE_FLOOR_COUNT}{' '}
            楼时自动队列也会生成。
          </p>
        ) : (
          <div className="context-preview__summary-list">
            {summaries.map(summary => {
              const isEditing = editingId === summary.summaryId;
              const canRegenerate =
                summary.status === 'rejected' && canRetryRejectedMemorySummary(summary.summaryId);
              return (
                <article className={`context-preview__summary-item is-${summary.status}`} key={summary.summaryId}>
                  <header>
                    <div>
                      <b>{summary.mode === 'small' ? '小总结' : '大总结'}</b>
                      <span>{getSummaryStatusLabel(summary.status)}</span>
                      <span>{summary.origin === 'player-edited' ? '玩家编辑' : summary.model}</span>
                    </div>
                    <time dateTime={summary.createdAt}>{formatDateTime(summary.createdAt)}</time>
                  </header>
                  {isEditing ? (
                    <div className="context-preview__summary-editor">
                      <label>
                        <span>标题</span>
                        <input value={editTitle} maxLength={30} onChange={event => setEditTitle(event.target.value)} />
                      </label>
                      <label>
                        <span>正文</span>
                        <textarea
                          value={editText}
                          minLength={
                            summary.mode === 'small' ? SMALL_SUMMARY_MIN_LENGTH : LARGE_SUMMARY_MIN_LENGTH
                          }
                          maxLength={summary.mode === 'small' ? SMALL_SUMMARY_MAX_LENGTH : LARGE_SUMMARY_MAX_LENGTH}
                          onChange={event => setEditText(event.target.value)}
                        />
                      </label>
                      <div className="context-preview__review-actions">
                        <button
                          type="button"
                          onClick={() => review(summary.summaryId, 'edit', { title: editTitle, text: editText })}
                        >
                          保存并接受
                        </button>
                        <button type="button" onClick={() => setEditingId(null)}>
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4>{summary.title}</h4>
                      <p>{summary.text}</p>
                    </>
                  )}
                  <details className="context-preview__summary-source">
                    <summary>
                      {getMemorySourceLabel(summary)} ·{' '}
                      {summary.mode === 'small'
                        ? `${summary.sourceFloorIds.length} 个来源楼层`
                        : `${summary.sourceSummaryIds.length} 条来源小总结`}
                    </summary>
                    <SummarySourceEvidence
                      source={summary}
                      messages={preview.messages}
                      summaries={summaries}
                      canonicalFloorIds={canonicalFloorIds}
                    />
                  </details>
                  <small className="context-preview__injection-state">当前不会进入剧情上下文</small>
                  {!isEditing && summary.status === 'pending' && (
                    <div className="context-preview__review-actions">
                      <button type="button" onClick={() => review(summary.summaryId, 'accept')}>
                        接受
                      </button>
                      <button type="button" onClick={() => beginEdit(summary)}>
                        编辑
                      </button>
                      <button type="button" className="is-danger" onClick={() => review(summary.summaryId, 'reject')}>
                        拒绝
                      </button>
                    </div>
                  )}
                  {!isEditing && summary.status === 'rejected' && (
                    <div className="context-preview__review-actions">
                      {canRegenerate ? (
                        <button
                          type="button"
                          disabled={busyJobId !== null}
                          onClick={() => void retryRejected(summary.summaryId)}
                        >
                          {busyJobId === summary.summaryId ? '重新生成中…' : '重新生成'}
                        </button>
                      ) : (
                        <small>已有后续候选或任务，请处理最新记录</small>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ContextTab({
  preview,
  messages,
}: {
  preview: LocalContextPreview;
  messages: LocalContextPreview['messages'];
}) {
  const generation = preview.generation;
  const isActiveProjection = generation?.source === 'active-run';
  return (
    <div className="context-preview__sections">
      <section className="context-preview__section">
        <div className="context-preview__section-heading">
          <div>
            <span>RAW WINDOW</span>
            <h3>
              {isActiveProjection ? '当前幕连续性窗口' : '下一轮连续性窗口'} · {messages.length}/
              {generation?.projection.maxChatHistory ?? RECENT_CONTEXT_MESSAGE_LIMIT}
            </h3>
          </div>
          <small>
            {!isActiveProjection && generation ? '按当前采用版重建 · ' : ''}
            {messages.map(message => message.id).join(' / ') || '当前为空'}
          </small>
        </div>
        <div className="context-preview__message-list">
          {messages.length === 0 && <p className="context-preview__empty">暂无可用原文。</p>}
          {messages.map(message => (
            <details className="context-preview__message" key={message.id}>
              <summary>
                <strong>{message.extra.role === 'user' ? 'User' : 'Assistant'}</strong>
                <span>{message.extra.source === 'fallback' ? 'fallback' : 'Tavern'}</span>
                <time dateTime={message.send_date}>{formatDateTime(message.send_date)}</time>
              </summary>
              <p>{message.mes}</p>
            </details>
          ))}
        </div>
      </section>

      {generation ? (
        <>
          <section className="context-preview__section">
            <div className="context-preview__section-heading">
              <div>
                <span>USER INPUT</span>
                <h3>{isActiveProjection ? '当前幕生成提示' : '最近楼层保存的提示'}</h3>
              </div>
              <small>
                {isActiveProjection
                  ? `当前请求 · ${generation.projection.continuityMode === 'continue' ? '延续前文' : '全新幕'}`
                  : '最近楼层保存的 User 提示原文'}
              </small>
            </div>
            <pre className="context-preview__prompt">{generation.projection.userInput}</pre>
          </section>
          <section className="context-preview__section">
            <div className="context-preview__section-heading">
              <div>
                <span>WORLD INFO ROUTING</span>
                <h3>本幕选择的引用</h3>
              </div>
              <small>仅为本地引用，不代表真实扫描结果</small>
            </div>
            <ul className="context-preview__reference-list">
              {generation.loreReferences.map(reference => (
                <li key={`${reference.worldbookName}:${reference.entryOrder}:${reference.entryName}`}>
                  <b>{reference.kind === 'plot' ? '剧情' : '人物'}</b>
                  <span>order {reference.entryOrder}</span>
                  <span>{reference.entryName}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <section className="context-preview__section context-preview__empty-section">
          <span>GENERATION</span>
          <h3>当前没有可重建的生成请求</h3>
          <p>快照和原文仍可用于本地存档恢复；下一幕开始生成后，这里会显示实际提示和历史窗口。</p>
        </section>
      )}
    </div>
  );
}

function SnapshotTab({ preview }: { preview: LocalContextPreview }) {
  const { snapshot } = preview;
  const period = getPeriodLabel(snapshot.game.periodIndex);
  const run = snapshot.game.mainStory.run;
  const learnedCount = snapshot.skills.learningHistory.length;
  const practicedCount = snapshot.skills.termCommits.at(-1)?.practicedSkillIds.length ?? 0;

  return (
    <div className="context-preview__sections">
      <section className="context-preview__section">
        <div className="context-preview__section-heading">
          <div>
            <span>GAME STATE</span>
            <h3>当前快照</h3>
          </div>
          <small>schema v{snapshot.schemaVersion}</small>
        </div>
        <dl className="context-preview__facts">
          <div>
            <dt>日期</dt>
            <dd>{formatCalendarDate(snapshot.game.date)}</dd>
          </div>
          <div>
            <dt>第几天</dt>
            <dd>第 {snapshot.game.day} 天</dd>
          </div>
          <div>
            <dt>时段</dt>
            <dd>{period}</dd>
          </div>
          <div>
            <dt>AP</dt>
            <dd>{snapshot.game.actionPointsRemaining}</dd>
          </div>
          <div>
            <dt>地点</dt>
            <dd>{getLocationLabel(snapshot.game.currentLocationId)}</dd>
          </div>
          <div>
            <dt>当前幕</dt>
            <dd>{run ? `${run.eventId} / ${run.actId}` : '无'}</dd>
          </div>
        </dl>
      </section>

      <section className="context-preview__section">
        <div className="context-preview__section-heading">
          <div>
            <span>PLAYER</span>
            <h3>{snapshot.player.name}</h3>
          </div>
          <small>money {snapshot.player.money}</small>
        </div>
        <dl className="context-preview__facts context-preview__facts--stats">
          <div>
            <dt>智力</dt>
            <dd>{snapshot.player.intelligence}</dd>
          </div>
          <div>
            <dt>运动</dt>
            <dd>{snapshot.player.athletics}</dd>
          </div>
          <div>
            <dt>艺术</dt>
            <dd>{snapshot.player.art}</dd>
          </div>
          <div>
            <dt>魅力</dt>
            <dd>{snapshot.player.charm}</dd>
          </div>
          <div>
            <dt>体力</dt>
            <dd>{snapshot.player.stamina}</dd>
          </div>
          <div>
            <dt>压力</dt>
            <dd>{snapshot.player.stress}</dd>
          </div>
        </dl>
      </section>

      <section className="context-preview__section">
        <div className="context-preview__section-heading">
          <div>
            <span>RELATION</span>
            <h3>角色关系轴</h3>
          </div>
          <small>当前字段原样读取</small>
        </div>
        <div className="context-preview__relation-list">
          {snapshot.cards.targets.map(target => (
            <div className="context-preview__relation" key={target.id}>
              <strong>{target.name}</strong>
              <span>affection {target.affection}</span>
              <span>friendship {target.friendship}</span>
              <span>romance {target.romance}</span>
            </div>
          ))}
          {snapshot.cards.targets.length === 0 && <p className="context-preview__empty">暂无角色卡。</p>}
        </div>
      </section>

      <section className="context-preview__section">
        <div className="context-preview__section-heading">
          <div>
            <span>SKILLS</span>
            <h3>特技快照</h3>
          </div>
          <small>技能效果仍未接入结算</small>
        </div>
        <dl className="context-preview__facts">
          <div>
            <dt>EXP</dt>
            <dd>{snapshot.skills.experience}</dd>
          </div>
          <div>
            <dt>学习记录</dt>
            <dd>{learnedCount}</dd>
          </div>
          <div>
            <dt>最近实践</dt>
            <dd>{practicedCount}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function ArchiveTab({ preview }: { preview: LocalContextPreview }) {
  return (
    <section className="context-preview__section context-preview__archive-section">
      <div className="context-preview__section-heading">
        <div>
          <span>LOCAL MESSAGE ARCHIVE</span>
          <h3>全部原文楼层</h3>
        </div>
        <small>{preview.messages.length} 条消息</small>
      </div>
      <div className="context-preview__archive-list">
        {preview.messages.length === 0 && <p className="context-preview__empty">暂无已保存的主线原文。</p>}
        {preview.messages.map(message => (
          <details key={message.id} className="context-preview__archive-item">
            <summary>
              <strong>{message.extra.role === 'user' ? 'User' : 'Assistant'}</strong>
              <span>{message.extra.floorId}</span>
              <span>{message.extra.source === 'fallback' ? 'fallback' : 'Tavern'}</span>
              <time dateTime={message.send_date}>{formatDateTime(message.send_date)}</time>
            </summary>
            <pre>{message.mes}</pre>
          </details>
        ))}
      </div>
    </section>
  );
}
