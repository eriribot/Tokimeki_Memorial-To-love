import { useEffect, useMemo, useState } from 'react';
import { getStoryPortraitRig, isStoryCharacterId } from '../GalMainStory/characters';
import GalStoryPage, { GalStoryPagePager } from '../GalMainStory/GalStoryPage';
import { getStoryScene } from '../GalMainStory/scenes';
import { getDatingLocation } from './datingRules';
import type { DatingArchive, DatingStoryLine } from './types';
import './DatingModule.css';

interface DatingHistoryPlaybackProps {
  archive: DatingArchive;
  characterName: string;
  onClose: () => void;
}

interface DatingHistoryLine extends DatingStoryLine {
  stageLabel: string;
}

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

export default function DatingHistoryPlayback({ archive, characterName, onClose }: DatingHistoryPlaybackProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const location = getDatingLocation(archive.locationId);
  const lines = useMemo<DatingHistoryLine[]>(
    () =>
      archive.contents.flatMap(content =>
        content.lines.map(line => ({
          ...line,
          stageLabel: content.stageId === 'main' ? '约会正文' : '返程记录',
        })),
      ),
    [archive.contents],
  );

  useEffect(() => {
    setLineIndex(0);
  }, [archive.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setLineIndex(index => Math.max(0, index - 1));
      } else if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setLineIndex(index => (index >= lines.length - 1 ? index : index + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lines.length, onClose]);

  const line = lines[lineIndex] ?? null;
  const scene = getStoryScene(line?.sceneId ?? location.sceneId);
  const isLastLine = lineIndex >= lines.length - 1;

  return (
    <section
      className={`dating-overlay gal-main-story dating-scene effect-${line?.effect ?? 'none'}`}
      data-dating-overlay="history"
      role="dialog"
    >
      <GalStoryPage
        backgroundKey={`${archive.id}-${lineIndex}-${line?.sceneId ?? location.sceneId}`}
        backgroundAsset={scene.asset}
        backgroundAlt={scene.alt}
        speaker={line?.speaker ?? null}
        text={line?.text ?? '这场约会没有可播放的正文。'}
        portrait={line ? getPortrait(line, lineIndex) : null}
        actLabel={`${characterName} · ${location.label} · ${line?.stageLabel ?? '约会回放'}`}
        theme="pink"
        controls={
          <nav className="gal-main-story__controls" aria-label="约会回放翻页">
            <button
              type="button"
              className="gal-main-story__icon-button"
              disabled={lineIndex <= 0}
              aria-label="上一句"
              onClick={() => setLineIndex(index => Math.max(0, index - 1))}
            >
              ←
            </button>
            <GalStoryPagePager currentPage={lineIndex} pageCount={lines.length} onSelectPage={setLineIndex} />
            <button
              type="button"
              className="gal-main-story__icon-button is-primary"
              aria-label={isLastLine ? '返回约会档案' : '下一句'}
              onClick={() => (isLastLine ? onClose() : setLineIndex(index => index + 1))}
            >
              {isLastLine ? '✓' : '→'}
            </button>
            <button type="button" className="gal-main-story__skip" onClick={onClose}>
              返回目录
            </button>
          </nav>
        }
      />
    </section>
  );
}
