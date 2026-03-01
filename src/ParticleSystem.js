import { COLORS, CONSTANTS } from './constants.js';

export class ParticleSystem {
  constructor() {
    this.maxParticles = 1024;
    this.pool = [];
    this.activeIndices = []; // Keep track of active particles for faster iteration
    this.freeIndices = [];   // Stack of free indices
    
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool.push({
        active: false,
        x: 0, y: 0, vx: 0, vy: 0,
        size: 0, maxSize: 0, life: 0, maxLife: 0, color: '#fff'
      });
      this.freeIndices.push(i);
    }
  }

  getFreeParticleIndex() {
    return this.freeIndices.pop();
  }

  spawnExplosion(cx, cy, color, angleStart = 0, angleRange = Math.PI * 2, radius = 0) {
    const particleCount = radius > 0 ? CONSTANTS.EXPLOSION_PARTICLES * 3 : CONSTANTS.EXPLOSION_PARTICLES;
    for (let n = 0; n < particleCount; n++) {
      if (this.freeIndices.length === 0) break;
      
      const idx = this.freeIndices.pop();
      const p = this.pool[idx];

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
      
      this.activeIndices.push(idx);
    }
  }

  spawnStunningExplosion(cx, cy, color) {
    // A more elaborate, layered explosion for bosses
    const layers = [
      { count: 64, speed: 8, life: 60, size: 6, color: '#ffffff' }, // Core flash
      { count: 128, speed: 4, life: 90, size: 4, color: color },    // Main burst
      { count: 128, speed: 2, life: 120, size: 3, color: color },   // Slow lingering embers
    ];

    layers.forEach(layer => {
      for (let n = 0; n < layer.count; n++) {
        if (this.freeIndices.length === 0) break;
        
        const idx = this.freeIndices.pop();
        const p = this.pool[idx];

        const angle = Math.random() * Math.PI * 2;
        const speed = layer.speed * (0.5 + Math.random() * 0.5);
        const maxSize = layer.size * (0.5 + Math.random() * 1);
        
        p.active = true;
        p.x = cx; p.y = cy; 
        p.vx = Math.cos(angle) * speed; 
        p.vy = Math.sin(angle) * speed;
        p.size = maxSize; p.maxSize = maxSize; 
        p.life = 0; p.maxLife = layer.life * (0.8 + Math.random() * 0.4); 
        p.color = layer.color;
        
        this.activeIndices.push(idx);
      }
    });
  }

  spawnRocketTrail(cx, cy, vx, vy) {
    if (this.freeIndices.length === 0) return;

    const idx = this.freeIndices.pop();
    const p = this.pool[idx];

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
    
    this.activeIndices.push(idx);
  }

  update() {
    for (let i = this.activeIndices.length - 1; i >= 0; i--) {
      const idx = this.activeIndices[i];
      const p = this.pool[idx];
      
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      
      if (p.life >= p.maxLife) {
        p.active = false;
        this.freeIndices.push(idx);
        // Faster remove from active array
        this.activeIndices[i] = this.activeIndices[this.activeIndices.length - 1];
        this.activeIndices.pop();
      }
    }
  }

  draw(ctx) {
    if (this.activeIndices.length === 0) return;

    // Group by color to minimize state changes
    const byColor = {};
    for (let i = 0; i < this.activeIndices.length; i++) {
      const p = this.pool[this.activeIndices[i]];
      if (!byColor[p.color]) byColor[p.color] = [];
      byColor[p.color].push(p);
    }

    ctx.shadowBlur = 8;
    for (const color in byColor) {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      const particles = byColor[color];
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const t = p.life / p.maxLife;
        const size = p.maxSize * (1 - t);
        if (size > 0) {
          ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
        }
      }
    }
    ctx.shadowBlur = 0;
  }
}
