import { test, expect } from '@playwright/test';

test.describe('Neon Nuke - Game Over and Reset', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect.poll(async () => {
            return await page.evaluate(() => !!window.game);
        }, { timeout: 10000 }).toBe(true);
    });

    test('Flow: Escape during PLAYING should trigger SETTINGS', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        
        await page.keyboard.press('Escape');
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('SETTINGS');
        
        const settingsVisible = await page.evaluate(() => window.game.ui.views.settings.container.visible);
        expect(settingsVisible).toBe(true);
    });

    test('Flow: Double Escape should end game from PLAYING', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        await page.keyboard.press('Escape'); // First ESC (Settings)
        await page.keyboard.press('Escape'); // Second ESC (Quit)
        
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('GAMEOVER');
    });

    test('Flow: Escape then Space should resume battle', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        await page.keyboard.press('Escape'); // Settings
        
        await page.keyboard.press('Space'); // Resume
        const state = await page.evaluate(() => window.game.state);
        expect(state).toBe('PLAYING');
    });

    test('Flow: Escape during GAMEOVER should enter SETTINGS and back', async ({ page }) => {
        await page.keyboard.press('Space'); // Start
        await page.keyboard.press('Escape'); 
        await page.keyboard.press('Escape'); // Quit
        
        await page.keyboard.press('Escape'); // Enter Settings from Game Over
        let state = await page.evaluate(() => window.game.state);
        expect(state).toBe('SETTINGS');

        await page.keyboard.press('Escape'); // Exit Settings back to Game Over
        state = await page.evaluate(() => window.game.state);
        expect(state).toBe('GAMEOVER');
    });

    test('Audio: M key should toggle mute', async ({ page }) => {
        const initialMute = await page.evaluate(() => window.game.audio.isMuted);
        expect(initialMute).toBe(false);

        await page.keyboard.press('KeyM');
        const muted = await page.evaluate(() => window.game.audio.isMuted);
        expect(muted).toBe(true);

        await page.keyboard.press('KeyM');
        const unmuted = await page.evaluate(() => window.game.audio.isMuted);
        expect(unmuted).toBe(false);
    });

    test('Highscore: Should show name entry if score is sufficient', async ({ page }) => {
        await page.evaluate(() => {
            window.localStorage.setItem('neonNukeHighScores', JSON.stringify([
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
            const scores = JSON.parse(localStorage.getItem('neonNukeHighScores'));
            return scores[0].score;
        });
        expect(topScore).toBe(5000);
    });
});
