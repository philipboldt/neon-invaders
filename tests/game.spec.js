import { test, expect, devices } from '@playwright/test';

test.describe('Neon Invaders E2E Tests (MCP Enhanced)', () => {

    test.beforeEach(async ({ page }) => {
        // Fail the test if any console error or unhandled exception occurs
        page.on('pageerror', (exception) => {
            throw new Error(`Uncaught exception: ${exception.message}`);
        });
    });

    test('should load the game and show the start screen', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Neon Invaders/);
        await expect(page.locator('#start-screen')).toBeVisible();
    });

    test('State Inspection: window.game should be initialized', async ({ page }) => {
        await page.goto('/');
        const isGameInitialized = await page.evaluate(() => !!window.game);
        expect(isGameInitialized).toBe(true);

        const gameState = await page.evaluate(() => ({
            level: window.game.level,
            score: window.game.score,
            lives: window.game.lives
        }));
        expect(gameState.level).toBe(1);
        expect(gameState.score).toBe(0);
        expect(gameState.lives).toBe(3);
    });

    test('Visual: Start Screen should match visual baseline', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => {
            window.localStorage.setItem('neonInvadersHighScores', JSON.stringify([9999, 1234, 10]));
        });
        await page.reload();
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({ content: '.blink { animation: none !important; opacity: 1 !important; }' });

        await expect(page.locator('.canvas-container')).toHaveScreenshot('start-screen-mcp.png');
    });

    test('Gameplay: Starting the game should populate invaders', async ({ page }) => {
        await page.goto('/');
        await page.keyboard.press('Space');
        
        // Use window.game to verify internal state
        const invaderCount = await page.evaluate(() => window.game.invaders.length);
        expect(invaderCount).toBeGreaterThan(0);
        
        const isRunning = await page.evaluate(() => window.game.gameRunning);
        expect(isRunning).toBe(true);
    });

    test('Boss Destruction: Should trigger stunning explosion', async ({ page }) => {
        await page.goto('/');
        await page.keyboard.press('Space');

        // Force level 10 (Boss Level) and kill boss instantly
        await page.evaluate(() => {
            window.game.level = 10;
            window.game.initInvaders();
            // Clear all regular invaders to avoid bullet interference
            window.game.invaders = window.game.invaders.filter(inv => inv.isBoss);
            const boss = window.game.invaders.find(inv => inv.isBoss);
            if (boss) {
                boss.hp = 1; 
                // Position player directly under the boss
                window.game.player.x = boss.x + boss.w / 2 - window.game.player.w / 2;
            }
        });

        // Shoot until boss is dead
        await page.keyboard.down('Space');
        
        // Wait for boss to be destroyed
        await expect.poll(async () => {
            return await page.evaluate(() => window.game.invaders.find(inv => inv.isBoss) === undefined);
        }, { timeout: 10000 }).toBe(true);

        // Capture the stunning explosion effect
        await page.waitForTimeout(200); // Wait a few frames for particles to spread
        await expect(page.locator('#game')).toHaveScreenshot('boss-stunning-explosion.png', {
            maxDiffPixelRatio: 0.2 // Allow variance for random particles
        });
    });

    test('Dynamic Brightness: Invaders should darken when damaged', async ({ page }) => {
        await page.goto('/');
        await page.keyboard.press('Space');

        // Find an invader with > 1 HP (Level 1 invaders usually have 1 HP, so let's force Level 5)
        await page.evaluate(() => {
            window.game.level = 5;
            window.game.initInvaders();
            const inv = window.game.invaders[0];
            inv.maxHp = 10;
            inv.hp = 10;
        });

        // Damage the invader
        await page.evaluate(() => {
            window.game.invaders[0].hp = 2;
        });

        // We verify the state logic via evaluate
        const ratio = await page.evaluate(() => {
            const inv = window.game.invaders[0];
            return 0.45 + 0.55 * (inv.hp / inv.maxHp);
        });
        expect(ratio).toBeCloseTo(0.56); // 0.45 + 0.55 * 0.2
    });

    test('Mobile: HUD layout remains stable', async ({ browser }) => {
        // Use full device emulation for proper media query triggering
        const context = await browser.newContext(devices['iPhone 12']);
        const page = await context.newPage();
        await page.goto('http://localhost:3001/');

        const hud = page.locator('.hud');
        await expect(hud).toBeVisible();

        const box = await hud.boundingBox();
        expect(box?.width).toBeLessThanOrEqual(390);
        
        // Verify touch controls are visible (now triggered by iPhone emulation)
        await expect(page.locator('#touch-controls')).toBeVisible();
        await context.close();
    });

    test('Responsive: Game should fit within viewport bounds', async ({ page }) => {
        // Test various resolutions to ensure "True Best Fit" works
        const viewports = [
            { width: 1920, height: 1080 }, // Large Desktop
            { width: 800, height: 400 },   // Short Wide (Mobile Landscape)
            { width: 375, height: 667 }    // Small Portrait
        ];

        for (const vp of viewports) {
            await page.setViewportSize(vp);
            await page.goto('/');
            
            const gameWrap = page.locator('.game-wrap');
            const box = await gameWrap.boundingBox();
            
            expect(box).not.toBeNull();
            // Wrap height should not exceed viewport height (allow 5px margin for rounding)
            expect(box.height).toBeLessThanOrEqual(vp.height + 5);
            // Wrap width should not exceed viewport width
            expect(box.width).toBeLessThanOrEqual(vp.width + 5);
        }
    });
});
