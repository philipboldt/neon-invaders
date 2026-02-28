import { Game } from './src/Game.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Initialize Game
new Game(canvas, ctx);
