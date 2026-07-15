import { useMemo, useState, type CSSProperties } from 'react';
import { categories, skills, type Skill } from '../data/skills';

interface SpecialSkillPanelProps {
  onClose: () => void;
}

export default function SpecialSkillPanel({ onClose }: SpecialSkillPanelProps) {
  const [activeCategory, setActiveCategory] = useState<Skill['category']>(categories[0].id);
  const [equippedSkillIds, setEquippedSkillIds] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill>(skills[0]);

  const categorySkills = useMemo(() => skills.filter(skill => skill.category === activeCategory), [activeCategory]);

  const equippedSkills = equippedSkillIds.map(id => skills.find(skill => skill.id === id)).filter(Boolean) as Skill[];

  const totalCost = equippedSkills.reduce((sum, skill) => sum + skill.cost, 0);
  const treeLevels = useMemo(() => getTreeLevels(categorySkills), [categorySkills]);

  const toggleEquip = (skill: Skill) => {
    setEquippedSkillIds(current => {
      if (current.includes(skill.id)) {
        return current.filter(id => id !== skill.id);
      }
      if (current.length >= 6) return current;
      return [...current, skill.id];
    });
  };

  const selectCategory = (categoryId: Skill['category']) => {
    setActiveCategory(categoryId);
    setSelectedSkill(skills.find(skill => skill.category === categoryId) ?? selectedSkill);
  };

  return (
    <div className="special-skill-overlay" role="dialog" aria-label="特技面板">
      <div className="special-skill-window">
        <header className="special-skill-header">
          <div>
            <span className="special-skill-kana">SPECIAL SKILL</span>
            <h2>特技</h2>
          </div>
          <div className="special-skill-summary">
            <span>EXP {totalCost}</span>
            <span>{equippedSkillIds.length}/6</span>
            <button onClick={onClose}>返回</button>
          </div>
        </header>

        <nav className="special-category-tabs" aria-label="特技分类">
          {categories.map(category => (
            <button
              key={category.id}
              className={activeCategory === category.id ? 'active' : ''}
              style={{ '--skill-color': category.color } as CSSProperties}
              onClick={() => selectCategory(category.id)}
              title={category.id}
            >
              <span>{category.icon}</span>
              {category.id}
            </button>
          ))}
        </nav>

        <div className="special-skill-body">
          <section className="special-tree-board" aria-label="特技树">
            {treeLevels.map((level, levelIndex) => (
              <div key={levelIndex} className="special-tree-level">
                <div className="special-tree-level-title">Lv.{levelIndex * 10 + 10}</div>
                {level.map(skill => {
                  const isSelected = selectedSkill.id === skill.id;
                  const isEquipped = equippedSkillIds.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      className={['special-tree-node', isSelected ? 'selected' : '', isEquipped ? 'equipped' : '']
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setSelectedSkill(skill)}
                    >
                      <span className="special-cost">{skill.cost}</span>
                      <span>{skill.name}</span>
                      {isEquipped && <strong>装</strong>}
                    </button>
                  );
                })}
              </div>
            ))}
          </section>

          <section className="special-skill-detail">
            <div className="special-detail-title">
              <span>{categories.find(c => c.id === selectedSkill.category)?.icon}</span>
              <div>
                <h3>{selectedSkill.name}</h3>
                <p>{selectedSkill.originalName}</p>
              </div>
            </div>

            <p className="special-description">{selectedSkill.description}</p>

            <div className="special-detail-grid">
              <span>消耗 EXP</span>
              <strong>{selectedSkill.cost}</strong>
              <span>推荐度</span>
              <strong>{selectedSkill.rating}</strong>
              <span>前置</span>
              <strong>{selectedSkill.prerequisites.length > 0 ? selectedSkill.prerequisites.length : 'なし'}</strong>
            </div>

            <div className="special-effects">
              {selectedSkill.effects.map((effect, index) => (
                <p key={index}>・{effect.description}</p>
              ))}
            </div>

            <button className="special-equip-button" onClick={() => toggleEquip(selectedSkill)}>
              {equippedSkillIds.includes(selectedSkill.id) ? '卸下' : '装备'}
            </button>
          </section>
        </div>

        <footer className="special-equipped-bar">
          <span>装备中</span>
          {Array.from({ length: 6 }).map((_, index) => {
            const skill = equippedSkills[index];
            return (
              <button key={index} className={skill ? 'filled' : ''} onClick={() => skill && setSelectedSkill(skill)}>
                {skill?.name ?? '-'}
              </button>
            );
          })}
        </footer>
      </div>
    </div>
  );
}

function getSkillDepth(skillId: string, memo = new Map<string, number>()): number {
  if (memo.has(skillId)) return memo.get(skillId)!;
  const skill = skills.find(item => item.id === skillId);
  if (!skill || skill.prerequisites.length === 0) {
    memo.set(skillId, 0);
    return 0;
  }
  const depth = Math.max(...skill.prerequisites.map(id => getSkillDepth(id, memo))) + 1;
  memo.set(skillId, depth);
  return depth;
}

function getTreeLevels(categorySkills: Skill[]) {
  const memo = new Map<string, number>();
  categorySkills.forEach(skill => getSkillDepth(skill.id, memo));
  const maxDepth = Math.max(...categorySkills.map(skill => memo.get(skill.id) ?? 0), 0);

  return Array.from({ length: maxDepth + 1 }, (_, depth) =>
    categorySkills.filter(skill => (memo.get(skill.id) ?? 0) === depth),
  );
}
