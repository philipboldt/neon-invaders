import { test, expect } from '@playwright/test';

test.describe('Neon Invaders - Visual Snapshots', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect.poll(async () => {
            return await page.evaluate(() => !!window.game);
        }, { timeout: 10000 }).toBe(true);
        
        // Setup consistent highscores for start screen
        await page.evaluate(() => {
            window.localStorage.setItem('neonInvadersHighScores', JSON.stringify([
                { name: 'NEO', score: 9999 },
                { name: 'TRN', score: 5555 },
                { name: 'FLY', score: 1111 }
            ]));
        });
        await page.reload();
        
        // Wait for game to initialize again after reload
        await expect.poll(async () => {
            return await page.evaluate(() => !!window.game);
        }, { timeout: 10000 }).toBe(true);

        // Aggressively disable all animations and movement
        await page.evaluate(() => {
            document.fonts.ready;
            // Overwrite update methods to NOOP
            Object.values(window.game.ui.views).forEach(view => {
                view.update = () => {}; 
            });
            window.game.starfield.update = () => {};
            window.game.particles.update = () => {};
            // Stop the ticker to freeze EVERYTHING
            window.game.app.ticker.stop();
        });
    });

    test('Snapshot: Start Screen', async ({ page }) => {
        // Increase timeout for screenshot generation
        test.setTimeout(15000);
        await expect(page.locator('.canvas-container')).toHaveScreenshot('start-screen.png', {
             animations: 'disabled',
             maxDiffPixelRatio: 0.1
        });
    });

    test('Snapshot: Pause / Help Screen', async ({ page }) => {
        test.setTimeout(15000);
        await page.keyboard.press('Space'); // Start
        await page.keyboard.press('KeyH'); // Pause
        
        await page.evaluate(() => {
            window.game.app.ticker.stop();
        });

        await expect(page.locator('.canvas-container')).toHaveScreenshot('pause-screen.png', {
            animations: 'disabled',
            maxDiffPixelRatio: 0.1
        });
    });

    test('Snapshot: Boss Clear summary (Level 5)', async ({ page }) => {
        test.setTimeout(15000);
        await page.keyboard.press('Space'); // Start
        
        await page.evaluate(() => {
            window.game.level = 5;
            window.game.invaders = [];
            window.game.app.ticker.start(); // Briefly start to allow one tick for detection
        });

        await expect.poll(async () => {
            return await page.evaluate(() => window.game.state);
        }, { timeout: 5000 }).toBe('BOSSKILLED');

        await page.evaluate(() => {
            window.game.app.ticker.stop();
        });

        await expect(page.locator('.canvas-container')).toHaveScreenshot('boss-clear-5.png', {
            animations: 'disabled',
            maxDiffPixelRatio: 0.1
        });
    });
});
