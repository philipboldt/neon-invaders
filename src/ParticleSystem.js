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

  get hasActiveParticles() {
    return this.activeIndices.length > 0;
  }

  getFreeParticleIndex() {
    return this.freeIndices.pop();
  }

  reset() {
    for (let i = this.activeIndices.length - 1; i >= 0; i--) {
      const idx = this.activeIndices[i];
      const p = this.pool[idx];
      p.active = false;
      if (p.pixiObj) p.pixiObj.visible = false;
      if (p.pixiText) p.pixiText.visible = false;
      this.freeIndices.push(idx);
    }
    this.activeIndices = [];
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
    p.size = CONSTANTS.PARTICLE_SCORE_TEXT_SIZE;
    p.maxSize = CONSTANTS.PARTICLE_SCORE_TEXT_MAX_SIZE;
    p.life = 0;
    p.maxLife = CONSTANTS.SCORE_TEXT_LIFE;
    p.color = COLORS.textYellow;
    p.text = `+${amount}`;
    p.isText = true;
    p.isLightning = false;

    if (!p.pixiText) {
      p.pixiText = new PIXI.Text('', {
        fontFamily: 'Orbitron',
        fontSize: CONSTANTS.FONT_SIZE_HUD,
        fontWeight: 'bold',
        fill: COLORS.textYellow,
        align: 'center',
        stroke: 0x000000,
        strokeThickness: CONSTANTS.PARTICLE_TEXT_STROKE_THICKNESS
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
    p.size = CONSTANTS.PARTICLE_DAMAGE_TEXT_SIZE;
    p.maxSize = CONSTANTS.PARTICLE_DAMAGE_TEXT_MAX_SIZE;
    p.life = 0;
    p.maxLife = CONSTANTS.DAMAGE_TEXT_LIFE;
    p.color = COLORS.textRed;
    p.text = `-${amount}`;
    p.isText = true;
    p.isLightning = false;

    if (!p.pixiText) {
      p.pixiText = new PIXI.Text('', {
        fontFamily: 'Orbitron',
        fontSize: CONSTANTS.FONT_SIZE_HUD,
        fontWeight: 'bold',
        fill: COLORS.textRed,
        align: 'center',
        stroke: 0x000000,
        strokeThickness: CONSTANTS.PARTICLE_TEXT_STROKE_THICKNESS
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
    const particleCount = radius > 0 ? CONSTANTS.EXPLOSION_PARTICLES * CONSTANTS.PARTICLE_EXPLOSION_LARGE_MULT : CONSTANTS.EXPLOSION_PARTICLES;
    const tint = this.parseColor(color);
    for (let n = 0; n < particleCount; n++) {
      if (this.freeIndices.length === 0) break;
      
      const idx = this.freeIndices.pop();
      const p = this.pool[idx];

      const angle = angleStart + (angleRange * n) / particleCount + (Math.random() - 0.5) * (angleRange / particleCount);
      const speedBase = radius > 0 ? radius * CONSTANTS.PARTICLE_EXPLOSION_SPEED_BASE_RATIO : CONSTANTS.PARTICLE_SPEED;
      const speed = speedBase * (CONSTANTS.PARTICLE_EXPLOSION_SPEED_RAND_MIN + Math.random() * CONSTANTS.PARTICLE_EXPLOSION_SPEED_RAND_RANGE);
      const sizeBase = radius > 0 ? CONSTANTS.PARTICLE_MAX_SIZE * 2 : CONSTANTS.PARTICLE_MAX_SIZE;
      const maxSize = sizeBase * (CONSTANTS.PARTICLE_EXPLOSION_SIZE_RAND_MIN + Math.random() * CONSTANTS.PARTICLE_EXPLOSION_SIZE_RAND_RANGE);
      const lifeBase = radius > 0 ? CONSTANTS.PARTICLE_LIFE * CONSTANTS.PARTICLE_EXPLOSION_LIFE_LARGE_MULT : CONSTANTS.PARTICLE_LIFE;
      
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
    CONSTANTS.PARTICLE_STUN_LAYERS.forEach(layer => {
      // Handle potential color reference string
      const layerColor = (layer.color === 'boss' || layer.color === 'player') ? COLORS[layer.color] : layer.color;
      const tint = this.parseColor(layerColor);
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
        p.color = layerColor;
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
    const count = CONSTANTS.PARTICLE_LIGHTNING_HIT_COUNT;
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
      p.size = CONSTANTS.PARTICLE_LIGHTNING_HIT_SIZE_BASE + Math.random() * CONSTANTS.PARTICLE_LIGHTNING_HIT_SIZE_RAND;
      p.maxSize = p.size;
      p.life = 0;
      p.maxLife = CONSTANTS.PARTICLE_LIGHTNING_LIFE_BASE + Math.random() * CONSTANTS.PARTICLE_LIGHTNING_LIFE_RAND;
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

  parseColor(color) {
    if (typeof color === 'number') return color;
    return parseInt(color.replace('#', '0x'));
  }

  update(dt = 1) {
    for (let i = this.activeIndices.length - 1; i >= 0; i--) {
      const idx = this.activeIndices[i];
      const p = this.pool[idx];
      
      p.x += p.vx * dt;
      // Scale vertical movement by height factor
      p.y += p.vy * this.game.heightFactor * dt;
      p.life += 1 * dt;
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
}
