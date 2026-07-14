export type WorldbookSource = 'global' | 'character-primary' | 'character-additional' | 'chat'; // 定义世界书在当前酒馆会话中的绑定来源。

export const WORLDBOOK_GAME_CONTEXT_INJECTION_ID = 'tolove-game-context'; // 定义游戏上下文在酒馆扩展提示词中的稳定唯一标识。

export interface WorldbookBinding { // 描述一本当前启用世界书及其全部绑定来源。
  name: string; // 保存酒馆中的世界书名称。
  sources: WorldbookSource[]; // 保存这本世界书命中的绑定来源，避免重复读取同一本书。
} // 结束当前启用世界书的绑定描述。

export interface CurrentWorldbookBindings { // 描述当前酒馆环境中的世界书名称和绑定关系。
  availableNames: string[]; // 保存酒馆中目前能够读取的全部世界书名称。
  globalNames: string[]; // 保存当前全局启用的世界书名称。
  characterPrimaryName: string | null; // 保存当前角色卡绑定的主要世界书名称。
  characterAdditionalNames: string[]; // 保存当前角色卡绑定的附加世界书名称。
  chatName: string | null; // 保存当前聊天文件绑定的世界书名称。
  active: WorldbookBinding[]; // 保存去重后的当前启用世界书和来源。
} // 结束当前酒馆世界书绑定快照的描述。

export interface LoadedWorldbook { // 描述从酒馆成功读取的一本世界书。
  name: string; // 保存被读取的世界书名称。
  sources: WorldbookSource[]; // 保存这本世界书在当前会话中的绑定来源。
  entries: WorldbookEntry[]; // 保存酒馆助手规范化后的完整世界书条目。
} // 结束成功读取的世界书描述。

export interface WorldbookReadError { // 描述单本世界书读取失败时的可见错误。
  name: string; // 保存读取失败的世界书名称。
  message: string; // 保存可供界面或控制台展示的错误文本。
} // 结束世界书读取错误描述。

export interface CurrentWorldbooksSnapshot { // 描述一次当前世界书读取操作的完整结果。
  loadedAt: string; // 保存本次读取完成时的标准时间。
  bindings: CurrentWorldbookBindings; // 保存读取时实际观察到的绑定关系。
  books: LoadedWorldbook[]; // 保存成功读取的世界书。
  errors: WorldbookReadError[]; // 保存失败但没有阻断其他世界书读取的错误。
} // 结束当前世界书读取结果描述。

export interface WorldbookGameContext { // 描述一次生成前需要交给酒馆原生世界书扫描器的确定性游戏状态。
  day?: number | null; // 保存当前游戏天数并允许尚未进入游戏时省略。
  period?: string | null; // 保存当前时段的稳定键，例如 lunch 或 afterSchool。
  location?: string | null; // 保存玩家当前地点的稳定键，例如 rooftop。
  characterIds?: readonly string[] | null; // 保存当前地点实际在场角色的稳定 ID 列表。
} // 结束世界书游戏上下文描述。

export interface WorldbookScanInjection { // 描述只进入原生世界书扫描缓冲区而不直接发给模型的提示词。
  id: typeof WORLDBOOK_GAME_CONTEXT_INJECTION_ID; // 使用稳定标识覆盖同名扫描上下文，避免堆积多个副本。
  position: 'none'; // 指定内容不进入最终模型提示词，只作为世界书扫描材料。
  depth: 0; // 保留酒馆助手扩展提示词所需深度字段，实际条目插入深度仍由世界书决定。
  role: 'system'; // 使用系统身份保存机器扫描键，身份不会因 position 为 none 而发送给模型。
  content: string; // 保存按固定顺序拼接的时间、地点和人物扫描键。
  should_scan: true; // 明确要求 SillyTavern 把内容加入绿灯条目的原生扫描缓冲区。
} // 结束世界书扫描注入描述。

export interface WorldbookScanSession { // 描述一次只对下一次生成有效的游戏上下文注入。
  injection: WorldbookScanInjection; // 保存实际交给酒馆助手的确定性注入内容，便于人工核对。
  uninject: () => void; // 允许调用方在生成前取消本次注入。
} // 结束世界书扫描会话描述。

export type ActivatedWorldbookEntry = { world: string } & SillyTavern.FlattenedWorldInfoEntry; // 描述 SillyTavern 原生扫描器确认激活并返回来源世界书的条目。

export interface WorldbookActivationSnapshot { // 描述一次由宿主真实 WORLD_INFO_ACTIVATED 事件产生的激活记录。
  observedAt: string; // 保存本次宿主激活事件被观察到的标准时间。
  entries: ActivatedWorldbookEntry[]; // 保存宿主通过概率、预算、递归和深度规则后实际激活的条目。
} // 结束宿主真实世界书激活记录描述。

export type WorldbookActivationListener = (snapshot: WorldbookActivationSnapshot) => void; // 定义消费宿主真实世界书激活记录的监听函数。

export interface WorldbookActivationObserver { // 描述显式启动且可以停止的宿主世界书激活观察器。
  getLatest: () => WorldbookActivationSnapshot | null; // 返回观察器启动后最近一次真实激活记录，没有事件时返回空值。
  stop: () => void; // 停止监听宿主 WORLD_INFO_ACTIVATED 事件。
} // 结束宿主世界书激活观察器描述。

export interface WorldbookReader { // 描述供游戏和酒馆控制台共同使用的世界书读取与扫描桥接接口。
  listBindings: () => CurrentWorldbookBindings; // 提供当前世界书名称与绑定关系查询。
  read: (worldbookName: string) => Promise<WorldbookEntry[]>; // 提供按名称读取单本世界书的能力。
  readCurrent: () => Promise<CurrentWorldbooksSnapshot>; // 提供读取当前实际启用全部世界书的能力。
  toJson: (value: unknown) => string; // 提供保留正则关键字信息的 UTF-8 JSON 文本转换能力。
  buildScanTokens: (context: WorldbookGameContext) => string[]; // 提供不访问宿主的确定性游戏扫描键构建能力。
  buildScanInjection: (context: WorldbookGameContext) => WorldbookScanInjection; // 提供不访问宿主的原生扫描注入对象构建能力。
  injectGameContext: (context: WorldbookGameContext) => WorldbookScanSession; // 显式把游戏上下文注入下一次宿主原生世界书扫描。
  observeActivations: (listener?: WorldbookActivationListener) => WorldbookActivationObserver; // 显式观察宿主最终确认的世界书激活结果。
} // 结束世界书读取与扫描桥接接口描述。

type TavernWorldbookReadApi = Pick<Window['TavernHelper'], 'getWorldbookNames' | 'getGlobalWorldbookNames' | 'getCharWorldbookNames' | 'getChatWorldbookName' | 'getWorldbook'>; // 只选取本轮允许使用的酒馆助手世界书读取函数。

type TavernWorldbookScanApi = Pick<Window['TavernHelper'], 'injectPrompts'>; // 只选取把确定性上下文交给原生世界书扫描器所需的酒馆助手函数。

function getTavernWorldbookReadApi(): TavernWorldbookReadApi { // 获取当前 iframe 中真实的酒馆助手世界书读取接口。
  const api = window.TavernHelper; // 从酒馆助手公开对象读取接口，避免依赖原始世界书导出 JSON 的形状。
  if ( // 开始逐项检查本模块实际调用的全部读取函数，避免只检查部分接口后在后续调用中崩溃。
    !api || // 检查当前页面是否存在酒馆助手公开对象。
    typeof api.getWorldbookNames !== 'function' || // 检查全部世界书名称读取函数是否存在。
    typeof api.getGlobalWorldbookNames !== 'function' || // 检查全局世界书绑定读取函数是否存在。
    typeof api.getCharWorldbookNames !== 'function' || // 检查角色卡世界书绑定读取函数是否存在。
    typeof api.getChatWorldbookName !== 'function' || // 检查聊天世界书绑定读取函数是否存在。
    typeof api.getWorldbook !== 'function' // 检查单本世界书内容读取函数是否存在。
  ) { // 结束酒馆助手读取接口完整性判断。
    throw new Error('当前页面没有酒馆助手世界书接口，请在 SillyTavern 的酒馆助手环境中调用。'); // 用明确错误阻止本地预览冒充真实世界书读取成功。
  } // 结束宿主接口可用性检查。
  return api; // 返回已经确认可用的只读世界书接口。
} // 结束酒馆助手世界书读取接口解析函数。

function getTavernWorldbookScanApi(): TavernWorldbookScanApi { // 获取当前 iframe 中真实的酒馆助手提示词注入接口。
  const api = window.TavernHelper; // 从酒馆助手公开对象读取原生扫描注入入口。
  if (!api || typeof api.injectPrompts !== 'function') { // 在独立浏览器预览中主动识别扫描注入接口缺失。
    throw new Error('当前页面没有酒馆助手提示词注入接口，请在 SillyTavern 的酒馆助手环境中调用。'); // 用明确错误阻止本地预览冒充真实世界书扫描接通。
  } // 结束宿主扫描注入接口可用性检查。
  return api; // 返回已经确认可用的原生扫描注入接口。
} // 结束酒馆助手扫描注入接口解析函数。

function addWorldbookBinding(bindingMap: Map<string, Set<WorldbookSource>>, name: string | null, source: WorldbookSource): void { // 将一本世界书及其来源加入去重映射。
  const normalizedName = name?.trim(); // 清理酒馆绑定名称两端可能存在的空白。
  if (!normalizedName) return; // 忽略没有实际名称的空绑定。
  const sources = bindingMap.get(normalizedName) ?? new Set<WorldbookSource>(); // 复用已有来源集合或为新世界书创建集合。
  sources.add(source); // 记录这本世界书在当前会话中的一个真实绑定来源。
  bindingMap.set(normalizedName, sources); // 将更新后的来源集合写回临时映射。
} // 结束单个世界书绑定的去重登记。

function sortWorldbookNames(names: string[]): string[] { // 为名称列表提供稳定且适合中文环境的顺序。
  return [...new Set(names.map(name => name.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right, 'zh-CN')); // 去除空值和重复值后按中文本地规则排序。
} // 结束世界书名称排序函数。

export function listCurrentWorldbookBindings(): CurrentWorldbookBindings { // 读取当前酒馆的全局、角色卡和聊天世界书绑定。
  const api = getTavernWorldbookReadApi(); // 获取本轮唯一允许访问的真实宿主读取接口。
  const availableNames = sortWorldbookNames(api.getWorldbookNames()); // 读取酒馆中目前存在的全部世界书名称。
  const globalNames = sortWorldbookNames(api.getGlobalWorldbookNames()); // 读取当前全局启用的世界书名称。
  const characterBindings = api.getCharWorldbookNames('current'); // 读取当前角色卡的主要和附加世界书绑定。
  const characterPrimaryName = characterBindings.primary?.trim() || null; // 标准化当前角色卡主要世界书名称。
  const characterAdditionalNames = sortWorldbookNames(characterBindings.additional); // 标准化当前角色卡附加世界书名称。
  const chatName = api.getChatWorldbookName('current')?.trim() || null; // 标准化当前聊天文件绑定的世界书名称。
  const bindingMap = new Map<string, Set<WorldbookSource>>(); // 创建仅用于本次读取的名称与来源去重映射。
  globalNames.forEach(name => addWorldbookBinding(bindingMap, name, 'global')); // 登记所有全局启用世界书。
  addWorldbookBinding(bindingMap, characterPrimaryName, 'character-primary'); // 登记当前角色卡主要世界书。
  characterAdditionalNames.forEach(name => addWorldbookBinding(bindingMap, name, 'character-additional')); // 登记当前角色卡附加世界书。
  addWorldbookBinding(bindingMap, chatName, 'chat'); // 登记当前聊天文件世界书。
  const active = [...bindingMap.entries()].map(([name, sources]) => ({ name, sources: [...sources] })); // 将内部去重映射转换成可序列化的绑定数组。
  active.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN')); // 让当前启用世界书顺序在不同读取中保持稳定。
  return { availableNames, globalNames, characterPrimaryName, characterAdditionalNames, chatName, active }; // 返回不包含任何写入行为的绑定快照。
} // 结束当前世界书绑定查询函数。

export async function readWorldbook(worldbookName: string): Promise<WorldbookEntry[]> { // 按名称从酒馆助手读取一本规范化世界书。
  const normalizedName = worldbookName.trim(); // 清理调用方传入名称两端的空白。
  if (!normalizedName) throw new Error('世界书名称不能为空。'); // 拒绝把空名称发送给真实宿主接口。
  const api = getTavernWorldbookReadApi(); // 获取本轮唯一允许访问的真实宿主读取接口。
  return api.getWorldbook(normalizedName); // 直接返回酒馆助手规范化后的条目，不自行猜测原始 JSON 字段。
} // 结束单本世界书读取函数。

function getErrorMessage(error: unknown): string { // 将未知异常转换成稳定的中文可见文本。
  return error instanceof Error ? error.message : String(error); // 优先保留标准错误消息，否则使用安全字符串转换。
} // 结束错误消息标准化函数。

function isCrossFrameRegExp(value: unknown): value is RegExp { // 判断来自酒馆父页面或当前 iframe 的正则对象。
  return Object.prototype.toString.call(value) === '[object RegExp]'; // 使用跨窗口稳定的内部标签，避免 instanceof 因不同全局对象而失效。
} // 结束跨窗口正则对象判断函数。

export async function readCurrentWorldbooks(): Promise<CurrentWorldbooksSnapshot> { // 并行读取当前实际启用的全部世界书。
  const bindings = listCurrentWorldbookBindings(); // 在开始读取前冻结本轮使用的绑定快照。
  const settledBooks = await Promise.allSettled(bindings.active.map(binding => readWorldbook(binding.name))); // 并行读取且允许单本失败不阻断其他世界书。
  const books: LoadedWorldbook[] = []; // 创建成功读取结果的收集容器。
  const errors: WorldbookReadError[] = []; // 创建读取失败结果的收集容器。
  settledBooks.forEach((result, index) => { // 按绑定顺序整理每一本世界书的读取结果。
    const binding = bindings.active[index]; // 取得当前读取结果对应的名称和来源。
    if (result.status === 'fulfilled') { // 只把宿主真实返回的条目登记为成功。
      books.push({ name: binding.name, sources: binding.sources, entries: result.value }); // 保存世界书名称、来源和完整规范化条目。
      return; // 完成当前成功结果处理并继续下一本世界书。
    } // 结束成功读取分支。
    errors.push({ name: binding.name, message: getErrorMessage(result.reason) }); // 保存失败名称和真实错误，不伪造空世界书。
  }); // 结束全部世界书读取结果整理。
  return { loadedAt: new Date().toISOString(), bindings, books, errors }; // 返回可供游戏、存档或后续检索层消费的完整快照。
} // 结束当前启用世界书读取函数。

export function worldbookDataToJson(value: unknown): string { // 将世界书快照转换成可复制、保存和检索的 UTF-8 JSON 文本。
  const json = JSON.stringify(value, (_key, nestedValue: unknown) => { // 使用替换器保护 JavaScript 正则关键字信息。
    if (isCrossFrameRegExp(nestedValue)) return { type: 'regexp', source: nestedValue.source, flags: nestedValue.flags }; // 把跨窗口正则转换成不会被 JSON.stringify 丢成空对象的结构。
    if (typeof nestedValue === 'bigint') return nestedValue.toString(); // 把极少见的大整数额外字段转换成 JSON 可接受的字符串。
    return nestedValue; // 原样保留其他酒馆世界书字段和 UTF-8 中文正文。
  }, 2); // 使用两个空格缩进便于人工检查和后续文档切分。
  if (json === undefined) throw new Error('当前世界书数据无法转换成 JSON 文本。'); // 阻止调用方把未生成文本误认成有效 JSON。
  return json; // 返回完整的 UTF-8 JSON 文本。
} // 结束世界书 JSON 转换函数。

function normalizeWorldbookScanValue(value: string, fieldLabel: string): string { // 将游戏状态值规范化为单行且不会伪造额外扫描键的稳定文本。
  const normalizedValue = value.normalize('NFKC').trim(); // 统一兼容字符并清理值两端空白，同时保留中文和可读角色 ID。
  if (!normalizedValue) throw new Error(`${fieldLabel}不能为空。`); // 拒绝生成没有实际值的世界书扫描键。
  return normalizedValue.replace(/[%=\r\n]/g, unsafeCharacter => encodeURIComponent(unsafeCharacter)); // 只转义会破坏键值协议的百分号、等号和换行符。
} // 结束世界书扫描值规范化函数。

function normalizeWorldbookDay(day: number): string { // 将当前游戏天数规范化为稳定扫描值。
  if (!Number.isSafeInteger(day) || day < 1) throw new Error('游戏天数必须是大于或等于 1 的安全整数。'); // 拒绝小数、负数和不安全整数进入世界书扫描键。
  return String(day); // 返回不会受本地化格式影响的十进制天数字符串。
} // 结束游戏天数规范化函数。

export function buildWorldbookScanTokens(context: WorldbookGameContext): string[] { // 按固定顺序构建供绿灯条目匹配的确定性机器扫描键。
  const tokens: string[] = []; // 创建本次调用独立的扫描键数组。
  if (context.day !== null && context.day !== undefined) tokens.push(`tolove.day=${normalizeWorldbookDay(context.day)}`); // 在提供天数时加入稳定的天数扫描键。
  if (context.period !== null && context.period !== undefined) tokens.push(`tolove.period=${normalizeWorldbookScanValue(context.period, '游戏时段')}`); // 在提供时段时加入稳定的时段扫描键。
  if (context.location !== null && context.location !== undefined) tokens.push(`tolove.location=${normalizeWorldbookScanValue(context.location, '游戏地点')}`); // 在提供地点时加入稳定的地点扫描键。
  const normalizedCharacterIds = (context.characterIds ?? []).map(characterId => normalizeWorldbookScanValue(characterId, '角色 ID')); // 规范化全部在场角色 ID 并拒绝空 ID。
  const uniqueCharacterIds = [...new Set(normalizedCharacterIds)].sort((left, right) => left.localeCompare(right, 'zh-CN')); // 去重并排序角色 ID，让相同场景始终生成相同内容。
  uniqueCharacterIds.forEach(characterId => tokens.push(`tolove.character=${characterId}`)); // 为每个在场角色添加一个可以独立匹配的重复键。
  if (tokens.length === 0) throw new Error('世界书游戏上下文至少需要天数、时段、地点或一个角色 ID。'); // 阻止空注入被误认成一次有效扫描。
  return tokens; // 返回仅由调用方明确游戏状态决定的扫描键，不执行任何概率判断。
} // 结束世界书扫描键构建函数。

export function buildWorldbookScanInjection(context: WorldbookGameContext): WorldbookScanInjection { // 构建交给酒馆助手 injectPrompts 的原生世界书扫描注入。
  return { id: WORLDBOOK_GAME_CONTEXT_INJECTION_ID, position: 'none', depth: 0, role: 'system', content: buildWorldbookScanTokens(context).join('\n'), should_scan: true }; // 使用 none 隔离模型正文并用 should_scan 交给 SillyTavern 原生绿灯扫描器。
} // 结束世界书扫描注入构建函数。

export function injectWorldbookGameContext(context: WorldbookGameContext): WorldbookScanSession { // 显式把确定性游戏上下文交给下一次宿主原生世界书扫描。
  const api = getTavernWorldbookScanApi(); // 获取已经确认可用的酒馆助手扫描注入接口。
  const injection = buildWorldbookScanInjection(context); // 在访问宿主前构建并验证完整扫描注入。
  const { uninject } = api.injectPrompts([injection], { once: true }); // 只让上下文参与下一次生成，避免地图状态变化后残留旧扫描键。
  return { injection, uninject }; // 返回实际注入内容和生成前可用的取消函数。
} // 结束一次性世界书游戏上下文注入函数。

export function observeWorldbookActivations(listener?: WorldbookActivationListener): WorldbookActivationObserver { // 显式监听宿主最终确认的世界书激活事件。
  if (typeof eventOn !== 'function' || typeof tavern_events === 'undefined' || !tavern_events.WORLD_INFO_ACTIVATED) { // 检查当前页面是否提供酒馆助手事件桥和原生世界书激活事件名。
    throw new Error('当前页面没有酒馆世界书激活事件接口，请在 SillyTavern 的酒馆助手环境中调用。'); // 阻止本地预览伪造世界书真实激活结果。
  } // 结束宿主世界书事件接口可用性检查。
  let latest: WorldbookActivationSnapshot | null = null; // 在观察器闭包中保存最近一次真实宿主激活记录。
  const subscription = eventOn(tavern_events.WORLD_INFO_ACTIVATED, entries => { // 注册 SillyTavern 完成原生扫描后发出的唯一真实激活结果事件。
    latest = { observedAt: new Date().toISOString(), entries: [...entries] }; // 复制事件数组并记录观察时间，避免由 UI 自行推断蓝灯或绿灯命中。
    listener?.(latest); // 在宿主真实事件发生后把记录交给可选调用方监听函数。
  }); // 结束宿主真实世界书激活事件监听注册。
  return { getLatest: () => latest, stop: subscription.stop }; // 返回最近记录读取能力和酒馆助手提供的停止监听函数。
} // 结束宿主真实世界书激活观察函数。

export const worldbookReader: WorldbookReader = Object.freeze({ // 创建不会修改世界书内容或绑定、且不会自动注入的显式桥接入口。
  listBindings: listCurrentWorldbookBindings, // 暴露当前绑定列表读取能力。
  read: readWorldbook, // 暴露单本世界书读取能力。
  readCurrent: readCurrentWorldbooks, // 暴露当前启用世界书批量读取能力。
  toJson: worldbookDataToJson, // 暴露保留正则信息的 UTF-8 JSON 转换能力。
  buildScanTokens: buildWorldbookScanTokens, // 暴露不访问宿主的确定性扫描键构建能力。
  buildScanInjection: buildWorldbookScanInjection, // 暴露不访问宿主的扫描注入对象构建能力。
  injectGameContext: injectWorldbookGameContext, // 暴露只对下一次生成有效的显式宿主扫描注入能力。
  observeActivations: observeWorldbookActivations, // 暴露只记录宿主真实激活事件的显式观察能力。
}); // 结束世界书读取与扫描桥接入口对象创建。
