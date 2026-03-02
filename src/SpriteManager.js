export class SpriteManager {
  constructor() {
    this.sprites = {};
  }

  preRender(key, w, h, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = w + 40; // Extra space for glow
    canvas.height = h + 40;
    const ctx = canvas.getContext('2d');
    ctx.translate(20, 20); // Center the drawing
    drawFn(ctx);
    this.sprites[key] = canvas;
  }

  get(key) {
    return this.sprites[key];
  }
}
