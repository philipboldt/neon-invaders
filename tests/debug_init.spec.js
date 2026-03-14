import { test, expect } from '@playwright/test';

test('Debug: Check window.game initialization', async ({ page }) => {
    await page.goto('/');
    
    // Log all console messages
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

    await page.waitForTimeout(5000);

    const debugInfo = await page.evaluate(() => {
        if (!window.game) return 'window.game is undefined';
        return {
            type: typeof window.game,
            constructor: window.game.constructor.name,
            keys: Object.keys(window.game),
            ui: {
                type: typeof window.game.ui,
                keys: window.game.ui ? Object.keys(window.game.ui) : [],
                hasViews: window.game.ui ? !!window.game.ui.views : false
            },
            invaders: typeof window.game.invaders,
            player: typeof window.game.player,
            state: window.game.state
        };
    });

    console.log('DEBUG INFO:', JSON.stringify(debugInfo, null, 2));
});
