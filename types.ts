export type GameScreen = 'start' | 'game';

export interface CalendarDateValue {
  year: number;
  month: number;
  day: number;
}

export type PeriodKey = 'morning' | 'class1' | 'lunch' | 'class2' | 'afterSchool' | 'evening';

export type LocationId = 'gate' | 'classroom' | 'library' | 'cafeteria' | 'gym' | 'musicRoom' | 'rooftop' | 'courtyard';

export interface PeriodDefinition {
  key: PeriodKey;
  label: string;
  time: string;
}

export interface MapLocation {
  id: LocationId;
  name: string;
  x: number;
  y: number;
  color: string;
  description: string;
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
  activeMainStoryEventId: string | null;
  completedMainStoryEventIds: string[];
  mainStoryPageIndex: number;
}

export interface GameActions {
  startGame: () => void;
  pauseGame: () => void;
  resumeSession: () => void;
  returnToStart: () => void;
  setLocation: (id: LocationId) => void;
  enterScene: (id: LocationId) => void;
  exitScene: () => void;
  nextPeriod: () => void;
  endDay: () => void;
  settlePlayerAction: (message: string) => boolean;
  addLog: (message: string) => void;
  spawnEvents: () => void;
  resolveEvent: (eventId: string) => void;
  setMainStoryPage: (pageIndex: number) => void;
  completeMainStoryEvent: () => void;
  resetGameState: () => void;
}

export type GameStore = GameState & GameActions;

export interface PlayerState {
  name: string;
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
  resetPlayer: () => void;
  study: () => void;
  exercise: () => void;
  practiceArt: () => void;
  rest: () => void;
  socialize: () => void;
  buySnack: () => void;
}

export type PlayerStore = PlayerState & PlayerActions;

export interface CharacterStats {
  affection: number;
  friendship: number;
  romance: number;
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
  addCardFromFile: (file: File) => Promise<CardAddResult>;
  addCardFromURL: (url: string) => Promise<CardAddResult>;
  removeTarget: (targetId: string) => void;
  setActiveTarget: (targetId: string) => void;
  getActiveTarget: () => GameCharacter | null;
  getTargetsByLocation: (locationId: LocationId) => GameCharacter[];
  updateTarget: (targetId: string, updates: Partial<GameCharacter>) => void;
  addAffection: (targetId: string, amount: number) => void;
  spawnTargetsForPeriod: (periodKey: PeriodKey) => void;
  clearTargets: () => void;
  resetTargets: () => void;
}

export type CardStore = CardStoreState & CardStoreActions;

export interface CharacterStore {
  characters: GameCharacter[];
  spawnForPeriod: (periodKey: PeriodKey) => void;
  addAffection: (id: string, amount: number) => void;
  resetCharacters: () => void;
  getCardStore: () => CardStore;
}

export interface MapStore {
  locations: Record<LocationId, MapLocation>;
  width: number;
  height: number;
  cellSize: number;
}

export type PlayerAction = () => void;
