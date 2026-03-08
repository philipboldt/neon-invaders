import { CONSTANTS } from './constants.js';

export class SpriteManager {
  constructor(app) {
    this.app = app;
    this.textures = {};
    this.sprites = {}; // Legacy support for Canvas
  }

  preRender(key, w, h, drawFn) {
    // 1. Create a PIXI.Graphics object to draw the sprite
    const graphics = new PIXI.Graphics();
    
    // We create a temporary canvas/context to reuse the existing drawFn logic
    // Pixi can't directly use 2D canvas draw functions, so we shim it
    const canvas = document.createElement('canvas');
    canvas.width = w + CONSTANTS.SPRITE_PADDING;
    canvas.height = h + CONSTANTS.SPRITE_PADDING;
    const ctx = canvas.getContext('2d');
    ctx.translate(CONSTANTS.SPRITE_TRANSLATE, CONSTANTS.SPRITE_TRANSLATE);
    drawFn(ctx);

    // 2. Generate PIXI.Texture from the canvas
    const texture = PIXI.Texture.from(canvas);
    this.textures[key] = texture;
    this.sprites[key] = canvas; // Keep legacy canvas for progressive migration
  }

  getTexture(key) {
    return this.textures[key];
  }

  get(key) {
    return this.sprites[key];
  }
}
