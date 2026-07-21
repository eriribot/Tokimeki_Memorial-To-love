const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const loreDirectory = path.join(__dirname, 'data', 'lore-books');
const characters = [
  {
    file: 'tolove-character-mikan.txt',
    rootTag: 'Mikan Yuuki',
    markers: [
      /姓名:结城美柑/u,
      /生日:11月3日/u,
      /血型:O型/u,
      /身高:149cm/u,
      /体重:41kg/u,
      /资料口径:.{0,60}二级资料.{0,80}TBS官方人物页.{0,40}未列/su,
      /家务/u,
      /伤(?:到|害|心).{0,8}女孩子/u,
      /User.{0,24}(?:没有|不继承).{0,16}(?:亲属|兄妹|家庭)/u,
      /夕崎梨子.{0,24}(?:独立|没有默认).{0,16}(?:同学|亲属)/u,
    ],
    forbidden: [/胸围/u, /三围/u, /性诱惑/u],
  },
  {
    file: 'tolove-character-haruna.txt',
    rootTag: 'Haruna Sairenji',
    markers: [
      /姓名:西连寺春菜/u,
      /生日:3月6日/u,
      /血型:O型/u,
      /身高:160cm/u,
      /体重:50kg/u,
      /资料口径:.{0,60}二级资料.{0,80}TBS官方人物页.{0,40}未列/su,
      /网球部/u,
      /怕鬼|害怕.{0,4}(?:鬼|灵异)/u,
      /User.{0,24}(?:没有|不).{0,16}(?:预设|既定).{0,12}(?:恋爱|好感|关系)/u,
      /夕崎梨子.{0,24}(?:独立|同班同学)/u,
    ],
    forbidden: [],
  },
];

const requiredSections = [
  '基础信息:',
  '外观与年龄:',
  '核心性格:',
  '日常能力与生活:',
  '人物经历过往:',
  '情感驱动:',
  '本作人际关系:',
  '第一至第二集认知边界:',
  '对他人的称呼方式:',
  '口吻与逻辑:',
  '常用台词:',
  '禁止偏移:',
];

for (const character of characters) {
  const filePath = path.join(loreDirectory, character.file);
  assert.ok(fs.existsSync(filePath), `缺少人物世界书恢复源：${character.file}`);
  const content = fs.readFileSync(filePath, 'utf8').replace(/\r\n?/gu, '\n').trim();
  assert.ok(content.startsWith(`<${character.rootTag}>\n`), `${character.file} 的根开标签无效`);
  assert.ok(content.endsWith(`\n</${character.rootTag}>`), `${character.file} 的根闭标签无效`);
  requiredSections.forEach(section => assert.ok(content.includes(section), `${character.file} 缺少“${section}”`));
  character.markers.forEach(marker => assert.match(content, marker, `${character.file} 缺少人物标记“${marker}”`));
  character.forbidden.forEach(marker =>
    assert.doesNotMatch(content, marker, `${character.file} 含有不适合的人物描写“${marker}”`),
  );

  const sampleDialogue = content.split('常用台词:')[1].split('禁止偏移:')[0];
  assert.doesNotMatch(sampleDialogue, /(?:必须|禁止|不得|世界书|好感度|攻略)/u, `${character.file} 的台词样例过于机械`);
}

const readme = fs.readFileSync(path.join(loreDirectory, 'README.md'), 'utf8');
for (const character of characters) {
  assert.ok(readme.includes(character.file), `README 缺少 ${character.file}`);
  assert.ok(readme.includes(character.rootTag), `README 缺少根标签 ${character.rootTag}`);
}
assert.match(readme, /## 人物条目/u);
assert.match(readme, /\| 结城美柑\s+\| 7\s+\| `结城美柑`/u);
assert.match(readme, /\| 西连寺春菜\s+\| 6\s+\| `西连寺春菜`/u);
assert.match(readme, /第一集第一幕.{0,160}(?:读取|扫描).{0,80}人物 lore/su);
assert.match(readme, /本地 fallback 渲染不等于真实 Tavern 扫描成功/u);

console.log('Character lore contract passed: Mikan and Haruna recovery sources and configured runtime UIDs.');
