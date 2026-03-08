import { test, expect } from '@playwright/test';

test.describe('Neon Invaders - Pod Progression', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // More robust wait for full game initialization
        await expect.poll(async () => {
            return await page.evaluate(() => {
                return !!(window.game && 
                       window.game.particles && 
                       window.game.player && 
                       window.game.player.pods);
            });
        }, { timeout: 15000 }).toBe(true);
    });

    test('Logic: Level 5 Boss should unlock Left Pod (PDC)', async ({ page }) => {
        await page.keyboard.press('Space'); // Start game

        await page.evaluate(() => {
            window.game.level = 5;
            window.game.invaders = []; 
            window.game.upgrades = [];
            window.game.particles.reset();
        });

        await expect.poll(async () => {
            return await page.evaluate(() => window.game.state);
        }, { timeout: 5000 }).toBe('BOSSKILLED');

        const isLeftActive = await page.evaluate(() => window.game.player.pods.left.active);
        expect(isLeftActive).toBe(true);

        const isSpriteVisible = await page.evaluate(() => window.game.player.leftPodSprite.visible);
        expect(isSpriteVisible).toBe(true);

        await page.keyboard.press('Space');
        expect(await page.evaluate(() => window.game.state)).toBe('PLAYING');
    });

    test('Logic: Level 10 Boss should unlock Right Pod (Lightning)', async ({ page }) => {
        await page.keyboard.press('Space');

        await page.evaluate(() => {
            window.game.level = 10;
            window.game.player.pods.left.active = true;
            window.game.invaders = []; 
            window.game.upgrades = [];
            window.game.particles.reset();
        });

        await expect.poll(async () => {
            return await page.evaluate(() => window.game.state);
        }, { timeout: 5000 }).toBe('BOSSKILLED');

        const pods = await page.evaluate(() => ({
            left: window.game.player.pods.left.active,
            right: window.game.player.pods.right.active
        }));
        
        expect(pods.left).toBe(true);
        expect(pods.right).toBe(true);

        const sprites = await page.evaluate(() => ({
            left: window.game.player.leftPodSprite.visible,
            right: window.game.player.rightPodSprite.visible
        }));
        expect(sprites.left).toBe(true);
        expect(sprites.right).toBe(true);
    });
});
