import type { DisabledWorldbookLoreReference } from '../data/storyLore';
import type { CalendarDateValue } from '../types';
import { isCalendarDateValue } from '../CalendarModule/date';
import type { StoryActDefinition } from './storyTypes';

export interface StoryActTrigger {
  date: CalendarDateValue;
  actionNumber: 1 | 2;
}

export interface StoryEpisodeActDefinition extends StoryActDefinition {
  trigger: StoryActTrigger;
  plotLore: DisabledWorldbookLoreReference;
}

export interface StoryEpisodeTemplate {
  id: string;
  episodeNumber: number;
  title: string;
  dateLabel: string;
  prerequisiteEventIds?: readonly string[];
  acts: readonly StoryEpisodeActDefinition[];
}

function compareTriggers(left: StoryActTrigger, right: StoryActTrigger): number {
  const leftParts = [left.date.year, left.date.month, left.date.day, left.actionNumber];
  const rightParts = [right.date.year, right.date.month, right.date.day, right.actionNumber];
  for (let index = 0; index < leftParts.length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function assertEpisodeTemplate(template: StoryEpisodeTemplate): void {
  if (
    !template.id.trim() ||
    !template.title.trim() ||
    !template.dateLabel.trim() ||
    !Number.isInteger(template.episodeNumber) ||
    template.episodeNumber < 1 ||
    template.acts.length === 0
  ) {
    throw new Error('主线剧情模板缺少事件 ID、标题或幕定义。');
  }
  if (new Set(template.acts.map(act => act.id)).size !== template.acts.length) {
    throw new Error(`主线剧情模板“${template.id}”存在重复幕 ID。`);
  }
  let previousTrigger: StoryActTrigger | null = null;
  for (const act of template.acts) {
    if (!act.id.trim() || !act.title.trim() || act.fallbackBeats.length === 0) {
      throw new Error(`主线剧情模板“${template.id}”包含空幕或空保底正文。`);
    }
    if (!isCalendarDateValue(act.trigger.date) || (act.trigger.actionNumber !== 1 && act.trigger.actionNumber !== 2)) {
      throw new Error(`主线幕“${act.id}”的触发时间无效。`);
    }
    if (previousTrigger) {
      if (compareTriggers(act.trigger, previousTrigger) <= 0) {
        throw new Error(`主线幕“${act.id}”的触发时间没有排在上一幕之后。`);
      }
    }
    previousTrigger = act.trigger;
    if (act.plotLore.kind !== 'plot') throw new Error(`主线幕“${act.id}”的 plotLore 不是剧情条目。`);
    if (!Number.isInteger(act.plotLore.entryOrder)) {
      throw new Error(`主线幕“${act.id}”的世界书 order 必须是整数。`);
    }
  }
}

export function defineStoryEpisode<const T extends StoryEpisodeTemplate>(template: T): T {
  assertEpisodeTemplate(template);
  return template;
}

export function defineStoryEpisodes<const T extends readonly StoryEpisodeTemplate[]>(episodes: T): T {
  const episodeIds = new Set<string>();
  const episodeNumbers = new Set<number>();
  const plotLoreOrders = new Set<string>();
  for (const episode of episodes) {
    assertEpisodeTemplate(episode);
    if (episodeIds.has(episode.id)) throw new Error(`主线剧情模板“${episode.id}”重复登记。`);
    if (episodeNumbers.has(episode.episodeNumber)) {
      throw new Error(`主线剧情第 ${episode.episodeNumber} 集重复登记。`);
    }
    episodeIds.add(episode.id);
    episodeNumbers.add(episode.episodeNumber);
    for (const act of episode.acts) {
      const order = act.plotLore.entryOrder;
      const orderKey = `${act.plotLore.worldbookName}:${order}`;
      if (plotLoreOrders.has(orderKey)) {
        throw new Error(`世界书“${act.plotLore.worldbookName}”的剧情 order ${order} 重复登记。`);
      }
      plotLoreOrders.add(orderKey);
    }
  }
  for (const episode of episodes) {
    for (const prerequisiteId of episode.prerequisiteEventIds ?? []) {
      if (prerequisiteId === episode.id || !episodeIds.has(prerequisiteId)) {
        throw new Error(`主线剧情模板“${episode.id}”引用了无效前置事件“${prerequisiteId}”。`);
      }
      const prerequisite = episodes.find(candidate => candidate.id === prerequisiteId);
      const firstTrigger = episode.acts[0]?.trigger;
      const prerequisiteLastTrigger = prerequisite?.acts[prerequisite.acts.length - 1]?.trigger;
      if (firstTrigger && prerequisiteLastTrigger && compareTriggers(firstTrigger, prerequisiteLastTrigger) <= 0) {
        throw new Error(`主线剧情模板“${episode.id}”的首幕没有排在前置事件“${prerequisiteId}”之后。`);
      }
    }
  }
  const prerequisiteMap = new Map(episodes.map(episode => [episode.id, episode.prerequisiteEventIds ?? []]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (eventId: string): void => {
    if (visiting.has(eventId)) throw new Error(`主线剧情前置事件存在循环依赖：“${eventId}”。`);
    if (visited.has(eventId)) return;
    visiting.add(eventId);
    for (const prerequisiteId of prerequisiteMap.get(eventId) ?? []) visit(prerequisiteId);
    visiting.delete(eventId);
    visited.add(eventId);
  };
  for (const episode of episodes) visit(episode.id);
  return episodes;
}
