import type { GalStoryMessageSave } from '../GalMainStory/storyTypes';
import { RECENT_CONTEXT_MESSAGE_LIMIT } from '../memory/summaryPolicy';
import { createMemorySummarySourceProjection } from '../memory/summarySourceProjection';
import type { GameSnapshot } from '../save/snapshot';
import { createDatingArchiveSummary } from './datingDirector';
import { getDatingCharacterProgress, getDatingGirlRelations } from './datingRelationships';
import {
  createDatingGenerationPrompt,
  type DatingGenerationContinuityMessage,
  type DatingGenerationRelationshipContext,
} from './datingStoryGeneration';
import type { DatingDirectorPlan, DatingStageId } from './types';

export interface DatingGenerationContextProjection {
  appointmentId: string;
  stageId: DatingStageId;
  characterName: string;
  playerName: string;
  playerFamilyName: string;
  playerGivenName: string;
  recentArchives: string[];
  recentBody: string | null;
  selectedOptionLabel: string | null;
  relationshipContext: DatingGenerationRelationshipContext | null;
  contextMessages: DatingGenerationContinuityMessage[];
  maxContextMessages: typeof RECENT_CONTEXT_MESSAGE_LIMIT;
  userInput: string;
}

export function createDatingGenerationContextProjection(request: {
  snapshot: GameSnapshot;
  mainStoryMessages: readonly GalStoryMessageSave[];
  plan: DatingDirectorPlan;
  stageId: DatingStageId;
}): DatingGenerationContextProjection {
  const { snapshot, mainStoryMessages, plan, stageId } = request;
  const dating = snapshot.dating;
  const activeRun = dating?.run?.appointmentId === plan.appointmentId ? dating.run : null;
  const recentArchives = (dating?.archives ?? [])
    .slice(-3)
    .map(archive =>
      createDatingArchiveSummary(
        archive,
        snapshot.cards.targets.find(target => target.id === archive.characterId)?.name ?? archive.characterId,
      ),
    );
  const latestArchivedContent = dating?.archives.at(-1)?.contents.at(-1) ?? null;
  const recentBody =
    activeRun?.stageContents.main?.lines.map(line => line.text).join(' ') ??
    latestArchivedContent?.lines.map(line => line.text).join(' ') ??
    null;
  const previousOptionId = activeRun?.selectedOptionIds.at(-1) ?? null;
  const selectedOptionLabel =
    plan.stages.flatMap(stage => stage.options).find(option => option.id === previousOptionId)?.label ?? null;
  const relationshipContext = dating
    ? {
        ...getDatingCharacterProgress(dating.relationships, plan.characterId),
        girlRelations: getDatingGirlRelations(dating.relationships, plan.characterId),
      }
    : null;
  const contextMessages = createMemorySummarySourceProjection(snapshot, mainStoryMessages)
    .messages.slice(-RECENT_CONTEXT_MESSAGE_LIMIT)
    .map(message => ({
      id: message.id,
      role: message.role,
      kind: message.kind,
      scopeLabel: message.scopeLabel,
      source: message.source,
      createdAt: message.createdAt,
      content: message.content,
    }));
  const userInput = createDatingGenerationPrompt(
    plan,
    stageId,
    recentArchives,
    recentBody,
    selectedOptionLabel,
    relationshipContext,
    contextMessages,
  );

  return {
    appointmentId: plan.appointmentId,
    stageId,
    characterName: plan.characterName,
    playerName: plan.playerName,
    playerFamilyName: plan.playerFamilyName,
    playerGivenName: plan.playerGivenName,
    recentArchives,
    recentBody,
    selectedOptionLabel,
    relationshipContext,
    contextMessages,
    maxContextMessages: RECENT_CONTEXT_MESSAGE_LIMIT,
    userInput,
  };
}
