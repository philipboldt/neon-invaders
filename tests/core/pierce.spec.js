import { test, expect } from '@playwright/test';

test.describe('Neon Nuke - Pierce Logic', () => {
    test.setTimeout(30000);

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect.poll(async () => {
            return await page.evaluate(() => {
                return !!(window.game && window.game.entities && window.game.player);
            });
        }, { timeout: 15000 }).toBe(true);
    });

    test('Logic: Pierce should allow bullet to pass through ONE fatal standard invader', async ({ page }) => {
        await page.keyboard.press('Space'); // Start game

        const result = await page.evaluate(() => {
            window.game.app.ticker.stop();
            window.game.hasPierce = true;
            window.game.playerDamage = 10;
            
            window.game.invaders.forEach(inv => { inv.x = -1000; });

            // Ensure overlap:
            // Bullet center (100, 100), Bullet size 4x12 -> Y range [94, 106]
            // Invader center (100, 100), Invader size 36x24 -> Y range [88, 112]
            window.game.entities.spawnInvader(100, 100, { 
                color: '0xff00ff', maxHp: 1, hp: 1, scoreValue: 10 
            });
            window.game.entities.spawnInvader(100, 50, { 
                color: '0x00ffff', maxHp: 1, hp: 1, scoreValue: 10 
            });
            
            const bullet = new window.game.entities.Projectile(window.game, 100, 100, 'bullet', { 
                w: 4, h: 12, vy: -10, pierceCount: 1 
            });
            window.game.bullets.push(bullet);

            // Manual Step 1: Bullet hits first invader at 100, 100
            window.game.collisions.checkCollisions(performance.now());
            const step1Count = window.game.invaders.filter(i => i.x > 0).length;
            const step1BulletCount = window.game.bullets.length;
            const step1PierceRemaining = bullet.pierceCount;

            // Manual Step 2: Move bullet to second invader at 100, 50
            bullet.y = 50;
            window.game.collisions.checkCollisions(performance.now());
            const step2Count = window.game.invaders.filter(i => i.x > 0).length;
            const step2BulletCount = window.game.bullets.length;

            return {
                step1Count,
                step1BulletCount,
                step1PierceRemaining,
                step2Count,
                step2BulletCount
            };
        });

        expect(result.step1Count).toBe(1);
        expect(result.step1BulletCount).toBe(1);
        expect(result.step1PierceRemaining).toBe(0);
        expect(result.step2Count).toBe(0);
        expect(result.step2BulletCount).toBe(0);
    });

    test('Logic: Pierce should NOT pass through non-fatal hit', async ({ page }) => {
        await page.keyboard.press('Space');

        const result = await page.evaluate(() => {
            window.game.app.ticker.stop();
            window.game.hasPierce = true;
            window.game.playerDamage = 1; 
            
            window.game.invaders.forEach(inv => { inv.x = -1000; });

            window.game.entities.spawnInvader(100, 100, { color: '0xff00ff', maxHp: 10, hp: 10, scoreValue: 10 });
            
            const bullet = new window.game.entities.Projectile(window.game, 100, 100, 'bullet', { 
                w: 4, h: 12, vy: -10, pierceCount: 1 
            });
            window.game.bullets.push(bullet);
            
            window.game.collisions.checkCollisions(performance.now());
            return window.game.bullets.length;
        });

        expect(result).toBe(0); 
    });

    test('Logic: Pierce should NOT pass through Bosses', async ({ page }) => {
        await page.keyboard.press('Space');

        const result = await page.evaluate(() => {
            window.game.app.ticker.stop();
            window.game.hasPierce = true;
            window.game.playerDamage = 100;
            
            window.game.invaders.forEach(inv => { inv.x = -1000; });

            window.game.entities.spawnInvader(100, 100, { color: '0xff0000', maxHp: 1, hp: 1, scoreValue: 100, isBoss: true });
            
            const bullet = new window.game.entities.Projectile(window.game, 100, 100, 'bullet', { 
                w: 4, h: 12, vy: -10, pierceCount: 1 
            });
            window.game.bullets.push(bullet);
            
            window.game.collisions.checkCollisions(performance.now());
            return window.game.bullets.length;
        });

        expect(result).toBe(0); 
    });
});
