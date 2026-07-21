const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const loreDirectory = path.join(__dirname, 'data', 'lore-books');
const acts = [
  {
    file: 'tolove-tv-episode-02-act01.txt',
    rootTag: 'To LOVE-Ru TV Episode 02 Act 01',
    markers: [/2008年4月7日20时43分/u, /2008年4月9日/u, /前天20时43分/u, /更衣室/u],
  },
  {
    file: 'tolove-tv-episode-02-act02.txt',
    rootTag: 'To LOVE-Ru TV Episode 02 Act 02',
    markers: [/婚约成立(?:后)?三日内/u, /2008年4月10日20时43分/u, /沛凯.{0,4}头/u, /最后一小时/u],
  },
  {
    file: 'tolove-tv-episode-02-act03.txt',
    rootTag: 'To LOVE-Ru TV Episode 02 Act 03',
    markers: [/2008年4月10日/u, /2008年4月11日/u, /转(?:校生|学生)/u, /(?:不要|不得|不)续写第三集|不展开下一集/u],
  },
];

const requiredSections = [
  '基础信息:',
  '剧情边界:',
  '角色权威:',
  '场景顺序:',
  '对白锚点:',
  '还原权重:',
  '必须保留:',
  '结束状态:',
];
const disputedClaims = [/24\s*小时/u, /八字不合/u, /让(?:菈菈|她)讨厌/u, /沛凯.{0,8}(?:变成|伪装成).{0,4}胸/u];
const rejectionMarkers = /(?:不是|并非|不得|不要|不能|禁止|错误|误写|不写成|0，)/u;

for (const act of acts) {
  const filePath = path.join(loreDirectory, act.file);
  assert.ok(fs.existsSync(filePath), `缺少第二集恢复源：${act.file}`);
  const content = fs.readFileSync(filePath, 'utf8').replace(/\r\n?/gu, '\n').trim();
  assert.ok(content.startsWith(`<${act.rootTag}>\n`), `${act.file} 的根开标签无效`);
  assert.ok(content.endsWith(`\n</${act.rootTag}>`), `${act.file} 的根闭标签无效`);
  requiredSections.forEach(section => assert.ok(content.includes(section), `${act.file} 缺少“${section}”`));
  act.markers.forEach(marker => assert.match(content, marker, `${act.file} 缺少校对标记“${marker}”`));
  disputedClaims.forEach(pattern => {
    const matchingLines = content.split('\n').filter(line => pattern.test(line));
    matchingLines.forEach(line =>
      assert.match(line, rejectionMarkers, `${act.file} 把已推翻的剧情说法写成了肯定事实：${line}`),
    );
  });
}

const readme = fs.readFileSync(path.join(loreDirectory, 'README.md'), 'utf8');
for (const [index, act] of acts.entries()) {
  assert.ok(readme.includes(String(201 + index)), `README 缺少 UID ${201 + index}`);
  assert.ok(readme.includes(act.file), `README 缺少 ${act.file}`);
}
assert.match(readme, /当前运行时只登记并读取第一集/su);
assert.match(readme, /第二集.{0,80}(?:待后续运行时接线|尚未接入运行时)/su);
assert.match(readme, /保持关闭/u);
assert.match(readme, /不(?:会|进入).{0,20}(?:bundle|运行时包)/iu);

console.log('Episode 02 lore contract passed: 3 disabled recovery sources, corrected timeline, runtime boundary.');
