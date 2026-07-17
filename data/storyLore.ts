import { readWorldbook } from './worldbook';

export interface DisabledWorldbookLoreReference {
  worldbookName: string;
  entryUid: number;
  entryName: string;
  rootTag: string;
  requiredContentMarker: string;
}

export interface LoadedStoryLore {
  worldbookName: string;
  entryUid: number;
  entryName: string;
  content: string;
}

export interface StoryLoreScope {
  eventId: string;
  stageId: string;
  stageTitle: string;
}

function normalizeName(value: string): string {
  return value.normalize('NFKC').trim();
}

export async function readDisabledWorldbookStoryLore(
  reference: DisabledWorldbookLoreReference,
): Promise<LoadedStoryLore> {
  const entries = await readWorldbook(reference.worldbookName);
  const expectedName = normalizeName(reference.entryName);
  const namedEntries = entries.filter(entry => normalizeName(entry.name) === expectedName);

  if (namedEntries.length > 1) {
    throw new Error(
      `世界书「${reference.worldbookName}」中存在多个「${reference.entryName}」条目，无法安全选择剧情资料。`,
    );
  }

  const uidEntry = entries.find(entry => entry.uid === reference.entryUid);
  const entry =
    uidEntry && normalizeName(uidEntry.name) === expectedName
      ? uidEntry
      : namedEntries.length === 1
        ? namedEntries[0]
        : null;

  if (!entry) {
    throw new Error(
      `找不到世界书「${reference.worldbookName}」中的「${reference.entryName}」条目（预期 UID ${reference.entryUid}）。`,
    );
  }
  if (entry.enabled) {
    throw new Error(
      `世界书「${reference.worldbookName}」的「${reference.entryName}」条目必须保持关闭；代码会直接读取并注入，开启会造成重复。`,
    );
  }

  const content = entry.content.replace(/\r\n?/gu, '\n').trim();
  const openingTag = `<${reference.rootTag}>`;
  const closingTag = `</${reference.rootTag}>`;
  if (
    !content.startsWith(openingTag) ||
    !content.endsWith(closingTag) ||
    !content.includes(reference.requiredContentMarker)
  ) {
    throw new Error(
      `世界书「${reference.worldbookName}」的「${reference.entryName}」正文不完整，请重新粘贴原始第一集 TXT。`,
    );
  }

  return {
    worldbookName: reference.worldbookName,
    entryUid: entry.uid,
    entryName: entry.name,
    content,
  };
}

function encodeAttribute(value: string): string {
  return encodeURIComponent(value.normalize('NFKC').trim());
}

export function buildSelectedStoryLoreContext(lore: LoadedStoryLore, scope: StoryLoreScope): string {
  return `
<selected_story_lore source="disabled_worldbook_entry" worldbook="${encodeAttribute(lore.worldbookName)}" entry_uid="${lore.entryUid}" entry_name="${encodeAttribute(lore.entryName)}" event_id="${encodeAttribute(scope.eventId)}" stage_id="${encodeAttribute(scope.stageId)}">
资料使用边界：
- 这是代码按当前游戏事件选择的剧情资料，每次生成只注入一次。
- 本次只生成阶段“${scope.stageTitle}”（${scope.stageId}）；条目中的其他阶段只用于连续性和禁止跨越边界，不得提前演出。
- 资料中的日期、行动点、好感和完成状态只是约束说明，最终数值仍由游戏状态和存档决定。

${lore.content}
</selected_story_lore>
  `.trim();
}
