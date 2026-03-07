import { test, expect } from '@playwright/test';

test.describe('Neon Invaders Mobile Portrait Optimization', () => {

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
    });

    test('should adapt logical dimensions for portrait mode', async ({ page }) => {
        // Set a tall portrait viewport (iPhone 12/13/14 Pro style)
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');

        // Wait for game to initialize
        await expect.poll(async () => {
            return await page.evaluate(() => !!window.game);
        }, { timeout: 10000 }).toBe(true);

        // Explicitly trigger resize in case setViewportSize didn't
        await page.evaluate(() => window.game.handleResize());

        // Check logical dimensions
        const dims = await page.evaluate(() => ({
            W: window.game.W,
            H: window.game.H,
            heightFactor: window.game.heightFactor
        }));

        // Logical width should always be 800
        expect(dims.W).toBe(800);
        // Logical height should be calculated based on aspect ratio (812/375 = 2.16)
        // 800 * 2.16 = 1732, but we clamp to 1400
        expect(dims.H).toBe(1400);
        // Height factor should be > 1 (1400 / 600 = 2.33)
        expect(dims.heightFactor).toBeGreaterThan(1);
    });

    test('should use a narrow grid in portrait mode', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');
        await page.evaluate(() => window.game.handleResize());
        await page.keyboard.press('Space'); // Start game

        // Check invader grid layout in Level 1
        const gridInfo = await page.evaluate(() => {
            // Re-calculate or inspect the grid
            const invaders = window.game.invaders;
            const rows = new Set(invaders.map(inv => inv.y)).size;
            const cols = new Set(invaders.map(inv => inv.x)).size;
            return { rows, cols };
        });

        // In portrait mode, we expect 9 rows and 6 columns (base level 1)
        expect(gridInfo.rows).toBe(9);
        expect(gridInfo.cols).toBe(6);
    });

    test('should maintain 4:3 style logical dimensions on landscape desktop', async ({ page }) => {
        // Set a standard desktop viewport
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/');
        await page.evaluate(() => window.game.handleResize());

        const dims = await page.evaluate(() => ({
            W: window.game.W,
            H: window.game.H
        }));

        expect(dims.W).toBe(800);
        // 720 / 1280 = 0.56. 800 * 0.56 = 450. Clamped to 600 minimum.
        expect(dims.H).toBe(600);
    });

    test('should adjust player position on resize', async ({ page }) => {
        await page.setViewportSize({ width: 800, height: 600 });
        await page.goto('/');
        await page.evaluate(() => window.game.handleResize());

        const initialY = await page.evaluate(() => window.game.player.y);
        expect(initialY).toBe(600 - 80);

        // Resize to taller screen
        await page.setViewportSize({ width: 400, height: 800 });
        await page.evaluate(() => window.game.handleResize());

        const newY = await page.evaluate(() => window.game.player.y);
        // Aspect 800/400 = 2.0. 800 * 2.0 = 1600. Clamped to 1400.
        // newY = 1400 - 80 = 1320
        expect(newY).toBe(1320);
    });

    test('Visual: Portrait layout should be centered and fill screen', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');
        await page.evaluate(() => window.game.handleResize());
        await page.evaluate(() => document.fonts.ready);
        
        // Hide blinking text for stable screenshot
        await page.addStyleTag({ content: '.blink { animation: none !important; opacity: 1 !important; }' });

        await expect(page.locator('.canvas-container')).toHaveScreenshot('portrait-layout.png');
    });
});
