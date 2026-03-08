import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to game...');
  await page.goto('http://localhost:3001');

  await page.waitForTimeout(3000);

  const diagnostic = await page.evaluate(() => {
    window.game.app.ticker.stop();
    window.game.invaders.forEach(inv => { inv.x = -1000; });

    const inv = window.game.entities.spawnInvader(100, 100, { color: 'ff00ff', maxHp: 1, hp: 1, scoreValue: 10 });
    const bullet = new window.game.entities.Projectile(window.game, 100, 100, 'bullet', { 
        w: 4, h: 12, vy: -10, pierceCount: 1 
    });
    
    const intersect = window.game.collisions.rectIntersect(bullet, inv);
    
    return {
      bullet: { x: bullet.x, y: bullet.y, w: bullet.w, h: bullet.h },
      invader: { x: inv.x, y: inv.y, w: inv.w, h: inv.h },
      intersect: intersect
    };
  });
  
  console.log('Diagnostic:', diagnostic);

  await browser.close();
})();
