import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
  page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));

  console.log('Navigating to game...');
  await page.goto('http://localhost:3001');

  // Diagnostic 1: Check WebGL support
  const webglStatus = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return {
      supported: !!gl,
      vendor: gl ? gl.getParameter(gl.VENDOR) : 'N/A',
      renderer: gl ? gl.getParameter(gl.RENDERER) : 'N/A'
    };
  });
  console.log('WebGL Status:', webglStatus);

  // Diagnostic 2: Check Canvas element
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    if (!canvas) return 'Canvas #game not found';
    return {
      id: canvas.id,
      width: canvas.width,
      height: canvas.height,
      offsetWidth: canvas.offsetWidth,
      offsetHeight: canvas.offsetHeight,
      visibility: window.getComputedStyle(canvas).visibility
    };
  });
  console.log('Canvas Info:', canvasInfo);

  // Diagnostic 3: Check Font status
  const fontStatus = await page.evaluate(async () => {
    return document.fonts.status;
  });
  console.log('Font Status:', fontStatus);

  // Wait a bit for the font-promise to trigger
  await page.waitForTimeout(2000);

  // Check if window.game exists
  const gameInitialized = await page.evaluate(() => !!window.game);
  console.log('Game Initialized:', gameInitialized);

  await browser.close();
})();
