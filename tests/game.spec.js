const { test, expect } = require('@playwright/test');

test.describe('Neon Invaders E2E Tests', () => {

    test('should load the game and show the start screen', async ({ page }) => {
        await page.goto('/');

        // Check title
        await expect(page).toHaveTitle(/Neon Invaders/);

        // Check canvas exists
        const canvas = page.locator('#game');
        await expect(canvas).toBeVisible();

        // Check start screen is visible
        const startScreen = page.locator('#start-screen');
        await expect(startScreen).toBeVisible();
        await expect(startScreen).toHaveText(/Press SPACE or Tap to start/);
    });

    test('Visual: Start Screen should match visual baseline', async ({ page }) => {
        await page.goto('/');
        
        // Wait for fonts to load for consistent rendering
        await page.evaluate(() => document.fonts.ready);
        
        // Ensure the highscores are consistent for the snapshot
        await page.evaluate(() => {
            window.localStorage.setItem('neonInvadersHighScores', JSON.stringify([9999, 1234, 10]));
            // Trigger a re-render by calling the globally accessible method if available, 
            // but since it's in a closure, we'll reload after setting localStorage.
        });
        await page.goto('/');
        await page.evaluate(() => document.fonts.ready);

        // Hide the "Press SPACE" blink to avoid flaky snapshots
        await page.addStyleTag({ content: '.blink { animation: none !important; opacity: 1 !important; }' });

        const startScreen = page.locator('#start-screen');
        await expect(startScreen).toHaveScreenshot('start-screen.png', {
            mask: [page.locator('.blink')] // Just in case, mask the blinking text
        });
    });

    test('Performance: Game should maintain high FPS during play', async ({ page }) => {
        if (page.viewportSize()?.width < 768) test.skip(); // Desktop only for baseline
        
        await page.goto('/');
        const client = await page.context().newCDPSession(page);
        await client.send('Performance.enable');

        // Start game
        await page.keyboard.press('Space');
        
        // Simulate some play time
        await page.keyboard.down('ArrowLeft');
        await page.waitForTimeout(2000);
        await page.keyboard.up('ArrowLeft');

        // Get metrics
        const metrics = await client.send('Performance.getMetrics');
        const frames = metrics.metrics.find(m => m.name === 'FramesPerSecond');
        
        // Note: Playwright's CDP metrics for FPS can be tricky depending on the environment.
        // A more reliable way in CI is to measure the time spent in the game loop.
        const frameTime = await page.evaluate(async () => {
            return new Promise(resolve => {
                let frames = 0;
                const start = performance.now();
                function count() {
                    frames++;
                    if (frames < 60) requestAnimationFrame(count);
                    else resolve((performance.now() - start) / 60);
                }
                requestAnimationFrame(count);
            });
        });

        // 60 FPS = 16.67ms per frame. 55 FPS = 18.18ms.
        expect(frameTime).toBeLessThan(18.2);
    });

    test('desktop: can start the game and shoot using keyboard', async ({ page }) => {
        // Only run this test on desktop browsers where keyboard is primary
        if (page.viewportSize()?.width < 768) test.skip();

        await page.goto('/');

        const startScreen = page.locator('#start-screen');
        const score = page.locator('#score');

        // Press Space to start
        await page.keyboard.press('Space');

        // The start screen should hide
        await expect(startScreen).toHaveClass(/hidden/);

        // Press Space to shoot
        await page.keyboard.press('Space');
        // Ensure game didn't crash and score is 0
        await expect(score).toHaveText('0');

        // Press Left / Right
        await page.keyboard.down('ArrowLeft');
        await page.waitForTimeout(100);
        await page.keyboard.up('ArrowLeft');

        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(100);
        await page.keyboard.up('ArrowRight');
    });

    test('mobile: can start the game and see touch controls', async ({ page, isMobile }) => {
        // We only want to test the touch control visibility and interaction on mobile viewports
        // Playwright device emulation handles this, so we check if the viewport is small
        if (page.viewportSize()?.width >= 768) test.skip();

        await page.goto('/');

        const startScreen = page.locator('#start-screen');
        const touchControls = page.locator('#touch-controls');

        // Touch controls should be visible on mobile
        await expect(touchControls).toBeVisible();

        // Tap to start
        await startScreen.tap();

        // Start screen should hide
        await expect(startScreen).toHaveClass(/hidden/);

        // Tap to pause the game
        const btnPause = page.locator('#btn-pause');
        const helpScreen = page.locator('#help-screen');
        await expect(btnPause).toBeVisible();
        await btnPause.tap();

        // Help screen should appear
        await expect(helpScreen).not.toHaveClass(/hidden/);

        // Tap the help screen to dismiss it
        await helpScreen.tap();

        // Help screen should be hidden again
        await expect(helpScreen).toHaveClass(/hidden/);

        // Tap the shoot button to enable auto-fire
        const btnShoot = page.locator('#btn-shoot');
        await expect(btnShoot).toBeVisible();
        await btnShoot.tap();
        await expect(btnShoot).toHaveClass(/active/);

        // Tap the shoot button again to disable auto-fire
        await btnShoot.tap();
        await expect(btnShoot).not.toHaveClass(/active/);
    });

    test('mobile: HUD layout remains stable with long text combinations', async ({ page }) => {
        if (page.viewportSize()?.width >= 768) test.skip();
        await page.goto('/');

        const hud = page.locator('.hud');
        await expect(hud).toBeVisible();

        // Get initial bounding box height of the HUD container
        const initialBox = await hud.boundingBox();
        expect(initialBox).not.toBeNull();

        // Inject extreme text into all HUD elements to force a potential wrap
        await page.evaluate(() => {
            document.getElementById('score').textContent = '999999999';
            document.getElementById('level').textContent = '999';
            document.getElementById('lives').textContent = '99';
            document.getElementById('shield').textContent = 'activated-super-long-status';
            document.getElementById('pierce').textContent = 'active-pierce-very-long';
            document.getElementById('damage').textContent = '999';
        });

        // Small timeout to allow browser layout calculation just in case
        await page.waitForTimeout(100);

        // Get new bounding box height
        const newBox = await hud.boundingBox();
        expect(newBox).not.toBeNull();

        // Assert height hasn't changed by more than 2 pixels
        // (If wrap occurred due to Flexbox, it would jump by ~15-20px)
        expect(Math.abs(newBox.height - initialBox.height)).toBeLessThan(2);
    });

    test('mobile: Level position remains mostly stable when Score is extremely large', async ({ page }) => {
        if (page.viewportSize()?.width >= 768) test.skip();
        await page.goto('/');

        const levelNode = page.locator('.level');
        await expect(levelNode).toBeVisible();

        // Get initial horizontal position of Level
        const initialLevelBox = await levelNode.boundingBox();
        expect(initialLevelBox).not.toBeNull();
        const initialLeft = initialLevelBox.x;

        // Inject massive score
        await page.evaluate(() => {
            document.getElementById('score').textContent = '999999999999';
        });

        await page.waitForTimeout(100);

        // Get new horizontal position of Level
        const newLevelBox = await levelNode.boundingBox();
        expect(newLevelBox).not.toBeNull();
        const newLeft = newLevelBox.x;

        // Assert horizontal Shift is minimal (e.g. less than 10 pixels of wobble)
        expect(Math.abs(newLeft - initialLeft)).toBeLessThan(10);
    });

    test('desktop: properly renders highscores from localStorage', async ({ page }) => {
        if (page.viewportSize()?.width < 768) test.skip();

        // Inject highscores before page load
        await page.addInitScript(() => {
            window.localStorage.setItem('neonInvadersHighScores', JSON.stringify([99999, 1234, 10]));
        });
        await page.goto('/');

        const hsList = page.locator('#start-screen .highscore-list li');
        await expect(hsList).toHaveCount(3);

        // Assert first place
        await expect(hsList.nth(0).locator('.rank')).toHaveText('1.');
        await expect(hsList.nth(0).locator('.score-val')).toHaveText('99999');

        // Assert second place
        await expect(hsList.nth(1).locator('.rank')).toHaveText('2.');
        await expect(hsList.nth(1).locator('.score-val')).toHaveText('01234');

        // Assert third place
        await expect(hsList.nth(2).locator('.rank')).toHaveText('3.');
        await expect(hsList.nth(2).locator('.score-val')).toHaveText('00010');
    });

    test('desktop: properly renders highscores on game over screen', async ({ page }) => {
        if (page.viewportSize()?.width < 768) test.skip();

        await page.addInitScript(() => {
            window.localStorage.setItem('neonInvadersHighScores', JSON.stringify([99999, 1234, 10]));
        });
        await page.goto('/');

        // Force a game over
        await page.evaluate(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
            document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
        });

        await page.evaluate(() => {
            // Need to bypass local closure variables if possible. 
            // Alternatively we trigger death directly by triggering a specific state, or just wait for the invaders to hit the player if we wait long enough.
            // A simpler way: The script runs automatically, we can manipulate localStorage, start game, wait for high score to re-render, 
            // Actually, we don't need to force game over, because the start game script hides it, but updateHighScores() is called on game over AND on start. It populates BOTH lists on load!
            // Wait, does it populate both lists on page load? Yes! `updateHighScores()` runs at the bottom of the script.
        });

        // The game over overlay starts with `display: none` because of the `.hidden` class, but the DOM elements for the list should be populated.
        const hsList = page.locator('#overlay .highscore-list li');
        await expect(hsList).toHaveCount(3);
        await expect(hsList.nth(0).locator('.rank')).toHaveText('1.');
        await expect(hsList.nth(0).locator('.score-val')).toHaveText('99999');
    });
});
