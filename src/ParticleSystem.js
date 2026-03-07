import { COLORS, CONSTANTS } from './constants.js';

export class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.maxParticles = CONSTANTS.MAX_PARTICLES;
    this.pool = [];
    this.activeIndices = []; 
    this.freeIndices = [];   
    
    for (let i = 0; i < this.maxParticles; i++) {
      const g = new PIXI.Graphics();
      g.visible = false;
      this.game.effectLayer.addChild(g);
      
      this.pool.push({
        active: false,
        x: 0, y: 0, vx: 0, vy: 0,
        size: 0, maxSize: 0, life: 0, maxLife: 0, color: '#fff',
        text: null, isText: false, isLightning: false,
        pixiObj: g,
        pixiText: null
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
    p.vy = CONSTANTS.SCORE_TEXT_SPEED;
    p.size = 16;
    p.maxSize = 32;
    p.life = 0;
    p.maxLife = CONSTANTS.SCORE_TEXT_LIFE;
    p.color = COLORS.textYellow;
    p.text = `+${amount}`;
    p.isText = true;
    p.isLightning = false;

    if (!p.pixiText) {
      p.pixiText = new PIXI.Text('', {
        fontFamily: 'Orbitron',
        fontSize: 20,
        fontWeight: 'bold',
        fill: COLORS.textYellow,
        align: 'center',
        stroke: 0x000000,
        strokeThickness: 3
      });
      p.pixiText.anchor.set(0.5);
      this.game.effectLayer.addChild(p.pixiText);
    }
    p.pixiText.text = p.text;
    p.pixiText.style.fill = COLORS.textYellow;
    p.pixiText.visible = true;
    p.pixiObj.visible = false;

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
    p.vy = 0;
    p.size = 20;
    p.maxSize = 64;
    p.life = 0;
    p.maxLife = CONSTANTS.DAMAGE_TEXT_LIFE;
    p.color = COLORS.textRed;
    p.text = `-${amount}`;
    p.isText = true;
    p.isLightning = false;

    if (!p.pixiText) {
      p.pixiText = new PIXI.Text('', {
        fontFamily: 'Orbitron',
        fontSize: 20,
        fontWeight: 'bold',
        fill: COLORS.textRed,
        align: 'center',
        stroke: 0x000000,
        strokeThickness: 3
      });
      p.pixiText.anchor.set(0.5);
      this.game.effectLayer.addChild(p.pixiText);
    }
    p.pixiText.text = p.text;
    p.pixiText.style.fill = COLORS.textRed;
    p.pixiText.visible = true;
    p.pixiObj.visible = false;

    this.activeIndices.push(idx);
  }

  spawnExplosion(cx, cy, color, angleStart = 0, angleRange = Math.PI * 2, radius = 0) {
    const particleCount = radius > 0 ? CONSTANTS.EXPLOSION_PARTICLES * 3 : CONSTANTS.EXPLOSION_PARTICLES;
    const tint = this.parseColor(color);
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
      
      p.pixiObj.clear();
      p.pixiObj.beginFill(0xFFFFFF);
      p.pixiObj.drawRect(-maxSize/2, -maxSize/2, maxSize, maxSize);
      p.pixiObj.endFill();
      p.pixiObj.tint = tint;
      p.pixiObj.visible = true;
      if (p.pixiText) p.pixiText.visible = false;

      this.activeIndices.push(idx);
    }
  }

  spawnStunningExplosion(cx, cy, color) {
    const layers = [
      { count: 128, speed: 45, life: 100, size: 50, color: '#ffffff' },
      { count: 256, speed: 25, life: 150, size: 35, color: color },
      { count: 256, speed: 12, life: 200, size: 20, color: color },
    ];

    layers.forEach(layer => {
      const tint = this.parseColor(layer.color);
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
        
        p.pixiObj.clear();
        p.pixiObj.beginFill(0xFFFFFF);
        p.pixiObj.drawRect(-maxSize/2, -maxSize/2, maxSize, maxSize);
        p.pixiObj.endFill();
        p.pixiObj.tint = tint;
        p.pixiObj.visible = true;
        if (p.pixiText) p.pixiText.visible = false;

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
    
    p.pixiObj.clear();
    p.pixiObj.beginFill(0xFFFFFF);
    p.pixiObj.drawRect(-p.maxSize/2, -p.maxSize/2, p.maxSize, p.maxSize);
    p.pixiObj.endFill();
    p.pixiObj.tint = this.parseColor(COLORS.rocket);
    p.pixiObj.visible = true;
    if (p.pixiText) p.pixiText.visible = false;

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
      p.isLightning = true;

      p.pixiObj.clear();
      p.pixiObj.beginFill(0xFFFFFF);
      p.pixiObj.drawRect(-p.maxSize/2, -p.maxSize/2, p.maxSize, p.maxSize);
      p.pixiObj.endFill();
      p.pixiObj.tint = 0x555555;
      p.pixiObj.visible = true;
      if (p.pixiText) p.pixiText.visible = false;

      this.activeIndices.push(idx);
    }
  }

  parseColor(hex) {
    return parseInt(hex.replace('#', '0x'));
  }

  update() {
    for (let i = this.activeIndices.length - 1; i >= 0; i--) {
      const idx = this.activeIndices[i];
      const p = this.pool[idx];
      
      p.x += p.vx;
      // Scale vertical movement by height factor
      p.y += p.vy * this.game.heightFactor;
      p.life++;
      const t = p.life / p.maxLife;
      
      if (p.isText) {
        p.pixiText.position.set(p.x, p.y);
        p.pixiText.alpha = 1 - t;
        const fontSize = p.size + (Math.max(0, p.maxSize - p.size)) * t;
        p.pixiText.style.fontSize = Math.floor(fontSize);
      } else {
        p.pixiObj.position.set(p.x, p.y);
        p.pixiObj.alpha = 1 - t;
        p.pixiObj.scale.set(1 - t);
        
        if (p.isLightning) {
          const colorHex = t < 0.25 ? 0x555555 : 
                           t < 0.50 ? 0x00f5ff : 
                           t < 0.75 ? 0xffffff : 
                           t < 0.90 ? 0x00f5ff : 0x555555;
          p.pixiObj.tint = colorHex;
        }
      }
      
      if (p.life >= p.maxLife) {
        p.active = false;
        if (p.pixiObj) p.pixiObj.visible = false;
        if (p.pixiText) p.pixiText.visible = false;
        this.freeIndices.push(idx);
        this.activeIndices[i] = this.activeIndices[this.activeIndices.length - 1];
        this.activeIndices.pop();
      }
    }
  }

  draw(ctx) {
    // Legacy draw, no longer needed
  }
}
