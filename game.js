if (window.location.protocol === 'file:') {
  alert('Neon Invaders uses ES Modules and requires a local web server to run. Please use "npm run report" or another server to view the game locally.');
}

import { Game } from './src/Game.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Initialize Game
window.game = new Game(canvas, ctx);
