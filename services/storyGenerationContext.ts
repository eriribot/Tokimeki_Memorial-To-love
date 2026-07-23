import { getStoryCharacter, getStoryPortraitRig, isStoryCharacterId } from '../GalMainStory/characters';
import { getMainStoryActOrThrow, getMainStoryEpisodeOrThrow } from '../GalMainStory/storyRegistry';
import type { GalStoryMessageSave } from '../GalMainStory/storyTypes';
import { RECENT_CONTEXT_MESSAGE_LIMIT } from '../memory/summaryPolicy';
import { buildStoryGenerationPrompt, type StoryPromptPortraitOption } from './storyGenerationPrompt';

export const STORY_CHAT_HISTORY_LIMIT = RECENT_CONTEXT_MESSAGE_LIMIT;

export interface StoryGenerationContextRequest {
  eventId: string;
  actId: string;
  contextFloorIds: readonly string[];
  historyFloorIds?: readonly string[];
  chatHistory: readonly GalStoryMessageSave[];
}

export interface StoryGenerationContextProjection {
  eventId: string;
  actId: string;
  eventTitle: string;
  actTitle: string;
  contextFloorIds: string[];
  historyFloorIds: string[];
  continuityMode: 'fresh' | 'continue';
  userInput: string;
  maxChatHistory: typeof STORY_CHAT_HISTORY_LIMIT;
  messageIds: string[];
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function getActPortraitOptions(eventId: string, actId: string): StoryPromptPortraitOption[] {
  const act = getMainStoryActOrThrow(eventId, actId);

  return act.presentation.cast.flatMap(member => {
    const characterId = member.characterId;
    if (!isStoryCharacterId(characterId)) throw new Error(`当前幕引用了未登记角色“${characterId}”。`);
    const character = getStoryCharacter(characterId);
    return member.portraitIds.map(portraitId => {
      const rig = getStoryPortraitRig(characterId, portraitId);
      return {
        characterId,
        displayName: character.displayName,
        portraitId,
        expressionIds: Object.keys(rig.expressions),
      };
    });
  });
}

function selectGenerationMessages(
  messages: readonly GalStoryMessageSave[],
  historyFloorIds: readonly string[],
): GalStoryMessageSave[] {
  const floorOrder = new Map(historyFloorIds.map((floorId, index) => [floorId, index]));
  return messages
    .filter(
      message =>
        message.extra.type === 'tolove-main-story' &&
        floorOrder.has(message.extra.floorId) &&
        !message.is_system &&
        message.mes.trim().length > 0,
    )
    .sort((left, right) => {
      const leftOrder = floorOrder.get(left.extra.floorId) ?? 0;
      const rightOrder = floorOrder.get(right.extra.floorId) ?? 0;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return left.extra.role === right.extra.role ? 0 : left.extra.role === 'user' ? -1 : 1;
    })
    .slice(-STORY_CHAT_HISTORY_LIMIT);
}

export function buildGenerationChatHistory(
  messages: readonly GalStoryMessageSave[],
  _eventId: string,
  contextFloorIds: readonly string[],
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return selectGenerationMessages(messages, contextFloorIds).map(message => ({
    role: message.extra.role,
    content: message.mes,
  }));
}

function buildGenerationPrompt(request: StoryGenerationContextRequest): string {
  const episode = getMainStoryEpisodeOrThrow(request.eventId);
  const act = getMainStoryActOrThrow(request.eventId, request.actId);

  return buildStoryGenerationPrompt({
    eventTitle: episode.title,
    loreSection: act.loreSection,
    sceneIds: act.presentation.sceneIds,
    minimumLineCount: act.generation.minimumLineCount,
    requiredSceneSequence: act.generation.requiredSceneSequence,
    portraitOptions: getActPortraitOptions(request.eventId, request.actId),
    portraitRules: act.presentation.portraitRules ?? [],
    continuityMode: (request.historyFloorIds ?? request.contextFloorIds).length > 0 ? 'continue' : 'fresh',
  });
}

export function createStoryGenerationContextProjection(
  request: StoryGenerationContextRequest,
): StoryGenerationContextProjection {
  const episode = getMainStoryEpisodeOrThrow(request.eventId);
  const act = getMainStoryActOrThrow(request.eventId, request.actId);
  const historyFloorIds = request.historyFloorIds ?? request.contextFloorIds;
  const selectedMessages = selectGenerationMessages(request.chatHistory, historyFloorIds);

  return {
    eventId: request.eventId,
    actId: request.actId,
    eventTitle: episode.title,
    actTitle: act.title,
    contextFloorIds: [...request.contextFloorIds],
    historyFloorIds: [...historyFloorIds],
    continuityMode: historyFloorIds.length > 0 ? 'continue' : 'fresh',
    userInput: buildGenerationPrompt(request),
    maxChatHistory: STORY_CHAT_HISTORY_LIMIT,
    messageIds: selectedMessages.map(message => message.id),
    chatHistory: selectedMessages.map(message => ({
      role: message.extra.role,
      content: message.mes,
    })),
  };
}
