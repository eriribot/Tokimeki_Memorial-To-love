import { calendarDateKey } from '../CalendarModule/specialDates';
import type { CharacterRelationshipDelta } from '../types';
import { getDatingLocation, getDatingQualityWeights, stableUnit } from './datingRules';
import type {
  DatingAppointment,
  DatingArchive,
  DatingDirectorPlan,
  DatingOption,
  DatingQuality,
  DatingRelationshipDelta,
  DatingRelationshipState,
  DatingStagePlan,
} from './types';
import { getDatingCharacterProgress, getDatingGirlRelations } from './datingRelationships';

function qualityFromUnit(value: number, weights: Readonly<Record<DatingQuality, number>>): DatingQuality {
  const total = weights.awkward + weights.good + weights.great;
  const cursor = value * total;
  if (cursor < weights.awkward) return 'awkward';
  if (cursor < weights.awkward + weights.good) return 'good';
  return 'great';
}

type LeadStyle = 'yield' | 'balanced' | 'lead';

function option(
  id: string,
  label: string,
  friendship: number,
  romance: number,
  qualityWeight: number,
  datingDelta?: DatingRelationshipDelta,
): DatingOption {
  return {
    id,
    label,
    relationshipDelta: { friendship, romance },
    ...(datingDelta ? { datingDelta } : {}),
    qualityWeight,
  };
}

function leadFit(sub: number, style: LeadStyle): CharacterRelationshipDelta {
  const desiredSub = style === 'yield' ? -45 : style === 'lead' ? 45 : 0;
  const distance = Math.abs(sub - desiredSub);
  if (distance <= 25) return { friendship: 1, romance: style === 'balanced' ? 1 : 0 };
  if (distance >= 70) return { friendship: -1, romance: -1 };
  return { friendship: 0, romance: 0 };
}

function withLeadFit(
  base: { friendship: number; romance: number },
  sub: number,
  style: LeadStyle,
): { friendship: number; romance: number } {
  const fit = leadFit(sub, style);
  return {
    friendship: base.friendship + (fit.friendship ?? 0),
    romance: base.romance + (fit.romance ?? 0),
  };
}

function buildMainOptions(
  quality: DatingQuality,
  characterName: string,
  locationId: DatingAppointment['locationId'],
  sub: number,
  characterId: string,
  relationshipState?: DatingRelationshipState,
  relationshipCharacterNames: Readonly<Record<string, string>> = {},
): DatingOption[] {
  const qualityBonus = quality === 'great' ? 1 : quality === 'awkward' ? -1 : 0;
  if (locationId === 'riverbank') {
    const follow = withLeadFit({ friendship: 3 + qualityBonus, romance: 2 + qualityBonus }, sub, 'yield');
    const balance = withLeadFit({ friendship: 2 + qualityBonus, romance: 4 + qualityBonus }, sub, 'balanced');
    const lead = withLeadFit({ friendship: 1 + qualityBonus, romance: 3 + qualityBonus }, sub, 'lead');
    const relationEntry = Object.entries(
      getDatingGirlRelations(
        relationshipState ?? {
          characterProgress: {},
          girlRelations: {},
        },
        characterId,
      ),
    ).sort((left, right) => {
      const leftScore = left[1].yuriBond + left[1].tolerance - left[1].rivalry;
      const rightScore = right[1].yuriBond + right[1].tolerance - right[1].rivalry;
      return rightScore - leftScore;
    })[0];
    const relationshipOption = relationEntry
      ? option(
          'riverbank-bond-talk',
          `聊起她和${relationshipCharacterNames[relationEntry[0]] ?? '朋友'}的默契`,
          lead.friendship + (relationEntry[1].rivalry > relationEntry[1].tolerance ? -1 : 1),
          lead.romance,
          2,
          {
            sub: 4,
            hurt: relationEntry[1].rivalry > relationEntry[1].tolerance ? 1 : -1,
            girlRelations: {
              [characterId]: {
                [relationEntry[0]]: {
                  tolerance: relationEntry[1].rivalry > relationEntry[1].tolerance ? -2 : 2,
                  rivalry: relationEntry[1].rivalry > relationEntry[1].tolerance ? -1 : 0,
                  yuriBond: relationEntry[1].tolerance >= 50 ? 2 : 1,
                },
              },
            },
          },
        )
      : option(
          'riverbank-shadow',
          '故意踩她的影子逗她',
          lead.friendship,
          lead.romance,
          quality === 'awkward' ? -1 : 2,
          {
            sub: 10,
            hurt: quality === 'awkward' ? 2 : 0,
          },
        );
    return [
      option('riverbank-follow', `问问${characterName}想沿哪边走`, follow.friendship, follow.romance, 2, {
        sub: -8,
        hurt: -1,
      }),
      option('riverbank-sunset', '靠着栏杆一起看晚霞', balance.friendship, balance.romance, 3, {
        sub: 0,
        hurt: -2,
      }),
      relationshipOption,
    ];
  }
  return [
    option('main-careful', `先问问${characterName}想看什么`, 3 + qualityBonus, 2 + qualityBonus, 2),
    option('main-share', '分享一个最近发生的小插曲', 2 + qualityBonus, 3 + qualityBonus, 3),
    option('main-rush', '兴奋地把所有话题一次说完', 0, qualityBonus, quality === 'awkward' ? -1 : 1),
  ];
}

function buildReturnOptions(quality: DatingQuality, characterName: string, sub: number): DatingOption[] {
  const qualityBonus = quality === 'great' ? 1 : quality === 'awkward' ? -1 : 0;
  const thanks = withLeadFit({ friendship: 2 + qualityBonus, romance: 2 + qualityBonus }, sub, 'yield');
  const next = withLeadFit({ friendship: 2 + qualityBonus, romance: 4 + qualityBonus }, sub, 'lead');
  const joke = withLeadFit({ friendship: 1 + qualityBonus, romance: 1 + qualityBonus }, sub, 'balanced');
  return [
    option('return-thanks', `认真向${characterName}道谢`, thanks.friendship, thanks.romance, 2, {
      sub: -4,
      hurt: -1,
    }),
    option('return-next', '自然地提起下次还想见面', next.friendship, next.romance, 3, { sub: 4 }),
    option('return-joke', '用一个轻松玩笑结束今天', joke.friendship, joke.romance, 1, {
      hurt: quality === 'awkward' ? 1 : 0,
    }),
  ];
}

export function createDatingDirectorPlan(input: {
  appointment: DatingAppointment;
  characterName: string;
  playerName: string;
  favoriteLocation: boolean;
  equippedSkillIds?: readonly string[];
  relationshipState?: DatingRelationshipState;
  relationshipCharacterNames?: Readonly<Record<string, string>>;
}): DatingDirectorPlan {
  const quality = qualityFromUnit(
    stableUnit(`${input.appointment.id}|quality|${input.appointment.characterId}`),
    getDatingQualityWeights(input.equippedSkillIds ?? []),
  );
  const sub = input.relationshipState
    ? getDatingCharacterProgress(input.relationshipState, input.appointment.characterId).sub
    : 0;
  const location = getDatingLocation(input.appointment.locationId);
  const stages: [DatingStagePlan, DatingStagePlan] = [
    {
      id: 'main',
      label: `${location.label}的时光`,
      sceneId: location.sceneId,
      options: buildMainOptions(
        quality,
        input.characterName,
        input.appointment.locationId,
        sub,
        input.appointment.characterId,
        input.relationshipState,
        input.relationshipCharacterNames,
      ),
    },
    {
      id: 'return',
      label: '回程',
      sceneId: 'schoolRoad',
      options: buildReturnOptions(quality, input.characterName, sub),
    },
  ];
  return {
    id: `dating-plan-${input.appointment.id}`,
    appointmentId: input.appointment.id,
    characterId: input.appointment.characterId,
    characterName: input.characterName,
    playerName: input.playerName,
    date: { ...input.appointment.date },
    locationId: input.appointment.locationId,
    quality,
    stages,
  };
}

export function settleDatingChoices(
  plan: DatingDirectorPlan,
  selectedOptionIds: readonly string[],
): CharacterRelationshipDelta {
  if (selectedOptionIds.length !== plan.stages.length) throw new Error('约会必须完成两个阶段后才能结算。');
  return plan.stages.reduce<CharacterRelationshipDelta>(
    (total, stage, index) => {
      const selected = stage.options.find(optionValue => optionValue.id === selectedOptionIds[index]);
      if (!selected) throw new Error(`约会阶段 ${stage.id} 的选项无效。`);
      return {
        friendship: (total.friendship ?? 0) + (selected.relationshipDelta.friendship ?? 0),
        romance: (total.romance ?? 0) + (selected.relationshipDelta.romance ?? 0),
      };
    },
    { friendship: 0, romance: 0 },
  );
}

function mergeDatingRelationshipDelta(
  total: DatingRelationshipDelta,
  next: DatingRelationshipDelta | undefined,
): DatingRelationshipDelta {
  if (!next) return total;
  const girlRelations = { ...(total.girlRelations ?? {}) };
  for (const [fromId, targets] of Object.entries(next.girlRelations ?? {})) {
    const nextTargets = { ...(girlRelations[fromId] ?? {}) };
    for (const [toId, relation] of Object.entries(targets)) {
      nextTargets[toId] = {
        ...(nextTargets[toId] ?? {}),
        tolerance: (nextTargets[toId]?.tolerance ?? 0) + (relation.tolerance ?? 0),
        rivalry: (nextTargets[toId]?.rivalry ?? 0) + (relation.rivalry ?? 0),
        yuriBond: (nextTargets[toId]?.yuriBond ?? 0) + (relation.yuriBond ?? 0),
      };
    }
    girlRelations[fromId] = nextTargets;
  }
  return {
    sub: (total.sub ?? 0) + (next.sub ?? 0),
    hurt: (total.hurt ?? 0) + (next.hurt ?? 0),
    ...(Object.keys(girlRelations).length > 0 ? { girlRelations } : {}),
  };
}

export function settleDatingRelationshipChoices(
  plan: DatingDirectorPlan,
  selectedOptionIds: readonly string[],
): DatingRelationshipDelta {
  if (selectedOptionIds.length !== plan.stages.length) throw new Error('约会必须完成两个阶段后才能结算关系账本。');
  return plan.stages.reduce<DatingRelationshipDelta>((total, stage, index) => {
    const selected = stage.options.find(optionValue => optionValue.id === selectedOptionIds[index]);
    if (!selected) throw new Error(`约会阶段 ${stage.id} 的选项无效。`);
    return mergeDatingRelationshipDelta(total, selected.datingDelta);
  }, {});
}

export function createDatingArchiveSummary(archive: DatingArchive, characterName: string): string {
  return `${calendarDateKey(archive.date)} ${characterName} · ${archive.quality} · 友情 +${archive.relationshipDelta.friendship ?? 0} / 恋爱 +${archive.relationshipDelta.romance ?? 0}`;
}
