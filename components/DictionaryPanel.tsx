import { useEffect, useRef, useState } from 'react';
import { DICTIONARY_ENTRIES } from '../data/dictionary';
import { resolveAssetPath } from '../utils/assetPath';
import './DictionaryPanel.css';

interface DictionaryPanelProps {
  onClose: () => void;
}

type DictionaryView = 'list' | 'detail';

export default function DictionaryPanel({ onClose }: DictionaryPanelProps) {
  const [view, setView] = useState<DictionaryView>('list');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selectedEntry = DICTIONARY_ENTRIES[selectedIndex];

  const showEntry = (index: number) => {
    setSelectedIndex(index);
    setView('detail');
  };

  const moveEntry = (direction: -1 | 1) => {
    setSelectedIndex(current => (current + direction + DICTIONARY_ENTRIES.length) % DICTIONARY_ENTRIES.length);
  };

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (view !== 'detail') return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setSelectedIndex(current => (current - 1 + DICTIONARY_ENTRIES.length) % DICTIONARY_ENTRIES.length);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setSelectedIndex(current => (current + 1) % DICTIONARY_ENTRIES.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, view]);

  return (
    <section
      className="dictionary-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dictionary-panel-title"
      data-view={view}
    >
      <img
        className="dictionary-panel__background"
        src={resolveAssetPath('/artsource/ui/bg_ji.png')}
        alt=""
        aria-hidden="true"
      />

      <header id="dictionary-panel-title" className="dictionary-panel__book-title">
        <span>ToLOVEる大百科</span>
      </header>

      <button
        ref={closeButtonRef}
        type="button"
        className="dictionary-panel__close"
        aria-label="关闭辞典并返回地图"
        onClick={onClose}
      >
        <span aria-hidden="true">×</span>
        返回地图
      </button>

      {view === 'list' ? (
        <div className="dictionary-panel__content dictionary-panel__list-view">
          <div className="dictionary-panel__section-heading">
            <h2>词条一览</h2>
            <span>共 {DICTIONARY_ENTRIES.length} 条</span>
          </div>
          <div className="dictionary-panel__entry-list" aria-label="辞典词条">
            {DICTIONARY_ENTRIES.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                className={`dictionary-panel__entry ${selectedIndex === index ? 'is-selected' : ''}`}
                onMouseEnter={() => setSelectedIndex(index)}
                onFocus={() => setSelectedIndex(index)}
                onClick={() => showEntry(index)}
              >
                {entry.name}
              </button>
            ))}
          </div>
          <p className="dictionary-panel__hint">选择词条查看详细说明</p>
        </div>
      ) : (
        <>
          <article className="dictionary-panel__content dictionary-panel__detail-view">
            <div className="dictionary-panel__detail-heading">
              <h2>{selectedEntry.title}</h2>
              <span>{selectedEntry.title}</span>
            </div>
            <p className="dictionary-panel__description">{selectedEntry.description}</p>
            <div className="dictionary-panel__detail-footer">
              <button type="button" className="dictionary-panel__back-to-list" onClick={() => setView('list')}>
                返回词条一览
              </button>
              <span>
                {selectedIndex + 1} / {DICTIONARY_ENTRIES.length}
              </span>
            </div>
          </article>
          <button
            type="button"
            className="dictionary-panel__guide dictionary-panel__guide--left"
            aria-label="上一个词条"
            onClick={() => moveEntry(-1)}
          >
            <img src={resolveAssetPath('/artsource/ui/ji_guide_L.png')} alt="" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="dictionary-panel__guide dictionary-panel__guide--right"
            aria-label="下一个词条"
            onClick={() => moveEntry(1)}
          >
            <img src={resolveAssetPath('/artsource/ui/ji_guide_R.png')} alt="" aria-hidden="true" />
          </button>
        </>
      )}
    </section>
  );
}
