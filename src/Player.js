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
    
    // Sidepods
    this.podW = 20;
    this.podH = 12;
    this.podGap = 10;
    this.pods = {
      left: { active: true, hp: 3, maxHp: 3 },
      right: { active: true, hp: 3, maxHp: 3 }
    };
  }

  reset() {
    this.x = this.W / 2 - this.w / 2;
    this.y = this.H - 60;
    this.dir = 0;
    this.pods.left = { active: true, hp: 3, maxHp: 3 };
    this.pods.right = { active: true, hp: 3, maxHp: 3 };
  }

  update() {
    this.x += this.dir * this.speed;
    
    // Movement constraints based on active sidepods
    const leftLimit = this.pods.left.active ? this.podW + this.podGap : 0;
    const rightLimit = this.pods.right.active ? this.podW + this.podGap : 0;
    
    this.x = Math.max(leftLimit, Math.min(this.W - this.w - rightLimit, this.x));
  }

  draw(ctx, shieldHits) {
    if (shieldHits > 0) {
      ctx.strokeStyle = COLORS.shield;
      ctx.shadowColor = COLORS.shield;
      ctx.shadowBlur = 20;
      ctx.lineWidth = 3;
      // Wrap main ship and active pods in shield
      let sX = this.x - 4;
      let sW = this.w + 8;
      if (this.pods.left.active) { sX -= (this.podW + this.podGap); sW += (this.podW + this.podGap); }
      if (this.pods.right.active) { sW += (this.podW + this.podGap); }
      
      ctx.strokeRect(sX, this.y - 4, sW, this.h + 8);
      ctx.shadowBlur = 0;
    }

    // Draw Sidepods
    const podY = this.y + (this.h - this.podH) / 2;
    if (this.pods.left.active) {
      const lx = this.x - this.podGap - this.podW;
      const ratio = this.pods.left.hp / this.pods.left.maxHp;
      const color = ratio >= 1 ? COLORS.player : this.darken(COLORS.player, 0.45 + 0.55 * ratio);
      drawRect(ctx, lx, podY, this.podW, this.podH, color, true);
    }
    if (this.pods.right.active) {
      const rx = this.x + this.w + this.podGap;
      const ratio = this.pods.right.hp / this.pods.right.maxHp;
      const color = ratio >= 1 ? COLORS.player : this.darken(COLORS.player, 0.45 + 0.55 * ratio);
      drawRect(ctx, rx, podY, this.podW, this.podH, color, true);
    }

    drawRect(ctx, this.x, this.y, this.w, this.h, COLORS.player, true);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(this.x + 8, this.y + 4, 8, 8);
    ctx.fillRect(this.x + this.w - 16, this.y + 4, 8, 8);
  }

  // Helper for darkening pod color when damaged
  darken(hex, ratio) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * ratio)}, ${Math.floor(g * ratio)}, ${Math.floor(b * ratio)})`;
  }
}
