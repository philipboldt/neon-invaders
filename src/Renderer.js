import { COLORS, CONSTANTS } from './constants.js';
import { drawRect, darkenColor } from './utils.js';

export class Renderer {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
  }

  draw() {
    this.ctx.save();
    if (this.game.shake > 0) {
      this.ctx.translate((Math.random() - 0.5) * this.game.shake * 2, (Math.random() - 0.5) * this.game.shake * 2);
    }
    
    this.ctx.fillStyle = '#0d0d14';
    this.ctx.fillRect(0, 0, this.game.W, this.game.H);
    this.game.starfield.draw(this.ctx);

    this.game.invaders.forEach((inv) => {
      const ratio = inv.maxHp > 1 ? 0.45 + 0.55 * (inv.hp / inv.maxHp) : 1;
      if (!inv.isBoss && ratio >= 1) {
        const sprite = this.game.sprites.get(`inv_${inv.color}`);
        if (sprite) this.ctx.drawImage(sprite, inv.x - 20, inv.y - 20);
      } else {
        const color = ratio >= 1 ? inv.color : darkenColor(inv.color, ratio);
        drawRect(this.ctx, inv.x, inv.y, inv.w, inv.h, color, true);
      }
      if (this.game.debugMode) {
        this.ctx.fillStyle = '#ffffff'; this.ctx.font = 'bold 14px Orbitron'; this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
        this.ctx.fillText(inv.hp + '/' + inv.maxHp, inv.x + inv.w / 2, inv.y + inv.h / 2);
      }
    });

    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = COLORS.bullet; this.ctx.shadowColor = COLORS.bullet;
    this.game.bullets.forEach(b => this.ctx.fillRect(b.x, b.y, 4, 12));
    
    this.ctx.fillStyle = COLORS.invader1; this.ctx.shadowColor = COLORS.invader1;
    this.game.invaderBullets.forEach(b => this.ctx.fillRect(b.x, b.y, 6, 10));
    
    this.ctx.shadowBlur = 12;
    this.ctx.fillStyle = '#ff0844'; this.ctx.shadowColor = '#ff0844';
    this.game.bossMissiles.forEach(m => {
      this.ctx.save(); this.ctx.translate(m.x + m.w / 2, m.y + m.h / 2); this.ctx.rotate(m.angle - Math.PI / 2);
      this.ctx.fillRect(-m.w / 2, -m.h / 2, m.w, m.h); this.ctx.restore();
    });
    this.ctx.shadowBlur = 0;

    const neonRed = '#ff0844';
    this.game.rockets.forEach(r => {
      let bestInv = null; let bestD = Infinity;
      for (const inv of this.game.invaders) {
        const d = (inv.x + inv.w / 2 - r.targetX) ** 2 + (inv.y + inv.h / 2 - r.targetY) ** 2;
        if (d < bestD) { bestD = d; bestInv = inv; }
      }
      if (bestInv) {
        this.ctx.strokeStyle = neonRed; this.ctx.shadowColor = neonRed; this.ctx.shadowBlur = 18; this.ctx.lineWidth = 3;
        this.ctx.strokeRect(Math.floor(bestInv.x), Math.floor(bestInv.y), Math.floor(bestInv.w), Math.floor(bestInv.h));
        this.ctx.shadowBlur = 0;
      }
    });

    this.game.rockets.forEach(r => {
      this.ctx.save(); this.ctx.translate(r.x + CONSTANTS.ROCKET_W / 2, r.y + CONSTANTS.ROCKET_H / 2); this.ctx.rotate(Math.atan2(r.vy, r.vx));
      this.ctx.translate(-CONSTANTS.ROCKET_W / 2, -CONSTANTS.ROCKET_H / 2);
      this.ctx.fillStyle = COLORS.rocket; this.ctx.shadowColor = COLORS.rocket; this.ctx.shadowBlur = 15;
      this.ctx.fillRect(0, 0, CONSTANTS.ROCKET_W, CONSTANTS.ROCKET_H); this.ctx.restore();
    });

    this.game.upgrades.forEach(u => {
      const sprite = this.game.sprites.get(`upg_${u.type}`);
      if (sprite) {
        this.ctx.drawImage(sprite, u.x - 20, u.y - 20);
        if (u.type === 'points') {
          this.ctx.fillStyle = '#000000'; this.ctx.font = 'bold 10px Orbitron'; this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
          const amount = u.level * 100;
          this.ctx.fillText(amount >= 1000 ? (amount / 1000).toFixed(1) + 'k' : amount, u.x + u.w / 2, u.y + u.h / 2 + 1);
        }
      }
    });

    if (this.game.activeLightning) {
      const age = performance.now() - this.game.activeLightning.startTime;
      const t = age / CONSTANTS.LIGHTNING_DURATION_MS;
      const rx = this.game.player.x + this.game.player.w + this.game.player.podGap + this.game.player.podW / 2;
      const ry = this.game.player.y + this.game.player.h / 2;
      const tx = this.game.activeLightning.target.hp > 0 ? this.game.activeLightning.target.x + this.game.activeLightning.target.w / 2 : this.game.activeLightning.points[this.game.activeLightning.points.length-1].x;
      const ty = this.game.activeLightning.target.hp > 0 ? this.game.activeLightning.target.y + this.game.activeLightning.target.h / 2 : this.game.activeLightning.points[this.game.activeLightning.points.length-1].y;

      this.ctx.save(); this.ctx.beginPath(); this.ctx.moveTo(rx, ry);
      for (let i = 1; i < this.game.activeLightning.points.length - 1; i++) {
        const segT = i / (this.game.activeLightning.points.length - 1);
        const curX = rx + (tx - rx) * segT;
        const curY = ry + (ty - ry) * segT;
        const origBaseX = this.game.activeLightning.points[0].x + (this.game.activeLightning.points[this.game.activeLightning.points.length-1].x - this.game.activeLightning.points[0].x) * segT;
        const origBaseY = this.game.activeLightning.points[0].y + (this.game.activeLightning.points[this.game.activeLightning.points.length-1].y - this.game.activeLightning.points[0].y) * segT;
        this.ctx.lineTo(curX + (this.game.activeLightning.points[i].x - origBaseX), curY + (this.game.activeLightning.points[i].y - origBaseY));
      }
      this.ctx.lineTo(tx, ty);
      const color = t < 0.25 ? CONSTANTS.LIGHTNING_COLOR_START : t < 0.50 ? CONSTANTS.LIGHTNING_COLOR_END : t < 0.75 ? '#ffffff' : t < 0.90 ? CONSTANTS.LIGHTNING_COLOR_END : CONSTANTS.LIGHTNING_COLOR_START;
      const bw = t < 0.5 ? 12 : 24 * (1 - t);
      this.ctx.strokeStyle = '#000000'; this.ctx.lineWidth = bw + 4; this.ctx.lineJoin = 'round'; this.ctx.lineCap = 'round'; this.ctx.stroke();
      this.ctx.strokeStyle = color; this.ctx.lineWidth = bw; this.ctx.shadowBlur = 15; this.ctx.shadowColor = CONSTANTS.LIGHTNING_GLOW; this.ctx.stroke();
      this.ctx.restore();
    }

    if (this.game.activePDCTracer) {
      this.ctx.save(); this.ctx.beginPath(); this.ctx.moveTo(this.game.activePDCTracer.startX, this.game.activePDCTracer.startY);
      const tx = this.game.activePDCTracer.target && this.game.activePDCTracer.target.x !== undefined ? this.game.activePDCTracer.target.x + this.game.activePDCTracer.target.w / 2 : this.game.activePDCTracer.startX;
      const ty = this.game.activePDCTracer.target && this.game.activePDCTracer.target.y !== undefined ? this.game.activePDCTracer.target.y + this.game.activePDCTracer.target.h / 2 : this.game.activePDCTracer.startY;
      this.ctx.lineTo(tx, ty); this.ctx.strokeStyle = '#ffffff'; this.ctx.lineWidth = 2; this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#ffffff'; this.ctx.stroke();
      this.ctx.restore();
    }

    this.game.player.draw(this.ctx, this.game.shieldHits);
    this.game.ui.drawHUD(this.ctx, this.game);
    this.game.particles.draw(this.ctx);

    if (this.game.debugMode) {
      this.ctx.font = 'bold 56px Orbitron'; this.ctx.fillStyle = '#ff0844'; this.ctx.shadowColor = '#ff0844'; this.ctx.shadowBlur = 20;
      this.ctx.textAlign = 'center'; this.ctx.fillText('DEBUG MODE', this.game.W / 2, 72);
    }
    this.ctx.restore();
  }
}
