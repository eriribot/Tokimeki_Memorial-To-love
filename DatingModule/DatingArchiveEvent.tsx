import type { DatingArchive } from './types';
import { type DatingArchiveEventView, formatDatingArchiveTime } from './datingArchiveProjection';

interface DatingArchiveEventProps {
  event: DatingArchiveEventView;
  eventNumber: number;
  onPreviewStage: (archive: DatingArchive, stageIndex: number) => void;
}

function getSourceLabel(source: DatingArchiveEventView['acts'][number]['source']): string {
  return source === 'tavern' ? 'AI' : '保底';
}

export default function DatingArchiveEvent({ event, eventNumber, onPreviewStage }: DatingArchiveEventProps) {
  return (
    <section
      className="gal-story-archive__dating-event"
      data-dating-event-id={event.eventKey}
      aria-label={`${event.dateLabel}与${event.characterName}的约会记录`}
    >
      {event.acts.map(act => {
        const isPlayable = act.isPlayable;
        return (
          <article className="gal-story-archive__act" data-dating-act-id={act.actKey} key={act.actKey}>
            <div className="gal-story-archive__act-heading">
              <div>
                <span>
                  日历记录 · 第 {eventNumber} 场约会 · {event.dateLabel} · 第 {act.stageIndex + 1} 幕
                </span>
                <h3>{act.title}</h3>
                <p className="gal-story-archive__dating-act-context">
                  与{event.characterName} · {event.locationLabel} · {event.qualityLabel}
                </p>
              </div>
              <div className="gal-story-archive__act-actions">
                <button
                  type="button"
                  disabled={!isPlayable}
                  onClick={() => onPreviewStage(event.archive, act.stageIndex)}
                >
                  回放当前幕
                </button>
              </div>
            </div>

            <p className="gal-story-archive__summary">共 1 个楼层 · 当前记录</p>

            <ol className="gal-story-archive__floors">
              <li className={isPlayable ? 'is-active' : undefined}>
                <div className="gal-story-archive__floor-meta">
                  <strong>楼层 1</strong>
                  <span>{getSourceLabel(act.source)}</span>
                  <span>{isPlayable ? '可播放' : '无正文'}</span>
                  {isPlayable && <span>当前记录</span>}
                  <time dateTime={act.createdAt}>{formatDatingArchiveTime(act.createdAt)}</time>
                </div>
                <p>{act.lineCount} 句已保存正文</p>
                <div className="gal-story-archive__floor-actions">
                  <button
                    type="button"
                    disabled={!isPlayable}
                    onClick={() => onPreviewStage(event.archive, act.stageIndex)}
                  >
                    预览
                  </button>
                </div>
              </li>
            </ol>
          </article>
        );
      })}
    </section>
  );
}
