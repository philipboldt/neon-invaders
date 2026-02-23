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
        await expect(startScreen).toHaveText(/Press SPACE to start/);
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
});
