import { START_MENU_CURSOR, START_MENU_ITEMS } from '../data/menuAssets';
import { startNewSession } from '../services/gameSession';
import { useGameStore } from '../stores/gameStore';
import { resolveAssetPath } from '../utils/assetPath';
import { useEffect, useRef, useState } from 'react';
import './Menu.css';

interface StartScreenProps {
  hasPersistedSave: boolean;
  isCheckingSaves: boolean;
  onContinue: () => void;
}

export default function StartScreen({ hasPersistedSave, isCheckingSaves, onContinue }: StartScreenProps) {
  const hasSession = useGameStore((state: { hasSession: boolean }) => state.hasSession);
  const canContinue = hasSession || hasPersistedSave;
  const audioRef = useRef<HTMLAudioElement>(null);
  const menuButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [audioState, setAudioState] = useState<'pending' | 'playing' | 'blocked'>('pending');
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);

  const playTitleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    void audio
      .play()
      .then(() => setAudioState('playing'))
      .catch(() => setAudioState('blocked'));
  };

  const focusAdjacentMenuItem = (currentIndex: number, direction: -1 | 1) => {
    for (let offset = 1; offset <= START_MENU_ITEMS.length; offset += 1) {
      const nextIndex = (currentIndex + direction * offset + START_MENU_ITEMS.length) % START_MENU_ITEMS.length;
      const nextItem = START_MENU_ITEMS[nextIndex];
      const disabled = nextItem.id === 'continue' && !canContinue;

      if (!disabled) {
        setSelectedMenuIndex(nextIndex);
        menuButtonRefs.current[nextIndex]?.focus();
        return;
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.volume = 0.7;
    playTitleMusic();

    const retryEvents: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart'];
    retryEvents.forEach(eventName => window.addEventListener(eventName, playTitleMusic, { passive: true }));

    return () => {
      retryEvents.forEach(eventName => window.removeEventListener(eventName, playTitleMusic));
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return (
    <main className="start-screen" data-audio-state={audioState}>
      <img className="start-screen-background" src={resolveAssetPath('/artsource/ui/title_bg.png')} alt="" />
      <img
        className="start-screen-foreground"
        src={resolveAssetPath('/artsource/ui/title_bg3a.png')}
        alt=""
        aria-hidden="true"
      />
      <audio
        ref={audioRef}
        id="title-op-music"
        src={resolveAssetPath('/artsource/music/op.mp3')}
        autoPlay
        loop
        preload="auto"
        aria-label="标题画面音乐"
      />

      <section className="start-screen-content" aria-labelledby="game-title">
        <img
          id="game-title"
          className="start-screen-title"
          src={resolveAssetPath('/artsource/ui/title.png')}
          alt="校园心动回忆"
        />
        <div className="start-menu" aria-label="开始菜单" aria-busy={isCheckingSaves}>
          {START_MENU_ITEMS.map((item, index) => {
            const disabled = item.id === 'continue' && !canContinue;
            const action = item.id === 'restart' ? startNewSession : item.id === 'continue' ? onContinue : undefined;
            const selected = selectedMenuIndex === index;

            return (
              <button
                ref={element => {
                  menuButtonRefs.current[index] = element;
                }}
                key={item.id}
                id={`start-${item.id}`}
                type="button"
                className={`start-menu-item ${selected ? 'is-selected' : ''}`}
                aria-label={item.label}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                onMouseEnter={() => {
                  setSelectedMenuIndex(disabled ? 0 : index);
                }}
                onFocus={() => {
                  if (disabled) {
                    setSelectedMenuIndex(0);
                    menuButtonRefs.current[0]?.focus();
                    return;
                  }

                  setSelectedMenuIndex(index);
                }}
                onPointerDown={event => {
                  if (!disabled) return;

                  event.preventDefault();
                  setSelectedMenuIndex(0);
                }}
                onKeyDown={event => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    focusAdjacentMenuItem(index, 1);
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    focusAdjacentMenuItem(index, -1);
                  }
                }}
                onClick={event => {
                  if (disabled) {
                    event.preventDefault();
                    setSelectedMenuIndex(0);
                    return;
                  }

                  playTitleMusic();
                  action?.();
                }}
              >
                {selected && (
                  <img
                    className="start-menu-cursor"
                    src={resolveAssetPath(START_MENU_CURSOR)}
                    alt=""
                    aria-hidden="true"
                  />
                )}
                <img
                  className="start-menu-image normal"
                  src={resolveAssetPath(item.normal)}
                  alt=""
                  aria-hidden="true"
                />
                <img
                  className="start-menu-image active"
                  src={resolveAssetPath(item.active)}
                  alt=""
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
