import { createSaveUuid } from '../save/uuid';
import { runExclusiveStoryGeneration } from '../services/storyGenerationMutex';
import { normalizePlayerProfileText, PLAYER_PROFILE_TEXT_MAX_LENGTH } from '../stores/playerStore';
import { VELVET_ROOM_START_SIGNAL, VELVET_ROOM_SYSTEM_PROMPT } from './velvetRoomPrompt';

export interface VelvetRoomMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface VelvetRoomProfileResult {
  personality: string;
  report: string;
}

export interface VelvetRoomChoiceOption {
  id: string;
  label: string;
}

export interface VelvetRoomQuestionTurn {
  kind: 'question';
  raw: string;
  stage: number;
  question: string;
  options: VelvetRoomChoiceOption[];
}

export interface VelvetRoomResultTurn {
  kind: 'result';
  raw: string;
  stage: 6;
  closingText: string;
  result: VelvetRoomProfileResult;
}

export type VelvetRoomTurn = VelvetRoomQuestionTurn | VelvetRoomResultTurn;

const VELVET_ROOM_GENERATION_ID = 'velvet-room';
const VELVET_ROOM_REPORT_MIN_LENGTH = 300;
const VELVET_ROOM_REPORT_MAX_LENGTH = 800;
const VELVET_ROOM_QUESTION_MAX_LENGTH = 160;
const VELVET_ROOM_OPTION_MAX_LENGTH = 80;
const VELVET_ROOM_CLOSING_MAX_LENGTH = 160;
const OPTION_LINE_PATTERN = /^@选项【index=(\d+)】：([^\r\n]+)$/gmu;
const OPTION_LINE_ANY_PATTERN = /^@选项【index=\d+】：[^\r\n]+$/mu;
const RESULT_TAG_PATTERN = /<\/?(?:personality|report)(?:\s[^>]*)?>/iu;
const APPEARANCE_TAG_PATTERN = /<\/?appearance(?:\s[^>]*)?>/iu;
const COMPLETION_TAG_PATTERN = /<\/?(?:closing|personality|report)(?:\s[^>]*)?>/iu;

function getTavernGenerateApi(): Pick<Window['TavernHelper'], 'generateRaw'> {
  const api = window.TavernHelper;
  if (!api || typeof api.generateRaw !== 'function') {
    throw new Error('没有检测到 TavernHelper.generateRaw，请在 SillyTavern 酒馆助手环境中重试。');
  }
  return api;
}

/** 创建一份只在内存中存在的空会话历史，不写楼层、不进存档，用完即弃。 */
export function createVelvetRoomHistory(): VelvetRoomMessage[] {
  return [];
}

function stripTagBlock(text: string, tag: string): string {
  return text
    .replace(new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, 'gu'), '')
    .replace(new RegExp(`<${tag}>[\\s\\S]*$`, 'u'), '');
}

/** 兼容诊断工具：剥离协议块和候选项，只留下可见的赛菲文本。 */
export function stripVelvetRoomHidden(text: string): string {
  return ['think', 'tucao', 'profile_state', 'appearance', 'personality', 'report']
    .reduce((visible, tag) => stripTagBlock(visible, tag), text)
    .replace(OPTION_LINE_PATTERN, '')
    .replace(/<\/?(?:question|closing)>/gu, '')
    .trim();
}

function extractTagBlock(text: string, tag: string): string | null {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'u'));
  const content = match?.[1]?.trim();
  return content ? content : null;
}

function removeCompleteTagBlock(text: string, tag: string): string {
  return text.replace(new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, 'gu'), '');
}

function normalizeVisibleText(value: string): string {
  return value.normalize('NFKC').replace(/[\t\r\n ]+/gu, ' ').trim();
}

function requireProfileStage(text: string): number {
  const state = extractTagBlock(text, 'profile_state');
  if (!state) throw new Error('赛菲返回的内部阶段状态不完整，请重新生成这一题。');
  const stage = Number(state.match(/阶段\s*[:：]\s*([1-6])/u)?.[1]);
  if (!Number.isInteger(stage) || stage < 1 || stage > 6) {
    throw new Error('赛菲返回的画像阶段无效，请重新生成这一题。');
  }
  return stage;
}

/** 性格与报告齐全且通过登记合同才判定完成；损坏的结果标签会显式失败。 */
export function parseVelvetRoomResult(text: string): VelvetRoomProfileResult | null {
  if (APPEARANCE_TAG_PATTERN.test(text)) {
    throw new Error('赛菲不应推断外貌；外貌必须由玩家在入学登记表中亲自填写。');
  }

  const personality = extractTagBlock(text, 'personality');
  const report = extractTagBlock(text, 'report');
  const hasAnyResultTag = RESULT_TAG_PATTERN.test(text);
  if (!personality && !report && !hasAnyResultTag) return null;
  if (!personality || !report) {
    throw new Error('赛菲返回的画像结果不完整，请重新生成这一回合。');
  }

  const normalizedPersonality = normalizePlayerProfileText(personality);
  const personalityLength = Array.from(normalizedPersonality).length;
  if (personalityLength === 0 || personalityLength > PLAYER_PROFILE_TEXT_MAX_LENGTH) {
    throw new Error(`赛菲返回的性格画像必须为 1 到 ${PLAYER_PROFILE_TEXT_MAX_LENGTH} 个字符，请让她重新归纳。`);
  }

  const normalizedReport = normalizePlayerProfileText(report);
  const reportLength = Array.from(normalizedReport).length;
  if (reportLength < VELVET_ROOM_REPORT_MIN_LENGTH || reportLength > VELVET_ROOM_REPORT_MAX_LENGTH) {
    throw new Error(
      `赛菲返回的画像报告必须为 ${VELVET_ROOM_REPORT_MIN_LENGTH} 到 ${VELVET_ROOM_REPORT_MAX_LENGTH} 个字符，请让她重新归纳。`,
    );
  }
  return { personality: normalizedPersonality, report: normalizedReport };
}

/** 严格解析赛菲协议：未完成时必须有一题和恰好三个 AI 回答，完成时必须处于第六阶段。 */
export function parseVelvetRoomTurn(raw: string): VelvetRoomTurn {
  const stage = requireProfileStage(raw);
  const result = parseVelvetRoomResult(raw);

  if (result) {
    if (stage !== 6) throw new Error('赛菲只能在第六阶段完成画像，请继续采访。');
    const closingText = normalizeVisibleText(extractTagBlock(raw, 'closing') ?? '');
    if (!closingText || Array.from(closingText).length > VELVET_ROOM_CLOSING_MAX_LENGTH) {
      throw new Error('赛菲返回的结束台词缺失或过长，请重新归纳画像。');
    }
    if (extractTagBlock(raw, 'question') || OPTION_LINE_ANY_PATTERN.test(raw)) {
      throw new Error('赛菲完成画像后不应继续给出问题或候选回答。');
    }
    const residue = ['profile_state', 'closing', 'personality', 'report']
      .reduce((text, tag) => removeCompleteTagBlock(text, tag), raw)
      .trim();
    if (residue) throw new Error('赛菲的完成回合含有协议外文字，请重新归纳画像。');
    return { kind: 'result', raw, stage: 6, closingText, result };
  }

  if (COMPLETION_TAG_PATTERN.test(raw)) {
    throw new Error('赛菲返回了不完整的完成协议，请重新生成这一回合。');
  }

  const question = normalizeVisibleText(extractTagBlock(raw, 'question') ?? '');
  const questionLength = Array.from(question).length;
  if (!question || questionLength > VELVET_ROOM_QUESTION_MAX_LENGTH) {
    throw new Error(`赛菲的问题必须为 1 到 ${VELVET_ROOM_QUESTION_MAX_LENGTH} 个字符，请重新生成这一题。`);
  }

  const matches = Array.from(raw.matchAll(OPTION_LINE_PATTERN));
  if (matches.length !== 3) throw new Error('赛菲必须为这一题生成恰好三个候选回答。');
  const options = matches.map((match, index) => {
    const optionIndex = Number(match[1]);
    if (optionIndex !== index + 1) throw new Error('赛菲返回的候选回答编号必须依次为 1、2、3。');
    const label = normalizeVisibleText(match[2] ?? '');
    const length = Array.from(label).length;
    if (!label || length > VELVET_ROOM_OPTION_MAX_LENGTH) {
      throw new Error(`赛菲的每个候选回答必须为 1 到 ${VELVET_ROOM_OPTION_MAX_LENGTH} 个字符。`);
    }
    return { id: `ai-${optionIndex}`, label };
  });
  if (new Set(options.map(option => option.label)).size !== options.length) {
    throw new Error('赛菲返回的三个候选回答不能重复。');
  }

  const residue = removeCompleteTagBlock(removeCompleteTagBlock(raw, 'profile_state'), 'question')
    .replace(OPTION_LINE_PATTERN, '')
    .trim();
  if (residue) throw new Error('赛菲的问题回合含有协议外文字，请重新生成这一题。');
  return { kind: 'question', raw, stage, question, options };
}

async function requestVelvetRoomTurn(history: VelvetRoomMessage[], input: string): Promise<VelvetRoomTurn> {
  const api = getTavernGenerateApi();
  return runExclusiveStoryGeneration(VELVET_ROOM_GENERATION_ID, async () => {
    const raw: Awaited<ReturnType<typeof api.generateRaw>> = await api.generateRaw({
      generation_id: createSaveUuid(),
      max_chat_history: 0,
      should_stream: false,
      should_silence: true,
      ordered_prompts: [
        { role: 'system', content: VELVET_ROOM_SYSTEM_PROMPT },
        ...history.map(message => ({ role: message.role, content: message.content })),
        { role: 'user', content: input },
      ],
    });
    if (typeof raw !== 'string') {
      throw new Error('酒馆返回了工具调用，天鹅绒房间只接受文本回复。');
    }
    if (!raw.trim()) throw new Error('酒馆没有返回任何内容。');

    const turn = parseVelvetRoomTurn(raw);
    history.push({ role: 'user', content: input });
    history.push({ role: 'assistant', content: raw });
    return turn;
  });
}

/** 接受画像后才调用模型，让 AI 生成第一题和三个候选回答。 */
export async function beginVelvetRoomInterview(history: VelvetRoomMessage[]): Promise<VelvetRoomQuestionTurn> {
  const turn = await requestVelvetRoomTurn(history, VELVET_ROOM_START_SIGNAL);
  if (turn.kind !== 'question') throw new Error('画像尚未开始，赛菲不能直接给出最终结果。');
  return turn;
}

/** 提交一个候选回答或自由回答，并生成下一题或最终画像。 */
export async function sendVelvetRoomTurn(history: VelvetRoomMessage[], userText: string): Promise<VelvetRoomTurn> {
  const input = userText.normalize('NFKC').trim();
  if (!input) throw new Error('请输入要对赛菲说的话。');
  return requestVelvetRoomTurn(history, input);
}
