import { test, expect } from '@playwright/test';

test.describe('Neon Nuke - Dynamic Difficulty Scaling', () => {

    test('Grid: 4:3 Landscape (800x600) should have ~11 columns', async ({ page }) => {
        await page.setViewportSize({ width: 800, height: 600 });
        await page.goto('/');
        
        await expect.poll(async () => {
            return await page.evaluate(() => !!window.game && !!window.game.invaders && window.game.invaders.length > 0);
        }, { timeout: 10000 }).toBe(true);

        const gridInfo = await page.evaluate(() => {
            const invaders = window.game.invaders;
            const xPositions = new Set(invaders.filter(inv => !inv.isBoss).map(inv => Math.round(inv.x)));
            return {
                cols: xPositions.size,
                gridW: window.game.gridW,
                appW: window.game.W
            };
        });

        // 800 * 0.6 = 480. 11 cols * (36+8)-8 = 476. Correct.
        expect(gridInfo.cols).toBeGreaterThanOrEqual(10);
        expect(gridInfo.gridW).toBeGreaterThan(400);
        expect(gridInfo.gridW).toBeLessThan(500);
    });

    test('Grid: 2:3 Portrait (800x1200) should have ~7 columns and scaled invaders', async ({ page }) => {
        // In 2:3 (800x1200), heightFactor is 2.0. Scale is capped at 1.5.
        // invW = 36 * 1.5 = 54.
        // targetGridW = 800 * 0.6 = 480.
        // cols = floor(480 / (54 + 8)) = floor(480 / 62) = 7.
        // 7 cols * (54+8)-8 = 426px.
        
        await page.setViewportSize({ width: 800, height: 1200 });
        await page.goto('/');
        
        await expect.poll(async () => {
            return await page.evaluate(() => !!window.game && !!window.game.invaders && window.game.invaders.length > 0);
        }, { timeout: 10000 }).toBe(true);

        const gridInfo = await page.evaluate(() => {
            const invaders = window.game.invaders.filter(inv => !inv.isBoss);
            const xPositions = new Set(invaders.map(inv => Math.round(inv.x)));
            return {
                cols: xPositions.size,
                gridW: window.game.gridW,
                invWidth: invaders[0].w
            };
        });

        expect(gridInfo.cols).toBeLessThan(10);
        expect(gridInfo.cols).toBeGreaterThanOrEqual(7);
        expect(gridInfo.invWidth).toBe(36 * 1.5);
        expect(gridInfo.gridW).toBeGreaterThan(400);
    });

    test('Position: Starting Y should be 20% of screen height', async ({ page }) => {
        // Landscape
        await page.setViewportSize({ width: 800, height: 600 });
        await page.goto('/');
        await page.waitForFunction(() => !!window.game && window.game.invaders.length > 0);
        
        let startY = await page.evaluate(() => {
            // Find the highest invader (lowest Y)
            return Math.min(...window.game.invaders.map(inv => inv.y));
        });
        // Boss might be higher, but let's check standard ones. 
        // Actually initInvaders sets startY for the grid, boss is above startY - gap*2.
        // Let's just check the first invader in the array (usually the first grid row)
        startY = await page.evaluate(() => window.game.invaders[0].y);
        expect(startY).toBeCloseTo(600 * 0.2, 0);

        // Portrait
        await page.setViewportSize({ width: 800, height: 1200 });
        await page.goto('/');
        await page.waitForFunction(() => !!window.game && window.game.invaders.length > 0);
        
        startY = await page.evaluate(() => window.game.invaders[0].y);
        expect(startY).toBeCloseTo(1200 * 0.2, 0);
    });
});
