import type { CalendarDateValue, CharacterRelationshipDelta } from '../types';

export const DATING_STATE_VERSION = 1 as const;

export type DatingLocationId = 'park' | 'riverbank' | 'townStreet';
export type DatingSceneId = DatingLocationId | 'schoolRoad';
export type DatingQuality = 'awkward' | 'good' | 'great';
export type DatingAppointmentStatus = 'booked' | 'active' | 'completed' | 'cancelled' | 'overridden';
export type DatingGenerationStatus = 'idle' | 'loading' | 'ready' | 'error';
export type WalkHomeStatus = 'skipped' | 'offered' | 'chosen' | 'declined';
export type DatingStageId = 'main' | 'return';

export interface DatingLocationDefinition {
  id: DatingLocationId;
  label: string;
  sceneId: DatingLocationId;
  cardAsset: string;
  backgroundAsset: string;
  /** 用于第三步地图浮起来的"地点小卡"图（通常与 cardAsset 不同）。
   *  若为空则 fallback 到 cardAsset。 */
  thumbnailAsset?: string;
  /** 地点氛围短句，例如"傍晚的公园、长椅的位置刚好"。会显示在地图小卡下方。 */
  atmosphereText: string;
  /** 地图底图，三个地点共用一张。 */
  mapBackgroundAsset: string;
  /** 在地图上的锚点，用于把缩略图浮到地图对应位置（左/中/右）。 */
  mapAnchor: 'left' | 'center' | 'right';
  cost: number;
}

export interface DatingCharacterProgress {
  /** School-safe signed lead/follow axis; this is the internal sub analogue. */
  sub: number;
  hurt: number;
}

export interface DatingGirlRelation {
  /** Directed acceptance of another girl, not a User relationship axis. */
  tolerance: number;
  /** Directed competitive tendency toward another girl. */
  rivalry: number;
  /** Pair-specific bond between two girls. */
  yuriBond: number;
}

export interface DatingGirlRelationDelta {
  tolerance?: number;
  rivalry?: number;
  yuriBond?: number;
}

export interface DatingRelationshipDelta {
  sub?: number;
  hurt?: number;
  girlRelations?: Record<string, Record<string, DatingGirlRelationDelta>>;
}

export interface DatingRelationshipState {
  characterProgress: Record<string, DatingCharacterProgress>;
  girlRelations: Record<string, Record<string, DatingGirlRelation>>;
}

export interface DatingOption {
  id: string;
  label: string;
  relationshipDelta: CharacterRelationshipDelta;
  datingDelta?: DatingRelationshipDelta;
  qualityWeight: number;
}

export interface DatingStagePlan {
  id: DatingStageId;
  label: string;
  sceneId: DatingSceneId;
  options: DatingOption[];
}

export interface DatingDirectorPlan {
  id: string;
  appointmentId: string;
  characterId: string;
  characterName: string;
  playerName: string;
  playerFamilyName: string;
  playerGivenName: string;
  date: CalendarDateValue;
  locationId: DatingLocationId;
  quality: DatingQuality;
  stages: [DatingStagePlan, DatingStagePlan];
}

export interface DatingAppointment {
  id: string;
  date: CalendarDateValue;
  characterId: string;
  locationId: DatingLocationId;
  fee: number;
  status: DatingAppointmentStatus;
  createdAt: string;
  accepted: true;
}

export interface DatingInvitationAttempt {
  id: string;
  date: CalendarDateValue;
  characterId: string;
  /**
   * 第二步邀约时为 `null`（地点尚未决定）。
   * 第四步确认预约前会在对话框内被覆盖；历史记录中保留 `null` 以反映"当时没选地点"的语义。
   */
  locationId: DatingLocationId | null;
  attemptNumber: number;
  acceptanceRate: number;
  roll: number;
  accepted: boolean;
  apSpent: number;
  reason: string;
  createdAt: string;
}

export interface DatingStoryLine {
  speaker: string | null;
  text: string;
  sceneId: DatingSceneId;
  focus: string | null;
  portrait: string | null;
  expression: string | null;
  effect: 'none' | 'flash' | 'shake';
}

export interface DatingGeneratedOption {
  id: string;
  label: string;
}

export interface DatingStageContent {
  stageId: DatingStageId;
  source: 'tavern' | 'fallback';
  lines: DatingStoryLine[];
  /** AI may rewrite presentation text, but the id remains owned by the local plan. */
  options?: DatingGeneratedOption[];
  createdAt: string;
}

export interface DatingGenerationState {
  status: DatingGenerationStatus;
  appointmentId: string | null;
  stageId: DatingStageId | null;
  content: DatingStageContent | null;
  error: string | null;
  requestId: string | null;
}

export interface DatingRun {
  appointmentId: string;
  plan: DatingDirectorPlan;
  stageIndex: 0 | 1;
  pageIndex: number;
  selectedOptionIds: string[];
  stageContents: Partial<Record<DatingStageId, DatingStageContent>>;
  status: 'active' | 'completed' | 'cancelled';
  startedAt: string;
}

export interface DatingArchive {
  id: string;
  appointmentId: string;
  date: CalendarDateValue;
  characterId: string;
  locationId: DatingLocationId;
  quality: DatingQuality;
  selectedOptionIds: string[];
  contents: DatingStageContent[];
  relationshipDelta: CharacterRelationshipDelta;
  datingRelationshipDelta?: DatingRelationshipDelta;
  createdAt: string;
}

export interface WalkHomeRecord {
  dateKey: string;
  characterId: string | null;
  status: WalkHomeStatus;
  probability: number;
  roll: number | null;
  choice: 'together' | 'alone' | null;
  generated: boolean;
  content: DatingStageContent | null;
  createdAt: string;
}

export interface DatingState {
  version: typeof DATING_STATE_VERSION;
  run: DatingRun | null;
  generation: DatingGenerationState;
  relationships: DatingRelationshipState;
  appointments: DatingAppointment[];
  invitationAttempts: DatingInvitationAttempt[];
  archives: DatingArchive[];
  walkHomeByDate: Record<string, WalkHomeRecord>;
  feePromptAppointmentId: string | null;
  /**
   * Persistent version of `DatingScene`'s local `completionMessage`. Set when a
   * dating run finishes and the player has not yet acknowledged the post-date
   * page; cleared when `finishWholeDayActivity({source:'dating-complete'})`
   * is invoked or when `acknowledgeDatingCompletion` is called explicitly.
   * Required so a mid-evaluation reload restores the notice panel.
   */
  pendingDatingCompletion: { message: string; appointmentId: string } | null;
}

export interface DatingInvitationContext {
  date: CalendarDateValue;
  characterId: string;
  friendship: number;
  romance: number;
  /**
   * 邀约阶段为 `null`：第二步仅判定对方是否答应，地点尚未决定。
   * 第四步确认预约时由 `bookAppointment` 单独选择地点，不参与成功率计算。
   */
  locationId: DatingLocationId | null;
  /**
   * 是否已事先知道该角色喜欢的地点。仅在第四步选地点后由对话框写入，
   * 用作 `quality` 加成；不影响邀请成功率。
   */
  favoriteLocation: boolean;
  faceToFace: boolean;
  equippedSkillIds: readonly string[];
  attemptNumber: number;
}

export interface DatingInvitationResult {
  accepted: boolean;
  acceptanceRate: number;
  roll: number;
  fee: number;
  reason: string;
}

export interface WalkHomeEvaluation {
  dateKey: string;
  characterId: string | null;
  probability: number;
  roll: number | null;
  status: WalkHomeStatus;
}
