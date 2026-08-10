import type { GalStoryBeat, StoryActCgDefinition, StoryActPresentation, StoryCgFrameDefinition } from './storyTypes';

const STORY_CG_FRAMINGS = ['cover-center', 'safe-face-closeup'] as const;
const STORY_CG_TRANSITIONS = ['fade', 'steam-zoom-out'] as const;

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function isValidCamera(camera: StoryCgFrameDefinition['camera']): boolean {
  if (!camera) return true;
  return (
    Number.isFinite(camera.focusXPercent) &&
    camera.focusXPercent >= 0 &&
    camera.focusXPercent <= 100 &&
    Number.isFinite(camera.focusYPercent) &&
    camera.focusYPercent >= 0 &&
    camera.focusYPercent <= 100 &&
    Number.isFinite(camera.zoom) &&
    camera.zoom >= 1 &&
    camera.zoom <= 3
  );
}

export function validateStoryCgDefinitions(presentation: StoryActPresentation): void {
  const cgIds = new Set<string>();
  const triggerKeys = new Set<string>();

  for (const cg of presentation.cgShots ?? []) {
    if (!cg.id.trim() || cgIds.has(cg.id)) throw new Error(`剧情 CG ID“${cg.id}”为空或重复。`);
    cgIds.add(cg.id);

    if (!Array.isArray(cg.frames) || cg.frames.length === 0) {
      throw new Error(`剧情 CG“${cg.id}”至少要登记一帧。`);
    }
    const frameIds = new Set<string>();
    for (const [frameIndex, frame] of cg.frames.entries()) {
      if (
        !frame.id.trim() ||
        !frame.asset.startsWith('/') ||
        !frame.alt.trim() ||
        !STORY_CG_FRAMINGS.includes(frame.framing) ||
        !isValidCamera(frame.camera)
      ) {
        throw new Error(
          `剧情 CG“${cg.id}”的第 ${frameIndex + 1} 帧必须登记 ID、站内资源路径、替代文本、合法裁切和镜头参数。`,
        );
      }
      if (frameIds.has(frame.id)) {
        throw new Error(`剧情 CG“${cg.id}”重复登记了帧 ID“${frame.id}”。`);
      }
      frameIds.add(frame.id);
    }
    if (!presentation.sceneIds.includes(cg.sceneId)) {
      throw new Error(`剧情 CG“${cg.id}”引用了当前幕未登记的场景“${cg.sceneId}”。`);
    }
    if (!isNonNegativeInteger(cg.afterSceneBeat)) throw new Error(`剧情 CG“${cg.id}”的触发页无效。`);
    if (!STORY_CG_TRANSITIONS.includes(cg.transition)) throw new Error(`剧情 CG“${cg.id}”的转场无效。`);

    const triggerKey = `${cg.sceneId}\u0000${cg.afterSceneBeat}`;
    if (triggerKeys.has(triggerKey)) throw new Error(`剧情 CG“${cg.id}”与同场景的另一段 CG 触发页重复。`);
    triggerKeys.add(triggerKey);
  }
}

export function resolveStoryCgFrame(
  cg: StoryActCgDefinition | null | undefined,
  frameIndex: number,
): StoryCgFrameDefinition | null {
  if (!cg || !Number.isInteger(frameIndex) || frameIndex < 0) return null;
  return cg.frames[frameIndex] ?? null;
}

export function getNextStoryCgFrameIndex(cg: StoryActCgDefinition, frameIndex: number): number | null {
  if (!resolveStoryCgFrame(cg, frameIndex)) return null;
  const nextFrameIndex = frameIndex + 1;
  return nextFrameIndex < cg.frames.length ? nextFrameIndex : null;
}

/**
 * Resolves an act-local CG from accepted presentation cues only. It never
 * guesses from prose, speaker names, episode IDs, or model-authored paths.
 */
export function resolveStoryCgAfterPage(
  presentation: StoryActPresentation | undefined,
  beats: readonly GalStoryBeat[],
  pageIndex: number,
): StoryActCgDefinition | null {
  const beat = beats[pageIndex];
  if (!presentation || !beat || !Number.isInteger(pageIndex) || pageIndex < 0) return null;

  const sceneBeatIndex =
    beats.slice(0, pageIndex + 1).filter(candidate => candidate.presentation.sceneId === beat.presentation.sceneId)
      .length - 1;

  return (
    presentation.cgShots?.find(
      cg => cg.sceneId === beat.presentation.sceneId && sceneBeatIndex === cg.afterSceneBeat,
    ) ?? null
  );
}
