import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  getFirstUnlockedCharacterArchiveSlot,
  resolveCharacterArchiveSlots,
  type ResolvedCharacterArchiveSlot,
} from '../data/characterArchive';
import { useGameStore } from '../stores/gameStore';
import { useCardStore } from '../stores/cardStore';
import { useMapStore } from '../stores/mapStore';
import {
  clampPlayerAttribute,
  clampPlayerResource,
  PLAYER_RESOURCE_MAX,
  resolveTokimekiAttributeStage,
  resolveTokimekiRadarAttributes,
  TOKIMEKI_ATTRIBUTE_STAGE_MAX,
  TOKIMEKI_ATTRIBUTE_MAX,
  usePlayerStore,
} from '../stores/playerStore';
import { resolveAssetPath } from '../utils/assetPath';
import './CharacterArchivePanel.css';

interface CharacterArchivePanelProps {
  onClose: () => void;
}

type ArchiveView = 'main' | 'detail';

const DESIGN_SIZE = 1024;

const GRID_COL_CENTERS = [640, 788, 936];
const GRID_ROW_CENTERS = [160, 395, 630, 865];

const DETAIL_BIO_ROWS = [275, 330, 385, 440, 495];
const UNREGISTERED = '未登记';
const PLAYER_PROFILE_FIELDS = ['生日', '身高', '体重', '血型'] as const;

const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const RADAR_AXES = [
  { label: '文系', x: 0, y: -1, labelX: 0, labelY: -174, anchor: 'middle' },
  { label: '理系', x: 0.866, y: -0.5, labelX: 174, labelY: -102, anchor: 'start' },
  { label: '艺术', x: 0.866, y: 0.5, labelX: 174, labelY: 102, anchor: 'start' },
  { label: '运动', x: 0, y: 1, labelX: 0, labelY: 184, anchor: 'middle' },
  { label: '容姿', x: -0.866, y: 0.5, labelX: -174, labelY: 102, anchor: 'end' },
  { label: '根性', x: -0.866, y: -0.5, labelX: -174, labelY: -102, anchor: 'end' },
] as const;

const RADAR_RADIUS = 132;
const RADAR_STAGE_SCALES = [0.2, 0.4, 0.6, 0.8, 1] as const;

function slotPosition(index: number): CSSProperties {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    left: `${((GRID_COL_CENTERS[col] ?? GRID_COL_CENTERS[0]) / DESIGN_SIZE) * 100}%`,
    top: `${((GRID_ROW_CENTERS[row] ?? GRID_ROW_CENTERS[GRID_ROW_CENTERS.length - 1]) / DESIGN_SIZE) * 100}%`,
  };
}

function radarRingPoints(scale: number) {
  return RADAR_AXES.map(axis => `${axis.x * RADAR_RADIUS * scale},${axis.y * RADAR_RADIUS * scale}`).join(' ');
}

function radarValuePoints(values: readonly number[]) {
  return RADAR_AXES.map((axis, index) => {
    const stage = resolveTokimekiAttributeStage(values[index] ?? 0);
    const scale = RADAR_STAGE_SCALES[stage - 1] ?? 1;
    return `${axis.x * RADAR_RADIUS * scale},${axis.y * RADAR_RADIUS * scale}`;
  }).join(' ');
}

function PlayerGauge({ label, value, tone }: { label: string; value: number; tone: 'stamina' | 'stress' }) {
  const normalized = clampPlayerResource(value);
  const fillPercent = (normalized / PLAYER_RESOURCE_MAX) * 100;
  const icon =
    tone === 'stamina'
      ? '/artsource/ui/archive/player-status/heart.png'
      : '/artsource/ui/archive/player-status/pressure-icon.png';
  return (
    <div className={`character-archive-player-gauge is-${tone}`}>
      <span className="character-archive-player-gauge-icon" aria-hidden="true">
        <img src={resolveAssetPath(icon)} alt="" />
      </span>
      <span className="character-archive-player-gauge-label">{label}</span>
      <span
        className="character-archive-player-gauge-track"
        role="meter"
        aria-label={`${label} ${normalized}`}
        aria-valuemin={0}
        aria-valuemax={PLAYER_RESOURCE_MAX}
        aria-valuenow={normalized}
      >
        <img
          className="character-archive-player-gauge-track-art"
          src={resolveAssetPath('/artsource/ui/archive/player-status/stamina-track.png')}
          alt=""
          aria-hidden="true"
        />
        <span className="character-archive-player-gauge-fill" style={{ width: `${fillPercent}%` }} />
      </span>
      <span className="character-archive-player-gauge-value">{normalized}</span>
    </div>
  );
}

function PlayerRadar({ values }: { values: readonly number[] }) {
  const normalizedValues = values.map(clampPlayerAttribute);
  const stages = normalizedValues.map(resolveTokimekiAttributeStage);
  const ariaValue = RADAR_AXES
    .map(
      (axis, index) =>
        `${axis.label} ${normalizedValues[index] ?? 0}/${TOKIMEKI_ATTRIBUTE_MAX}，阶段 ${stages[index] ?? 1}/${TOKIMEKI_ATTRIBUTE_STAGE_MAX}`,
    )
    .join('，');

  return (
    <svg
      className="character-archive-player-radar"
      viewBox="-245 -205 490 410"
      role="img"
      aria-label={`主角六维能力（上限${TOKIMEKI_ATTRIBUTE_MAX}）：${ariaValue}`}
    >
      <title>主角六维能力</title>
      <g className="character-archive-player-radar-grid" aria-hidden="true">
        {RADAR_STAGE_SCALES.map(scale => (
          <polygon key={scale} points={radarRingPoints(scale)} />
        ))}
        {RADAR_AXES.map(axis => (
          <line key={axis.label} x1={0} y1={0} x2={axis.x * RADAR_RADIUS} y2={axis.y * RADAR_RADIUS} />
        ))}
      </g>

      <polygon className="character-archive-player-radar-value" points={radarValuePoints(normalizedValues)} />
      {RADAR_AXES.map((axis, index) => {
        const value = normalizedValues[index] ?? 0;
        return (
          <g key={axis.label} className="character-archive-player-radar-label-group">
            <text
              className="character-archive-player-radar-label"
              x={axis.labelX}
              y={axis.labelY}
              textAnchor={axis.anchor}
              dominantBaseline="middle"
            >
              <tspan className="character-archive-player-radar-label-name">{axis.label}</tspan>
              <tspan className="character-archive-player-radar-label-value" dx="8">
                {value}
              </tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PlayerStatusSide() {
  const intelligence = usePlayerStore(state => state.intelligence);
  const athletics = usePlayerStore(state => state.athletics);
  const art = usePlayerStore(state => state.art);
  const charm = usePlayerStore(state => state.charm);
  const stamina = usePlayerStore(state => state.stamina);
  const stress = usePlayerStore(state => state.stress);
  const money = usePlayerStore(state => state.money);
  // Keep the six-axis presentation compatible with the current save schema until player abilities are expanded.
  const radar = resolveTokimekiRadarAttributes({ intelligence, athletics, art, charm });
  const radarValues = [
    radar.humanities,
    radar.science,
    radar.art,
    radar.athletics,
    radar.appearance,
    radar.perseverance,
  ];

  return (
    <div className="character-archive-player-view" aria-label="主角属性">
      <img
        className="character-archive-player-paper-patch"
        src={resolveAssetPath('/artsource/ui/archive/bg_ht01.png')}
        alt=""
        aria-hidden="true"
        draggable="false"
      />
      <div className="character-archive-player-sheet">
        <h2 className="character-archive-player-heading">主角</h2>

        <div className="character-archive-player-summary">
          <dl className="character-archive-player-profile" aria-label="主角基础档案">
            {PLAYER_PROFILE_FIELDS.map(field => (
              <div key={field}>
                <dt>
                  <img
                    src={resolveAssetPath('/artsource/ui/archive/player-status/heart.png')}
                    alt=""
                    aria-hidden="true"
                  />
                  {field}
                </dt>
                <dd>{UNREGISTERED}</dd>
              </div>
            ))}
          </dl>

          <div className="character-archive-player-state-block">
            <div className="character-archive-player-vitals" aria-label="主角状态">
              <PlayerGauge label="体力" value={stamina} tone="stamina" />
              <PlayerGauge label="压力" value={stress} tone="stress" />
            </div>

            <div className="character-archive-player-money">
              <span>零用钱</span>
              <strong>{money} 円</strong>
            </div>
          </div>
        </div>

        <PlayerRadar values={radarValues} />
      </div>
    </div>
  );
}

function ArchiveGridSide({
  slots,
  selectedIndex,
  onSelect,
}: {
  slots: readonly ResolvedCharacterArchiveSlot[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="character-archive-slot-grid" role="listbox" aria-label="角色档案槽位">
      {slots.map((slot, index) => {
        const unlocked = slot.unlocked && slot.character;
        return (
          <button
            key={slot.slot}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            className={`character-archive-slot ${slot.unlocked ? 'is-unlocked' : 'is-locked'} ${
              index === selectedIndex ? 'is-selected' : ''
            }`}
            style={slotPosition(index)}
            aria-label={unlocked ? `查看${slot.character?.name}的档案` : `查看未解锁角色 ${slot.slot}`}
            onClick={() => onSelect(index)}
          >
            {index === selectedIndex && (
              <img
                className="character-archive-slot-cursor"
                src={resolveAssetPath(slot.cursor)}
                alt=""
                aria-hidden="true"
              />
            )}
            <img
              className="character-archive-slot-icon"
              src={resolveAssetPath(slot.unlocked ? slot.unlockedIcon : slot.lockedIcon)}
              alt={unlocked ? slot.character?.name : '未解锁角色'}
              draggable="false"
            />
          </button>
        );
      })}
    </div>
  );
}

function RelationshipBar({ label, value, top }: { label: string; value: number; top: number }) {
  const normalized = clampPercent(value);
  return (
    <div className="character-archive-relationship" style={{ top: `${(top / DESIGN_SIZE) * 100}%` }}>
      <span className="character-archive-relationship-label">{label}</span>
      <span
        className="character-archive-relationship-track"
        role="meter"
        aria-label={`${label} ${normalized}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalized}
      >
        <span className="character-archive-relationship-fill" style={{ width: `${normalized}%` }} />
      </span>
      <span className="character-archive-relationship-value">{normalized}</span>
    </div>
  );
}

function ArchiveDetailView({
  slot,
  locations,
  onBack,
  onMove,
}: {
  slot: ResolvedCharacterArchiveSlot;
  locations: ReturnType<typeof useMapStore.getState>['locations'];
  onBack: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const character = slot.character;
  const locationNames = character
    ? character.favoriteLocations
        .map(id => locations[id]?.name)
        .filter(Boolean)
        .join('、') || UNREGISTERED
    : null;
  const description = character?._cardData.data.description.trim() ?? '';

  return (
    <div className="character-archive-character-detail-view">
      {character && <span className="character-archive-detail-type">{character.type}</span>}
      <h3 id="character-archive-detail-heading" className="character-archive-detail-name">
        {character ? character.name : '???'}
      </h3>

      {DETAIL_BIO_ROWS.map(centerY => (
        <span
          key={centerY}
          className="character-archive-bio-value character-archive-bio-value--detail"
          style={{ left: '28%', top: `${((centerY - 21) / DESIGN_SIZE) * 100}%` }}
        >
          {UNREGISTERED}
        </span>
      ))}

      {character ? (
        <>
          <RelationshipBar label="好感" value={character.affection} top={570} />
          <RelationshipBar label="友情" value={character.friendship} top={632} />
          <RelationshipBar label="恋爱" value={character.romance} top={694} />
          <p className="character-archive-detail-locations">常去地点：{locationNames}</p>
          <p className="character-archive-description">{description || '暂无简介。'}</p>
          <img
            className="character-archive-detail-icon is-unlocked"
            src={resolveAssetPath(slot.unlockedIcon)}
            alt={character.name}
            draggable="false"
          />
        </>
      ) : (
        <>
          <p className="character-archive-locked-hint">该档案尚未解锁。完成对应剧情或取得角色卡后再来查看。</p>
          <img
            className="character-archive-detail-icon is-locked"
            src={resolveAssetPath(slot.lockedIcon)}
            alt="未解锁角色"
            draggable="false"
          />
        </>
      )}

      <button
        type="button"
        className="character-archive-guide character-archive-guide--left"
        aria-label="上一个角色档案"
        onClick={() => onMove(-1)}
      >
        <img src={resolveAssetPath('/artsource/ui/archive/L_data.png')} alt="" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="character-archive-guide character-archive-guide--right"
        aria-label="下一个角色档案"
        onClick={() => onMove(1)}
      >
        <img src={resolveAssetPath('/artsource/ui/archive/R_data.png')} alt="" aria-hidden="true" />
      </button>
      <button type="button" className="character-archive-back-button" onClick={onBack}>
        <span className="character-archive-circle-icon" aria-hidden="true">
          ×
        </span>
        返回
      </button>
    </div>
  );
}

export default function CharacterArchivePanel({ onClose }: CharacterArchivePanelProps) {
  const [view, setView] = useState<ArchiveView>('main');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const targets = useCardStore(state => state.targets);
  const completedMainStoryEventIds = useGameStore(state => state.mainStory.completedEventIds);
  const locations = useMapStore(state => state.locations);

  const slots = useMemo(
    () => resolveCharacterArchiveSlots(targets, completedMainStoryEventIds),
    [completedMainStoryEventIds, targets],
  );
  const firstUnlockedSlotIndex = useMemo(() => getFirstUnlockedCharacterArchiveSlot(slots), [slots]);
  const activeSlotIndex = selectedSlotIndex ?? firstUnlockedSlotIndex;
  const activeSlot = slots[activeSlotIndex] ?? slots[0];
  const background = view === 'main' ? '/artsource/ui/archive/bg_data1.png' : '/artsource/ui/archive/bg_data2.png';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      setSelectedSlotIndex(current => {
        const index = current ?? activeSlotIndex;
        return (index + direction + slots.length) % slots.length;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlotIndex, onClose, slots.length]);

  const selectCharacterSlot = (index: number) => {
    setSelectedSlotIndex(index);
    setView('detail');
  };

  return (
    <section
      className="character-archive-panel"
      role="dialog"
      aria-modal="true"
      aria-label="数据"
      data-character-archive="true"
      data-view={view}
      data-selected-slot={activeSlot.slot}
      data-selected-slot-unlocked={String(activeSlot.unlocked)}
      data-selected-name={activeSlot.character?.name}
      data-selected-target-id={activeSlot.character?.id}
    >
      <div className="character-archive-stage">
        <img
          className="character-archive-background"
          src={resolveAssetPath(background)}
          alt=""
          aria-hidden="true"
          draggable="false"
        />

        {view === 'main' ? (
          <>
            <PlayerStatusSide />
            <ArchiveGridSide slots={slots} selectedIndex={activeSlotIndex} onSelect={selectCharacterSlot} />
            <button type="button" className="character-archive-close" aria-label="关闭数据并返回地图" onClick={onClose}>
              <span className="character-archive-circle-icon" aria-hidden="true">
                ×
              </span>
              返回
            </button>
          </>
        ) : (
          <ArchiveDetailView
            slot={activeSlot}
            locations={locations}
            onBack={() => setView('main')}
            onMove={direction => {
              setSelectedSlotIndex(current => {
                const index = current ?? activeSlotIndex;
                return (index + direction + slots.length) % slots.length;
              });
            }}
          />
        )}
      </div>
    </section>
  );
}
