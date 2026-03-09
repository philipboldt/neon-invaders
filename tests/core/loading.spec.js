import { test, expect } from '@playwright/test';

test.describe('Neon Nuke - Loading and Initialization', () => {

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => {
            if (msg.type() === 'error') console.error(`PAGE ERROR: ${msg.text()}`);
        });
    });

    test('Basic: HTML structure and title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Neon Nuke/);
        
        const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
        expect(viewport).toContain('width=device-width');
        expect(viewport).toContain('initial-scale=1.0');
    });

    test('Initialization: window.game should be ready', async ({ page }) => {
        await page.goto('/');
        
        await expect.poll(async () => {
            return await page.evaluate(() => !!window.game);
        }, { timeout: 10000 }).toBe(true);

        const gameState = await page.evaluate(() => ({
            level: window.game.level,
            score: window.game.score,
            lives: window.game.lives,
            state: window.game.state
        }));
        
        expect(gameState.level).toBe(1);
        expect(gameState.score).toBe(0);
        expect(gameState.lives).toBe(3);
        expect(gameState.state).toBe('START');
    });

    test('Visibility: Start Screen PixiJS state', async ({ page }) => {
        await page.goto('/');
        
        // Wait for game to initialize
        await expect.poll(async () => {
            return await page.evaluate(() => !!window.game);
        }, { timeout: 10000 }).toBe(true);

        const startScreenVisible = await page.evaluate(() => window.game.ui.views.start.container.visible);
        expect(startScreenVisible).toBe(true);
        
        const promptText = await page.evaluate(() => window.game.ui.views.start.startPrompt.text);
        expect(promptText).toContain('start');
        
        // HUD should be hidden on start screen
        const hudVisible = await page.evaluate(() => window.game.ui.views.hud.container.visible);
        expect(hudVisible).toBe(false);
    });

    test('Responsive: Body height should be 100dvh (effectively viewport height)', async ({ page }) => {
        await page.goto('/');
        const height = await page.evaluate(() => {
            const body = document.body;
            const style = window.getComputedStyle(body);
            return style.height;
        });
        
        const viewportHeight = page.viewportSize()?.height;
        // Allow for small rounding differences
        expect(parseFloat(height)).toBeGreaterThanOrEqual((viewportHeight || 0) - 1);
        expect(parseFloat(height)).toBeLessThanOrEqual((viewportHeight || 0) + 1);
    });
});
