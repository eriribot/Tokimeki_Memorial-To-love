import { useEffect, useMemo, useRef, useState } from 'react';
import { getMainStoryEpisode, getMainStoryActIndex } from '../GalMainStory/storyRegistry';
import {
  getPreviewConnectionLabels,
  getPreviewWindowMessages,
  createLocalContextPreview,
  type LocalContextPreview,
} from '../services/localContextPreview';
import { PERIODS } from '../stores/gameStore';
import { LOCATIONS } from '../stores/mapStore';
import './ContextPreviewModal.css';

type ContextPreviewTab = 'context' | 'snapshot' | 'archive';

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
            <span className="context-preview__eyebrow">LOCAL MEMORY / READ ONLY</span>
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
          <button type="button" className={tab === 'archive' ? 'is-active' : ''} onClick={() => setTab('archive')}>
            原文归档 <span>{preview.messages.length}</span>
          </button>
        </nav>

        <div className="context-preview__body">
          {tab === 'context' && <ContextTab preview={preview} messages={windowMessages} />}
          {tab === 'snapshot' && <SnapshotTab preview={preview} />}
          {tab === 'archive' && <ArchiveTab preview={preview} />}
        </div>

        <footer className="context-preview__footer">
          <span>读取时间 {formatDateTime(preview.capturedAt)}</span>
          <span>GameSnapshot v{snapshot.schemaVersion} · MessageArchive v2</span>
          <span>只读审查视图</span>
        </footer>
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
  return (
    <div className="context-preview__sections">
      <section className="context-preview__section">
        <div className="context-preview__section-heading">
          <div>
            <span>RAW WINDOW</span>
            <h3>
              {generation
                ? `实际发送窗口 · ${messages.length}/${generation.projection.maxChatHistory}`
                : '最近原文窗口'}
            </h3>
          </div>
          <small>
            {generation ? generation.projection.messageIds.join(' / ') || '当前为空' : '当前没有生成中的主线'}
          </small>
        </div>
        <div className="context-preview__message-list">
          {messages.length === 0 && <p className="context-preview__empty">暂无可用原文。</p>}
          {messages.map(message => (
            <article className="context-preview__message" key={message.id}>
              <header>
                <strong>{message.extra.role === 'user' ? 'User' : 'Assistant'}</strong>
                <span>{message.extra.source === 'fallback' ? 'fallback' : 'Tavern'}</span>
                <time dateTime={message.send_date}>{formatDateTime(message.send_date)}</time>
              </header>
              <p>{message.mes}</p>
            </article>
          ))}
        </div>
      </section>

      {generation ? (
        <>
          <section className="context-preview__section">
            <div className="context-preview__section-heading">
              <div>
                <span>USER INPUT</span>
                <h3>本轮生成提示</h3>
              </div>
              <small>
                {generation.source === 'active-run' ? '当前请求' : '最近楼层保存的请求'} ·{' '}
                {generation.projection.continuityMode === 'continue' ? '延续前文' : '全新幕'}
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
