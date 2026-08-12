/* eslint-disable @typescript-eslint/no-require-imports, import-x/no-nodejs-modules */

const path = require('node:path');

process.env.TS_NODE_PROJECT = path.join(__dirname, 'tsconfig.json');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'Node16',
  moduleResolution: 'Node16',
  target: 'ES2022',
});
require('ts-node/register/transpile-only');

const {
  createPlayerPersonaPromptPlan,
  serializePlayerPersona,
  withPlayerPersonaHostTakeover,
} = require('./services/playerPersona');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertRejects(operation, pattern, message) {
  try {
    await operation();
  } catch (error) {
    assert(pattern.test(error instanceof Error ? error.message : String(error)), message);
    return;
  }
  throw new Error(message);
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

function createAdapter(options = {}) {
  const original = {
    personaId: 'mounted-user.png',
    userName: '{{user}}',
    description: '外部挂载的女性 User 设定',
  };
  const state = { ...original, temporaryNames: [], restoredPersonaIds: [] };
  const adapter = {
    getCurrentPersonaId: () => state.personaId,
    getExpandedUserName: () => state.userName,
    getPersonaDescription: () => state.description,
    setPersonaDescription: value => {
      state.description = value;
    },
    setTemporaryUserName: async value => {
      state.temporaryNames.push(value);
      if (!options.ignoreTemporaryName) state.userName = options.temporaryNameOverride ?? value;
    },
    restorePersona: async personaId => {
      state.restoredPersonaIds.push(personaId);
      if (options.failRestore) throw new Error('restore failed');
      state.personaId = original.personaId;
      state.userName = original.userName;
      state.description = original.description;
    },
  };
  return { adapter, original, state };
}

async function main() {
  const serialized = serializePlayerPersona(profile);
  assert(serialized.includes('"displayName": "测试主角"'), 'Persona 资料块缺少存档姓名。');
  assert(serialized.includes('"genderLabel": "男性"'), 'Persona 资料块缺少固定男性身份。');
  assert(serialized.includes(profile.personality), 'Persona 资料块缺少登记性格。');

  const plan = createPlayerPersonaPromptPlan(profile, true);
  assert(plan.maskedSources.includes('active-persona-name'), '接管计划没有声明屏蔽宿主 Persona 名称。');
  assert(plan.maskedSources.includes('active-persona-description'), '接管计划没有声明屏蔽宿主 Persona 描述。');

  const success = createAdapter();
  const result = await withPlayerPersonaHostTakeover(
    profile,
    async () => {
      assert(success.state.personaId === success.original.personaId, '接管不应切换真实 Persona。');
      assert(success.state.userName === profile.displayName, '生成期间 {{user}} 没有使用存档姓名。');
      assert(success.state.description === '', '生成期间外部 Persona Description 没有被屏蔽。');
      return 'generated';
    },
    success.adapter,
  );
  assert(result === 'generated', '接管包装器没有返回生成结果。');
  assert(success.state.userName === success.original.userName, '成功路径没有恢复原 Persona 名称。');
  assert(success.state.description === success.original.description, '成功路径没有恢复原 Persona 描述。');
  assert(success.state.restoredPersonaIds.join(',') === success.original.personaId, '成功路径恢复了错误的 Persona。');

  const failure = createAdapter();
  await assertRejects(
    () =>
      withPlayerPersonaHostTakeover(
        profile,
        async () => {
          throw new Error('generation failed');
        },
        failure.adapter,
      ),
    /generation failed/u,
    '生成异常没有原样抛出。',
  );
  assert(failure.state.userName === failure.original.userName, '异常路径没有恢复原 Persona 名称。');
  assert(failure.state.description === failure.original.description, '异常路径没有恢复原 Persona 描述。');

  const rejectedTakeover = createAdapter({ ignoreTemporaryName: true });
  await assertRejects(
    () => withPlayerPersonaHostTakeover(profile, async () => 'unreachable', rejectedTakeover.adapter),
    /\{\{user\}\} 没有切换为当前存档姓名/u,
    '用户名接管未生效时没有拒绝生成。',
  );

  const malformedTakeover = createAdapter({ temporaryNameOverride: '异常临时名称' });
  await assertRejects(
    () => withPlayerPersonaHostTakeover(profile, async () => 'unreachable', malformedTakeover.adapter),
    /\{\{user\}\} 没有切换为当前存档姓名/u,
    '用户名接管为异常值时没有拒绝生成。',
  );
  assert(malformedTakeover.state.userName === malformedTakeover.original.userName, '异常临时名称没有回滚。');
  assert(
    malformedTakeover.state.restoredPersonaIds.join(',') === malformedTakeover.original.personaId,
    '异常临时名称回滚了错误的 Persona。',
  );

  const externalSwitch = createAdapter();
  await withPlayerPersonaHostTakeover(
    profile,
    async () => {
      externalSwitch.state.personaId = 'user-selected-other.png';
      externalSwitch.state.userName = '用户主动切换的人设';
      externalSwitch.state.description = '用户主动切换后的描述';
    },
    externalSwitch.adapter,
  );
  assert(externalSwitch.state.personaId === 'user-selected-other.png', '生成中的用户 Persona 切换被强行撤销。');
  assert(externalSwitch.state.userName === '用户主动切换的人设', '生成中的用户名称切换被强行撤销。');
  assert(externalSwitch.state.description === '用户主动切换后的描述', '生成中的用户描述切换被强行撤销。');

  const restoreFailure = createAdapter({ failRestore: true });
  await assertRejects(
    () => withPlayerPersonaHostTakeover(profile, async () => 'generated', restoreFailure.adapter),
    /原 Persona 恢复失败/u,
    '恢复失败没有转成可见错误。',
  );
  assert(restoreFailure.state.description === restoreFailure.original.description, '恢复命令失败前没有先还原描述。');

  const noPersona = createAdapter();
  noPersona.state.personaId = null;
  await assertRejects(
    () => withPlayerPersonaHostTakeover(profile, async () => 'unreachable', noPersona.adapter),
    /没有可恢复的当前 Persona/u,
    '没有当前 Persona 时仍然启动了不可恢复的接管。',
  );

  console.log('player Persona host takeover contract passed 7 of 7 cases');
}

void main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
