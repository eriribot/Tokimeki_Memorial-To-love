const caseData = window.HARUNA_CASE;

const STAGES = {
  official: { label: "03 官方参考", detail: "目标表情语义" },
  direct: { label: "直接贴到 02", detail: "失败基线" },
  warp: { label: "TV-L1 配准", detail: "只校正局部几何" },
  basis: { label: "02 原生底板", detail: "目标脸型与边界" },
  mask: { label: "共享融合区", detail: "每套表情三帧共用" },
  semantic_mask: { label: "像素归属遮罩", detail: "随候选显示清除、迁入与目标保留范围" },
  candidate: { label: "当前候选", detail: "等待逐项人工验收" },
};

const FORMULA_STATUS = {
  "awaiting-human-review": { label: "主候选 · 待人工验收", status: "candidate" },
  "comparison-only": { label: "对照候选 · 待人工验收", status: "experimental" },
  "rejected-visual-artifact": { label: "已否决 · 可见画面伪影", status: "rejected" },
  "rejected-human-review": { label: "已被人工拒绝", status: "rejected" },
};

const REVIEW_REGIONS = [
  { id: "eyes", label: "eyes", manifestKey: "eye" },
  { id: "mouth", label: "mouth", manifestKey: "mouth" },
];
const REVIEW_DECISIONS = [
  { id: "pending", label: "待定" },
  { id: "accepted", label: "通过" },
  { id: "rejected", label: "拒绝" },
];
const REVIEW_STORAGE_KEY = `${caseData.caseId}:human-review:v${caseData.schemaVersion}`;

const state = {
  expression: "shy",
  frame: 0,
  view: "face",
  formula: "official_window",
  leftStage: "official",
  rightStage: "candidate",
  split: 50,
  zoom: 100,
};

const elements = Object.fromEntries(
  [
    "reviewState",
    "expressionControls",
    "frameControls",
    "viewControls",
    "formulaControls",
    "leftStage",
    "rightStage",
    "swapStages",
    "showWindows",
    "openRightImage",
    "comparisonViewport",
    "comparisonStage",
    "leftImage",
    "rightImage",
    "rightClip",
    "windowGuides",
    "splitLine",
    "leftLabel",
    "rightLabel",
    "splitRange",
    "splitReadout",
    "zoomRange",
    "zoomReadout",
    "stageStrip",
    "selectionTitle",
    "selectionKey",
    "formulaState",
    "eyeBasis",
    "mouthBasis",
    "flowMetrics",
    "eyeBoundary",
    "mouthBoundary",
    "eyeCriteria",
    "mouthCriteria",
    "eyeOutputLink",
    "mouthOutputLink",
    "eyeReviewLink",
    "mouthReviewLink",
    "reviewProgress",
    "reviewMatrix",
    "reviewNote",
    "exportReview",
  ].map((id) => [id, document.getElementById(id)]),
);

let reviewStore = loadReviewStore();

function frameKey(frame = state.frame, expression = state.expression) {
  return `${expression}-frame-${frame}`;
}

function frameData() {
  return caseData.frames[frameKey()];
}

function expressionKey() {
  return frameData().sourceExpression;
}

function stagePath(stage) {
  const value = frameData().stages[stage];
  if (stage === "candidate") return value[state.formula];
  if (stage === "semantic_mask" && state.formula === "target_native_features_v2") {
    return frameData().stages.feature_mask_v2;
  }
  if (stage === "semantic_mask" && state.formula === "target_native_features") {
    return frameData().stages.feature_mask;
  }
  return value;
}

function formulaData() {
  return caseData.formulas[state.formula];
}

function stageLabel(stage) {
  if (stage !== "candidate") return STAGES[stage].label;
  return `${STAGES.candidate.label} · ${formulaData().label}`;
}

function setPressed(container, attribute, value) {
  container.querySelectorAll(`[${attribute}]`).forEach((button) => {
    button.setAttribute("aria-pressed", String(button.getAttribute(attribute) === String(value)));
  });
}

function renderFlowMetrics() {
  const rows = [];
  for (const [kind, label] of [
    ["eye", "eyes"],
    ["mouth", "mouth"],
  ]) {
    for (const [axis, axisLabel] of [
      ["verticalPercentiles", "Y"],
      ["horizontalPercentiles", "X"],
    ]) {
      const values = caseData.flow[kind][axis];
      rows.push(
        `<tr><td>${label}</td><td>${axisLabel}</td><td>${values[0]}</td><td>${values[2]}</td><td>${values[4]}</td></tr>`,
      );
    }
  }
  elements.flowMetrics.innerHTML = rows.join("");
}

function renderCriteria() {
  for (const [element, criteria] of [
    [elements.eyeCriteria, caseData.acceptance.humanReview.eyes],
    [elements.mouthCriteria, caseData.acceptance.humanReview.mouth],
  ]) {
    element.replaceChildren(...criteria.map((criterion) => Object.assign(document.createElement("li"), { textContent: criterion })));
  }
}

function renderBoundaryMetrics() {
  const metrics = frameData().boundaryMetrics[state.formula];
  if (!metrics.eye || !metrics.mouth) {
    const label = metrics.label ?? (metrics.status === "not-applicable-human-mask-candidate" ? "人工遮罩候选 · 仅看原尺寸画面" : "官方图层基线 · 不适用");
    elements.eyeBoundary.textContent = label;
    elements.mouthBoundary.textContent = label;
    return;
  }
  for (const region of REVIEW_REGIONS) {
    const current = metrics[region.manifestKey];
    elements[region.id === "eyes" ? "eyeBoundary" : "mouthBoundary"].textContent =
      `edge Δ${current.edgeMaxRgbaDelta} / outside Δ${current.outsideSupportMaxRgbaDelta}`;
  }
}

function renderStageSize() {
  const viewportWidth = Math.max(360, elements.comparisonViewport.clientWidth - 30);
  const baseSize = Math.min(820, viewportWidth);
  elements.comparisonStage.style.width = `${Math.round(baseSize * (state.zoom / 100))}px`;
}

function renderSelection() {
  const leftPath = stagePath(state.leftStage);
  const rightPath = stagePath(state.rightStage);
  elements.leftImage.src = leftPath;
  elements.rightImage.src = rightPath;
  elements.leftImage.alt = `${state.expression} 帧 ${state.frame}：${stageLabel(state.leftStage)}`;
  elements.rightImage.alt = `${state.expression} 帧 ${state.frame}：${stageLabel(state.rightStage)}`;
  elements.leftLabel.textContent = stageLabel(state.leftStage);
  elements.rightLabel.textContent = stageLabel(state.rightStage);
  elements.openRightImage.href = rightPath;

  elements.comparisonStage.dataset.view = state.view;
  elements.comparisonStage.style.setProperty("--split", `${state.split}%`);
  elements.splitReadout.textContent = `${state.split}%`;
  elements.zoomReadout.textContent = `${state.zoom}%`;
  elements.windowGuides.hidden = !elements.showWindows.checked;

  const basis = formulaData().basis ?? caseData.basis[expressionKey()];
  elements.eyeBasis.textContent = basis.eye;
  elements.mouthBasis.textContent = basis.mouth;
  elements.selectionTitle.textContent = `${state.expression} · 帧 ${state.frame} · ${stageLabel(state.rightStage)}`;
  elements.selectionKey.textContent = rightPath;

  const formulaStatus = FORMULA_STATUS[formulaData().status];
  elements.formulaState.textContent = formulaStatus.label;
  elements.formulaState.dataset.status = formulaStatus.status;
  const outputs = caseData.outputs[state.expression][state.formula];
  elements.eyeOutputLink.href = outputs.eye;
  elements.eyeOutputLink.textContent = `eye · ${outputs.eye.split("/").at(-1)}`;
  elements.mouthOutputLink.href = outputs.mouth;
  elements.mouthOutputLink.textContent = `mouth · ${outputs.mouth.split("/").at(-1)}`;
  const reviewSheets = caseData.reviewSheets[state.formula];
  elements.eyeReviewLink.href = reviewSheets.eyes;
  elements.mouthReviewLink.href = reviewSheets.mouth;

  elements.leftStage.value = state.leftStage;
  elements.rightStage.value = state.rightStage;
  setPressed(elements.expressionControls, "data-expression", state.expression);
  setPressed(elements.frameControls, "data-frame", state.frame);
  setPressed(elements.viewControls, "data-view", state.view);
  setPressed(elements.formulaControls, "data-formula", state.formula);
  elements.stageStrip.querySelectorAll("[data-stage]").forEach((button) => {
    if (button.dataset.stage === state.rightStage) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });

  renderBoundaryMetrics();
  renderReviewMatrix();
  renderStageSize();
  preloadAdjacentFrames();
}

function preloadAdjacentFrames() {
  for (const frame of [state.frame - 1, state.frame + 1]) {
    if (frame < 0 || frame >= caseData.sampling.frameCount) continue;
    const adjacent = caseData.frames[frameKey(frame)];
    for (const stage of [state.leftStage, state.rightStage]) {
      const source = stage === "candidate" ? adjacent.stages.candidate[state.formula] : adjacent.stages[stage];
      const image = new Image();
      image.src = source;
    }
  }
}

function loadReviewStore() {
  try {
    const stored = JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) ?? "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function currentFormulaReview() {
  if (!reviewStore[state.formula]) reviewStore[state.formula] = { decisions: {}, note: "" };
  return reviewStore[state.formula];
}

function reviewItemKey(expression, frame, region) {
  return `${expression}:frame-${frame}:${region}`;
}

function saveReviewStore() {
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviewStore));
  } catch {
    elements.reviewState.textContent = "本页无法保存本地审查记录 · 未晋升";
    elements.reviewState.dataset.status = "error";
  }
}

function renderReviewSummary() {
  const review = currentFormulaReview();
  const decisions = [];
  for (const expression of Object.keys(caseData.outputs)) {
    for (let frame = 0; frame < caseData.sampling.frameCount; frame += 1) {
      for (const region of REVIEW_REGIONS) {
        decisions.push(review.decisions[reviewItemKey(expression, frame, region.id)] ?? "pending");
      }
    }
  }
  const accepted = decisions.filter((decision) => decision === "accepted").length;
  const rejected = decisions.filter((decision) => decision === "rejected").length;
  const pending = decisions.length - accepted - rejected;
  elements.reviewProgress.textContent = `${accepted} 通过 · ${rejected} 拒绝 · ${pending} 待定`;
  elements.reviewState.textContent =
    accepted === decisions.length
      ? `${accepted} / ${decisions.length} 人工标记通过 · 仍未晋升`
      : `${accepted} / ${decisions.length} 人工通过${rejected ? ` · ${rejected} 项拒绝` : ""} · 未晋升`;
  elements.reviewState.dataset.status = rejected ? "rejected" : accepted === decisions.length ? "complete" : "pending";
}

function renderReviewMatrix() {
  const review = currentFormulaReview();
  const fragment = document.createDocumentFragment();
  for (const expression of Object.keys(caseData.outputs)) {
    for (let frame = 0; frame < caseData.sampling.frameCount; frame += 1) {
      for (const region of REVIEW_REGIONS) {
        const key = reviewItemKey(expression, frame, region.id);
        const decision = review.decisions[key] ?? "pending";
        const item = document.createElement("article");
        item.className = "review-item";
        item.dataset.current = String(
          expression === state.expression && frame === state.frame && region.id === state.view,
        );

        const focus = document.createElement("button");
        focus.type = "button";
        focus.className = "review-item-label";
        focus.dataset.reviewFocus = key;
        focus.dataset.expression = expression;
        focus.dataset.frame = String(frame);
        focus.dataset.region = region.id;
        const title = document.createElement("strong");
        title.textContent = `${expression} · frame ${frame} · ${region.label}`;
        const detail = document.createElement("span");
        detail.textContent = region.id === "eyes" ? "眼位 / 眉线 / 重影 / 四边" : "嘴型 / 双线 / 下巴 / 四边";
        focus.append(title, detail);

        const choices = document.createElement("div");
        choices.className = "review-decisions";
        for (const option of REVIEW_DECISIONS) {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.reviewKey = key;
          button.dataset.decision = option.id;
          button.setAttribute("aria-pressed", String(decision === option.id));
          button.setAttribute("aria-label", `${expression} 帧 ${frame} ${region.label}：${option.label}`);
          button.textContent = option.label;
          choices.append(button);
        }
        item.append(focus, choices);
        fragment.append(item);
      }
    }
  }
  elements.reviewMatrix.replaceChildren(fragment);
  elements.reviewNote.value = review.note ?? "";
  renderReviewSummary();
}

function exportReviewRecord() {
  const review = currentFormulaReview();
  const record = {
    schemaVersion: 1,
    caseId: caseData.caseId,
    candidate: state.formula,
    sourceFamily: caseData.source.family,
    targetFamily: caseData.target.family,
    coordinateAuthority: caseData.coordinateAuthority,
    decisions: review.decisions,
    note: review.note ?? "",
    acceptanceContract: caseData.acceptance,
    promotionAllowed: false,
    exportedAt: new Date().toISOString(),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${caseData.caseId}-${state.formula}-human-review.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function bindChoiceButtons(container, attribute, apply) {
  container.addEventListener("click", (event) => {
    const button = event.target.closest(`[${attribute}]`);
    if (!button) return;
    apply(button.getAttribute(attribute));
    renderSelection();
  });
}

function bindControls() {
  bindChoiceButtons(elements.expressionControls, "data-expression", (value) => {
    state.expression = value;
  });
  bindChoiceButtons(elements.frameControls, "data-frame", (value) => {
    state.frame = Number(value);
  });
  bindChoiceButtons(elements.viewControls, "data-view", (value) => {
    state.view = value;
  });
  bindChoiceButtons(elements.formulaControls, "data-formula", (value) => {
    state.formula = value;
  });

  elements.leftStage.addEventListener("change", () => {
    state.leftStage = elements.leftStage.value;
    renderSelection();
  });
  elements.rightStage.addEventListener("change", () => {
    state.rightStage = elements.rightStage.value;
    renderSelection();
  });
  elements.stageStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-stage]");
    if (!button) return;
    state.rightStage = button.dataset.stage;
    renderSelection();
  });
  elements.swapStages.addEventListener("click", () => {
    [state.leftStage, state.rightStage] = [state.rightStage, state.leftStage];
    renderSelection();
  });
  elements.showWindows.addEventListener("change", renderSelection);
  elements.splitRange.addEventListener("input", () => {
    state.split = Number(elements.splitRange.value);
    elements.comparisonStage.style.setProperty("--split", `${state.split}%`);
    elements.splitReadout.textContent = `${state.split}%`;
  });
  elements.zoomRange.addEventListener("input", () => {
    state.zoom = Number(elements.zoomRange.value);
    elements.zoomReadout.textContent = `${state.zoom}%`;
    renderStageSize();
  });
  elements.reviewMatrix.addEventListener("click", (event) => {
    const focus = event.target.closest("[data-review-focus]");
    if (focus) {
      state.expression = focus.dataset.expression;
      state.frame = Number(focus.dataset.frame);
      state.view = focus.dataset.region;
      renderSelection();
      return;
    }
    const decision = event.target.closest("[data-review-key]");
    if (!decision) return;
    currentFormulaReview().decisions[decision.dataset.reviewKey] = decision.dataset.decision;
    saveReviewStore();
    renderReviewMatrix();
  });
  elements.reviewNote.addEventListener("input", () => {
    currentFormulaReview().note = elements.reviewNote.value;
    saveReviewStore();
  });
  elements.exportReview.addEventListener("click", exportReviewRecord);
  window.addEventListener("resize", renderStageSize);
}

function initialize() {
  if (!caseData?.frames || caseData.promotionAllowed !== false) {
    elements.reviewState.textContent = "案例数据无效或错误开放了晋升";
    elements.reviewState.dataset.status = "error";
    return;
  }

  elements.leftImage.addEventListener("error", () => {
    elements.reviewState.textContent = "左图载入失败 · 未晋升";
  });
  elements.rightImage.addEventListener("error", () => {
    elements.reviewState.textContent = "右图载入失败 · 未晋升";
  });
  renderFlowMetrics();
  renderCriteria();
  if (caseData.formulas.target_native_features_v2) state.formula = "target_native_features_v2";
  bindControls();
  renderSelection();
}

initialize();
