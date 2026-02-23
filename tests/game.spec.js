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
});
