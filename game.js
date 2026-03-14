import { Game } from './src/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  if (window.location.protocol === 'file:') {
    alert('Neon Nuke uses ES Modules and requires a local web server to run. Please use "npm run report" or another server to view the game locally.');
  }

  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Wait for fonts to load before initializing the game
  document.fonts.ready.then(() => {
    // Adding a small additional delay because document.fonts.ready sometimes 
    // fires just before the font is actually usable by PixiJS/Canvas.
    setTimeout(() => {
      window.game = new Game(canvas);
    }, 500);
  });
});
