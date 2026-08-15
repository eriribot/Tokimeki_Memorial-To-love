async page => {
  await page.evaluate(() => {
    window.TavernHelper = Object.assign(window.TavernHelper || {}, {
      generateRaw: async () =>
        '<profile_state>阶段: 1</profile_state>\n' +
        '<question>当疲惫与迷茫同时来临时，你更愿意怎样安放自己的心绪？</question>\n' +
        '@选项【index=1】：我会独自待在安静熟悉的空间里，慢慢整理思绪。\n' +
        '@选项【index=2】：我会和亲近的朋友聚在一起，在轻松交谈中重新获得活力。\n' +
        '@选项【index=3】：我不会刻意停留，会顺着当下的心情出门或转换环境。',
    });
  });
}
