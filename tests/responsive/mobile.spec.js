import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Pixel 5'] });

test.describe('Neon Invaders - Mobile Responsive (New Touch System)', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect.poll(async () => {
            return await page.evaluate(() => !!window.game);
        }, { timeout: 10000 }).toBe(true);
    });

    test('UI: Touch controls (DOM) should NOT exist', async ({ page }) => {
        const touchControls = page.locator('#touch-controls');
        await expect(touchControls).toHaveCount(0);
    });

    test('Interaction: Tap to start', async ({ page }) => {
        // Tap in the middle of the screen
        const rect = await page.locator('#game').boundingBox();
        if (!rect) throw new Error('Canvas not found');

        await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
        
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PLAYING');
    });

    test('Movement: Bottom Left/Right zones', async ({ page }) => {
        const rect = await page.locator('#game').boundingBox();
        if (!rect) throw new Error('Canvas not found');
        
        await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2); // Start
        
        const initialX = await page.evaluate(() => window.game.player.x);

        // Tap Bottom Right (at 80% width, 80% height)
        await page.mouse.move(rect.x + rect.width * 0.8, rect.y + rect.height * 0.8);
        await page.mouse.down();
        await page.waitForTimeout(200);
        const moveRightX = await page.evaluate(() => window.game.player.x);
        expect(moveRightX).toBeGreaterThan(initialX);
        await page.mouse.up();

        // Tap Bottom Left (at 20% width, 80% height)
        await page.mouse.move(rect.x + rect.width * 0.2, rect.y + rect.height * 0.8);
        await page.mouse.down();
        await page.waitForTimeout(200);
        const moveLeftX = await page.evaluate(() => window.game.player.x);
        expect(moveLeftX).toBeLessThan(moveRightX);
        await page.mouse.up();
    });

    test('Combat: Bottom Center zone (Auto-Shoot Toggle)', async ({ page }) => {
        const rect = await page.locator('#game').boundingBox();
        if (!rect) throw new Error('Canvas not found');
        
        await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2); // Start
        
        // Tap Bottom Center (at 50% width, 80% height)
        await page.mouse.click(rect.x + rect.width * 0.5, rect.y + rect.height * 0.8);
        
        const isShooting = await page.evaluate(() => window.game.spacePressed);
        expect(isShooting).toBe(true);

        // Tap again to toggle off
        await page.mouse.click(rect.x + rect.width * 0.5, rect.y + rect.height * 0.8);
        expect(await page.evaluate(() => window.game.spacePressed)).toBe(false);
    });

    test('Interaction: Middle zone (Pause Toggle)', async ({ page }) => {
        const rect = await page.locator('#game').boundingBox();
        if (!rect) throw new Error('Canvas not found');
        
        await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2); // Start
        
        // Tap Middle (at 50% width, 50% height)
        await page.mouse.click(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
        let state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PAUSED');
        
        // Tap again to resume
        await page.mouse.click(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
        state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PLAYING');
    });

    test('Flow: Top zone (Double Tap to EXIT)', async ({ page }) => {
        const rect = await page.locator('#game').boundingBox();
        if (!rect) throw new Error('Canvas not found');
        
        await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2); // Start
        
        // Double Tap Top (at 50% width, 10% height)
        const tx = rect.x + rect.width * 0.5;
        const ty = rect.y + rect.height * 0.1;
        
        await page.mouse.click(tx, ty);
        await page.waitForTimeout(100);
        await page.mouse.click(tx, ty);
        
        const state = await page.evaluate(() => window.game.state);
        // Should be GAMEOVER or HIGHSCORE depending on score, but definitely not PLAYING
        expect(state).not.toBe('PLAYING');
    });
});
