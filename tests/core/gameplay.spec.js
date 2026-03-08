import { test, expect } from '@playwright/test';

test.describe('Neon Invaders - Core Gameplay', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect.poll(async () => {
            return await page.evaluate(() => !!window.game);
        }, { timeout: 10000 }).toBe(true);
    });

    test('Transitions: START -> PLAYING via Space', async ({ page }) => {
        await page.keyboard.press('Space');
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PLAYING');
        
        const startVisible = await page.evaluate(() => window.game.ui.views.start.container.visible);
        const hudVisible = await page.evaluate(() => window.game.ui.views.hud.container.visible);
        expect(startVisible).toBe(false);
        expect(hudVisible).toBe(true);
    });

    test('Movement: Player should move horizontally', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        
        const initialX = await page.evaluate(() => window.game.player.x);
        
        // Move Right
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(300); // 300ms @ 60fps = 18 frames
        await page.keyboard.up('ArrowRight');
        
        const afterMoveRight = await page.evaluate(() => window.game.player.x);
        expect(afterMoveRight).toBeGreaterThan(initialX + 10); // Ensure significant move

        // Move Left
        await page.keyboard.down('ArrowLeft');
        await page.waitForTimeout(300);
        await page.keyboard.up('ArrowLeft');
        
        const afterMoveLeft = await page.evaluate(() => window.game.player.x);
        expect(afterMoveLeft).toBeLessThan(afterMoveRight - 10);
    });

    test('Combat: Space should create bullets', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        
        await page.keyboard.press('Space'); // Shoot
        const bulletCount = await page.evaluate(() => window.game.bullets.length);
        expect(bulletCount).toBeGreaterThan(0);
    });

    test('Interaction: Pause Toggle (Key H)', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        
        // Pause
        await page.keyboard.press('KeyH');
        let state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PAUSED');
        
        let helpVisible = await page.evaluate(() => window.game.ui.views.help.container.visible);
        expect(helpVisible).toBe(true);

        // Resume via H
        await page.keyboard.press('KeyH');
        state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PLAYING');
        
        helpVisible = await page.evaluate(() => window.game.ui.views.help.container.visible);
        expect(helpVisible).toBe(false);

        // Resume via Space
        await page.keyboard.press('KeyH'); // Pause again
        await page.keyboard.press('Space');
        state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PLAYING');
    });

    test('Logic: Killing all invaders should advance level', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        
        await page.evaluate(() => {
            window.game.invaders = []; // Clear current wave
        });
        
        // Game loop should detect level end
        await expect.poll(async () => {
            return await page.evaluate(() => window.game.level);
        }, { timeout: 5000 }).toBe(2);
        
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PLAYING');
        
        // Verify new invaders spawned
        const invaderCount = await page.evaluate(() => window.game.invaders.length);
        expect(invaderCount).toBeGreaterThan(0);
    });

    test('Logic: Boss Clear summary at level 5', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        
        // Force Level 5 and clear invaders
        await page.evaluate(() => {
            window.game.level = 5;
            window.game.invaders = [];
        });

        // Wait for BOSSKILLED state
        await expect.poll(async () => {
            return await page.evaluate(() => window.game.state);
        }, { timeout: 5000 }).toBe('BOSSKILLED'); 
        
        const bossClearVisible = await page.evaluate(() => window.game.ui.views.bossClear.container.visible);
        expect(bossClearVisible).toBe(true);

        // Verify Level 5 rewards (PDC)
        const rewards = await page.evaluate(() => window.game.ui.views.bossClear.rewardContainer.children.map(c => c.text));
        expect(rewards.some(r => r.includes('PDC'))).toBe(true);

        // Dismiss
        await page.keyboard.press('Space');
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PLAYING');
        expect(await page.evaluate(() => window.game.level)).toBe(6);
    });

    test('Inspection: HUD sync with game state', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        
        // Change score and level
        await page.evaluate(() => {
            window.game.score = 12345;
            window.game.level = 9;
            window.game.ui.updateStats(window.game);
        });

        const hudScore = await page.evaluate(() => window.game.ui.views.hud.hudTexts.score.value.text);
        const hudLevel = await page.evaluate(() => window.game.ui.views.hud.hudTexts.level.value.text);
        
        expect(hudScore).toContain('12345');
        expect(hudLevel).toContain('9');
    });
});
