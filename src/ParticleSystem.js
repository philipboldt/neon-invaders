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
        size: 0, maxSize: 0, life: 0, maxLife: 0, color: '#fff',
        text: null, isText: false, isLightning: false
      });
      this.freeIndices.push(i);
    }
  }

  getFreeParticleIndex() {
    return this.freeIndices.pop();
  }

  get hasActiveParticles() {
    return this.activeIndices.length > 0;
  }

  spawnScoreText(x, y, amount) {
    if (this.freeIndices.length === 0) return;

    const idx = this.freeIndices.pop();
    const p = this.pool[idx];

    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = -3.5; // Increased vertical speed (was -1.5)
    p.size = 16;  // Start font size
    p.maxSize = 32; // End font size
    p.life = 0;
    p.maxLife = 45; // ~0.75s at 60fps
    p.color = '#ffff00'; // Neon yellow
    p.text = `+${amount}`;
    p.isText = true;
    p.isLightning = false;

    this.activeIndices.push(idx);
  }

  spawnDamageText(x, y, amount) {
    if (this.freeIndices.length === 0) return;

    const idx = this.freeIndices.pop();
    const p = this.pool[idx];

    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = 0; // Static position for better visibility
    p.size = 20;  // Larger start font size
    p.maxSize = 64; // Grow even bigger
    p.life = 0;
    p.maxLife = 40; // ~0.66s
    p.color = '#ff0844'; // Neon red
    p.text = `-${amount}`;
    p.isText = true;
    p.isLightning = false;

    this.activeIndices.push(idx);
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
      p.isText = false;
      p.text = null;
      p.isLightning = false;
      
      this.activeIndices.push(idx);
    }
  }

  spawnStunningExplosion(cx, cy, color) {
    // A screen-filling, massive explosion for bosses
    const layers = [
      { count: 128, speed: 45, life: 100, size: 50, color: '#ffffff' }, // Ultra-fast core flash
      { count: 256, speed: 25, life: 150, size: 35, color: color },    // Massive main burst
      { count: 256, speed: 12, life: 200, size: 20, color: color },    // Screen-covering embers
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
        p.isText = false;
        p.text = null;
        p.isLightning = false;
        
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
    p.isText = false;
    p.text = null;
    p.isLightning = false;
    
    this.activeIndices.push(idx);
  }

  spawnLightningHit(x, y) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      if (this.freeIndices.length === 0) break;

      const idx = this.freeIndices.pop();
      const p = this.pool[idx];

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;

      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 3 + Math.random() * 3;
      p.maxSize = p.size;
      p.life = 0;
      p.maxLife = 20 + Math.random() * 15;
      p.color = '#555555';
      p.isText = false;
      p.text = null;
      p.isLightning = true; // Special flag for color transition

      this.activeIndices.push(idx);
    }
  }

  update() {
    for (let i = this.activeIndices.length - 1; i >= 0; i--) {
      const idx = this.activeIndices[i];
      const p = this.pool[idx];
      
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      
      if (p.isLightning) {
        const t = p.life / p.maxLife;
        p.color = t < 0.3 ? '#555555' : t < 0.7 ? '#00f5ff' : '#ffffff';
      }
      
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

    const textParticles = [];
    const byColor = {};

    for (let i = 0; i < this.activeIndices.length; i++) {
      const p = this.pool[this.activeIndices[i]];
      if (p.isText) {
        textParticles.push(p);
      } else {
        if (!byColor[p.color]) byColor[p.color] = [];
        byColor[p.color].push(p);
      }
    }

    // Draw regular particles
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

    // Draw text particles (growing and fading)
    for (let i = 0; i < textParticles.length; i++) {
      const p = textParticles[i];
      const t = p.life / p.maxLife;
      const opacity = 1 - t;
      const fontSize = p.size + (p.maxSize - p.size) * t;
      
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = `bold ${Math.floor(fontSize)}px Orbitron`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw black border/stroke first
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(p.text, p.x, p.y);
      
      // Draw neon color on top
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 20;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }
    
    ctx.shadowBlur = 0;
  }
}
