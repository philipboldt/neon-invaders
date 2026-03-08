import { test, expect } from '@playwright/test';

test.describe('Neon Invaders - Game Over and Reset', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect.poll(async () => {
            return await page.evaluate(() => !!window.game);
        }, { timeout: 10000 }).toBe(true);
    });

    test('Flow: Escape during PLAYING should trigger QUIT_CONFIRM', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        
        await page.keyboard.press('Escape');
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('QUIT_CONFIRM');
        
        const quitConfirmVisible = await page.evaluate(() => window.game.ui.views.quitConfirm.container.visible);
        expect(quitConfirmVisible).toBe(true);
    });

    test('Flow: Double Escape should end game', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        await page.keyboard.press('Escape'); // First ESC (Airlock)
        await page.keyboard.press('Escape'); // Second ESC (Quit)
        
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('GAMEOVER');
    });

    test('Flow: Escape then Space should resume battle', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        await page.keyboard.press('Escape'); // Airlock
        
        await page.keyboard.press('Space'); // Resume
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PLAYING');
    });

    test('Flow: Escape during GAMEOVER should restart', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        await page.keyboard.press('Escape'); 
        await page.keyboard.press('Escape'); // Quit
        
        await page.keyboard.press('Escape'); // Restart
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PLAYING');
    });

    test('Highscore: Should show name entry if score is sufficient', async ({ page }) => {
        await page.evaluate(() => {
            window.localStorage.setItem('neonInvadersHighScores', JSON.stringify([
                { name: 'LOW', score: 10 }
            ]));
        });
        await page.reload();
        await page.keyboard.press('Space'); // Start
        
        await page.evaluate(() => {
            window.game.score = 5000;
            window.game.endGame(false);
        });

        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('HIGHSCORE');
        
        const nameEntryVisible = await page.evaluate(() => window.game.ui.views.nameEntry.container.visible);
        expect(nameEntryVisible).toBe(true);

        await page.keyboard.press('Space');
        
        const finalState = await page.evaluate(() => window.game.state);
        expect(finalState).toBe('GAMEOVER');
        
        const topScore = await page.evaluate(() => {
            const scores = JSON.parse(localStorage.getItem('neonInvadersHighScores'));
            return scores[0].score;
        });
        expect(topScore).toBe(5000);
    });
});
