import type { GalStoryFloor, GalStoryMessageSave, MainStoryState } from './GalMainStory/storyTypes';
import type { DatingState } from './DatingModule/types';

export type GameScreen = 'start' | 'registration' | 'game';

export type PlayerBloodType = 'A' | 'B' | 'AB' | 'O' | 'unknown';

export type PlayerGender = 'male';

export interface PlayerProfile {
  familyName: string;
  givenName: string;
  displayName: string;
  gender: PlayerGender;
  birthdayMonth: number;
  birthdayDay: number;
  bloodType: PlayerBloodType;
  appearance: string;
  personality: string;
  registrationCompleted: true;
}

export interface PlayerRegistrationInput {
  familyName: string;
  givenName: string;
  birthdayMonth: number;
  birthdayDay: number;
  bloodType: PlayerBloodType;
  appearance: string;
  personality: string;
}

export interface CalendarDateValue {
  year: number;
  month: number;
  day: number;
}

export type PeriodKey = 'morning' | 'afterSchool' | 'evening';

export type CharacterAvailabilityRule =
  { kind: 'always' } | { kind: 'after-event'; eventId: string } | { kind: 'locked' };

export interface CharacterPresenceContext {
  periodKey: PeriodKey;
  completedMainStoryEventIds: readonly string[];
}

export type LocationId =
  | 'gate'
  | 'classroom'
  | 'library'
  | 'cafeteria'
  | 'gym'
  | 'musicRoom'
  | 'rooftop'
  | 'courtyard'
  | 'station'
  | 'shoppingStreet'
  | 'park'
  | 'riverbank'
  | 'residentialArea';

export type MapId = 'sainanHigh' | 'sainanTown';

export interface PeriodDefinition {
  key: PeriodKey;
  label: string;
}

export interface MapLocation {
  id: LocationId;
  name: string;
  x: number;
  y: number;
  color: string;
  description: string;
}

export interface GameMapDefinition {
  id: MapId;
  name: string;
  background: string;
  entryLocationId: LocationId;
  locationIds: readonly LocationId[];
}

export interface GameEvent {
  id: string;
  label: string;
  message: string;
  locationId: LocationId;
}

export interface GameState {
  screen: GameScreen;
  hasSession: boolean;
  day: number;
  date: CalendarDateValue;
  actionPointsRemaining: number;
  periodIndex: number;
  currentLocationId: LocationId;
  currentSceneId: LocationId | null;
  isPlaying: boolean;
  log: string[];
  events: GameEvent[];
  mainStory: MainStoryState;
  /**
   * 整天活动状态：
   *  - `'dating'`：约会进行中（Zustand 中持有 run cursor 与 stage）。
   *  - `'dating-completing'`：约会正文已完成、评价页等待玩家点"返回地图"；此时 store 已经没有 run cursor，
   *     等待 `finishWholeDayActivity({source:'dating-complete'})` 推进日期。
   *  - `null`：非整天活动。
   */
  wholeDayActivity: 'dating' | 'dating-completing' | null;
  /**
   * Transient source marker for the most recent `date` advance. Not persisted
   * to `GameSnapshot`. Consumed (and cleared) by `<App>` to decide whether to
   * mount `DayTransition`. Values:
   *  - `whole-day`: a normal AP-exhausted day end (settlePlayerAction).
   *  - `dating-complete`: a dating run finished via finishWholeDayActivity({source:'dating-complete'}).
   *  - `load`: restoreGameSnapshot wrote a new date.
   *  - `new-game`: resetGameState / new registration.
   *  - `action`: explicit other call sites that intentionally push the date.
   */
  lastDateAdvanceSource: DateAdvanceSource | null;
}

export type PlayerActionKind = 'activity' | 'talk';

export interface PlayerActionRequest {
  kind: PlayerActionKind;
  message: string;
}

export interface PlayerActionSettlement {
  accepted: boolean;
  startsMainStory: boolean;
  dayAdvanced: boolean;
  periodKey: PeriodKey;
}

export interface WholeDayActivitySettlement {
  accepted: boolean;
  dayAdvanced: boolean;
  reason: string | null;
}

export type DateAdvanceSource = 'whole-day' | 'dating-complete' | 'load' | 'new-game' | 'action';

export interface GameActions {
  startGame: () => void;
  pauseGame: () => void;
  resumeSession: () => void;
  returnToStart: () => void;
  setLocation: (id: LocationId) => void;
  enterScene: (id: LocationId) => void;
  exitScene: () => void;
  settlePlayerAction: (request: PlayerActionRequest) => PlayerActionSettlement;
  consumeActionPoint: (message: string) => PlayerActionSettlement;
  beginWholeDayActivity: (kind?: 'dating') => WholeDayActivitySettlement;
  finishWholeDayActivity: (options?: { source?: DateAdvanceSource }) => boolean;
  /** Mark the active dating run as finished-but-acknowledgement-pending. */
  markDatingSettlementPending: () => boolean;
  addLog: (message: string) => void;
  spawnEvents: () => void;
  resolveEvent: (eventId: string) => void;
  reconcilePendingMainStoryEntry: () => boolean;
  beginMainStoryGeneration: (requestId: string) => boolean;
  setMainStoryActContent: (floor: GalStoryFloor, messages: GalStoryMessageSave[]) => void;
  failMainStoryGeneration: (message: string, messages?: GalStoryMessageSave[], floor?: GalStoryFloor) => void;
  addMainStoryFloor: (floor: GalStoryFloor, messages: GalStoryMessageSave[], basedOnFloorId: string) => boolean;
  selectMainStoryFloor: (floorId: string) => boolean;
  deleteMainStoryFloor: (floorId: string) => boolean;
  setMainStoryPosition: (actId: string, pageIndex: number) => void;
  selectMainStoryChoice: (choiceId: string, optionId: string, customText?: string) => boolean;
  finishMainStoryAct: () => boolean;
  completeRegistration: () => void;
  resetGameState: () => void;
  /** Clear `lastDateAdvanceSource` after `<App>` has consumed it. */
  acknowledgeDateAdvance: () => void;
}

export type GameStore = GameState & GameActions;

export type { DatingState };

export interface PlayerState {
  name: string;
  profile: PlayerProfile | null;
  color: string;
  avatar: string;
  intelligence: number;
  athletics: number;
  art: number;
  charm: number;
  stamina: number;
  stress: number;
  money: number;
}

export interface PlayerActions {
  isTired: () => boolean;
  isStressed: () => boolean;
  setColor: (color: string) => void;
  completeRegistration: (profile: PlayerProfile) => boolean;
  resetPlayer: () => void;
  study: () => void;
  exercise: () => void;
  practiceArt: () => void;
  rest: () => void;
  socialize: () => void;
  buySnack: () => void;
  spendMoney: (amount: number) => boolean;
}

export type PlayerStore = PlayerState & PlayerActions;

export interface CharacterStats {
  affection: number;
  friendship: number;
  romance: number;
}

export interface CharacterRelationshipDelta {
  friendship?: number;
  romance?: number;
}

export interface CharacterGameData {
  id: string;
  color: string;
  type: string;
  favoriteLocations: LocationId[];
  stats: CharacterStats;
  events: unknown[];
  chibi_image: string | null;
  portrait_image: string | null;
  tachie_image: string | null;
}

export interface CharacterBookEntry {
  id: number;
  keys: string[];
  content: string;
  extensions?: Record<string, unknown>;
  enabled: boolean;
  insertion_order: number;
  case_sensitive: boolean;
  name: string;
  priority: number;
  comment?: string;
  selective: boolean;
  secondary_keys?: string[];
  constant: boolean;
  position: string;
  [key: string]: unknown;
}

export interface CharacterBook {
  name?: string;
  description?: string;
  scan_depth?: number;
  token_budget?: number;
  recursive_scanning?: boolean;
  extensions?: Record<string, unknown>;
  entries: CharacterBookEntry[];
  [key: string]: unknown;
}

export interface CharacterCardData {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  creator_notes: string;
  system_prompt: string;
  post_history_instructions: string;
  alternate_greetings: string[];
  character_book: CharacterBook;
  tags: string[];
  creator: string;
  character_version: string;
  extensions: Record<string, unknown> & { game_data: CharacterGameData };
  [key: string]: unknown;
}

export interface CharacterCard {
  spec: 'chara_card_v2';
  spec_version: string;
  data: CharacterCardData;
  [key: string]: unknown;
}

export interface LegacyCharacterCard {
  name: string;
  description?: string;
  personality?: string;
  scenario?: string;
  first_mes?: string;
  mes_example?: string;
  creator_notes?: string;
  system_prompt?: string;
  post_history_instructions?: string;
  alternate_greetings?: string[];
  character_book?: CharacterBook;
  tags?: string[];
  creator?: string;
  character_version?: string;
  extensions?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GameCharacter extends CharacterStats {
  id: string;
  name: string;
  color: string;
  type: string;
  favoriteLocations: LocationId[];
  greeting: string;
  portrait: string;
  chibi: string;
  tachie: string | null;
  currentLocationId: LocationId | null;
  _cardData: CharacterCard;
}

export interface CardLoadSuccess {
  success: true;
  card: CharacterCard;
}

export interface CardLoadFailure {
  success: false;
  error: string;
}

export type CardLoadResult = CardLoadSuccess | CardLoadFailure;

export interface CardAddSuccess {
  success: true;
  character: GameCharacter;
}

export interface CardAddFailure {
  success: false;
  error: string;
}

export type CardAddResult = CardAddSuccess | CardAddFailure;

export interface CardStoreState {
  targets: GameCharacter[];
  activeTargetId: string | null;
  loadedCards: CharacterCard[];
  isLoading: boolean;
  error: string | null;
}

export interface CardStoreActions {
  addCardFromJSON: (jsonData: unknown) => Promise<CardAddResult>;
  removeTarget: (targetId: string) => void;
  setActiveTarget: (targetId: string) => void;
  getActiveTarget: () => GameCharacter | null;
  getTargetsByLocation: (locationId: LocationId) => GameCharacter[];
  updateTarget: (targetId: string, updates: Partial<GameCharacter>) => void;
  addAffection: (targetId: string, amount: number) => void;
  applyRelationshipDelta: (targetId: string, delta: CharacterRelationshipDelta) => void;
  syncTargetLocations: (context: CharacterPresenceContext) => void;
  clearTargets: () => void;
  resetTargets: () => void;
}

export type CardStore = CardStoreState & CardStoreActions;

export interface CharacterStore {
  characters: GameCharacter[];
  syncPresence: () => void;
  addAffection: (id: string, amount: number) => void;
  resetCharacters: () => void;
  getCardStore: () => CardStore;
}

export interface MapStore {
  maps: Record<MapId, GameMapDefinition>;
  locations: Record<LocationId, MapLocation>;
  width: number;
  height: number;
  cellSize: number;
}

export type PlayerAction = () => void;
