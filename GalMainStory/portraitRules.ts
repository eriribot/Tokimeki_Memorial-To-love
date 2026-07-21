export interface StoryPortraitRuleContract {
  sceneId: string;
  characterId: string;
  portraitId: string;
  outsideScenePortraitId?: string;
}

export function validateStoryPortraitRules(rules: readonly StoryPortraitRuleContract[]): void {
  const sceneCharacterPairs = new Set<string>();
  const outsidePortraitByCharacter = new Map<string, string>();

  for (const rule of rules) {
    const pair = `${rule.sceneId}\u0000${rule.characterId}`;
    if (sceneCharacterPairs.has(pair)) {
      throw new Error(`场景“${rule.sceneId}”中的角色“${rule.characterId}”存在重复立绘规则。`);
    }
    sceneCharacterPairs.add(pair);

    if (!rule.outsideScenePortraitId) continue;
    const existingOutsidePortrait = outsidePortraitByCharacter.get(rule.characterId);
    if (existingOutsidePortrait && existingOutsidePortrait !== rule.outsideScenePortraitId) {
      throw new Error(`角色“${rule.characterId}”配置了互相冲突的场景外立绘。`);
    }
    outsidePortraitByCharacter.set(rule.characterId, rule.outsideScenePortraitId);
  }
}

export function getRequiredStoryPortraitId(
  rules: readonly StoryPortraitRuleContract[],
  sceneId: string,
  characterId: string,
): string | null {
  validateStoryPortraitRules(rules);

  const sceneRule = rules.find(rule => rule.sceneId === sceneId && rule.characterId === characterId);
  if (sceneRule) return sceneRule.portraitId;

  return (
    rules.find(rule => rule.characterId === characterId && rule.outsideScenePortraitId)?.outsideScenePortraitId ?? null
  );
}
