const SEPHIE_PRESET = {
  schemaVersion: 1,
  id: "default",
  characterId: "sephie",
  displayName: "Sephie",
  formatProfile: "prototype",
  canvas: { width: 1024, height: 1024 },
  files: {
    body: "../sephie/sephie_body.png",
    mask: "../sephie/sephie_mask.png",
    eyes: "../sephie/sephie_a_eye.png",
    mouth: "../sephie/sephie_a_mouth.png",
  },
  runtimeBasePath: "/artsource/sephie/",
  regions: {
    eyes: { x: 400, y: 90, width: 225, height: 145, feather: 0 },
    mouth: { x: 420, y: 185, width: 185, height: 105, feather: 0 },
  },
  frameCount: { eyes: 3, mouth: 3 },
  defaultExpressionId: "neutral",
  expressionBlinking: true,
  galViewport: { width: 844, height: 390 },
  galStage: { width: 48, right: 4, bottom: 0 },
};

const ASSET_KEYS = ["body", "mask", "eyes", "mouth"];
const REGION_KEYS = ["eyes", "mouth"];

const elements = {
  globalStatus: document.querySelector("#globalStatus"),
  loadSephie: document.querySelector("#loadSephie"),
  manifestInput: document.querySelector("#manifestInput"),
  characterId: document.querySelector("#characterId"),
  portraitId: document.querySelector("#portraitId"),
  displayName: document.querySelector("#displayName"),
  expressionId: document.querySelector("#expressionId"),
  assetBasePath: document.querySelector("#assetBasePath"),
  formatProfile: document.querySelector("#formatProfile"),
  expressionBlinking: document.querySelector("#expressionBlinking"),
  bodyInput: document.querySelector("#bodyInput"),
  maskInput: document.querySelector("#maskInput"),
  eyesInput: document.querySelector("#eyesInput"),
  mouthInput: document.querySelector("#mouthInput"),
  bodyName: document.querySelector("#bodyName"),
  maskName: document.querySelector("#maskName"),
  eyesName: document.querySelector("#eyesName"),
  mouthName: document.querySelector("#mouthName"),
  bodyMeta: document.querySelector("#bodyMeta"),
  maskMeta: document.querySelector("#maskMeta"),
  eyesMeta: document.querySelector("#eyesMeta"),
  mouthMeta: document.querySelector("#mouthMeta"),
  bodyLayer: document.querySelector("#bodyLayer"),
  eyeLayer: document.querySelector("#eyeLayer"),
  mouthLayer: document.querySelector("#mouthLayer"),
  galBodyLayer: document.querySelector("#galBodyLayer"),
  galEyeLayer: document.querySelector("#galEyeLayer"),
  galMouthLayer: document.querySelector("#galMouthLayer"),
  eyeAtlasImage: document.querySelector("#eyeAtlasImage"),
  mouthAtlasImage: document.querySelector("#mouthAtlasImage"),
  portrait: document.querySelector("#portrait"),
  galPortrait: document.querySelector("#galPortrait"),
  logicalStage: document.querySelector("#logicalStage"),
  stageScaler: document.querySelector("#stageScaler"),
  eyeWindow: document.querySelector("#eyeWindow"),
  mouthWindow: document.querySelector("#mouthWindow"),
  galEyeWindow: document.querySelector("#galEyeWindow"),
  galMouthWindow: document.querySelector("#galMouthWindow"),
  eyeGuide: document.querySelector("#eyeGuide"),
  mouthGuide: document.querySelector("#mouthGuide"),
  stageBackground: document.querySelector("#stageBackground"),
  stageZoom: document.querySelector("#stageZoom"),
  zoomReadout: document.querySelector("#zoomReadout"),
  showGuides: document.querySelector("#showGuides"),
  maskEnabled: document.querySelector("#maskEnabled"),
  eyesVisible: document.querySelector("#eyesVisible"),
  mouthVisible: document.querySelector("#mouthVisible"),
  eyeFrames: document.querySelector("#eyeFrames"),
  mouthFrames: document.querySelector("#mouthFrames"),
  frameReadout: document.querySelector("#frameReadout"),
  blinkOnce: document.querySelector("#blinkOnce"),
  speakOnce: document.querySelector("#speakOnce"),
  stopMotion: document.querySelector("#stopMotion"),
  canvasWidth: document.querySelector("#canvasWidth"),
  canvasHeight: document.querySelector("#canvasHeight"),
  canvasPreviewLabel: document.querySelector("#canvasPreviewLabel"),
  eyeFrameCount: document.querySelector("#eyeFrameCount"),
  mouthFrameCount: document.querySelector("#mouthFrameCount"),
  eyeCoordinateText: document.querySelector("#eyeCoordinateText"),
  mouthCoordinateText: document.querySelector("#mouthCoordinateText"),
  eyeAtlasPreview: document.querySelector("#eyeAtlasPreview"),
  mouthAtlasPreview: document.querySelector("#mouthAtlasPreview"),
  eyeAtlasCaption: document.querySelector("#eyeAtlasCaption"),
  mouthAtlasCaption: document.querySelector("#mouthAtlasCaption"),
  validationList: document.querySelector("#validationList"),
  dirtyState: document.querySelector("#dirtyState"),
  galPortraitStage: document.querySelector("#galPortraitStage"),
  galPreview: document.querySelector("#galPreview"),
  galPreviewLabel: document.querySelector("#galPreviewLabel"),
  galViewportWidth: document.querySelector("#galViewportWidth"),
  galViewportHeight: document.querySelector("#galViewportHeight"),
  galNameplate: document.querySelector("#galNameplate"),
  galWidth: document.querySelector("#galWidth"),
  galRight: document.querySelector("#galRight"),
  galBottom: document.querySelector("#galBottom"),
  galCoordinateText: document.querySelector("#galCoordinateText"),
  jsonTab: document.querySelector("#jsonTab"),
  regionsTab: document.querySelector("#regionsTab"),
  typescriptTab: document.querySelector("#typescriptTab"),
  exportCode: document.querySelector("#exportCode"),
  copyJson: document.querySelector("#copyJson"),
  downloadJson: document.querySelector("#downloadJson"),
  copyRegions: document.querySelector("#copyRegions"),
  copyTypeScript: document.querySelector("#copyTypeScript"),
};

const state = {
  characterId: "sephie",
  portraitId: "default",
  displayName: "Sephie",
  expressionId: "neutral",
  assetBasePath: "/artsource/sephie/",
  formatProfile: "prototype",
  canvas: { width: 1024, height: 1024 },
  regions: {
    eyes: { x: 400, y: 90, width: 225, height: 145, feather: 0 },
    mouth: { x: 420, y: 185, width: 185, height: 105, feather: 0 },
  },
  frameCount: { eyes: 3, mouth: 3 },
  frames: { eyes: 0, mouth: 0 },
  assets: Object.fromEntries(
    ASSET_KEYS.map((key) => [key, { name: "", source: "", width: 0, height: 0, status: "idle", objectUrl: "" }]),
  ),
  galViewport: { width: 844, height: 390 },
  galStage: { width: 48, right: 4, bottom: 0 },
  expressionBlinking: true,
  activeExport: "json",
  motionTimers: [],
  dirty: false,
};

function setStatus(message) {
  elements.globalStatus.textContent = message;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function finiteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function positiveInteger(value, fallback = 1) {
  return Math.max(1, Math.round(finiteNumber(value, fallback)));
}

function basename(path) {
  const cleanPath = String(path || "").split(/[?#]/, 1)[0];
  const parts = cleanPath.split(/[\\/]/);
  return decodeURIComponent(parts.at(-1) || "");
}

function ensureTrailingSlash(path) {
  const trimmed = String(path || "").trim();
  if (!trimmed) return "/";
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function encodedAssetPath(fileName) {
  const encodedName = encodeURIComponent(fileName).replace(/%2F/gi, "/");
  return `${ensureTrailingSlash(state.assetBasePath)}${encodedName}`;
}

function cssPercent(value, total) {
  return `${(value / Math.max(1, total)) * 100}%`;
}

function markDirty(isDirty = true) {
  state.dirty = isDirty;
  elements.dirtyState.textContent = isDirty ? "有未导出调整" : "配置已载入";
}

function revokeObjectUrl(asset) {
  if (asset.objectUrl) URL.revokeObjectURL(asset.objectUrl);
  asset.objectUrl = "";
}

function imageTargets(key) {
  if (key === "body") return [elements.bodyLayer, elements.galBodyLayer];
  if (key === "eyes") return [elements.eyeLayer, elements.galEyeLayer, elements.eyeAtlasImage];
  if (key === "mouth") return [elements.mouthLayer, elements.galMouthLayer, elements.mouthAtlasImage];
  return [];
}

function clearAssetTargets(key) {
  imageTargets(key).forEach((image) => image.removeAttribute("src"));
  if (key === "mask") applyMask();
}

function updateAssetCard(key) {
  const asset = state.assets[key];
  const card = document.querySelector(`[data-asset="${key}"]`);
  const nameElement = elements[`${key}Name`];
  const metaElement = elements[`${key}Meta`];
  card.dataset.state = asset.status;
  nameElement.textContent = asset.name || "尚未选择";

  if (asset.status === "ready") metaElement.textContent = `${asset.width} × ${asset.height}`;
  else if (asset.status === "error") metaElement.textContent = "载入失败";
  else if (asset.status === "loading") metaElement.textContent = "正在载入";
  else metaElement.textContent = "尚未载入";
}

function loadAssetSource(key, source, fileName, objectUrl = "") {
  const asset = state.assets[key];
  revokeObjectUrl(asset);
  asset.name = fileName || basename(source);
  asset.source = source;
  asset.objectUrl = objectUrl;
  asset.width = 0;
  asset.height = 0;
  asset.status = "loading";
  updateAssetCard(key);

  const probe = new Image();
  probe.onload = () => {
    if (state.assets[key].source !== source) return;
    asset.width = probe.naturalWidth;
    asset.height = probe.naturalHeight;
    asset.status = "ready";
    imageTargets(key).forEach((image) => {
      image.src = source;
    });
    updateAssetCard(key);
    if (key === "mask") applyMask();
    renderAtlasPreview(key);
    renderValidation();
    renderExport();
    const loaded = ASSET_KEYS.filter((assetKey) => state.assets[assetKey].status === "ready").length;
    setStatus(`${loaded} / 4 份素材已载入`);
  };
  probe.onerror = () => {
    if (state.assets[key].source !== source) return;
    asset.status = "error";
    clearAssetTargets(key);
    updateAssetCard(key);
    renderValidation();
    setStatus(`${asset.name || key} 载入失败，请重新选择文件`);
  };
  probe.src = source;
}

function loadAssetFile(key, file) {
  if (!file) return;
  const objectUrl = URL.createObjectURL(file);
  loadAssetSource(key, objectUrl, file.name, objectUrl);
  markDirty();
}

function resetAsset(key) {
  const asset = state.assets[key];
  revokeObjectUrl(asset);
  Object.assign(asset, { name: "", source: "", width: 0, height: 0, status: "idle", objectUrl: "" });
  clearAssetTargets(key);
  updateAssetCard(key);
}

function applyMask() {
  const maskAsset = state.assets.mask;
  const enabled = elements.maskEnabled.checked && maskAsset.status === "ready";
  const value = enabled ? `url("${maskAsset.source}")` : "none";
  [elements.portrait, elements.galPortrait].forEach((portrait) => {
    portrait.style.webkitMaskImage = value;
    portrait.style.maskImage = value;
    portrait.style.webkitMaskMode = "alpha";
    portrait.style.maskMode = "alpha";
  });
}

function applyRegionToElement(element, regionKey) {
  const region = state.regions[regionKey];
  element.style.left = cssPercent(region.x, state.canvas.width);
  element.style.top = cssPercent(region.y, state.canvas.height);
  element.style.width = cssPercent(region.width, state.canvas.width);
  element.style.height = cssPercent(region.height, state.canvas.height);

  const feather = Math.max(0, region.feather || 0);
  element.dataset.feathered = feather > 0 ? "true" : "false";
  element.style.setProperty("--feather-x", cssPercent(feather, region.width));
  element.style.setProperty("--feather-y", cssPercent(feather, region.height));
}

function normalizeRegion(regionKey) {
  const region = state.regions[regionKey];
  region.width = clamp(positiveInteger(region.width), 1, state.canvas.width);
  region.height = clamp(positiveInteger(region.height), 1, state.canvas.height);
  region.x = clamp(Math.round(finiteNumber(region.x, 0)), 0, Math.max(0, state.canvas.width - region.width));
  region.y = clamp(Math.round(finiteNumber(region.y, 0)), 0, Math.max(0, state.canvas.height - region.height));
  region.feather = clamp(
    Math.round(finiteNumber(region.feather, 0)),
    0,
    Math.floor(Math.min(region.width, region.height) / 2),
  );
}

function regionText(region) {
  return `x:${region.x} y:${region.y} w:${region.width} h:${region.height} f:${region.feather || 0}`;
}

function renderRegion(regionKey) {
  normalizeRegion(regionKey);
  const region = state.regions[regionKey];
  const prefix = regionKey === "eyes" ? "eyes" : "mouth";
  const windows =
    regionKey === "eyes"
      ? [elements.eyeWindow, elements.galEyeWindow]
      : [elements.mouthWindow, elements.galMouthWindow];
  const guide = regionKey === "eyes" ? elements.eyeGuide : elements.mouthGuide;
  windows.forEach((windowElement) => applyRegionToElement(windowElement, regionKey));
  applyRegionToElement(guide, regionKey);

  document.querySelectorAll(`[data-region-input="${regionKey}"]`).forEach((input) => {
    input.value = region[input.dataset.axis];
  });
  elements[`${regionKey === "eyes" ? "eye" : "mouth"}CoordinateText`].textContent = regionText(region);
  renderValidation();
  renderExport();
}

function renderCanvas() {
  state.canvas.width = positiveInteger(state.canvas.width, 1024);
  state.canvas.height = positiveInteger(state.canvas.height, 1024);
  elements.canvasWidth.value = state.canvas.width;
  elements.canvasHeight.value = state.canvas.height;
  elements.canvasPreviewLabel.textContent = `${state.canvas.width} × ${state.canvas.height}`;
  [elements.logicalStage, elements.galPortraitStage].forEach((element) => {
    element.style.setProperty("--canvas-width", state.canvas.width);
    element.style.setProperty("--canvas-height", state.canvas.height);
  });
  REGION_KEYS.forEach(renderRegion);
}

function renderFrameButtons(kind) {
  const container = kind === "eyes" ? elements.eyeFrames : elements.mouthFrames;
  const count = state.frameCount[kind];
  container.replaceChildren();
  for (let frame = 0; frame < count; frame += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(frame);
    button.dataset.frameKind = kind;
    button.dataset.frame = String(frame);
    button.setAttribute("aria-pressed", String(state.frames[kind] === frame));
    button.addEventListener("click", () => setFrame(kind, frame));
    container.append(button);
  }
}

function setFrame(kind, requestedFrame) {
  const count = state.frameCount[kind];
  const frame = clamp(Math.round(finiteNumber(requestedFrame, 0)), 0, count - 1);
  state.frames[kind] = frame;
  const layers = kind === "eyes" ? [elements.eyeLayer, elements.galEyeLayer] : [elements.mouthLayer, elements.galMouthLayer];
  layers.forEach((layer) => {
    layer.style.height = `${count * 100}%`;
    layer.style.top = `${frame * -100}%`;
  });
  const container = kind === "eyes" ? elements.eyeFrames : elements.mouthFrames;
  container.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-pressed", String(Number(button.dataset.frame) === frame));
  });
  elements.frameReadout.textContent = `眼睛 ${state.frames.eyes} / 嘴型 ${state.frames.mouth}`;
}

function renderFrameControls(kind) {
  state.frameCount[kind] = clamp(positiveInteger(state.frameCount[kind], 3), 1, 12);
  state.frames[kind] = clamp(state.frames[kind], 0, state.frameCount[kind] - 1);
  const input = kind === "eyes" ? elements.eyeFrameCount : elements.mouthFrameCount;
  input.value = state.frameCount[kind];
  renderFrameButtons(kind);
  setFrame(kind, state.frames[kind]);
  renderAtlasPreview(kind);
  renderValidation();
  renderExport();
}

function renderAtlasPreview(kind) {
  if (kind !== "eyes" && kind !== "mouth") return;
  const asset = state.assets[kind];
  const preview = kind === "eyes" ? elements.eyeAtlasPreview : elements.mouthAtlasPreview;
  const caption = kind === "eyes" ? elements.eyeAtlasCaption : elements.mouthAtlasCaption;
  preview.querySelectorAll(".atlas-divider").forEach((line) => line.remove());
  const count = state.frameCount[kind];
  for (let index = 1; index < count; index += 1) {
    const line = document.createElement("span");
    line.className = "atlas-divider";
    line.style.top = `${(index / count) * 100}%`;
    preview.append(line);
  }
  caption.textContent =
    asset.status === "ready" ? `${kind} · ${asset.width} × ${asset.height} · ${count} 帧纵排` : `${kind} · ${count} 帧纵排`;
}

function clearMotion() {
  state.motionTimers.forEach((timer) => window.clearTimeout(timer));
  state.motionTimers = [];
}

function bounceSequence(frameCount) {
  const forward = Array.from({ length: frameCount }, (_, index) => index);
  const backward = forward.slice(1, -1).reverse();
  return [...forward, ...backward, 0];
}

function playSequence(kind, sequence, frameMs, repeat = 1) {
  clearMotion();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setFrame(kind, 0);
    setStatus("系统启用了减少动态，已停在第 0 帧");
    return;
  }
  const frames = Array.from({ length: repeat }, () => sequence).flat();
  frames.forEach((frame, index) => {
    const timer = window.setTimeout(() => {
      setFrame(kind, frame);
      if (index === frames.length - 1) setStatus(`${kind === "eyes" ? "眨眼" : "说话"}预览完成`);
    }, index * frameMs);
    state.motionTimers.push(timer);
  });
}

function renderGalStage() {
  state.galViewport.width = clamp(positiveInteger(state.galViewport.width, 844), 320, 3840);
  state.galViewport.height = clamp(positiveInteger(state.galViewport.height, 390), 180, 2160);
  state.galStage.width = clamp(finiteNumber(state.galStage.width, 48), 10, 100);
  state.galStage.right = clamp(finiteNumber(state.galStage.right, 4), -100, 100);
  state.galStage.bottom = clamp(finiteNumber(state.galStage.bottom, 0), -100, 100);
  elements.galViewportWidth.value = state.galViewport.width;
  elements.galViewportHeight.value = state.galViewport.height;
  elements.galWidth.value = state.galStage.width;
  elements.galRight.value = state.galStage.right;
  elements.galBottom.value = state.galStage.bottom;
  elements.galPreview.style.setProperty("--gal-preview-width", state.galViewport.width);
  elements.galPreview.style.setProperty("--gal-preview-height", state.galViewport.height);
  elements.galPreviewLabel.textContent = `${state.galViewport.width} × ${state.galViewport.height}`;
  elements.galPortraitStage.style.width = `${state.galStage.width}%`;
  elements.galPortraitStage.style.right = `${state.galStage.right}%`;
  elements.galPortraitStage.style.bottom = `${state.galStage.bottom}%`;
  const portraitPixels = Math.round((state.galViewport.width * state.galStage.width) / 100);
  elements.galCoordinateText.textContent = `size:${state.galStage.width}% ≈ ${portraitPixels} × ${portraitPixels}px · right:${state.galStage.right}% bottom:${state.galStage.bottom}%`;
  renderExport();
}

function addValidation(stateName, message) {
  const item = document.createElement("li");
  item.dataset.state = stateName;
  item.textContent = message;
  elements.validationList.append(item);
}

function renderValidation() {
  elements.validationList.replaceChildren();
  const body = state.assets.body;
  const mask = state.assets.mask;
  const eyes = state.assets.eyes;
  const mouth = state.assets.mouth;

  const readyCount = ASSET_KEYS.filter((key) => state.assets[key].status === "ready").length;
  addValidation(readyCount === 4 ? "ok" : "warning", `素材 ${readyCount} / 4 已成功解码。`);

  if (body.status === "ready") {
    const matchesCanvas = body.width === state.canvas.width && body.height === state.canvas.height;
    addValidation(
      matchesCanvas ? "ok" : "error",
      matchesCanvas
        ? `body 与逻辑画布一致：${body.width} × ${body.height}。`
        : `body 为 ${body.width} × ${body.height}，逻辑画布为 ${state.canvas.width} × ${state.canvas.height}。`,
    );
  }

  if (mask.status === "ready") {
    const canvasRatio = state.canvas.width / state.canvas.height;
    const maskRatio = mask.width / mask.height;
    const ratioMatches = Math.abs(canvasRatio - maskRatio) < 0.001;
    addValidation(
      ratioMatches ? "ok" : "error",
      ratioMatches
        ? `mask 比例与逻辑画布一致，可由运行时拉伸：${mask.width} × ${mask.height}。`
        : `mask 比例 ${mask.width}:${mask.height} 与逻辑画布不一致。`,
    );
  }

  [
    ["eyes", eyes],
    ["mouth", mouth],
  ].forEach(([kind, asset]) => {
    const count = state.frameCount[kind];
    addValidation(
      count === 3 ? "ok" : "error",
      count === 3
        ? `${kind} 使用当前 LayeredPortrait 支持的 3 帧纵排格式。`
        : `${kind} 当前为 ${count} 帧：校准页可以预览，但 LayeredPortrait 运行时固定为 3 帧，不能直接接入。`,
    );
    if (asset.status !== "ready") return;
    addValidation(
      "ok",
      `${kind} 图集按 ${count} 帧纵排显示；每帧运行时缩放到 ${state.regions[kind].width} × ${state.regions[kind].height}。`,
    );
  });

  REGION_KEYS.forEach((kind) => {
    const region = state.regions[kind];
    const inside =
      region.x >= 0 &&
      region.y >= 0 &&
      region.x + region.width <= state.canvas.width &&
      region.y + region.height <= state.canvas.height;
    addValidation(inside ? "ok" : "error", `${kind} 窗口${inside ? "位于" : "超出"}逻辑画布。`);
    if (region.feather > 0) {
      addValidation("ok", `${kind} 使用 ${region.feather}px 四边等距 feather。`);
    }
  });
}

function manifestObject() {
  const expectedDimensions = Object.fromEntries(
    ASSET_KEYS.map((key) => {
      const asset = state.assets[key];
      return [key, { width: asset.width || null, height: asset.height || null }];
    }),
  );
  return {
    schemaVersion: 1,
    id: state.portraitId,
    characterId: state.characterId,
    displayName: state.displayName,
    formatProfile: state.formatProfile,
    canvas: { ...state.canvas },
    files: Object.fromEntries(ASSET_KEYS.map((key) => [key, encodedAssetPath(state.assets[key].name)])),
    expectedDimensions,
    regions: {
      eyes: { ...state.regions.eyes },
      mouth: { ...state.regions.mouth },
    },
    frameCount: { ...state.frameCount },
    defaultExpressionId: state.expressionId,
    expression: {
      id: state.expressionId,
      eyes: encodedAssetPath(state.assets.eyes.name),
      mouth: encodedAssetPath(state.assets.mouth.name),
      blinking: state.expressionBlinking,
    },
    galViewport: { ...state.galViewport },
    galStage: { ...state.galStage },
  };
}

function regionLiteral(region, indent = "    ") {
  const featherPart = region.feather > 0 ? `, feather: ${region.feather}` : "";
  return `${indent}{ x: ${region.x}, y: ${region.y}, width: ${region.width}, height: ${region.height}${featherPart} }`;
}

function regionsTypeScript() {
  return [
    "regions: {",
    `  eyes: ${regionLiteral(state.regions.eyes, "")},`,
    `  mouth: ${regionLiteral(state.regions.mouth, "")},`,
    "},",
  ].join("\n");
}

function quote(value) {
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function constName() {
  const raw = `${state.characterId}_${state.portraitId}_portrait`;
  const normalized = raw.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return (normalized || "LAYERED_PORTRAIT").toUpperCase();
}

function rigTypeScript() {
  const bodyPath = encodedAssetPath(state.assets.body.name);
  const maskPath = encodedAssetPath(state.assets.mask.name);
  const eyesPath = encodedAssetPath(state.assets.eyes.name);
  const mouthPath = encodedAssetPath(state.assets.mouth.name);
  return [
    `const ${constName()} = {`,
    `  id: ${quote(state.portraitId)},`,
    `  characterId: ${quote(state.characterId)},`,
    `  displayName: ${quote(state.displayName)},`,
    `  canvas: { width: ${state.canvas.width}, height: ${state.canvas.height} },`,
    `  body: ${quote(bodyPath)},`,
    `  mask: ${quote(maskPath)},`,
    "  regions: {",
    `    eyes: ${regionLiteral(state.regions.eyes, "")},`,
    `    mouth: ${regionLiteral(state.regions.mouth, "")},`,
    "  },",
    `  defaultExpressionId: ${quote(state.expressionId)},`,
    "  expressions: {",
    `    ${JSON.stringify(state.expressionId)}: {`,
    `      id: ${quote(state.expressionId)},`,
    `      eyes: ${quote(eyesPath)},`,
    `      mouth: ${quote(mouthPath)},`,
    `      blinking: ${state.expressionBlinking},`,
    "    },",
    "  },",
    "} as const;",
    "",
    `// Preview-only GAL ${state.galViewport.width}×${state.galViewport.height} composition; not part of LayeredPortraitRig.`,
    `// width:${state.galStage.width}% right:${state.galStage.right}% bottom:${state.galStage.bottom}%`,
  ].join("\n");
}

function jsonText() {
  return JSON.stringify(manifestObject(), null, 2);
}

function exportText(kind = state.activeExport) {
  if (kind === "regions") return regionsTypeScript();
  if (kind === "typescript") return rigTypeScript();
  return jsonText();
}

function renderExport() {
  elements.exportCode.textContent = exportText();
}

function selectExport(kind) {
  state.activeExport = kind;
  const tabs = {
    json: elements.jsonTab,
    regions: elements.regionsTab,
    typescript: elements.typescriptTab,
  };
  Object.entries(tabs).forEach(([tabKind, tab]) => {
    tab.setAttribute("aria-selected", String(tabKind === kind));
  });
  renderExport();
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  setStatus(successMessage);
}

function downloadManifest() {
  const blob = new Blob([jsonText()], { type: "application/json;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${state.characterId || "character"}-${state.portraitId || "portrait"}.portrait.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  markDirty(false);
  setStatus("manifest 已下载");
}

function pathForImportedAsset(fileValue, fallbackBasePath) {
  if (!fileValue) return "";
  const value = String(fileValue);
  if (/^(blob:|data:|https?:|\.\.?\/)/i.test(value)) return value;
  if (value.startsWith("/artsource/")) return `..${value.slice("/artsource".length)}`;
  return `${ensureTrailingSlash(fallbackBasePath)}${value}`;
}

function regionFromManifest(input, fallback) {
  return {
    x: finiteNumber(input?.x, fallback.x),
    y: finiteNumber(input?.y, fallback.y),
    width: positiveInteger(input?.width, fallback.width),
    height: positiveInteger(input?.height, fallback.height),
    feather: Math.max(0, Math.round(finiteNumber(input?.feather, fallback.feather || 0))),
  };
}

function loadManifest(manifest, { preset = false } = {}) {
  if (!manifest || typeof manifest !== "object") throw new Error("manifest 必须是 JSON 对象。");
  clearMotion();
  state.characterId = String(manifest.characterId || manifest.id || state.characterId);
  state.portraitId = String(manifest.id || manifest.portraitId || state.portraitId);
  state.displayName = String(manifest.displayName || state.displayName);
  state.expressionId = String(manifest.defaultExpressionId || manifest.expression?.id || state.expressionId);
  state.formatProfile = String(manifest.formatProfile || "prototype");
  state.expressionBlinking = manifest.expression?.blinking !== false;
  state.canvas = {
    width: positiveInteger(manifest.canvas?.width, 1024),
    height: positiveInteger(manifest.canvas?.height, 1024),
  };
  state.regions = {
    eyes: regionFromManifest(manifest.regions?.eyes, state.regions.eyes),
    mouth: regionFromManifest(manifest.regions?.mouth, state.regions.mouth),
  };
  const rawFrameCount = manifest.frameCount;
  state.frameCount = {
    eyes: clamp(positiveInteger(typeof rawFrameCount === "number" ? rawFrameCount : rawFrameCount?.eyes, 3), 1, 12),
    mouth: clamp(positiveInteger(typeof rawFrameCount === "number" ? rawFrameCount : rawFrameCount?.mouth, 3), 1, 12),
  };
  state.frames = { eyes: 0, mouth: 0 };
  state.galViewport = {
    width: positiveInteger(manifest.galViewport?.width, 844),
    height: positiveInteger(manifest.galViewport?.height, 390),
  };
  state.galStage = {
    width: finiteNumber(manifest.galStage?.width, 48),
    right: finiteNumber(manifest.galStage?.right, 4),
    bottom: finiteNumber(manifest.galStage?.bottom, 0),
  };

  const manifestFiles = manifest.files || {
    body: manifest.body,
    mask: manifest.mask,
    eyes: manifest.expression?.eyes,
    mouth: manifest.expression?.mouth,
  };
  const explicitBasePath = manifest.runtimeBasePath || manifest.assetBasePath;
  if (explicitBasePath) {
    state.assetBasePath = ensureTrailingSlash(explicitBasePath);
  } else {
    const bodyPath = String(manifestFiles.body || "");
    const slash = bodyPath.lastIndexOf("/");
    if (slash >= 0 && bodyPath.startsWith("/")) state.assetBasePath = bodyPath.slice(0, slash + 1);
  }

  elements.characterId.value = state.characterId;
  elements.portraitId.value = state.portraitId;
  elements.displayName.value = state.displayName;
  elements.expressionId.value = state.expressionId;
  elements.assetBasePath.value = state.assetBasePath;
  elements.formatProfile.value = [...elements.formatProfile.options].some((option) => option.value === state.formatProfile)
    ? state.formatProfile
    : "prototype";
  state.formatProfile = elements.formatProfile.value;
  elements.expressionBlinking.checked = state.expressionBlinking;
  elements.galNameplate.textContent = state.displayName;

  ASSET_KEYS.forEach((key) => resetAsset(key));
  ASSET_KEYS.forEach((key) => {
    const fileValue = manifestFiles[key];
    if (!fileValue) return;
    const source = preset ? String(fileValue) : pathForImportedAsset(fileValue, "./");
    loadAssetSource(key, source, basename(fileValue));
  });

  renderCanvas();
  renderFrameControls("eyes");
  renderFrameControls("mouth");
  renderGalStage();
  renderValidation();
  selectExport("json");
  markDirty(false);
  setStatus(preset ? "Sephie 示例配置已载入" : "manifest 已导入");
}

function bindIdentityInputs() {
  const bindings = [
    [elements.characterId, "characterId"],
    [elements.portraitId, "portraitId"],
    [elements.displayName, "displayName"],
    [elements.expressionId, "expressionId"],
    [elements.assetBasePath, "assetBasePath"],
    [elements.formatProfile, "formatProfile"],
  ];
  bindings.forEach(([input, key]) => {
    input.addEventListener("input", () => {
      state[key] = input.value;
      if (key === "displayName") elements.galNameplate.textContent = input.value || state.characterId;
      markDirty();
      renderExport();
    });
  });
  elements.expressionBlinking.addEventListener("change", () => {
    state.expressionBlinking = elements.expressionBlinking.checked;
    markDirty();
    renderExport();
  });
}

function bindAssetInputs() {
  ASSET_KEYS.forEach((key) => {
    const input = elements[`${key}Input`];
    input.addEventListener("change", () => {
      loadAssetFile(key, input.files?.[0]);
      input.value = "";
    });
  });
}

function bindCanvasInputs() {
  elements.canvasWidth.addEventListener("change", () => {
    state.canvas.width = positiveInteger(elements.canvasWidth.value, state.canvas.width);
    markDirty();
    renderCanvas();
  });
  elements.canvasHeight.addEventListener("change", () => {
    state.canvas.height = positiveInteger(elements.canvasHeight.value, state.canvas.height);
    markDirty();
    renderCanvas();
  });
  elements.eyeFrameCount.addEventListener("change", () => {
    state.frameCount.eyes = elements.eyeFrameCount.value;
    markDirty();
    renderFrameControls("eyes");
  });
  elements.mouthFrameCount.addEventListener("change", () => {
    state.frameCount.mouth = elements.mouthFrameCount.value;
    markDirty();
    renderFrameControls("mouth");
  });
}

function bindRegionInputs() {
  document.querySelectorAll("[data-region-input]").forEach((input) => {
    input.addEventListener("input", () => {
      const regionKey = input.dataset.regionInput;
      const axis = input.dataset.axis;
      state.regions[regionKey][axis] = finiteNumber(input.value, state.regions[regionKey][axis]);
      markDirty();
      renderRegion(regionKey);
    });
  });
}

function beginRegionPointer(event, regionKey, resize) {
  if (event.button !== 0) return;
  event.preventDefault();
  clearMotion();
  const guide = regionKey === "eyes" ? elements.eyeGuide : elements.mouthGuide;
  const stageRect = elements.logicalStage.getBoundingClientRect();
  const start = {
    clientX: event.clientX,
    clientY: event.clientY,
    region: { ...state.regions[regionKey] },
  };
  guide.setPointerCapture(event.pointerId);

  const move = (moveEvent) => {
    const deltaX = ((moveEvent.clientX - start.clientX) / Math.max(1, stageRect.width)) * state.canvas.width;
    const deltaY = ((moveEvent.clientY - start.clientY) / Math.max(1, stageRect.height)) * state.canvas.height;
    if (resize) {
      state.regions[regionKey].width = start.region.width + deltaX;
      state.regions[regionKey].height = start.region.height + deltaY;
    } else {
      state.regions[regionKey].x = start.region.x + deltaX;
      state.regions[regionKey].y = start.region.y + deltaY;
    }
    markDirty();
    renderRegion(regionKey);
  };

  const end = () => {
    guide.removeEventListener("pointermove", move);
    guide.removeEventListener("pointerup", end);
    guide.removeEventListener("pointercancel", end);
  };
  guide.addEventListener("pointermove", move);
  guide.addEventListener("pointerup", end);
  guide.addEventListener("pointercancel", end);
}

function bindRegionGuides() {
  REGION_KEYS.forEach((regionKey) => {
    const guide = regionKey === "eyes" ? elements.eyeGuide : elements.mouthGuide;
    guide.addEventListener("pointerdown", (event) => {
      const resize = Boolean(event.target.closest("[data-resize]"));
      beginRegionPointer(event, regionKey, resize);
    });
    guide.addEventListener("keydown", (event) => {
      const deltas = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const delta = deltas[event.key];
      if (!delta) return;
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      state.regions[regionKey].x += delta[0] * step;
      state.regions[regionKey].y += delta[1] * step;
      markDirty();
      renderRegion(regionKey);
    });
  });
}

function bindStageControls() {
  elements.stageBackground.addEventListener("change", () => {
    elements.logicalStage.dataset.background = elements.stageBackground.value;
  });
  elements.stageZoom.addEventListener("input", () => {
    const zoom = finiteNumber(elements.stageZoom.value, 100);
    elements.zoomReadout.textContent = `${zoom}%`;
    elements.stageScaler.style.width = `${zoom}%`;
  });
  elements.showGuides.addEventListener("change", () => {
    elements.logicalStage.classList.toggle("show-guides", elements.showGuides.checked);
  });
  elements.maskEnabled.addEventListener("change", applyMask);
  elements.eyesVisible.addEventListener("change", () => {
    [elements.eyeWindow, elements.galEyeWindow].forEach((windowElement) => {
      windowElement.hidden = !elements.eyesVisible.checked;
    });
  });
  elements.mouthVisible.addEventListener("change", () => {
    [elements.mouthWindow, elements.galMouthWindow].forEach((windowElement) => {
      windowElement.hidden = !elements.mouthVisible.checked;
    });
  });
  elements.blinkOnce.addEventListener("click", () =>
    playSequence("eyes", bounceSequence(state.frameCount.eyes), 85, 1),
  );
  elements.speakOnce.addEventListener("click", () =>
    playSequence("mouth", bounceSequence(state.frameCount.mouth), 105, 3),
  );
  elements.stopMotion.addEventListener("click", () => {
    clearMotion();
    setFrame("eyes", 0);
    setFrame("mouth", 0);
    setStatus("动作已停止");
  });
}

function bindGalControls() {
  [
    [elements.galViewportWidth, "width"],
    [elements.galViewportHeight, "height"],
  ].forEach(([input, key]) => {
    input.addEventListener("input", () => {
      state.galViewport[key] = finiteNumber(input.value, state.galViewport[key]);
      markDirty();
      renderGalStage();
    });
  });
  [
    [elements.galWidth, "width"],
    [elements.galRight, "right"],
    [elements.galBottom, "bottom"],
  ].forEach(([input, key]) => {
    input.addEventListener("input", () => {
      state.galStage[key] = finiteNumber(input.value, state.galStage[key]);
      markDirty();
      renderGalStage();
    });
  });
}

function bindManifestControls() {
  elements.loadSephie.addEventListener("click", () => loadManifest(SEPHIE_PRESET, { preset: true }));
  elements.manifestInput.addEventListener("change", async () => {
    const file = elements.manifestInput.files?.[0];
    elements.manifestInput.value = "";
    if (!file) return;
    try {
      loadManifest(JSON.parse(await file.text()));
    } catch (error) {
      setStatus(`manifest 导入失败：${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

function bindExportControls() {
  elements.jsonTab.addEventListener("click", () => selectExport("json"));
  elements.regionsTab.addEventListener("click", () => selectExport("regions"));
  elements.typescriptTab.addEventListener("click", () => selectExport("typescript"));
  elements.copyJson.addEventListener("click", () => copyText(jsonText(), "JSON 已复制"));
  elements.copyRegions.addEventListener("click", () => copyText(regionsTypeScript(), "regions 已复制"));
  elements.copyTypeScript.addEventListener("click", () => copyText(rigTypeScript(), "完整 rig 已复制"));
  elements.downloadJson.addEventListener("click", downloadManifest);
}

function initialize() {
  bindIdentityInputs();
  bindAssetInputs();
  bindCanvasInputs();
  bindRegionInputs();
  bindRegionGuides();
  bindStageControls();
  bindGalControls();
  bindManifestControls();
  bindExportControls();
  loadManifest(SEPHIE_PRESET, { preset: true });
}

initialize();
