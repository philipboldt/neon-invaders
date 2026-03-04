import { COLORS, CONSTANTS } from './constants.js';
import { drawRect, darkenColor } from './utils.js';
import { SpriteManager } from './SpriteManager.js';
import { UIManager } from './UIManager.js';
import { ParticleSystem } from './ParticleSystem.js';
import { Player } from './Player.js';
import { Starfield } from './Starfield.js';
import { InputManager } from './InputManager.js';
import { WeaponManager } from './WeaponManager.js';

export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.W = canvas.width;
    this.H = canvas.height;

    this.ui = new UIManager();
    this.particles = new ParticleSystem();
    this.player = new Player(this.W, this.H);
    this.sprites = new SpriteManager();
    this.starfield = new Starfield(this.W, this.H);
    this.inputs = new InputManager(this);
    this.weapons = new WeaponManager(this);
    
    this.initSprites();
    this.resetState();
    this.inputs.bindInputs();
    
    console.log('Neon Invaders Initialized');
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }

  initSprites() {
    // Pre-render invaders
    [COLORS.invader1, COLORS.invader2, COLORS.invader3, '#ff0844'].forEach(color => {
      this.sprites.preRender(`inv_${color}`, CONSTANTS.INVADER_W, CONSTANTS.INVADER_H, (ctx) => {
        drawRect(ctx, 0, 0, CONSTANTS.INVADER_W, CONSTANTS.INVADER_H, color, true);
      });
    });

    // Pre-render upgrades
    CONSTANTS.UPGRADE_TYPES.forEach(type => {
      const color = COLORS[type] || COLORS.heal;
      const size = CONSTANTS.UPGRADE_W;
      const radius = size / 2;
      this.sprites.preRender(`upg_${type}`, size, size, (ctx) => {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(radius, radius, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  resetState() {
    this.gameRunning = false;
    this.isPaused = false;
    this.debugMode = false;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.shotCount = 1;
    this.playerDamage = 1;
    this.shieldHits = 0;
    this.hasShieldSystem = false;
    this.lastShieldLostTime = -1;
    this.rocketLevel = 0;
    this.lightningLevel = 1; 
    this.hasPierce = false;
    this.spacePressed = false;
    this.shake = 0;
    
    this.invaders = [];
    this.bullets = [];
    this.invaderBullets = [];
    this.bossMissiles = [];
    this.upgrades = [];
    this.rockets = [];
    this.activeLightning = null; 
    
    this.lastPlayerShot = 0;
    this.lastInvaderShoot = 0;
    this.lastBossShoot = 0;
    this.lastRocketTime = 0;
    this.lastLightningTime = 0;
    this.lastPDCTime = 0;
    this.activePDCTracer = null;
    this.pdcTarget = null; 
    this.invaderDir = 1;
    
    this.ui.updateStats(this);
    this.ui.setShootActive(false);
    this.player.reset();
  }

  startGame() {
    this.resetState();
    this.ui.hideScreens();
    this.initInvaders();
    this.gameRunning = true;
  }

  endGame(won) {
    this.gameRunning = false;
    this.spacePressed = false;
    this.ui.setShootActive(false);
    this.ui.updateHighScores(this.score);
    this.ui.showGameOver(won);
  }

  initInvaders() {
    this.invaders = [];
    let startX = 80;
    let startY = 80;
    const gap = 8;
    
    const isBossLevel = this.level % 10 === 0;
    const isMiniBossLevel = this.level % 10 === 5;
    
    const bossW = isBossLevel ? CONSTANTS.INVADER_W * 6 : (isMiniBossLevel ? CONSTANTS.INVADER_W * 4 : 0);
    const bossH = isBossLevel ? CONSTANTS.INVADER_H * 6 : (isMiniBossLevel ? CONSTANTS.INVADER_H * 4 : 0);

    const rows = Math.min(CONSTANTS.INVADER_ROWS + Math.floor(this.level / 2), 7);
    const cols = Math.min(CONSTANTS.INVADER_COLS + Math.floor(this.level / 3), 14);
    const block = Math.floor((this.level - 1) / 4);
    const p = (this.level - 1) % 4;
    const baseHp = 1 + block * 2;
    const higherHp = baseHp + 2;
    const rowsWithHigher = p * 2;
    const actualMaxHp = rowsWithHigher > 0 ? higherHp : baseHp;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const color =
          row === 0 ? COLORS.invader3 :
          row < Math.ceil(rows / 2) ? COLORS.invader1 : COLORS.invader2;
        const maxHp = row < rowsWithHigher ? higherHp : baseHp;
        const scoreValue = color === COLORS.invader3 ? 30 : color === COLORS.invader1 ? 20 : 10;
        this.invaders.push({
          x: startX + col * (CONSTANTS.INVADER_W + gap),
          y: startY + row * (CONSTANTS.INVADER_H + gap),
          w: CONSTANTS.INVADER_W,
          h: CONSTANTS.INVADER_H,
          color,
          maxHp,
          hp: maxHp,
          isBoss: false,
          scoreValue
        });
      }
    }
    this.invaderDir = 1;
    this.gridX = startX;
    this.gridW = cols * (CONSTANTS.INVADER_W + gap) - gap;
    
    if (isBossLevel || isMiniBossLevel) {
      const bossMaxHp = isBossLevel ? actualMaxHp * 250 : actualMaxHp * 125;
      const bossColor = isBossLevel ? '#ff0844' : COLORS.invader3; 
      const bX = startX + this.gridW / 2 - bossW / 2;
      const bY = startY - bossH - gap * 2;
      this.invaders.push({
        x: bX,
        y: bY,
        w: bossW,
        h: bossH,
        color: bossColor,
        maxHp: bossMaxHp,
        hp: bossMaxHp,
        isBoss: true,
        scoreValue: isBossLevel ? 500 : 250
      });
    }
  }

  invaderShoot(now) {
    const shootInterval = Math.max(350, CONSTANTS.INVADER_SHOOT_INTERVAL_BASE - this.level * 60);
    if (this.invaders.length === 0 || now - this.lastInvaderShoot < shootInterval) return;
    this.lastInvaderShoot = now;
    const idx = Math.floor(Math.random() * this.invaders.length);
    const inv = this.invaders[idx];
    if (inv.y + inv.h < 0) return;
    this.invaderBullets.push({
      x: inv.x + inv.w / 2 - 3,
      y: inv.y + inv.h,
      w: 6,
      h: 10,
    });
  }

  bossShoot(now) {
    if (now - this.lastBossShoot < 3000) return;
    const bosses = this.invaders.filter(inv => inv.isBoss);
    if (bosses.length === 0) return;
    
    this.lastBossShoot = now;
    bosses.forEach(boss => {
      if (boss.y + boss.h < 0) return;
      
      const startX = boss.x + boss.w / 2;
      const startY = boss.y + boss.h;
      
      const playerCx = this.player.x + this.player.w / 2;
      const playerCy = this.player.y + this.player.h / 2;
      
      const dx = playerCx - startX;
      const dy = playerCy - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const speed = 5; 
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;
      
      this.bossMissiles.push({
        x: startX - 4, 
        y: startY,
        w: 8,
        h: 16,
        vx,
        vy,
        angle: Math.atan2(vy, vx)
      });
    });
  }

  spawnUpgrade(x, y) {
    if (Math.random() >= CONSTANTS.DROP_CHANCE) return;

    const availableTypes = CONSTANTS.UPGRADE_TYPES.filter(type => {
      if (type === 'shield' && this.hasShieldSystem) return false;
      if (type === 'double' && this.shotCount >= 4 && this.playerDamage >= 5) return false;
      if (type === 'rocket' && this.rocketLevel >= 5) return false;
      if (type === 'pierce' && this.hasPierce) return false;
      if (type === 'heal' && this.lives >= 5) return false;
      return true;
    });

    if (availableTypes.length === 0) return;

    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    this.upgrades.push({
      x: x + CONSTANTS.INVADER_W / 2 - CONSTANTS.UPGRADE_W / 2,
      y: y,
      w: CONSTANTS.UPGRADE_W,
      h: CONSTANTS.UPGRADE_H,
      type,
      level: this.level 
    });
  }

  updateEntities(now) {
    if (this.shake > 0) {
      this.shake *= 0.9;
      if (this.shake < 0.1) this.shake = 0;
    }

    this.player.update();

    // Update Bullets
    this.bullets = this.bullets.filter(b => {
      b.y += CONSTANTS.BULLET_SPEED;
      return b.y > -20;
    });
    this.invaderBullets = this.invaderBullets.filter(b => {
      b.y += CONSTANTS.INVADER_BULLET_SPEED;
      return b.y < this.H + 20;
    });
    this.bossMissiles = this.bossMissiles.filter(m => {
      m.x += m.vx;
      m.y += m.vy;
      return m.y < this.H + 50 && m.x > -50 && m.x < this.W + 50;
    });

    // Update Invaders
    if (this.invaders.length > 0) {
      const speed = (40 + this.level * 5) / 60;
      let moveDown = false;
      const margin = 40;
      const moveX = this.invaderDir * speed;

      if (this.invaderDir > 0 && this.gridX + this.gridW + moveX >= this.W - margin) moveDown = true;
      if (this.invaderDir < 0 && this.gridX + moveX <= margin) moveDown = true;

      if (moveDown) {
        this.invaderDir *= -1;
        this.invaders.forEach(inv => (inv.y += 20));
      } else {
        this.gridX += moveX;
        this.invaders.forEach(inv => (inv.x += moveX));
      }
    }

    // Update Upgrades
    this.upgrades = this.upgrades.filter(u => {
      u.y += CONSTANTS.UPGRADE_FALL_SPEED;
      if (u.y > this.H) return false;
      
      let collected = false;
      if (u.x + u.w > this.player.x && u.x < this.player.x + this.player.w && u.y + u.h > this.player.y && u.y < this.player.y + this.player.h) {
        collected = true;
      }
      
      if (!collected) {
        const podY = this.player.y + (this.player.h - this.player.podH) / 2;
        if (this.player.pods.left.active) {
          const lx = this.player.x - this.player.podGap - this.player.podW;
          if (u.x + u.w > lx && u.x < lx + this.player.podW && u.y + u.h > podY && u.y < podY + this.player.podH) collected = true;
        }
        if (!collected && this.player.pods.right.active) {
          const rx = this.player.x + this.player.w + this.player.podGap;
          if (u.x + u.w > rx && u.x < rx + this.player.podW && u.y + u.h > podY && u.y < podY + this.player.podH) collected = true;
        }
      }

      if (collected) {
        this.particles.spawnExplosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, COLORS[u.type], Math.PI, Math.PI);
        if (!this.debugMode) {
          if (u.type === 'shield') { this.shieldHits = 1; this.hasShieldSystem = true; this.lastShieldLostTime = -1; }
          if (u.type === 'double') { if (this.shotCount < 4) this.shotCount++; else if (this.playerDamage < 5) this.playerDamage++; }
          if (u.type === 'rocket' && this.rocketLevel < 5) this.rocketLevel++;
          if (u.type === 'pierce') this.hasPierce = true;
          if (u.type === 'heal' && this.lives < 5) this.lives++;
          if (u.type === 'points') {
            const amount = this.level * 100;
            this.score += amount;
            this.particles.spawnScoreText(this.player.x + this.player.w / 2, this.player.y - 20, amount);
          }
          this.ui.updateStats(this);        
        }
        return false;
      }
      return true;
    });

    if (this.hasShieldSystem && this.shieldHits === 0 && this.lastShieldLostTime >= 0) {
      if (now - this.lastShieldLostTime >= CONSTANTS.SHIELD_RECHARGE_MS) {
        this.shieldHits = 1;
        this.lastShieldLostTime = -1;
        this.ui.updateStats(this);
      }
    }
    
    this.weapons.updateRockets(now);
    this.weapons.updateLightning(now);
    this.weapons.updatePDC(now);
  }

  getLowestRowInvaders() {
    if (this.invaders.length === 0) return [];
    const lowestY = Math.max(...this.invaders.map((inv) => inv.y));
    return this.invaders.filter((inv) => inv.y >= lowestY - 2);
  }

  checkCollisions(now) {
    this.bullets = this.bullets.filter(b => {
      for (let i = 0; i < this.invaders.length; i++) {
        const inv = this.invaders[i];
        if (b.x + 4 > inv.x && b.x < inv.x + inv.w && b.y < inv.y + inv.h && b.y + 12 > inv.y) {
          this.particles.spawnDamageText(inv.x + inv.w / 2, inv.y + inv.h / 2, this.playerDamage);
          inv.hp -= this.playerDamage;
          if (inv.isBoss) this.shake = Math.min(this.shake + 1, 5);
          if (inv.hp <= 0) {
            this.score += inv.scoreValue;
            this.particles.spawnScoreText(this.player.x + this.player.w / 2, this.player.y - 20, inv.scoreValue);
            
            if (inv.isBoss) {
              this.shake = 30;
              this.particles.spawnStunningExplosion(inv.x + inv.w / 2, inv.y + inv.h / 2, inv.color);
              this.spawnUpgrade(inv.x + inv.w / 4, inv.y + inv.h / 2);
              this.spawnUpgrade(inv.x + inv.w * 0.75, inv.y + inv.h / 2);
              this.spawnUpgrade(inv.x + inv.w / 2, inv.y + inv.h / 2);

              if (this.level === 5) {
                this.player.pods.left.active = true;
                this.player.pods.left.hp = 3;
                this.particles.spawnScoreText(this.player.x + this.player.w / 2, this.player.y - 40, "LEFT POD UNLOCKED!");
              } else if (this.level === 10) {
                this.player.pods.right.active = true;
                this.player.pods.right.hp = 3;
                this.particles.spawnScoreText(this.player.x + this.player.w / 2, this.player.y - 40, "RIGHT POD UNLOCKED!");
              } else if (this.level > 10) {
                let restored = false;
                if (!this.player.pods.left.active || this.player.pods.left.hp < 3) { this.player.pods.left.active = true; this.player.pods.left.hp = 3; restored = true; }
                if (!this.player.pods.right.active || this.player.pods.right.hp < 3) { this.player.pods.right.active = true; this.player.pods.right.hp = 3; restored = true; }
                if (restored) this.particles.spawnScoreText(this.player.x + this.player.w / 2, this.player.y - 40, "PODS RESTORED!");
              } else if (this.level > 5 && this.level < 10) {
                if (!this.player.pods.left.active || this.player.pods.left.hp < 3) {
                  this.player.pods.left.active = true; this.player.pods.left.hp = 3;
                  this.particles.spawnScoreText(this.player.x + this.player.w / 2, this.player.y - 40, "LEFT POD RESTORED!");
                }
              }
            } else {
              this.particles.spawnExplosion(inv.x + inv.w / 2, inv.y + inv.h / 2, inv.color, 0, Math.PI * 2);
              this.spawnUpgrade(inv.x, inv.y);
            }
            
            this.invaders.splice(i, 1);
            this.ui.updateStats(this);

            if (this.hasPierce && !b.pierced) {
              b.pierced = true;
              return true;
            }
          }
          return false;
        }
      }
      return true;
    });

    this.invaderBullets = this.invaderBullets.filter(b => {
      if (b.x + 6 > this.player.x && b.x < this.player.x + this.player.w && b.y + 10 > this.player.y && b.y < this.player.y + this.player.h) {
        if (!this.debugMode) {
          this.shake = 15;
          this.particles.spawnExplosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, COLORS.player, Math.PI, Math.PI);
          if (this.shieldHits > 0) { this.shieldHits = 0; this.lastShieldLostTime = now; } else { this.lives--; }
          this.ui.updateStats(this);
        }
        return false;
      }
      const podY = this.player.y + (this.player.h - this.player.podH) / 2;
      if (this.player.pods.left.active) {
        const lx = this.player.x - this.player.podGap - this.player.podW;
        if (b.x + 6 > lx && b.x < lx + this.player.podW && b.y + 10 > podY && b.y < podY + this.player.podH) {
          if (!this.debugMode) {
            this.shake = 10;
            this.particles.spawnExplosion(lx + this.player.podW / 2, podY + this.player.podH / 2, COLORS.player, Math.PI, Math.PI);
            if (this.shieldHits > 0) { this.shieldHits = 0; this.lastShieldLostTime = now; } else {
              this.player.pods.left.hp--;
              if (this.player.pods.left.hp <= 0) this.player.pods.left.active = false;
            }
          }
          return false;
        }
      }
      if (this.player.pods.right.active) {
        const rx = this.player.x + this.player.w + this.player.podGap;
        if (b.x + 6 > rx && b.x < rx + this.player.podW && b.y + 10 > podY && b.y < podY + this.player.podH) {
          if (!this.debugMode) {
            this.shake = 10;
            this.particles.spawnExplosion(rx + this.player.podW / 2, podY + this.player.podH / 2, COLORS.player, Math.PI, Math.PI);
            if (this.shieldHits > 0) { this.shieldHits = 0; this.lastShieldLostTime = now; } else {
              this.player.pods.right.hp--;
              if (this.player.pods.right.hp <= 0) this.player.pods.right.active = false;
            }
          }
          return false;
        }
      }
      return true;
    });

    this.bossMissiles = this.bossMissiles.filter(m => {
      if (m.x + m.w > this.player.x && m.x < this.player.x + this.player.w && m.y + m.h > this.player.y && m.y < this.player.y + this.player.h) {
        if (!this.debugMode) {
          this.shake = 15;
          this.particles.spawnExplosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, COLORS.player, Math.PI, Math.PI);
          if (this.shieldHits > 0) { this.shieldHits = 0; this.lastShieldLostTime = now; } else { this.lives--; }
          this.ui.updateStats(this);
        }
        return false;
      }
      const podY = this.player.y + (this.player.h - this.player.podH) / 2;
      if (this.player.pods.left.active) {
        const lx = this.player.x - this.player.podGap - this.player.podW;
        if (m.x + m.w > lx && m.x < lx + this.player.podW && m.y + m.h > podY && m.y < podY + this.player.podH) {
          if (!this.debugMode) {
            this.shake = 10;
            this.particles.spawnExplosion(lx + this.player.podW / 2, podY + this.player.podH / 2, COLORS.player, Math.PI, Math.PI);
            if (this.shieldHits > 0) { this.shieldHits = 0; this.lastShieldLostTime = now; } else {
              this.player.pods.left.hp--;
              if (this.player.pods.left.hp <= 0) this.player.pods.left.active = false;
            }
          }
          return false;
        }
      }
      if (this.player.pods.right.active) {
        const rx = this.player.x + this.player.w + this.player.podGap;
        if (m.x + m.w > rx && m.x < rx + this.player.podW && m.y + m.h > podY && m.y < podY + this.player.podH) {
          if (!this.debugMode) {
            this.shake = 10;
            this.particles.spawnExplosion(rx + this.player.podW / 2, podY + this.player.podH / 2, COLORS.player, Math.PI, Math.PI);
            if (this.shieldHits > 0) { this.shieldHits = 0; this.lastShieldLostTime = now; } else {
              this.player.pods.right.hp--;
              if (this.player.pods.right.hp <= 0) this.player.pods.right.active = false;
            }
          }
          return false;
        }
      }
      return true;
    });
  }

  checkLose() {
    for (const inv of this.invaders) { if (inv.y + inv.h >= this.player.y) return !this.debugMode; }
    return this.lives <= 0;
  }

  draw() {
    this.ctx.save();
    if (this.shake > 0) {
      this.ctx.translate((Math.random() - 0.5) * this.shake * 2, (Math.random() - 0.5) * this.shake * 2);
    }
    
    this.ctx.fillStyle = '#0d0d14';
    this.ctx.fillRect(0, 0, this.W, this.H);
    this.starfield.draw(this.ctx);

    this.invaders.forEach((inv) => {
      const ratio = inv.maxHp > 1 ? 0.45 + 0.55 * (inv.hp / inv.maxHp) : 1;
      if (!inv.isBoss && ratio >= 1) {
        const sprite = this.sprites.get(`inv_${inv.color}`);
        if (sprite) this.ctx.drawImage(sprite, inv.x - 20, inv.y - 20);
      } else {
        const color = ratio >= 1 ? inv.color : darkenColor(inv.color, ratio);
        drawRect(this.ctx, inv.x, inv.y, inv.w, inv.h, color, true);
      }
      if (this.debugMode) {
        this.ctx.fillStyle = '#ffffff'; this.ctx.font = 'bold 14px Orbitron'; this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
        this.ctx.fillText(inv.hp + '/' + inv.maxHp, inv.x + inv.w / 2, inv.y + inv.h / 2);
      }
    });

    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = COLORS.bullet; this.ctx.shadowColor = COLORS.bullet;
    this.bullets.forEach(b => this.ctx.fillRect(b.x, b.y, 4, 12));
    
    this.ctx.fillStyle = COLORS.invader1; this.ctx.shadowColor = COLORS.invader1;
    this.invaderBullets.forEach(b => this.ctx.fillRect(b.x, b.y, 6, 10));
    
    this.ctx.shadowBlur = 12;
    this.ctx.fillStyle = '#ff0844'; this.ctx.shadowColor = '#ff0844';
    this.bossMissiles.forEach(m => {
      this.ctx.save(); this.ctx.translate(m.x + m.w / 2, m.y + m.h / 2); this.ctx.rotate(m.angle - Math.PI / 2);
      this.ctx.fillRect(-m.w / 2, -m.h / 2, m.w, m.h); this.ctx.restore();
    });
    this.ctx.shadowBlur = 0;

    const neonRed = '#ff0844';
    this.rockets.forEach(r => {
      let bestInv = null; let bestD = Infinity;
      for (const inv of this.invaders) {
        const d = (inv.x + inv.w / 2 - r.targetX) ** 2 + (inv.y + inv.h / 2 - r.targetY) ** 2;
        if (d < bestD) { bestD = d; bestInv = inv; }
      }
      if (bestInv) {
        this.ctx.strokeStyle = neonRed; this.ctx.shadowColor = neonRed; this.ctx.shadowBlur = 18; this.ctx.lineWidth = 3;
        this.ctx.strokeRect(Math.floor(bestInv.x), Math.floor(bestInv.y), Math.floor(bestInv.w), Math.floor(bestInv.h));
        this.ctx.shadowBlur = 0;
      }
    });

    this.rockets.forEach(r => {
      this.ctx.save(); this.ctx.translate(r.x + CONSTANTS.ROCKET_W / 2, r.y + CONSTANTS.ROCKET_H / 2); this.ctx.rotate(Math.atan2(r.vy, r.vx));
      this.ctx.translate(-CONSTANTS.ROCKET_W / 2, -CONSTANTS.ROCKET_H / 2);
      this.ctx.fillStyle = COLORS.rocket; this.ctx.shadowColor = COLORS.rocket; this.ctx.shadowBlur = 15;
      this.ctx.fillRect(0, 0, CONSTANTS.ROCKET_W, CONSTANTS.ROCKET_H); this.ctx.restore();
    });

    this.upgrades.forEach(u => {
      const sprite = this.sprites.get(`upg_${u.type}`);
      if (sprite) {
        this.ctx.drawImage(sprite, u.x - 20, u.y - 20);
        if (u.type === 'points') {
          this.ctx.fillStyle = '#000000'; this.ctx.font = 'bold 10px Orbitron'; this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
          const amount = u.level * 100;
          this.ctx.fillText(amount >= 1000 ? (amount / 1000).toFixed(1) + 'k' : amount, u.x + u.w / 2, u.y + u.h / 2 + 1);
        }
      }
    });

    if (this.activeLightning) {
      const age = performance.now() - this.activeLightning.startTime;
      const t = age / CONSTANTS.LIGHTNING_DURATION_MS;
      const px = this.player.x + this.player.w / 2;
      const py = this.player.y;
      const tx = this.activeLightning.target.hp > 0 ? this.activeLightning.target.x + this.activeLightning.target.w / 2 : this.activeLightning.points[this.activeLightning.points.length-1].x;
      const ty = this.activeLightning.target.hp > 0 ? this.activeLightning.target.y + this.activeLightning.target.h / 2 : this.activeLightning.points[this.activeLightning.points.length-1].y;

      this.ctx.save(); this.ctx.beginPath(); this.ctx.moveTo(px, py);
      for (let i = 1; i < this.activeLightning.points.length - 1; i++) {
        const segT = i / (this.activeLightning.points.length - 1);
        const curX = px + (tx - px) * segT;
        const curY = py + (ty - py) * segT;
        const origBaseX = this.activeLightning.points[0].x + (this.activeLightning.points[this.activeLightning.points.length-1].x - this.activeLightning.points[0].x) * segT;
        const origBaseY = this.activeLightning.points[0].y + (this.activeLightning.points[this.activeLightning.points.length-1].y - this.activeLightning.points[0].y) * segT;
        this.ctx.lineTo(curX + (this.activeLightning.points[i].x - origBaseX), curY + (this.activeLightning.points[i].y - origBaseY));
      }
      this.ctx.lineTo(tx, ty);
      const color = t < 0.25 ? CONSTANTS.LIGHTNING_COLOR_START : t < 0.50 ? CONSTANTS.LIGHTNING_COLOR_END : t < 0.75 ? '#ffffff' : t < 0.90 ? CONSTANTS.LIGHTNING_COLOR_END : CONSTANTS.LIGHTNING_COLOR_START;
      const bw = t < 0.5 ? 12 : 24 * (1 - t);
      this.ctx.strokeStyle = '#000000'; this.ctx.lineWidth = bw + 4; this.ctx.lineJoin = 'round'; this.ctx.lineCap = 'round'; this.ctx.stroke();
      this.ctx.strokeStyle = color; this.ctx.lineWidth = bw; this.ctx.shadowBlur = 15; this.ctx.shadowColor = CONSTANTS.LIGHTNING_GLOW; this.ctx.stroke();
      this.ctx.restore();
    }

    if (this.activePDCTracer) {
      this.ctx.save(); this.ctx.beginPath(); this.ctx.moveTo(this.activePDCTracer.startX, this.activePDCTracer.startY);
      const tx = this.activePDCTracer.target && this.activePDCTracer.target.x !== undefined ? this.activePDCTracer.target.x + this.activePDCTracer.target.w / 2 : this.activePDCTracer.startX;
      const ty = this.activePDCTracer.target && this.activePDCTracer.target.y !== undefined ? this.activePDCTracer.target.y + this.activePDCTracer.target.h / 2 : this.activePDCTracer.startY;
      this.ctx.lineTo(tx, ty); this.ctx.strokeStyle = '#ffffff'; this.ctx.lineWidth = 2; this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#ffffff'; this.ctx.stroke();
      this.ctx.restore();
    }

    this.player.draw(this.ctx, this.shieldHits);
    this.ui.drawHUD(this.ctx, this);
    this.particles.draw(this.ctx);

    if (this.debugMode) {
      this.ctx.font = 'bold 56px Orbitron'; this.ctx.fillStyle = '#ff0844'; this.ctx.shadowColor = '#ff0844'; this.ctx.shadowBlur = 20;
      this.ctx.textAlign = 'center'; this.ctx.fillText('DEBUG MODE', this.W / 2, 72);
    }
    this.ctx.restore();
  }

  gameLoop(now) {
    requestAnimationFrame(this.gameLoop);
    this.starfield.update();
    if (this.gameRunning && !this.isPaused) {
      this.updateEntities(now);
      this.weapons.playerShoot(now);
      this.invaderShoot(now);
      this.bossShoot(now);
      this.checkCollisions(now);
      this.particles.update();
    }
    this.draw();
    if (!this.gameRunning || this.isPaused) return;
    if (this.invaders.length === 0 && !this.particles.hasActiveParticles && this.rockets.length === 0 && this.bossMissiles.length === 0 && this.upgrades.length === 0 && this.activeLightning === null) {
      this.level++; this.ui.updateStats(this);
      this.bullets = []; this.invaderBullets = []; this.bossMissiles = []; this.upgrades = []; this.rockets = [];
      this.initInvaders(); this.lastInvaderShoot = now; this.lastBossShoot = now;
    } else if (this.checkLose()) {
      this.endGame(false);
    }
  }
}
