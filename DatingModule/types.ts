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
  locationId: DatingLocationId;
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
}

export interface DatingInvitationContext {
  date: CalendarDateValue;
  characterId: string;
  friendship: number;
  romance: number;
  locationId: DatingLocationId;
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
