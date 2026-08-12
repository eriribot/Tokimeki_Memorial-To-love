import { createSaveUuid } from '../save/uuid';
import { runExclusiveStoryGeneration } from '../services/storyGenerationMutex';
import { VELVET_ROOM_OPENING_TEXT, VELVET_ROOM_SYSTEM_PROMPT } from './velvetRoomPrompt';

export interface VelvetRoomMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface VelvetRoomProfileResult {
  appearance: string;
  personality: string;
  report: string;
}

export interface VelvetRoomTurn {
  raw: string;
  visibleText: string;
  result: VelvetRoomProfileResult | null;
}

const VELVET_ROOM_GENERATION_ID = 'velvet-room';

function getTavernGenerateApi(): Pick<Window['TavernHelper'], 'generate'> {
  const api = window.TavernHelper;
  if (!api || typeof api.generate !== 'function') {
    throw new Error('没有检测到 TavernHelper.generate，请在 SillyTavern 酒馆助手环境中重试。');
  }
  return api;
}

/** 创建一份只在内存中存在的会话历史，不写楼层、不进存档，用完即弃。 */
export function createVelvetRoomHistory(): VelvetRoomMessage[] {
  return [
    { role: 'system', content: VELVET_ROOM_SYSTEM_PROMPT },
    { role: 'assistant', content: VELVET_ROOM_OPENING_TEXT },
  ];
}

function stripTagBlock(text: string, tag: string): string {
  return text
    .replace(new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, 'gu'), '')
    .replace(new RegExp(`<${tag}>[\\s\\S]*$`, 'u'), '');
}

/** 剥离内部追踪与登记结果块后，留下赛菲在 GAL 对话框中的台词。 */
export function stripVelvetRoomHidden(text: string): string {
  return ['think', 'tucao', 'appearance', 'personality', 'report']
    .reduce((visible, tag) => stripTagBlock(visible, tag), text)
    .trim();
}

const VELVET_ROOM_PAGE_CHARACTER_LIMIT = 120;

/** 把一轮可见回复切成稳定的 GAL 页，不把结果标签或内部追踪送进渲染器。 */
export function paginateVelvetRoomText(text: string): string[] {
  const paragraphs = text
    .split(/\r?\n+/u)
    .map(value => value.trim())
    .filter(Boolean);
  const pages: string[] = [];

  for (const paragraph of paragraphs) {
    const sentences = paragraph.match(/[^。！？!?]+[。！？!?]?/gu)?.filter(Boolean) ?? [paragraph];
    let current = '';

    for (const sentence of sentences) {
      if (current && current.length + sentence.length > VELVET_ROOM_PAGE_CHARACTER_LIMIT) {
        pages.push(current);
        current = '';
      }
      if (sentence.length > VELVET_ROOM_PAGE_CHARACTER_LIMIT) {
        if (current) pages.push(current);
        for (let index = 0; index < sentence.length; index += VELVET_ROOM_PAGE_CHARACTER_LIMIT) {
          pages.push(sentence.slice(index, index + VELVET_ROOM_PAGE_CHARACTER_LIMIT));
        }
      } else {
        current += sentence;
      }
    }
    if (current) pages.push(current);
  }

  return pages;
}

function extractTagBlock(text: string, tag: string): string | null {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'u'));
  const content = match?.[1]?.trim();
  return content ? content : null;
}

/** 三个结果块齐全才判定采访完成；否则视为普通回合继续。 */
export function parseVelvetRoomResult(text: string): VelvetRoomProfileResult | null {
  const appearance = extractTagBlock(text, 'appearance');
  const personality = extractTagBlock(text, 'personality');
  const report = extractTagBlock(text, 'report');
  if (!appearance || !personality || !report) return null;
  return { appearance, personality, report };
}

/**
 * 进行一轮天鹅绒房间对话。history 会被原地追加 user/assistant 两条消息;
 * 调用方应把同一个数组在整次会话期间复用。
 */
export async function sendVelvetRoomTurn(history: VelvetRoomMessage[], userText: string): Promise<VelvetRoomTurn> {
  const api = getTavernGenerateApi();
  const input = userText.trim();
  if (!input) throw new Error('请输入要对赛菲说的话。');

  return runExclusiveStoryGeneration(VELVET_ROOM_GENERATION_ID, async () => {
    let raw: Awaited<ReturnType<typeof api.generate>>;
    raw = await api.generate({
      preset_name: 'in_use',
      generation_id: createSaveUuid(),
      user_input: input,
      max_chat_history: 0,
      should_stream: false,
      should_silence: true,
      overrides: {
        chat_history: {
          with_depth_entries: false,
          prompts: history.map(message => ({ role: message.role, content: message.content })),
        },
      },
    });
    if (typeof raw !== 'string') {
      throw new Error('酒馆返回了工具调用，天鹅绒房间只接受文本回复。');
    }
    if (!raw.trim()) {
      throw new Error('酒馆没有返回任何内容。');
    }
    history.push({ role: 'user', content: input });
    history.push({ role: 'assistant', content: raw });
    return { raw, visibleText: stripVelvetRoomHidden(raw), result: parseVelvetRoomResult(raw) };
  });
}
