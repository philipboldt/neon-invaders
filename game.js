import { Game } from './src/Game.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Initialize Game
window.game = new Game(canvas, ctx);
