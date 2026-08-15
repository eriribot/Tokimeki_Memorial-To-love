/* eslint-disable @typescript-eslint/no-require-imports, import-x/no-nodejs-modules */

const path = require('node:path');

process.env.TS_NODE_PROJECT = path.join(__dirname, 'tsconfig.json');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'Node16',
  moduleResolution: 'Node16',
  target: 'ES2022',
});
require('ts-node/register/transpile-only');

const playerPersona = require('./services/playerPersona');
const { createPlayerPersonaPromptPlan, serializePlayerPersona } = playerPersona;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const profile = {
  familyName: '测试',
  givenName: '主角',
  displayName: '测试主角',
  gender: 'male',
  birthdayMonth: 4,
  birthdayDay: 7,
  bloodType: 'A',
  appearance: '黑色短发，棕色眼睛。',
  personality: '温和谨慎，遇到危险时会先保护身边的人。',
  registrationCompleted: true,
};

function main() {
  const serialized = serializePlayerPersona(profile);
  assert(serialized.includes('"displayName": "测试主角"'), 'Persona 资料块缺少存档姓名。');
  assert(serialized.includes('"genderLabel": "男性"'), 'Persona 资料块缺少固定男性身份。');
  assert(serialized.includes(profile.personality), 'Persona 资料块缺少登记性格。');

  const plan = createPlayerPersonaPromptPlan(profile, true);
  assert(plan.personaDescriptionOverride === serialized, '启用 Persona Description 时没有使用请求级资料覆盖。');
  assert(plan.injections.length === 1, '玩家资料计划必须只有一个请求级 system 注入。');
  assert(plan.injections[0].content.includes('authoritativeDisplayName'), '身份别名护栏没有进入请求级注入。');
  assert(plan.maskedSources.includes('active-persona-description'), '计划没有声明隔离宿主 Persona 描述。');
  assert(plan.maskedSources.includes('persona-lore'), '计划没有声明隔离宿主 Persona Lore。');

  const fallbackPlan = createPlayerPersonaPromptPlan(profile, false);
  assert(fallbackPlan.personaDescriptionOverride === '', '关闭 Persona Description 槽时不应覆盖该槽。');
  assert(fallbackPlan.injections[0].content.includes(serialized), '兜底注入缺少完整存档玩家资料。');
  assert(
    !Object.prototype.hasOwnProperty.call(playerPersona, 'withPlayerPersonaHostTakeover'),
    '请求级玩家资料模块不应暴露宿主 Persona 接管能力。',
  );

  console.log('player Persona request-only injection contract passed 2 of 2 cases');
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
