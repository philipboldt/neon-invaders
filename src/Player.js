import { COLORS } from './constants.js';
import { drawRect } from './utils.js';

export class Player {
  constructor(W, H) {
    this.W = W;
    this.H = H;
    this.w = 40;
    this.h = 24;
    this.x = W / 2 - this.w / 2;
    this.y = H - 60;
    this.speed = 6;
    this.dir = 0;
  }

  reset() {
    this.x = this.W / 2 - this.w / 2;
    this.y = this.H - 60;
    this.dir = 0;
  }

  update() {
    this.x += this.dir * this.speed;
    this.x = Math.max(0, Math.min(this.W - this.w, this.x));
  }

  draw(ctx, shieldHits) {
    if (shieldHits > 0) {
      ctx.strokeStyle = COLORS.shield;
      ctx.shadowColor = COLORS.shield;
      ctx.shadowBlur = 20;
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x - 4, this.y - 4, this.w + 8, this.h + 8);
      ctx.shadowBlur = 0;
    }
    drawRect(ctx, this.x, this.y, this.w, this.h, COLORS.player, true);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(this.x + 8, this.y + 4, 8, 8);
    ctx.fillRect(this.x + this.w - 16, this.y + 4, 8, 8);
  }
}
