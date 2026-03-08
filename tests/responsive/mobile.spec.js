import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Pixel 5'] });

test.describe('Neon Invaders - Mobile Responsive', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect.poll(async () => {
            return await page.evaluate(() => !!window.game);
        }, { timeout: 10000 }).toBe(true);
    });

    test('Dimensions: Adapt logical height for portrait mode', async ({ page }) => {
        const dims = await page.evaluate(() => ({
            W: window.game.W,
            H: window.game.H,
            heightFactor: window.game.heightFactor
        }));

        expect(dims.W).toBe(800);
        expect(dims.H).toBeGreaterThan(1000); // 844/390 ratio is ~2.16
        expect(dims.heightFactor).toBeGreaterThan(1.5);
    });

    test('UI: Touch controls should be visible', async ({ page }) => {
        const touchControls = page.locator('#touch-controls');
        await expect(touchControls).toBeVisible();
        
        // CSS display check
        const display = await touchControls.evaluate((el) => window.getComputedStyle(el).display);
        expect(display).toBe('flex');
    });

    test('Interaction: Tap to start', async ({ page }) => {
        // Start screen container check
        const startVisible = await page.evaluate(() => window.game.ui.views.start.container.visible);
        expect(startVisible).toBe(true);

        // Tap on the canvas to start (StartView overlay is pointer-active)
        await page.click('#game');
        
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PLAYING');
    });

    test('Interaction: Mobile Pause Toggle', async ({ page }) => {
        await page.click('#game'); // Start
        
        // Tap pause button
        await page.click('#btn-pause');
        let state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PAUSED');
        
        // Tap Help screen to resume
        await page.click('#game');
        state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PLAYING');
    });

    test('Layout: Portrait Grid (9x6)', async ({ page }) => {
        await page.click('#game'); // Start
        
        const gridInfo = await page.evaluate(() => {
            const invaders = window.game.invaders;
            const rows = new Set(invaders.map(inv => inv.y)).size;
            const cols = new Set(invaders.map(inv => inv.x)).size;
            return { rows, cols };
        });

        expect(gridInfo.rows).toBe(9);
        expect(gridInfo.cols).toBe(6);
    });
});
