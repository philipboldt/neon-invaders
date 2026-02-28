import { COLORS, CONSTANTS } from './constants.js';

export class ParticleSystem {
  constructor() {
    this.maxParticles = 1024;
    this.pool = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool.push({
        active: false,
        x: 0, y: 0, vx: 0, vy: 0,
        size: 0, maxSize: 0, life: 0, maxLife: 0, color: '#fff'
      });
    }
  }

  getFreeParticle() {
    return this.pool.find(p => !p.active);
  }

  spawnExplosion(cx, cy, color, angleStart = 0, angleRange = Math.PI * 2, radius = 0) {
    const particleCount = radius > 0 ? CONSTANTS.EXPLOSION_PARTICLES * 3 : CONSTANTS.EXPLOSION_PARTICLES;
    for (let n = 0; n < particleCount; n++) {
      const p = this.getFreeParticle();
      if (!p) break;

      const angle = angleStart + (angleRange * n) / particleCount + (Math.random() - 0.5) * (angleRange / particleCount);
      const speedBase = radius > 0 ? radius * 0.15 : CONSTANTS.PARTICLE_SPEED;
      const speed = speedBase * (0.6 + Math.random() * 0.8);
      const sizeBase = radius > 0 ? CONSTANTS.PARTICLE_MAX_SIZE * 2 : CONSTANTS.PARTICLE_MAX_SIZE;
      const maxSize = sizeBase * (0.4 + Math.random() * 0.6);
      const lifeBase = radius > 0 ? CONSTANTS.PARTICLE_LIFE * 1.5 : CONSTANTS.PARTICLE_LIFE;
      
      p.active = true;
      p.x = cx; p.y = cy; 
      p.vx = Math.cos(angle) * speed; 
      p.vy = Math.sin(angle) * speed;
      p.size = maxSize; p.maxSize = maxSize; 
      p.life = 0; p.maxLife = lifeBase; 
      p.color = color;
    }
  }

  spawnRocketTrail(cx, cy, vx, vy) {
    const p = this.getFreeParticle();
    if (!p) return;

    const speed = Math.sqrt(vx * vx + vy * vy) || 1;
    const backX = (-vx / speed) * CONSTANTS.ROCKET_TRAIL_DRAG * speed;
    const backY = (-vy / speed) * CONSTANTS.ROCKET_TRAIL_DRAG * speed;
    
    p.active = true;
    p.x = cx; p.y = cy;
    p.vx = backX + (Math.random() - 0.5) * 1.5;
    p.vy = backY + (Math.random() - 0.5) * 1.5;
    p.size = CONSTANTS.ROCKET_TRAIL_SIZE;
    p.maxSize = CONSTANTS.ROCKET_TRAIL_SIZE * (0.6 + Math.random() * 0.4);
    p.life = 0;
    p.maxLife = CONSTANTS.ROCKET_TRAIL_LIFE;
    p.color = COLORS.rocket;
  }

  update() {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      if (p.life >= p.maxLife) {
        p.active = false;
      }
    }
  }

  draw(ctx) {
    ctx.shadowBlur = 8;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      const t = p.life / p.maxLife;
      const size = Math.max(0, p.maxSize * (1 - t));
      if (size <= 0) continue;
      
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.shadowBlur = 0;
  }
}
