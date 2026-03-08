import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to game...');
  await page.goto('http://localhost:3001');

  await page.waitForTimeout(3000);

  const diagnostic = await page.evaluate(() => {
    return {
      game: !!window.game,
      entities: !!(window.game && window.game.entities),
      spawnInvader: !!(window.game && window.game.entities && window.game.entities.spawnInvader),
      keys: window.game && window.game.entities ? Object.keys(window.game.entities) : []
    };
  });
  
  console.log('Diagnostic:', diagnostic);

  await browser.close();
})();
