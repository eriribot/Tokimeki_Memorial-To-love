async page => {
  await page.evaluate(() => {
    document.head.innerHTML = `
      <style>
        html, body { height: 100%; margin: 0; background: #eee; }
        #carrier { display: block; width: 1100px; height: 225px; margin: 80px auto; border: 8px solid #777; }
      </style>
    `;
    document.body.innerHTML =
      '<iframe id="carrier" src="/dist/Tokimeki_Memorial-To-love/index.html"></iframe>';
  });

  const carrier = page.locator('#carrier').contentFrame();
  await carrier.getByRole('button', { name: '全屏游玩' }).waitFor();
}
