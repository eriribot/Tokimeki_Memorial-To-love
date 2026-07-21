const TAG_PATTERN = /<(\/?)(([\p{L}_][\p{L}\p{N}_.:-]*))(?:\s[^<>]*?)?\s*(\/?)>/gu;
const TAG_MARKUP_PATTERN = /<\/?[\p{L}_][^<>\r\n]*>/gu;

const BLOCKED_TAGS = new Set([
  'analysis',
  'reasoning',
  'thinking',
  'think',
  'scratchpad',
  'plan',
  'planning',
  'progress',
  'state',
  'status',
  'current_event',
  'tucao',
  'meta',
  'metadata',
  'debug',
  'system',
  'tool',
  'prompt',
  'instruction',
  'worldbook',
  'stats',
  'variables',
  'variable',
]);

const PLAYABLE_TAG_GROUPS = [
  new Set([
    'story_scene',
    'story_scence',
    'gal_scene',
    'story',
    'scene',
    '正文',
    '剧情',
    'narrative',
    'dialogue',
    'script',
  ]),
  new Set(['content', 'context', 'body', 'text']),
  new Set(['final', 'answer', 'output', 'response']),
] as const;

const PLAYABLE_TAG_PRIORITIES = new Map<string, number>();
PLAYABLE_TAG_GROUPS.forEach((tags, priority) => {
  tags.forEach(tag => PLAYABLE_TAG_PRIORITIES.set(tag, priority));
});

interface TagToken {
  name: string;
  start: number;
  end: number;
  closing: boolean;
  selfClosing: boolean;
}

interface TagNode {
  name: string;
  start: number;
  openEnd: number;
  closeStart: number;
  end: number;
  closed: boolean;
  parent: TagNode | null;
  children: TagNode[];
}

interface ParsedTags {
  roots: TagNode[];
  tokens: TagToken[];
}

interface PlayableCandidate {
  node: TagNode;
  priority: number;
}

export interface PlayableTextExtractionOptions {
  requirePlayableWrapper?: boolean;
}

function normalizeTagName(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en-US');
}

function unwrapCodeFence(text: string): string {
  return text.startsWith('```') ? text.replace(/^```[^\r\n]*\r?\n?/u, '').replace(/\s*```$/u, '') : text;
}

function parseTags(text: string): ParsedTags {
  const roots: TagNode[] = [];
  const tokens: TagToken[] = [];
  const stack: TagNode[] = [];

  for (const match of text.matchAll(TAG_PATTERN)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const name = normalizeTagName(match[2]);
    const closing = match[1] === '/';
    const selfClosing = !closing && match[4] === '/';
    tokens.push({ name, start, end, closing, selfClosing });

    if (selfClosing) continue;
    if (!closing) {
      const parent = stack.at(-1) ?? null;
      const node: TagNode = {
        name,
        start,
        openEnd: end,
        closeStart: text.length,
        end: text.length,
        closed: false,
        parent,
        children: [],
      };
      if (parent) parent.children.push(node);
      else roots.push(node);
      stack.push(node);
      continue;
    }

    let matchingOpenIndex = -1;
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      if (stack[index].name === name) {
        matchingOpenIndex = index;
        break;
      }
    }
    if (matchingOpenIndex < 0) continue;

    const node = stack[matchingOpenIndex];
    node.closeStart = start;
    node.end = end;
    node.closed = true;
    stack.splice(matchingOpenIndex);
  }

  return { roots, tokens };
}

function isBlocked(node: TagNode): boolean {
  for (let current: TagNode | null = node; current; current = current.parent) {
    if (BLOCKED_TAGS.has(current.name)) return true;
  }
  return false;
}

function isAncestor(ancestor: TagNode, node: TagNode): boolean {
  for (let current = node.parent; current; current = current.parent) {
    if (current === ancestor) return true;
  }
  return false;
}

function collectPlayableCandidates(nodes: readonly TagNode[], candidates: PlayableCandidate[]): void {
  for (const node of nodes) {
    if (isBlocked(node)) continue;
    const priority = PLAYABLE_TAG_PRIORITIES.get(node.name);
    if (node.closed && priority !== undefined) candidates.push({ node, priority });
    collectPlayableCandidates(node.children, candidates);
  }
}

function extractPreferredBlocks(text: string, roots: readonly TagNode[]): string | null {
  const candidates: PlayableCandidate[] = [];
  collectPlayableCandidates(roots, candidates);
  if (candidates.length === 0) return null;

  const bestPriority = Math.min(...candidates.map(candidate => candidate.priority));
  const bestCandidates = candidates
    .filter(candidate => candidate.priority === bestPriority)
    .filter(candidate =>
      candidates.every(
        other => other === candidate || other.priority > candidate.priority || !isAncestor(candidate.node, other.node),
      ),
    )
    .sort((left, right) => left.node.start - right.node.start);

  return bestCandidates
    .map(candidate => text.slice(candidate.node.openEnd, candidate.node.closeStart).trim())
    .filter(Boolean)
    .join('\n');
}

function getOutsideText(text: string, roots: readonly TagNode[]): string {
  const closedRoots = roots.filter(node => node.closed).sort((left, right) => left.start - right.start);
  const fragments: string[] = [];
  let cursor = 0;

  for (const node of closedRoots) {
    if (node.start < cursor) continue;
    fragments.push(text.slice(cursor, node.start));
    cursor = node.end;
  }
  fragments.push(text.slice(cursor));
  return fragments.join('').trim();
}

function hasClosedNodeEndingAt(nodes: readonly TagNode[], end: number): boolean {
  return nodes.some(node => (node.closed && node.end === end) || hasClosedNodeEndingAt(node.children, end));
}

function extractOpenPlayableBlock(text: string, roots: readonly TagNode[]): string | null {
  const candidates: PlayableCandidate[] = [];
  const visit = (nodes: readonly TagNode[]) => {
    for (const node of nodes) {
      if (isBlocked(node)) continue;
      const priority = PLAYABLE_TAG_PRIORITIES.get(node.name);
      if (!node.closed && priority !== undefined) candidates.push({ node, priority });
      visit(node.children);
    }
  };
  visit(roots);
  if (candidates.length === 0) return null;

  const candidate = candidates.sort(
    (left, right) => left.priority - right.priority || left.node.start - right.node.start,
  )[0].node;
  const blockedBoundary = candidate.children
    .filter(child => BLOCKED_TAGS.has(child.name))
    .map(child => child.start)
    .sort((left, right) => left - right)[0];
  const end = blockedBoundary ?? text.length;
  return text.slice(candidate.openEnd, end).trim();
}

function extractOneLayer(text: string): string | null {
  const { roots, tokens } = parseTags(text);
  const preferred = extractPreferredBlocks(text, roots);
  if (preferred !== null) return preferred;

  const openPlayable = extractOpenPlayableBlock(text, roots);
  if (openPlayable !== null) return openPlayable;

  const orphanPlayableClose = tokens.find(
    token => token.closing && PLAYABLE_TAG_PRIORITIES.has(token.name) && !hasClosedNodeEndingAt(roots, token.end),
  );
  if (orphanPlayableClose) return text.slice(0, orphanPlayableClose.start).trim();

  const outsideText = getOutsideText(text, roots);
  const genericRoots = roots.filter(node => node.closed && !isBlocked(node));
  if (genericRoots.length > 0 && !outsideText) {
    const genericNames = [...new Set(genericRoots.map(node => node.name))];
    if (genericNames.length !== 1) return '';
    return genericRoots
      .map(node => text.slice(node.openEnd, node.closeStart).trim())
      .filter(Boolean)
      .join('\n');
  }

  const hasBlockedRoots = roots.some(node => node.closed && BLOCKED_TAGS.has(node.name));
  if (hasBlockedRoots && genericRoots.length === 0) return outsideText;
  return null;
}

function extractRequiredWrapper(text: string): string {
  const { tokens } = parseTags(text);
  const wrapperTokens = tokens.filter(token => PLAYABLE_TAG_PRIORITIES.has(token.name));
  const openings = wrapperTokens.filter(token => !token.closing && !token.selfClosing);

  if (openings.length === 0) throw new Error('酒馆返回结果未包含受支持的正文容器。');
  if (openings.length !== 1 || wrapperTokens.some(token => token.selfClosing)) {
    throw new Error('酒馆返回结果只能包含一个受支持的正文容器。');
  }

  const opening = openings[0];
  const closings = wrapperTokens.filter(token => token.closing);
  const closing = closings.find(token => token.name === opening.name && token.start >= opening.end);
  if (!closing) {
    throw new Error(`酒馆返回结果中的 <${opening.name}> 正文容器没有用 </${opening.name}> 闭合。`);
  }
  if (closings.length !== 1) throw new Error('酒馆返回结果只能包含一个受支持的正文容器。');

  return text.slice(opening.end, closing.start).trim();
}

function stripTagMarkup(text: string): string {
  return text.replace(TAG_MARKUP_PATTERN, '').trim();
}

export function extractPlayableText(raw: string, options: PlayableTextExtractionOptions = {}): string {
  let current = unwrapCodeFence(raw.trim());
  if (options.requirePlayableWrapper) current = extractRequiredWrapper(current);

  for (let depth = 0; depth < 8; depth += 1) {
    const extracted = extractOneLayer(current);
    if (extracted === null) return options.requirePlayableWrapper ? stripTagMarkup(current) : current.trim();
    const next = extracted.trim();
    if (next === current) return options.requirePlayableWrapper ? stripTagMarkup(next) : next;
    current = next;
  }

  return options.requirePlayableWrapper ? stripTagMarkup(current) : current.trim();
}
