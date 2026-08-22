/**
 * Dating lore registry: maps a character ID to the same character lore references
 * used by the main story, so dating generations get identical worldbook injections.
 *
 * Only characters that have lore entries in `出包王女` are registered here.
 * Characters with an empty `loreReferences` array (e.g. 猿山健一) return an empty
 * array and will skip worldbook injection for their turn, which is the same
 * behaviour as the main story.
 */
import { STORY_CHARACTERS, isStoryCharacterId } from '../GalMainStory/characters';
import type { DisabledWorldbookLoreReference } from '../data/storyLore';

/**
 * Returns the character lore references for a given character ID.
 * Returns an empty array for unknown or lore-less characters.
 */
export function getDatingCharacterLoreReferences(characterId: string): readonly DisabledWorldbookLoreReference[] {
  if (!isStoryCharacterId(characterId)) return [];
  const character = STORY_CHARACTERS[characterId];
  return character.loreReferences;
}
