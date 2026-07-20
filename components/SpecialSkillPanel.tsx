import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { categories, skills, type Skill } from '../data/skills';
import {
  MAX_PRACTICED_SKILLS,
  deriveAllSkillStatuses,
  getCurrentAcademicTerm,
  getEquippedSkillIds,
  getOpenManagementTerm,
  skillGraph,
  useSkillStore,
  type SkillProgressionState,
  type SkillStatus,
} from '../skilllogic';
import { useGameStore } from '../stores/gameStore';
import { resolveAssetPath } from '../utils/assetPath';

interface SpecialSkillPanelProps {
  onClose: () => void;
}

interface TreeLevel {
  depth: number;
  skills: Skill[];
}

type ConnectionState = 'locked' | 'available' | 'learned' | 'practiced';

interface TreeConnection {
  id: string;
  path: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  state: ConnectionState;
  isSelectedRoute: boolean;
}

interface TreeGeometry {
  width: number;
  height: number;
  connections: TreeConnection[];
}

interface FeedbackMessage {
  tone: 'success' | 'error';
  text: string;
}

const skillById = new Map(skills.map(skill => [skill.id, skill]));

const STATUS_LABELS: Record<SkillStatus, string> = {
  locked: '未解锁',
  available: '可学习',
  learned: '已取得',
  equipped: '实践中',
};

const STATUS_MARKS: Record<SkillStatus, string> = {
  locked: '锁',
  available: '可',
  learned: '得',
  equipped: '践',
};

export default function SpecialSkillPanel({ onClose }: SpecialSkillPanelProps) {
  const calendarDate = useGameStore(state => state.date);
  const experience = useSkillStore(state => state.experience);
  const learningHistory = useSkillStore(state => state.learningHistory);
  const termCommits = useSkillStore(state => state.termCommits);
  const learnSkill = useSkillStore(state => state.learnSkill);
  const commitPracticedSkills = useSkillStore(state => state.commitPracticedSkills);

  const progressionState = useMemo<SkillProgressionState>(
    () => ({ experience, learningHistory, termCommits }),
    [experience, learningHistory, termCommits],
  );
  const statuses = useMemo(() => deriveAllSkillStatuses(skillGraph, progressionState), [progressionState]);
  const learnedSkillIds = useMemo(() => new Set(learningHistory.map(record => record.skillId)), [learningHistory]);
  const committedPracticeIds = useMemo(() => getEquippedSkillIds(progressionState), [progressionState]);
  const committedPracticeKey = committedPracticeIds.join('\u0000');
  const managementTerm = useMemo(
    () =>
      getOpenManagementTerm(
        calendarDate,
        termCommits.map(commit => commit.termId),
      ),
    [calendarDate, termCommits],
  );
  const currentTerm = useMemo(() => getCurrentAcademicTerm(calendarDate), [calendarDate]);

  const [activeCategory, setActiveCategory] = useState<Skill['category']>(categories[0].id);
  const [selectedSkill, setSelectedSkill] = useState<Skill>(skills[0]);
  const [practiceDraftIds, setPracticeDraftIds] = useState<string[]>([...committedPracticeIds]);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCompactDrawer, setIsCompactDrawer] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [treeGeometry, setTreeGeometry] = useState<TreeGeometry>({ width: 0, height: 0, connections: [] });

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerCloseRef = useRef<HTMLButtonElement | null>(null);
  const detailRef = useRef<HTMLElement | null>(null);
  const treeCanvasRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previousDetailTriggerRef = useRef<HTMLElement | null>(null);

  const activeCategoryInfo = categories.find(category => category.id === activeCategory) ?? categories[0];
  const categorySkills = useMemo(() => skills.filter(skill => skill.category === activeCategory), [activeCategory]);
  const categorySkillIds = useMemo(() => new Set(categorySkills.map(skill => skill.id)), [categorySkills]);
  const treeLevels = useMemo(() => getTreeLevels(categorySkills), [categorySkills]);
  const maxTreeRows = Math.max(...treeLevels.map(level => level.skills.length), 1);
  const selectedRouteIds = useMemo(
    () => new Set([selectedSkill.id, ...(skillGraph.ancestorsById.get(selectedSkill.id) ?? [])]),
    [selectedSkill.id],
  );
  const practiceDraftIdSet = useMemo(() => new Set(practiceDraftIds), [practiceDraftIds]);
  const practicedSkills = practiceDraftIds
    .map(id => skillById.get(id))
    .filter((skill): skill is Skill => Boolean(skill));
  const selectedStatus = statuses.get(selectedSkill.id) ?? 'locked';
  const selectedPrerequisites = selectedSkill.prerequisites
    .map(id => skillById.get(id))
    .filter((skill): skill is Skill => Boolean(skill));
  const missingPrerequisites = selectedPrerequisites.filter(skill => !learnedSkillIds.has(skill.id));
  const isSelectedDrafted = practiceDraftIdSet.has(selectedSkill.id);
  const isPracticeDraftFull = practiceDraftIds.length >= MAX_PRACTICED_SKILLS && !isSelectedDrafted;

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    return () => previousFocusRef.current?.focus();
  }, []);

  useEffect(() => {
    setPracticeDraftIds([...committedPracticeIds]);
  }, [committedPracticeKey, managementTerm?.id]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const updateMode = () => {
      const { width, height } = overlay.getBoundingClientRect();
      setIsCompactDrawer(width <= 720 || (width > 720 && height <= 500));
    };
    const observer = new ResizeObserver(updateMode);
    observer.observe(overlay);
    updateMode();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isCompactDrawer || !isDetailDrawerOpen) return;
    const frame = window.requestAnimationFrame(() => drawerCloseRef.current?.focus());
    const timer = window.setTimeout(() => drawerCloseRef.current?.focus(), 240);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [isCompactDrawer, isDetailDrawerOpen, selectedSkill.id]);

  useLayoutEffect(() => {
    const canvas = treeCanvasRef.current;
    if (!canvas) return;

    let animationFrame = 0;
    const measureConnections = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const connections = categorySkills.flatMap(skill =>
        skill.prerequisites.flatMap(prerequisiteId => {
          if (!categorySkillIds.has(prerequisiteId)) return [];
          const fromNode = nodeRefs.current.get(prerequisiteId);
          const toNode = nodeRefs.current.get(skill.id);
          if (!fromNode || !toNode) return [];

          const fromRect = fromNode.getBoundingClientRect();
          const toRect = toNode.getBoundingClientRect();
          const fromX = fromRect.right - canvasRect.left;
          const fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;
          const toX = toRect.left - canvasRect.left;
          const toY = toRect.top + toRect.height / 2 - canvasRect.top;
          const targetStatus = statuses.get(skill.id) ?? 'locked';
          const state: ConnectionState =
            practiceDraftIdSet.has(prerequisiteId) && practiceDraftIdSet.has(skill.id)
              ? 'practiced'
              : learnedSkillIds.has(prerequisiteId) && learnedSkillIds.has(skill.id)
                ? 'learned'
                : targetStatus === 'available'
                  ? 'available'
                  : 'locked';

          return [
            {
              id: `${prerequisiteId}->${skill.id}`,
              path: createRoundedConnectorPath(fromX, fromY, toX, toY),
              fromX,
              fromY,
              toX,
              toY,
              state,
              isSelectedRoute: selectedRouteIds.has(prerequisiteId) && selectedRouteIds.has(skill.id),
            },
          ];
        }),
      );

      setTreeGeometry({
        width: Math.max(canvas.scrollWidth, canvasRect.width),
        height: Math.max(canvas.scrollHeight, canvasRect.height),
        connections,
      });
    };

    const scheduleMeasurement = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(measureConnections);
    };
    const resizeObserver = new ResizeObserver(scheduleMeasurement);
    resizeObserver.observe(canvas);
    nodeRefs.current.forEach(node => resizeObserver.observe(node));
    window.addEventListener('resize', scheduleMeasurement);
    scheduleMeasurement();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleMeasurement);
    };
  }, [categorySkillIds, categorySkills, learnedSkillIds, practiceDraftIdSet, selectedRouteIds, statuses]);

  const closeDetailDrawer = () => {
    setIsDetailDrawerOpen(false);
    const trigger = previousDetailTriggerRef.current;
    window.requestAnimationFrame(() => trigger?.focus());
  };

  const selectCategory = (categoryId: Skill['category']) => {
    const firstCategorySkill = skills.find(skill => skill.category === categoryId);
    setActiveCategory(categoryId);
    if (firstCategorySkill) setSelectedSkill(firstCategorySkill);
    setFeedback(null);
    setIsDetailDrawerOpen(false);
  };

  const selectSkill = (skill: Skill, trigger?: HTMLElement) => {
    if (trigger) previousDetailTriggerRef.current = trigger;
    setSelectedSkill(skill);
    setFeedback(null);
    setIsDetailDrawerOpen(true);
  };

  const navigateToSkill = (skill: Skill) => {
    setActiveCategory(skill.category);
    setSelectedSkill(skill);
    setFeedback(null);
  };

  const handleLearn = () => {
    const result = learnSkill(selectedSkill.id, calendarDate);
    if (!result.ok) {
      setFeedback({ tone: 'error', text: result.error.message });
      return;
    }
    setFeedback({
      tone: 'success',
      text: `取得「${selectedSkill.name}」，消耗 ${result.value.spent} EXP。`,
    });
  };

  const togglePracticeDraft = () => {
    if (!managementTerm) {
      setFeedback({ tone: 'error', text: '当前学期的特技配置已确定。' });
      return;
    }
    if (!learnedSkillIds.has(selectedSkill.id)) {
      setFeedback({ tone: 'error', text: '只有已经取得的特技才能加入实践栏。' });
      return;
    }
    setPracticeDraftIds(current => {
      if (current.includes(selectedSkill.id)) return current.filter(id => id !== selectedSkill.id);
      if (current.length >= MAX_PRACTICED_SKILLS) return current;
      return [...current, selectedSkill.id];
    });
    setFeedback(null);
  };

  const commitPracticeDraft = () => {
    const result = commitPracticedSkills(practiceDraftIds, calendarDate);
    if (!result.ok) {
      setFeedback({ tone: 'error', text: result.error.message });
      return;
    }
    setFeedback({ tone: 'success', text: `${formatTerm(result.value.termId)}的实践特技已确定。` });
  };

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (isCompactDrawer && isDetailDrawerOpen) closeDetailDrawer();
      else onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusRoot = isCompactDrawer && isDetailDrawerOpen ? detailRef.current : overlayRef.current;
    if (!focusRoot) return;
    const focusableElements = Array.from(
      focusRoot.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(element => {
      const style = window.getComputedStyle(element);
      return style.visibility !== 'hidden' && style.display !== 'none' && element.getClientRects().length > 0;
    });
    if (focusableElements.length === 0) return;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const termLabel = managementTerm
    ? `${formatTerm(managementTerm.id)}管理中`
    : currentTerm
      ? `${formatTerm(currentTerm.id)}已确定`
      : '5月9日开放';
  const panelStyle = {
    '--skill-accent': activeCategoryInfo.color,
    '--special-paper-texture': `url("${resolveAssetPath('/artsource/SkillUi/skill-menu-paper-bg.png')}")`,
  } as CSSProperties;

  return (
    <div
      ref={overlayRef}
      className="special-skill-overlay"
      role="dialog"
      aria-labelledby="special-skill-title"
      style={panelStyle}
      onKeyDown={handleDialogKeyDown}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="special-skill-window">
        <header className="special-skill-header" inert={isCompactDrawer && isDetailDrawerOpen ? true : undefined}>
          <div className="special-skill-heading">
            <span className="special-skill-kana">SPECIAL SKILL</span>
            <h2 id="special-skill-title">特技</h2>
          </div>

          <div
            className="special-skill-summary"
            aria-label={`EXP ${experience}，取得 ${learningHistory.length}，实践草案 ${practiceDraftIds.length}`}
          >
            <span className="special-summary-stat">
              <small>EXP</small>
              <strong>{experience}</strong>
            </span>
            <span className="special-summary-stat">
              <small>取得</small>
              <strong>{learningHistory.length}</strong>
            </span>
            <span className="special-summary-stat">
              <small>实践</small>
              <strong>
                {practiceDraftIds.length}/{MAX_PRACTICED_SKILLS}
              </strong>
            </span>
            <button ref={closeButtonRef} type="button" className="special-close-button" onClick={onClose}>
              <span aria-hidden="true">←</span>
              <span className="special-close-label">返回</span>
            </button>
          </div>
        </header>

        <nav
          className="special-category-tabs"
          aria-label="特技分类"
          inert={isCompactDrawer && isDetailDrawerOpen ? true : undefined}
        >
          {categories.map(category => (
            <button
              key={category.id}
              type="button"
              className={activeCategory === category.id ? 'active' : ''}
              style={{ '--tab-color': category.color } as CSSProperties}
              aria-pressed={activeCategory === category.id}
              onClick={() => selectCategory(category.id)}
            >
              <span className="special-category-icon" aria-hidden="true">
                {category.icon}
              </span>
              <span className="special-category-label">{category.id}</span>
            </button>
          ))}
        </nav>

        <div className={`special-skill-body ${isDetailDrawerOpen ? 'is-detail-open' : ''}`}>
          <section
            className="special-tree-board"
            aria-label={`${activeCategory}特技树`}
            inert={isCompactDrawer && isDetailDrawerOpen ? true : undefined}
          >
            <div
              ref={treeCanvasRef}
              className="special-tree-canvas"
              style={{ minHeight: `${56 + maxTreeRows * 58}px` }}
            >
              {treeGeometry.width > 0 && treeGeometry.height > 0 && (
                <svg
                  className="special-tree-connectors"
                  viewBox={`0 0 ${treeGeometry.width} ${treeGeometry.height}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  {treeGeometry.connections.map(connection => (
                    <g
                      key={connection.id}
                      className={`special-tree-connection is-${connection.state} ${connection.isSelectedRoute ? 'is-selected-route' : ''}`}
                      data-edge={connection.id}
                    >
                      <path d={connection.path} vectorEffect="non-scaling-stroke" />
                      <circle cx={connection.fromX} cy={connection.fromY} r="3" vectorEffect="non-scaling-stroke" />
                      <circle cx={connection.toX} cy={connection.toY} r="3" vectorEffect="non-scaling-stroke" />
                    </g>
                  ))}
                </svg>
              )}

              {treeLevels.map(level => (
                <div key={level.depth} className="special-tree-level">
                  <div className="special-tree-level-title">
                    <span>STEP</span>
                    <strong>{level.depth + 1}</strong>
                  </div>
                  <div
                    className="special-tree-level-nodes"
                    style={{ gridTemplateRows: `repeat(${maxTreeRows}, 46px)` }}
                  >
                    {level.skills.map((skill, skillIndex) => {
                      const status = statuses.get(skill.id) ?? 'locked';
                      const isSelected = selectedSkill.id === skill.id;
                      const isOnSelectedRoute = selectedRouteIds.has(skill.id) && !isSelected;
                      const isDrafted = practiceDraftIdSet.has(skill.id);
                      const externalPrerequisites = skill.prerequisites
                        .map(id => skillById.get(id))
                        .filter((item): item is Skill => item !== undefined && item.category !== activeCategory);
                      const visibleStatus = isDrafted && status === 'learned' ? '待实践' : STATUS_LABELS[status];

                      return (
                        <button
                          key={skill.id}
                          ref={node => {
                            if (node) nodeRefs.current.set(skill.id, node);
                            else nodeRefs.current.delete(skill.id);
                          }}
                          type="button"
                          className={[
                            'special-tree-node',
                            `is-${status}`,
                            isSelected ? 'selected' : '',
                            isOnSelectedRoute ? 'on-route' : '',
                            isDrafted ? 'is-drafted' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          style={{ gridRow: getDistributedRow(skillIndex, level.skills.length, maxTreeRows) }}
                          aria-current={isSelected ? 'true' : undefined}
                          aria-label={`${skill.name}，${visibleStatus}，${skill.acquisition === 'license' ? '考试取得' : `${skill.cost} EXP`}`}
                          onClick={event => selectSkill(skill, event.currentTarget)}
                        >
                          <span className="special-node-anchor" aria-hidden="true" />
                          <span className="special-cost" aria-hidden="true">
                            {skill.acquisition === 'license' ? '免' : skill.cost}
                          </span>
                          <span className="special-node-name">{skill.name}</span>
                          <span className="special-node-state" title={visibleStatus} aria-hidden="true">
                            {isDrafted && status === 'learned' ? '候' : STATUS_MARKS[status]}
                          </span>
                          {externalPrerequisites.length > 0 && (
                            <span
                              className="special-cross-category-badge"
                              title={externalPrerequisites
                                .map(item => `${item.name}（${STATUS_LABELS[statuses.get(item.id) ?? 'locked']}）`)
                                .join('、')}
                            >
                              需 {externalPrerequisites.map(item => item.name).join('/')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button
            type="button"
            className="special-drawer-backdrop"
            aria-label="关闭特技详情"
            tabIndex={-1}
            onClick={closeDetailDrawer}
          />

          <section
            ref={detailRef}
            className="special-skill-detail"
            aria-label="特技详情"
            aria-labelledby="special-detail-title"
          >
            <div className="special-drawer-toolbar">
              <div className="special-drawer-handle" aria-hidden="true" />
              <button
                ref={drawerCloseRef}
                type="button"
                className="special-drawer-close"
                aria-label="关闭特技详情"
                title="关闭特技详情"
                onClick={closeDetailDrawer}
              >
                ×
              </button>
            </div>

            <div className="special-detail-title">
              <span className="special-detail-icon" aria-hidden="true">
                {activeCategoryInfo.icon}
              </span>
              <div>
                <span className="special-detail-category">
                  {selectedSkill.category} · {STATUS_LABELS[selectedStatus]}
                </span>
                <h3 id="special-detail-title">{selectedSkill.name}</h3>
                <p>{selectedSkill.originalName}</p>
              </div>
            </div>

            <p className="special-description">{selectedSkill.description}</p>

            <dl className="special-detail-grid">
              <div>
                <dt>取得方式</dt>
                <dd>{selectedSkill.acquisition === 'license' ? '驾照考试' : `${selectedSkill.cost} EXP`}</dd>
              </div>
              <div>
                <dt>当前状态</dt>
                <dd>{isSelectedDrafted && selectedStatus === 'learned' ? '待实践' : STATUS_LABELS[selectedStatus]}</dd>
              </div>
              {selectedSkill.triggerCondition && (
                <div>
                  <dt>发动条件</dt>
                  <dd>{selectedSkill.triggerCondition}</dd>
                </div>
              )}
              {selectedSkill.triggerRate && (
                <div>
                  <dt>发动概率</dt>
                  <dd>{selectedSkill.triggerRate}</dd>
                </div>
              )}
            </dl>

            <div className="special-prerequisites">
              <span>前置</span>
              <div>
                {selectedPrerequisites.length > 0 ? (
                  selectedPrerequisites.map(prerequisite => (
                    <button
                      key={prerequisite.id}
                      type="button"
                      className={learnedSkillIds.has(prerequisite.id) ? 'is-met' : 'is-missing'}
                      onClick={() => navigateToSkill(prerequisite)}
                    >
                      {prerequisite.name}
                      <small>{learnedSkillIds.has(prerequisite.id) ? '已取得' : prerequisite.category}</small>
                    </button>
                  ))
                ) : (
                  <strong>无</strong>
                )}
              </div>
            </div>

            <p className="special-effects-heading" role="note">
              <strong>效果资料</strong>
              <span>尚未接入结算</span>
            </p>
            <ul className="special-effects">
              {selectedSkill.effects.map((effect, index) => (
                <li key={`${effect.type}-${index}`}>{effect.description}</li>
              ))}
            </ul>

            {feedback && (
              <p className={`special-feedback is-${feedback.tone}`} role="status">
                {feedback.text}
              </p>
            )}

            <DetailAction
              skill={selectedSkill}
              status={selectedStatus}
              experience={experience}
              hasManagementTerm={Boolean(managementTerm)}
              missingPrerequisites={missingPrerequisites}
              isDrafted={isSelectedDrafted}
              isDraftFull={isPracticeDraftFull}
              onLearn={handleLearn}
              onTogglePractice={togglePracticeDraft}
            />
          </section>
        </div>

        <footer
          className="special-equipped-bar"
          aria-label="本学期实践特技"
          inert={isCompactDrawer && isDetailDrawerOpen ? true : undefined}
        >
          <div className="special-equipped-label">
            <span>{termLabel}</span>
            <strong>{managementTerm ? '实践草案' : '当前实践'}</strong>
          </div>
          <div className="special-equipped-slots">
            {Array.from({ length: MAX_PRACTICED_SKILLS }).map((_, index) => {
              const skill = practicedSkills[index];
              return (
                <button
                  key={index}
                  type="button"
                  className={skill ? 'filled' : ''}
                  disabled={!skill}
                  aria-label={skill ? `查看实践特技：${skill.name}` : `空实践栏 ${index + 1}`}
                  onClick={event => skill && selectSkill(skill, event.currentTarget)}
                >
                  <span>{index + 1}</span>
                  <strong>{skill?.name ?? '—'}</strong>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="special-practice-commit"
            disabled={!managementTerm}
            onClick={commitPracticeDraft}
          >
            {managementTerm ? '确定配置' : '已确定'}
          </button>
        </footer>
      </div>
    </div>
  );
}

interface DetailActionProps {
  skill: Skill;
  status: SkillStatus;
  experience: number;
  hasManagementTerm: boolean;
  missingPrerequisites: Skill[];
  isDrafted: boolean;
  isDraftFull: boolean;
  onLearn: () => void;
  onTogglePractice: () => void;
}

function DetailAction({
  skill,
  status,
  experience,
  hasManagementTerm,
  missingPrerequisites,
  isDrafted,
  isDraftFull,
  onLearn,
  onTogglePractice,
}: DetailActionProps) {
  if (skill.acquisition === 'license' && status === 'locked') {
    return (
      <button type="button" className="special-primary-action" disabled>
        通过驾照考试取得
      </button>
    );
  }
  if (status === 'locked') {
    const label = missingPrerequisites.length > 0 ? `尚需 ${missingPrerequisites.length} 个前置` : '尚未解锁';
    return (
      <button type="button" className="special-primary-action" disabled>
        {label}
      </button>
    );
  }
  if (status === 'available') {
    const disabled = !hasManagementTerm || experience < skill.cost;
    const label = !hasManagementTerm
      ? '当前不可学习'
      : experience < skill.cost
        ? 'EXP 不足'
        : `消耗 ${skill.cost} EXP 学习`;
    return (
      <button type="button" className="special-primary-action" disabled={disabled} onClick={onLearn}>
        {label}
      </button>
    );
  }

  const disabled = !hasManagementTerm || isDraftFull;
  const label = !hasManagementTerm
    ? '本学期配置已确定'
    : isDrafted
      ? '移出实践草案'
      : isDraftFull
        ? '实践栏已满'
        : '加入实践草案';
  return (
    <button
      type="button"
      className="special-primary-action"
      aria-pressed={isDrafted}
      disabled={disabled}
      onClick={onTogglePractice}
    >
      {label}
    </button>
  );
}

function getTreeLevels(categorySkills: Skill[]): TreeLevel[] {
  const levels = new Map<number, Skill[]>();
  for (const skill of categorySkills) {
    const depth = skillGraph.depthById.get(skill.id) ?? 0;
    levels.set(depth, [...(levels.get(depth) ?? []), skill]);
  }
  return [...levels.entries()]
    .sort(([leftDepth], [rightDepth]) => leftDepth - rightDepth)
    .map(([depth, levelSkills]) => ({ depth, skills: levelSkills }));
}

function formatTerm(termId: string): string {
  const match = /^(\d+)-t([123])$/.exec(termId);
  if (!match) return termId;
  const academicYear = Number(match[1]) - 2007;
  return `第${academicYear}学年${match[2]}学期`;
}

function getDistributedRow(index: number, itemCount: number, rowCount: number): number {
  if (itemCount <= 1) return Math.ceil(rowCount / 2);
  return Math.round((index * (rowCount - 1)) / (itemCount - 1)) + 1;
}

function createRoundedConnectorPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const horizontalDistance = Math.max(0, toX - fromX);
  const middleX = fromX + horizontalDistance / 2;
  const verticalDirection = Math.sign(toY - fromY);
  const cornerRadius = Math.min(10, Math.abs(toY - fromY) / 2, horizontalDistance / 4);
  const round = (value: number) => Math.round(value * 10) / 10;
  if (cornerRadius < 0.5) return `M ${round(fromX)} ${round(fromY)} H ${round(toX)}`;
  return [
    `M ${round(fromX)} ${round(fromY)}`,
    `H ${round(middleX - cornerRadius)}`,
    `Q ${round(middleX)} ${round(fromY)} ${round(middleX)} ${round(fromY + verticalDirection * cornerRadius)}`,
    `V ${round(toY - verticalDirection * cornerRadius)}`,
    `Q ${round(middleX)} ${round(toY)} ${round(middleX + cornerRadius)} ${round(toY)}`,
    `H ${round(toX)}`,
  ].join(' ');
}
