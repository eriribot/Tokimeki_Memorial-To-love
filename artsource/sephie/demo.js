/*
 * ================================================================
 * SEPHIE RIG CONFIG — 已按最终 1024px 素材校准。
 * ================================================================
 * 坐标保持集中在此处，不要把角色专属数值分散到 CSS。
 */
const SEPHIE_RIG_CONFIG = {
  id: "sephie",
  canvas: { width: 1024, height: 1024 },
  anchors: {
    center: { x: 512, y: 512 },
    ground: { x: 512, y: 1024 },
    face: { x: 512, y: 180 },
  },
  files: {
    body: "sephie_body.png",
    mask: "sephie_mask.png",
    eyes: "sephie_a_eye.png",
    mouth: "sephie_a_mouth.png",
  },
  expectedDimensions: {
    body: { width: 1024, height: 1024 },
    mask: { width: 1024, height: 1024 },
    eyes: { width: 256, height: 512 },
    mouth: { width: 256, height: 256 },
  },
  regions: {
    eyes: { x: 400, y: 90, width: 225, height: 145 },
    mouth: { x: 420, y: 185, width: 185, height: 105 },
  },
  frameCount: 3,
  animations: {
    blink: {
      order: [0, 1, 2, 1, 0],
      cycleMs: 4200,
      // 2% of the 4.2s cycle, matching the compact blink at the cycle end.
      frameMs: 84,
    },
    speaking: {
      order: [0, 1, 2, 1, 0],
      frameMs: 105,
      repeats: 4,
    },
    breathing: { cycleMs: 4200 },
    reducedMotion: { eyes: 0, mouth: 0 },
  },
};

// Console access is intentional: this is an internal calibration page.
window.SEPHIE_RIG_CONFIG = SEPHIE_RIG_CONFIG;

const elements = {
  portrait: document.querySelector("#sephiePortrait"),
  logicalStage: document.querySelector("#logicalStage"),
  body: document.querySelector("#bodyLayer"),
  eyes: document.querySelector("#eyeLayer"),
  mouth: document.querySelector("#mouthLayer"),
  eyeWindow: document.querySelector("#eyeWindow"),
  mouthWindow: document.querySelector("#mouthWindow"),
  eyeGuide: document.querySelector("#eyeGuide"),
  mouthGuide: document.querySelector("#mouthGuide"),
  eyeAtlasPreview: document.querySelector("#eyeAtlasPreview"),
  mouthAtlasPreview: document.querySelector("#mouthAtlasPreview"),
  blinkOnce: document.querySelector("#blinkOnce"),
  speakOnce: document.querySelector("#speakOnce"),
  stopMotion: document.querySelector("#stopMotion"),
  resetDemo: document.querySelector("#resetDemo"),
  autoBlink: document.querySelector("#autoBlink"),
  autoSpeak: document.querySelector("#autoSpeak"),
  showGuides: document.querySelector("#showGuides"),
  maskEnabled: document.querySelector("#maskEnabled"),
  eyesVisible: document.querySelector("#eyesVisible"),
  mouthVisible: document.querySelector("#mouthVisible"),
  stageBackground: document.querySelector("#stageBackground"),
  stageZoom: document.querySelector("#stageZoom"),
  zoomReadout: document.querySelector("#zoomReadout"),
  frameReadout: document.querySelector("#frameReadout"),
  eventLog: document.querySelector("#eventLog"),
  motionPreference: document.querySelector("#motionPreference"),
  assetSummary: document.querySelector("#assetSummary"),
  assetList: document.querySelector("#assetList"),
  eyeCoordinates: document.querySelector("#eyeCoordinates"),
  mouthCoordinates: document.querySelector("#mouthCoordinates"),
};

const state = {
  eyeFrame: 0,
  mouthFrame: 0,
  eyeSequenceToken: 0,
  eyeTimers: [],
  autoBlinkTimer: null,
  speechTimer: null,
  speechStep: 0,
  speechTransitions: 0,
  assetStates: new Map(),
};

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function percent(value, total) {
  return `${(value / total) * 100}%`;
}

function setRectangle(element, region) {
  element.style.left = percent(region.x, SEPHIE_RIG_CONFIG.canvas.width);
  element.style.top = percent(region.y, SEPHIE_RIG_CONFIG.canvas.height);
  element.style.width = percent(region.width, SEPHIE_RIG_CONFIG.canvas.width);
  element.style.height = percent(region.height, SEPHIE_RIG_CONFIG.canvas.height);
}

function rectangleText(region) {
  return `x:${region.x}  y:${region.y}  w:${region.width}  h:${region.height}`;
}

function announce(message) {
  elements.eventLog.textContent = message;
}

function updateFrameReadout() {
  elements.frameReadout.textContent = `眼睛 ${state.eyeFrame} / 嘴型 ${state.mouthFrame}`;

  document.querySelectorAll("[data-kind][data-frame]").forEach((button) => {
    const activeFrame = button.dataset.kind === "eyes" ? state.eyeFrame : state.mouthFrame;
    button.setAttribute("aria-pressed", String(Number(button.dataset.frame) === activeFrame));
  });
}

function setEyeFrame(frame) {
  const safeFrame = Math.max(0, Math.min(SEPHIE_RIG_CONFIG.frameCount - 1, Number(frame)));
  state.eyeFrame = safeFrame;
  elements.eyes.style.top = `${safeFrame * -100}%`;
  updateFrameReadout();
}

function setMouthFrame(frame) {
  const safeFrame = Math.max(0, Math.min(SEPHIE_RIG_CONFIG.frameCount - 1, Number(frame)));
  state.mouthFrame = safeFrame;
  elements.mouth.style.top = `${safeFrame * -100}%`;
  updateFrameReadout();
}

function clearEyeTimers() {
  state.eyeSequenceToken += 1;
  state.eyeTimers.forEach((timer) => window.clearTimeout(timer));
  state.eyeTimers = [];
}

function clearAutoBlinkTimer() {
  if (state.autoBlinkTimer !== null) {
    window.clearTimeout(state.autoBlinkTimer);
    state.autoBlinkTimer = null;
  }
}

function scheduleAutoBlink() {
  clearAutoBlinkTimer();

  if (!elements.autoBlink.checked || reducedMotionQuery.matches) {
    return;
  }

  const { order, cycleMs, frameMs } = SEPHIE_RIG_CONFIG.animations.blink;
  const sequenceDuration = frameMs * (order.length - 1);
  const restDuration = Math.max(0, cycleMs - sequenceDuration);

  state.autoBlinkTimer = window.setTimeout(() => {
    playBlink(true);
  }, restDuration);
}

function playBlink(fromAuto = false) {
  if (reducedMotionQuery.matches) {
    setEyeFrame(SEPHIE_RIG_CONFIG.animations.reducedMotion.eyes);
    announce("系统启用了减少动态：眨眼动画已停用，可使用逐帧按钮检查素材");
    return;
  }

  clearAutoBlinkTimer();
  clearEyeTimers();
  elements.logicalStage.classList.remove("motion-paused");

  const { order, frameMs } = SEPHIE_RIG_CONFIG.animations.blink;
  const token = state.eyeSequenceToken;

  order.forEach((frame, index) => {
    const timer = window.setTimeout(() => {
      if (token !== state.eyeSequenceToken) return;
      setEyeFrame(frame);

      if (index === order.length - 1) {
        announce(fromAuto ? "自动眨眼完成" : "手动眨眼完成");
        scheduleAutoBlink();
      }
    }, index * frameMs);
    state.eyeTimers.push(timer);
  });
}

function stopSpeech({ restoreFrame = true } = {}) {
  if (state.speechTimer !== null) {
    window.clearInterval(state.speechTimer);
    state.speechTimer = null;
  }

  state.speechStep = 0;
  state.speechTransitions = 0;
  if (restoreFrame) setMouthFrame(SEPHIE_RIG_CONFIG.animations.reducedMotion.mouth);
}

function startSpeech(repeats = Number.POSITIVE_INFINITY, source = "manual") {
  if (reducedMotionQuery.matches) {
    stopSpeech();
    announce("系统启用了减少动态：嘴型动画已停用，可使用逐帧按钮检查素材");
    return;
  }

  stopSpeech();
  elements.logicalStage.classList.remove("motion-paused");
  const { order, frameMs } = SEPHIE_RIG_CONFIG.animations.speaking;
  const cycle = order.slice(0, -1);
  const transitionsPerRepeat = order.length - 1;
  const maxTransitions = Number.isFinite(repeats) ? repeats * transitionsPerRepeat : Infinity;

  setMouthFrame(cycle[0]);
  state.speechTimer = window.setInterval(() => {
    state.speechStep = (state.speechStep + 1) % cycle.length;
    state.speechTransitions += 1;
    setMouthFrame(cycle[state.speechStep]);

    if (state.speechTransitions >= maxTransitions) {
      stopSpeech();
      announce("说话测试完成，嘴型回到第 0 帧");
    }
  }, frameMs);

  announce(source === "auto" ? "自动说话已启动" : `开始说话测试：${repeats} 轮`);
}

function stopAllMotion({ disableAuto = false } = {}) {
  clearAutoBlinkTimer();
  clearEyeTimers();
  stopSpeech();
  setEyeFrame(SEPHIE_RIG_CONFIG.animations.reducedMotion.eyes);

  if (disableAuto) {
    elements.autoBlink.checked = false;
    elements.autoSpeak.checked = false;
    elements.logicalStage.classList.add("motion-paused");
  }
}

function updateMotionPreference() {
  const reduced = reducedMotionQuery.matches;
  elements.motionPreference.dataset.reduced = String(reduced);
  elements.motionPreference.textContent = reduced
    ? "减少动态：已停用自动动画"
    : "标准动态：4.2s 呼吸与眨眼";

  if (reduced) {
    stopAllMotion();
  } else {
    scheduleAutoBlink();
    if (elements.autoSpeak.checked) startSpeech(Infinity, "auto");
  }
}

function setAssetStatus(key, status, message) {
  const row = elements.assetList.querySelector(`[data-asset="${key}"]`);
  row.dataset.state = status;
  row.querySelector("output").textContent = message;
  state.assetStates.set(key, status);

  const statuses = [...state.assetStates.values()];
  const okCount = statuses.filter((entry) => entry === "ok").length;
  const warningCount = statuses.filter((entry) => entry === "warning").length;
  const errorCount = statuses.filter((entry) => entry === "error").length;
  const loadedCount = okCount + warningCount;

  elements.assetSummary.textContent = `${loadedCount} / ${Object.keys(SEPHIE_RIG_CONFIG.files).length}`;
  elements.assetSummary.dataset.state = errorCount > 0 ? "error" : okCount === 4 ? "ok" : "loading";

  if (errorCount > 0) {
    announce(`有 ${errorCount} 个素材无法载入，请用本地静态服务器打开`);
  } else if (loadedCount === 4) {
    announce(warningCount > 0 ? "素材均已载入，但存在尺寸警告" : "4 个素材均已载入，尺寸符合约定");
  }
}

function verifyAsset(key, src, expected) {
  state.assetStates.set(key, "loading");
  const image = new Image();

  image.addEventListener("load", () => {
    const actual = `${image.naturalWidth}×${image.naturalHeight}`;
    const matches = image.naturalWidth === expected.width && image.naturalHeight === expected.height;
    setAssetStatus(key, matches ? "ok" : "warning", matches ? `OK · ${actual}` : `尺寸警告 · ${actual}`);
  });

  image.addEventListener("error", () => {
    setAssetStatus(key, "error", "载入失败");
  });

  image.src = src;
}

function applyRigConfig() {
  const { files, regions, expectedDimensions } = SEPHIE_RIG_CONFIG;

  elements.body.src = files.body;
  elements.eyes.src = files.eyes;
  elements.mouth.src = files.mouth;
  elements.eyeAtlasPreview.src = files.eyes;
  elements.mouthAtlasPreview.src = files.mouth;
  elements.portrait.style.setProperty("--mask-url", `url("${files.mask}")`);
  elements.portrait.style.animationDuration = `${SEPHIE_RIG_CONFIG.animations.breathing.cycleMs}ms`;

  setRectangle(elements.eyeWindow, regions.eyes);
  setRectangle(elements.eyeGuide, regions.eyes);
  setRectangle(elements.mouthWindow, regions.mouth);
  setRectangle(elements.mouthGuide, regions.mouth);
  elements.eyeCoordinates.textContent = rectangleText(regions.eyes);
  elements.mouthCoordinates.textContent = rectangleText(regions.mouth);

  Object.keys(files).forEach((key) => {
    verifyAsset(key, files[key], expectedDimensions[key]);
  });
}

function selectManualFrame(kind, frame) {
  if (kind === "eyes") {
    elements.autoBlink.checked = false;
    clearAutoBlinkTimer();
    clearEyeTimers();
    setEyeFrame(frame);
    announce(`眼睛锁定到第 ${frame} 帧；自动眨眼已暂停`);
    return;
  }

  elements.autoSpeak.checked = false;
  stopSpeech({ restoreFrame: false });
  setMouthFrame(frame);
  announce(`嘴型锁定到第 ${frame} 帧；自动说话已暂停`);
}

function resetDemo() {
  stopAllMotion();
  elements.autoBlink.checked = true;
  elements.autoSpeak.checked = false;
  elements.showGuides.checked = true;
  elements.maskEnabled.checked = true;
  elements.eyesVisible.checked = true;
  elements.mouthVisible.checked = true;
  elements.stageBackground.value = "checker";
  elements.stageZoom.value = "100";
  elements.zoomReadout.textContent = "100%";
  elements.logicalStage.style.setProperty("--stage-size", "100%");
  elements.logicalStage.dataset.background = "checker";
  elements.logicalStage.classList.add("show-guides");
  elements.logicalStage.classList.remove("mask-off", "eyes-hidden", "mouth-hidden");
  elements.logicalStage.classList.remove("motion-paused");
  setEyeFrame(0);
  setMouthFrame(0);
  scheduleAutoBlink();
  announce(reducedMotionQuery.matches ? "已重置；减少动态模式保持生效" : "演示已重置，自动眨眼已开启");
}

elements.blinkOnce.addEventListener("click", () => playBlink(false));

elements.speakOnce.addEventListener("click", () => {
  elements.autoSpeak.checked = false;
  startSpeech(SEPHIE_RIG_CONFIG.animations.speaking.repeats, "manual");
});

elements.stopMotion.addEventListener("click", () => {
  stopAllMotion({ disableAuto: true });
  announce("动作已停止，眼睛和嘴型回到第 0 帧");
});

elements.resetDemo.addEventListener("click", resetDemo);

elements.autoBlink.addEventListener("change", () => {
  clearAutoBlinkTimer();
  clearEyeTimers();
  setEyeFrame(0);

  if (elements.autoBlink.checked) {
    scheduleAutoBlink();
    announce(reducedMotionQuery.matches ? "自动眨眼已选择，但减少动态模式会阻止播放" : "自动眨眼已开启");
  } else {
    announce("自动眨眼已关闭");
  }
});

elements.autoSpeak.addEventListener("change", () => {
  if (elements.autoSpeak.checked) {
    startSpeech(Infinity, "auto");
  } else {
    stopSpeech();
    announce("自动说话已关闭");
  }
});

document.querySelectorAll("[data-kind][data-frame]").forEach((button) => {
  button.addEventListener("click", () => {
    selectManualFrame(button.dataset.kind, Number(button.dataset.frame));
  });
});

elements.stageBackground.addEventListener("change", () => {
  elements.logicalStage.dataset.background = elements.stageBackground.value;
});

elements.stageZoom.addEventListener("input", () => {
  const zoom = elements.stageZoom.value;
  elements.logicalStage.style.setProperty("--stage-size", `${zoom}%`);
  elements.zoomReadout.textContent = `${zoom}%`;
});

elements.showGuides.addEventListener("change", () => {
  elements.logicalStage.classList.toggle("show-guides", elements.showGuides.checked);
});

elements.maskEnabled.addEventListener("change", () => {
  elements.logicalStage.classList.toggle("mask-off", !elements.maskEnabled.checked);
  announce(elements.maskEnabled.checked ? "Alpha mask 已应用到整张立绘" : "Alpha mask 已临时关闭，仅用于底图对照");
});

elements.eyesVisible.addEventListener("change", () => {
  const hidden = !elements.eyesVisible.checked;
  elements.logicalStage.classList.toggle("eyes-hidden", hidden);
  announce(hidden ? "eyes 动态贴片已隐藏，仅显示 body 底图" : "eyes 动态贴片已显示");
});

elements.mouthVisible.addEventListener("change", () => {
  const hidden = !elements.mouthVisible.checked;
  elements.logicalStage.classList.toggle("mouth-hidden", hidden);
  announce(hidden ? "mouth 动态贴片已隐藏，仅显示 body 底图" : "mouth 动态贴片已显示");
});

if (typeof reducedMotionQuery.addEventListener === "function") {
  reducedMotionQuery.addEventListener("change", updateMotionPreference);
} else {
  // Safari 13 and older.
  reducedMotionQuery.addListener(updateMotionPreference);
}

applyRigConfig();
setEyeFrame(0);
setMouthFrame(0);
updateMotionPreference();
scheduleAutoBlink();

window.SephieDemo = {
  config: SEPHIE_RIG_CONFIG,
  blink: () => playBlink(false),
  speak: (repeats = SEPHIE_RIG_CONFIG.animations.speaking.repeats) => startSpeech(repeats, "manual"),
  stop: () => stopAllMotion({ disableAuto: true }),
  reset: resetDemo,
  setEyeFrame,
  setMouthFrame,
};
