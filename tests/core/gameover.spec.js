import { test, expect } from '@playwright/test';

test.describe('Neon Invaders - Game Over and Reset', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect.poll(async () => {
            return await page.evaluate(() => !!window.game);
        }, { timeout: 10000 }).toBe(true);
    });

    test('Flow: Escape during PLAYING should trigger GAMEOVER', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        
        await page.keyboard.press('Escape');
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('GAMEOVER');
        
        const gameOverVisible = await page.evaluate(() => window.game.ui.views.gameOver.container.visible);
        expect(gameOverVisible).toBe(true);
    });

    test('Flow: Escape during PAUSED should trigger GAMEOVER', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        await page.keyboard.press('KeyH'); // Pause
        
        await page.keyboard.press('Escape');
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('GAMEOVER');
    });

    test('Flow: Escape during GAMEOVER should restart', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        await page.keyboard.press('Escape'); // Kill
        
        await page.keyboard.press('Escape'); // Restart
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PLAYING');
    });

    test('Highscore: Should show name entry if score is sufficient', async ({ page }) => {
        // Setup low highscores
        await page.evaluate(() => {
            window.localStorage.setItem('neonInvadersHighScores', JSON.stringify([
                { name: 'LOW', score: 10 }
            ]));
        });
        await page.reload();
        await page.keyboard.press('Space'); // Start
        
        // Force high score and end game
        await page.evaluate(() => {
            window.game.score = 5000;
            window.game.endGame(false);
        });

        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('HIGHSCORE');
        
        const nameEntryVisible = await page.evaluate(() => window.game.ui.views.nameEntry.container.visible);
        expect(nameEntryVisible).toBe(true);

        // Name input interaction (Simplified: just press Space to save)
        await page.keyboard.press('Space');
        
        // Should return to GAMEOVER screen after saving
        const finalState = await page.evaluate(() => window.game.state);
        expect(finalState).toBe('GAMEOVER');
        
        // Verify list updated
        const topScore = await page.evaluate(() => {
            const scores = JSON.parse(localStorage.getItem('neonInvadersHighScores'));
            return scores[0].score;
        });
        expect(topScore).toBe(5000);
    });
});
