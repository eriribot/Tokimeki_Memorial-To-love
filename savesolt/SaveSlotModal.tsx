import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SAVE_SLOT, gameSaveApi, toSaveSummary, type SaveProbeResult, type SaveSummary } from '../save';
import { PERIODS } from '../stores/gameStore';
import { LOCATIONS } from '../stores/mapStore';
import './SaveSlotModal.css';

export type SaveSlotMode = 'save' | 'load';

interface SaveSlotModalProps {
  mode: SaveSlotMode;
  onClose: () => void;
  onSavesChanged?: (hasSaves: boolean) => void;
}

interface SlotView {
  id: string;
  number: number;
  isAutosave?: boolean;
  save?: SaveSummary;
}

interface PendingSlotAction {
  kind: SaveSlotMode | 'delete';
  slot: SlotView;
}

const SAVE_SLOT_COUNT = 8;
const SAVE_SLOT_IDS = Array.from(
  { length: SAVE_SLOT_COUNT },
  (_, index) => `slot-${String(index + 1).padStart(2, '0')}`,
);

function formatSaveTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function formatClock(value: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
}

function getLocationLabel(locationId?: string): string {
  if (!locationId) return '未知地点';
  return Object.values(LOCATIONS).find(location => location.id === locationId)?.name ?? locationId;
}

function getPeriodLabel(periodIndex?: number): string {
  if (periodIndex === undefined) return '未知时段';
  return PERIODS[periodIndex]?.label ?? `时段 ${periodIndex + 1}`;
}

function describeBackend(probe: SaveProbeResult | null): string {
  if (!probe) return '正在检查存档位置';
  return 'SillyTavern 本地存档与对话档';
}

function getSlotLabel(slot: SlotView): string {
  return slot.isAutosave ? '自动存档' : `槽位 ${String(slot.number).padStart(2, '0')}`;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function SaveSlotModal({ mode, onClose, onSavesChanged }: SaveSlotModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [clock, setClock] = useState(() => new Date());
  const [probe, setProbe] = useState<SaveProbeResult | null>(null);
  const [saves, setSaves] = useState<SaveSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busySlotId, setBusySlotId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingSlotAction | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const slots = useMemo<SlotView[]>(() => {
    const savesBySlot = new Map(saves.map(save => [save.slotId, save]));
    const manualSlots = SAVE_SLOT_IDS.map((id, index) => ({ id, number: index + 1, save: savesBySlot.get(id) }));
    if (mode === 'save') return manualSlots;
    return [
      { id: DEFAULT_SAVE_SLOT, number: 0, isAutosave: true, save: savesBySlot.get(DEFAULT_SAVE_SLOT) },
      ...manualSlots,
    ];
  }, [mode, saves]);

  const applySaveList = useCallback(
    (nextSaves: SaveSummary[]) => {
      setSaves(nextSaves);
      onSavesChanged?.(nextSaves.length > 0);
    },
    [onSavesChanged],
  );

  const refreshSaveList = useCallback(async (): Promise<SaveSummary[]> => {
    const result = await gameSaveApi.list();
    applySaveList(result.saves);
    return result.saves;
  }, [applySaveList]);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      setIsLoading(true);
      setNotice(null);

      try {
        const nextProbe = await gameSaveApi.probe(true);
        const result = await gameSaveApi.list();
        if (cancelled) return;

        setProbe(nextProbe);
        applySaveList(result.saves);
      } catch (error) {
        if (!cancelled) {
          setNotice({ kind: 'error', text: toErrorMessage(error) });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void refresh();
    return () => {
      cancelled = true;
    };
  }, [applySaveList, mode]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (pendingAction) {
        setPendingAction(null);
      } else if (!busySlotId) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busySlotId, onClose, pendingAction]);

  const requestSlotAction = (slot: SlotView) => {
    if (isLoading || busySlotId || (mode === 'load' && !slot.save)) return;
    setNotice(null);
    setPendingAction({ kind: mode, slot });
  };

  const requestDelete = (event: MouseEvent<HTMLButtonElement>, slot: SlotView) => {
    event.preventDefault();
    event.stopPropagation();
    if (isLoading || busySlotId || !slot.save) return;
    setNotice(null);
    setPendingAction({ kind: 'delete', slot });
  };

  const executeSlotAction = async () => {
    const action = pendingAction;
    if (!action) return;
    const { slot } = action;

    setPendingAction(null);
    setBusySlotId(slot.id);
    setNotice(null);

    try {
      if (action.kind === 'delete') {
        const saveUuid = slot.save?.saveUuid;
        if (!saveUuid) throw new Error(`${getSlotLabel(slot)}没有可删除的存档`);
        const result = await gameSaveApi.delete(slot.id, saveUuid);
        const refreshedSaves = await refreshSaveList();
        const replacement = refreshedSaves.find(save => save.slotId === slot.id);
        setNotice({
          kind: 'success',
          text: result.deleted
            ? `已删除${getSlotLabel(slot)}`
            : replacement
              ? `${getSlotLabel(slot)}已变化，未删除，列表已刷新`
              : `${getSlotLabel(slot)}已经为空，列表已刷新`,
        });
      } else if (action.kind === 'save') {
        const result = await gameSaveApi.save(slot.id, slot.save?.saveUuid);
        const summary = toSaveSummary(result.save);
        setSaves(current => [summary, ...current.filter(save => save.saveUuid !== summary.saveUuid)]);
        onSavesChanged?.(true);
        setNotice({ kind: 'success', text: `已保存到${getSlotLabel(slot)}` });
      } else {
        await gameSaveApi.load(slot.id, slot.save?.saveUuid);
        onSavesChanged?.(true);
        onClose();
      }
    } catch (error) {
      if (action.kind === 'delete') {
        try {
          await refreshSaveList();
        } catch {
          // 保留原始删除错误；再次打开界面会重新探测权威文件列表。
        }
      }
      setNotice({ kind: 'error', text: toErrorMessage(error) });
    } finally {
      setBusySlotId(null);
    }
  };

  const title = mode === 'save' ? '保存数据' : '读取数据';
  const actionLabel = mode === 'save' ? '保存' : '读取';
  const confirmTarget = pendingAction?.slot ?? null;
  const isDeleteConfirmation = pendingAction?.kind === 'delete';

  return (
    <div className="save-slot-overlay" data-save-mode={mode}>
      <section
        className="save-slot-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-slot-title"
        aria-busy={isLoading || busySlotId !== null}
      >
        <div className="save-slot-livearea-background" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>

        <div className="save-slot-statusbar" aria-label="设备状态">
          <span className="save-slot-system-name">ToLOVE / SAVE DATA</span>
          <time dateTime={clock.toISOString()}>{formatClock(clock)}</time>
          <span className="save-slot-device-icons" aria-hidden="true">
            <span className="save-slot-wifi">
              <i />
              <i />
              <i />
            </span>
            <span className="save-slot-battery">
              <i />
            </span>
          </span>
        </div>

        <header className="save-slot-header">
          <div className="save-slot-brand" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <p>DATA MANAGEMENT</p>
            <h2 id="save-slot-title">{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="save-slot-close"
            onClick={onClose}
            disabled={busySlotId !== null}
            aria-label="关闭存档界面"
          >
            ×
          </button>
        </header>

        <div className={`save-slot-backend ${probe ? 'is-tavern' : 'is-checking'}`}>
          <span className="save-slot-backend-dot" aria-hidden="true" />
          <strong>{describeBackend(probe)}</strong>
          {probe && <span>{saves.length} 个存档</span>}
          {probe?.storagePath && <span>{probe.storagePath}</span>}
          {probe?.uuidMode === 'math-random' && <span>兼容 UUID 模式</span>}
        </div>

        {notice && (
          <p className={`save-slot-notice is-${notice.kind}`} role="status">
            {notice.text}
          </p>
        )}

        <div className="save-slot-list" aria-label={`${title}槽位`}>
          {slots.map(slot => {
            const save = slot.save;
            const preview = save?.preview;
            const isEmpty = !save;
            const isBusy = busySlotId === slot.id;
            const disabled = isLoading || busySlotId !== null || (mode === 'load' && isEmpty);

            return (
              <div
                key={slot.id}
                className={`save-slot-item ${isEmpty ? 'is-empty' : 'has-data'} ${isBusy ? 'is-busy' : ''}`}
                data-save-slot-item={slot.id}
              >
                <button
                  type="button"
                  className={`save-slot-card ${isEmpty ? 'is-empty' : 'has-data'} ${isBusy ? 'is-busy' : ''}`}
                  data-save-slot={slot.id}
                  disabled={disabled}
                  onClick={() => requestSlotAction(slot)}
                  aria-label={
                    isEmpty
                      ? `${getSlotLabel(slot)}，空存档`
                      : `${getSlotLabel(slot)}，${preview?.date ? `${preview.date.month}月${preview.date.day}日` : `第 ${preview?.day ?? '?'} 天`}，${actionLabel}`
                  }
                >
                  <span className="save-slot-bubble" aria-hidden="true">
                    <span className="save-slot-bubble-shine" />
                    <small>{slot.isAutosave ? 'AUTO' : 'SLOT'}</small>
                    <b>{String(slot.number).padStart(2, '0')}</b>
                    <span className="save-slot-bubble-state">{isEmpty ? '+' : '✓'}</span>
                  </span>

                  {save ? (
                    <span className="save-slot-card-body">
                      <span className="save-slot-summary">
                        <strong>
                          {preview?.date
                            ? `${preview.date.month}月${preview.date.day}日 · 开学第 ${preview.day} 天`
                            : `第 ${preview?.day ?? '?'} 天`}{' '}
                          · {getPeriodLabel(preview?.periodIndex)}
                        </strong>
                        <span>
                          {preview?.playerName || '主人公'} / {getLocationLabel(preview?.locationId)}
                        </span>
                      </span>
                      <span className="save-slot-meta">
                        <time dateTime={save.updatedAt}>{formatSaveTime(save.updatedAt)}</time>
                        <span>REV.{save.revision}</span>
                      </span>
                      <span className="save-slot-uuid" title={save.saveUuid}>
                        UUID {save.saveUuid}
                      </span>
                      <b className="save-slot-action-label">{isBusy ? '处理中…' : actionLabel}</b>
                    </span>
                  ) : (
                    <span className="save-slot-card-body save-slot-empty-copy">
                      <strong>EMPTY SLOT</strong>
                      <span>{mode === 'save' ? '建立新存档' : '尚无存档数据'}</span>
                      <span className="save-slot-empty-rule" aria-hidden="true" />
                      <b className="save-slot-action-label">{mode === 'save' ? '选择' : '不可读取'}</b>
                    </span>
                  )}
                </button>
                {save && (
                  <button
                    type="button"
                    className="save-slot-delete"
                    data-delete-save-slot={slot.id}
                    disabled={isLoading || busySlotId !== null}
                    onClick={event => requestDelete(event, slot)}
                    aria-label={`删除${getSlotLabel(slot)}`}
                  >
                    {isBusy ? '处理中' : '删除'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <footer className="save-slot-footer">
          <span>○ 选择</span>
          <span>× 返回</span>
          <span>{mode === 'save' ? '保存会记录当前游戏状态' : '读取后将恢复该槽位的状态'}</span>
        </footer>

        {confirmTarget && (
          <div className="save-slot-confirm-layer">
            <section
              className="save-slot-confirm"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="save-confirm-title"
            >
              <p>{isDeleteConfirmation ? 'DELETE DATA' : mode === 'save' ? 'SAVE DATA' : 'LOAD DATA'}</p>
              <h3 id="save-confirm-title">
                {isDeleteConfirmation
                  ? `删除${getSlotLabel(confirmTarget)}？`
                  : mode === 'save' && confirmTarget.save
                    ? `覆盖${getSlotLabel(confirmTarget)}？`
                    : `${actionLabel}${getSlotLabel(confirmTarget)}？`}
              </h3>
              <span>
                {isDeleteConfirmation
                  ? confirmTarget.isAutosave
                    ? '当前自动存档和对应的对话记录会永久删除。继续游玩或返回标题后，系统会重新建立自动存档。'
                    : '主存档和对应的对话记录会永久删除，此操作无法撤销。'
                  : mode === 'save' && confirmTarget.save
                    ? '原有记录会被当前进度替换，但存档 UUID 保持不变。'
                    : mode === 'save'
                      ? '将在这个空槽位建立一份新存档。'
                      : '当前未保存的游戏进度将会丢失。'}
              </span>
              <div>
                <button
                  type="button"
                  className="is-secondary"
                  onClick={() => setPendingAction(null)}
                  autoFocus={isDeleteConfirmation}
                >
                  取消
                </button>
                <button
                  type="button"
                  className={isDeleteConfirmation ? 'is-danger' : 'is-primary'}
                  onClick={() => void executeSlotAction()}
                  autoFocus={!isDeleteConfirmation}
                >
                  {isDeleteConfirmation ? '确认删除' : `确定${actionLabel}`}
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
