(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const COLORS = {
    player: '#00f5ff',
    invader1: '#ff00ff',
    invader2: '#39ff14',
    invader3: '#ff6600',
    bullet: '#00f5ff',
    glow: 'rgba(0, 245, 255, 0.6)',
    shield: '#00f5ff',
    double: '#39ff14',
    rocket: '#ff6600',
    heal: '#ff3366',
    pierce: '#ffff00',
  };

  const CONSTANTS = {
    ROCKET_W: 10, ROCKET_H: 24, ROCKET_INITIAL_SPEED: 1, ROCKET_MAX_SPEED: 9,
    ROCKET_THRUST: 0.25, ROCKET_STEER_STRENGTH: 0.12, ROCKET_VERTICAL_PHASE: 55, ROCKET_HIT_RADIUS: 28,
    UPGRADE_TYPES: ['shield', 'double', 'rocket', 'pierce', 'heal'], DROP_CHANCE: 0.18, UPGRADE_FALL_SPEED: 3,
    UPGRADE_W: 24, UPGRADE_H: 24, ROCKET_INTERVAL_MS: 5000, SHIELD_RECHARGE_MS: 5000,
    EXPLOSION_PARTICLES: 18, PARTICLE_MAX_SIZE: 14, PARTICLE_LIFE: 28, PARTICLE_SPEED: 5,
    ROCKET_TRAIL_SIZE: 5, ROCKET_TRAIL_LIFE: 14, ROCKET_TRAIL_DRAG: 0.25,
    BULLET_SPEED: -10, INVADER_BULLET_SPEED: 4, INVADER_ROWS: 5, INVADER_COLS: 11,
    INVADER_W: 36, INVADER_H: 24, INVADER_SHOOT_INTERVAL_BASE: 1000, PLAYER_SHOOT_COOLDOWN: 200
  };

  function drawRect(ctx, x, y, w, h, fill, glow) {
    if (glow) {
      ctx.shadowColor = fill;
      ctx.shadowBlur = 15;
    }
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0;
  }

  function darkenColor(hex, ratio) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.floor(((n >> 16) & 0xff) * ratio));
    const g = Math.max(0, Math.floor(((n >> 8) & 0xff) * ratio));
    const b = Math.max(0, Math.floor((n & 0xff) * ratio));
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  class UIManager {
    constructor() {
      this.els = {
        score: document.getElementById('score'),
        level: document.getElementById('level'),
        lives: document.getElementById('lives'),
        shield: document.getElementById('shield'),
        pierce: document.getElementById('pierce'),
        damage: document.getElementById('damage'),
        overlay: document.getElementById('overlay'),
        overlayText: document.getElementById('overlay-text'),
        startScreen: document.getElementById('start-screen'),
        helpScreen: document.getElementById('help-screen'),
        btnShoot: document.getElementById('btn-shoot'),
        btnLeft: document.getElementById('btn-left'),
        btnRight: document.getElementById('btn-right'),
        btnPause: document.getElementById('btn-pause'),
        restartBtn: document.getElementById('restart')
      };
      this.updateHighScores();
    }

    updateStats(gameState) {
      this.els.score.textContent = gameState.score;
      this.els.level.textContent = gameState.level;
      this.els.lives.textContent = gameState.lives;
      this.els.damage.textContent = gameState.playerDamage;
      this.els.shield.textContent = gameState.shieldHits > 0 ? 'activated' : (gameState.hasShieldSystem ? 'deactivated' : 'no shield');
      this.els.pierce.textContent = gameState.hasPierce ? 'active' : 'none';
    }

    setShootActive(isActive) {
      if (this.els.btnShoot) this.els.btnShoot.classList.toggle('active', isActive);
    }

    showStartScreen() {
      this.els.startScreen.classList.remove('hidden');
      this.els.overlay.classList.add('hidden');
      this.els.helpScreen.classList.add('hidden');
    }

    hideScreens() {
      this.els.startScreen.classList.add('hidden');
      this.els.overlay.classList.add('hidden');
      this.els.helpScreen.classList.add('hidden');
    }

    showGameOver(won) {
      this.els.overlay.classList.remove('hidden');
      this.els.overlayText.textContent = won ? 'YOU WIN!' : 'GAME OVER';
      this.els.overlayText.classList.toggle('win', won);
    }

    toggleHelp(isVisible) {
      this.els.helpScreen.classList.toggle('hidden', !isVisible);
    }

    updateHighScores(newScore) {
      let scores = JSON.parse(localStorage.getItem('neonInvadersHighScores') || '[0,0,0]');
      if (newScore !== undefined) {
        scores.push(newScore);
        scores.sort((a, b) => b - a);
        scores = scores.slice(0, 3);
        localStorage.setItem('neonInvadersHighScores', JSON.stringify(scores));
      }
      const listEls = document.querySelectorAll('.highscore-list');
      listEls.forEach(listEl => {
        listEl.innerHTML = '';
        scores.forEach((s, i) => {
          const li = document.createElement('li');
          const rankSpan = document.createElement('span');
          rankSpan.className = 'rank';
          rankSpan.textContent = `${i + 1}.`;
          const scoreSpan = document.createElement('span');
          scoreSpan.className = 'score-val';
          scoreSpan.textContent = s.toString().padStart(5, '0');
          li.appendChild(rankSpan);
          li.appendChild(scoreSpan);
          listEl.appendChild(li);
        });
      });
    }
  }

  class ParticleSystem {
    constructor() {
      this.particles = [];
    }

    spawnExplosion(cx, cy, color, angleStart = 0, angleRange = Math.PI * 2, radius = 0) {
      const particleCount = radius > 0 ? CONSTANTS.EXPLOSION_PARTICLES * 3 : CONSTANTS.EXPLOSION_PARTICLES;
      for (let n = 0; n < particleCount; n++) {
        const angle = angleStart + (angleRange * n) / particleCount + (Math.random() - 0.5) * (angleRange / particleCount);
        const speedBase = radius > 0 ? radius * 0.15 : CONSTANTS.PARTICLE_SPEED;
        const speed = speedBase * (0.6 + Math.random() * 0.8);
        const sizeBase = radius > 0 ? CONSTANTS.PARTICLE_MAX_SIZE * 2 : CONSTANTS.PARTICLE_MAX_SIZE;
        const maxSize = sizeBase * (0.4 + Math.random() * 0.6);
        const lifeBase = radius > 0 ? CONSTANTS.PARTICLE_LIFE * 1.5 : CONSTANTS.PARTICLE_LIFE;
        
        this.particles.push({
          x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          size: maxSize, maxSize, life: 0, maxLife: lifeBase, color,
        });
      }
    }

    spawnRocketTrail(cx, cy, vx, vy) {
      const speed = Math.sqrt(vx * vx + vy * vy) || 1;
      const backX = (-vx / speed) * CONSTANTS.ROCKET_TRAIL_DRAG * speed;
      const backY = (-vy / speed) * CONSTANTS.ROCKET_TRAIL_DRAG * speed;
      this.particles.push({
        x: cx, y: cy, vx: backX + (Math.random() - 0.5) * 1.5, vy: backY + (Math.random() - 0.5) * 1.5,
        size: CONSTANTS.ROCKET_TRAIL_SIZE, maxSize: CONSTANTS.ROCKET_TRAIL_SIZE * (0.6 + Math.random() * 0.4),
        life: 0, maxLife: CONSTANTS.ROCKET_TRAIL_LIFE, color: COLORS.rocket,
      });
    }

    update() {
      this.particles = this.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        return p.life < p.maxLife;
      });
    }

    draw(ctx) {
      this.particles.forEach((p) => {
        const t = p.life / p.maxLife;
        const size = Math.max(0, p.maxSize * (1 - t));
        if (size <= 0) return;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
        ctx.shadowBlur = 0;
      });
    }
  }

  class Player {
    constructor() {
      this.w = 40;
      this.h = 24;
      this.x = W / 2 - this.w / 2;
      this.y = H - 60;
      this.speed = 6;
      this.dir = 0;
    }

    reset() {
      this.x = W / 2 - this.w / 2;
      this.y = H - 60;
      this.dir = 0;
    }

    update() {
      this.x += this.dir * this.speed;
      this.x = Math.max(0, Math.min(W - this.w, this.x));
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

  class Game {
    constructor() {
      this.ui = new UIManager();
      this.particles = new ParticleSystem();
      this.player = new Player();
      
      this.resetState();
      this.bindInputs();
      
      this.gameLoop = this.gameLoop.bind(this);
      requestAnimationFrame(this.gameLoop);
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
      this.hasPierce = false;
      this.spacePressed = false;
      
      this.invaders = [];
      this.bullets = [];
      this.invaderBullets = [];
      this.bossMissiles = [];
      this.upgrades = [];
      this.rockets = [];
      
      this.lastPlayerShot = 0;
      this.lastInvaderShoot = 0;
      this.lastBossShoot = 0;
      this.lastRocketTime = 0;
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
      
      if (isBossLevel || isMiniBossLevel) {
        startY += bossH + gap * 2;
      }

      const rows = Math.min(CONSTANTS.INVADER_ROWS + Math.floor(this.level / 2), 7);
      const cols = Math.min(CONSTANTS.INVADER_COLS + Math.floor(this.level / 3), 14);
      const block = Math.floor((this.level - 1) / 4);
      const p = (this.level - 1) % 4;
      const baseHp = 1 + block;
      const higherHp = baseHp + 1;
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
        const bossMaxHp = isBossLevel ? actualMaxHp * 10 : actualMaxHp * 5;
        const bossColor = isBossLevel ? '#ff0844' : COLORS.invader3; 
        const bX = startX + this.gridW / 2 - bossW / 2;
        const bY = 80;
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

    playerShoot(now) {
      if (!this.spacePressed || now - this.lastPlayerShot < CONSTANTS.PLAYER_SHOOT_COOLDOWN) return;
      this.lastPlayerShot = now;
      const maxBullets = 5 + this.shotCount * 2;
      if (this.bullets.length < maxBullets) {
        const spread = 14;
        const startX = this.player.x + this.player.w / 2 - 2 - (this.shotCount - 1) * (spread / 2);
        for (let i = 0; i < this.shotCount; i++) {
          this.bullets.push({ x: startX + i * spread, y: this.player.y, w: 4, h: 12 });
        }
      }
    }

    invaderShoot(now) {
      const shootInterval = Math.max(350, CONSTANTS.INVADER_SHOOT_INTERVAL_BASE - this.level * 60);
      if (this.invaders.length === 0 || now - this.lastInvaderShoot < shootInterval) return;
      this.lastInvaderShoot = now;
      const idx = Math.floor(Math.random() * this.invaders.length);
      const inv = this.invaders[idx];
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
        const startX = boss.x + boss.w / 2;
        const startY = boss.y + boss.h;
        
        // Calculate vector towards player
        const playerCx = this.player.x + this.player.w / 2;
        const playerCy = this.player.y + this.player.h / 2;
        
        const dx = playerCx - startX;
        const dy = playerCy - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const speed = 5; // Fixed missile speed
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        
        this.bossMissiles.push({
          x: startX - 4, // 8px width
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
      });
    }

    updateEntities(now) {
      this.player.update();

      // Update Bullets
      this.bullets = this.bullets.filter(b => {
        b.y += CONSTANTS.BULLET_SPEED;
        return b.y > -20;
      });
      this.invaderBullets = this.invaderBullets.filter(b => {
        b.y += CONSTANTS.INVADER_BULLET_SPEED;
        return b.y < H + 20;
      });
      this.bossMissiles = this.bossMissiles.filter(m => {
        m.x += m.vx;
        m.y += m.vy;
        return m.y < H + 50 && m.x > -50 && m.x < W + 50;
      });

      // Update Invaders
      if (this.invaders.length > 0) {
        const speed = (40 + this.level * 5) / 60;
        let moveDown = false;
        const margin = 40;
        const moveX = this.invaderDir * speed;

        if (this.invaderDir > 0 && this.gridX + this.gridW + moveX >= W - margin) moveDown = true;
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
        if (u.y > H) return false;
        if (
          u.x + u.w > this.player.x && u.x < this.player.x + this.player.w &&
          u.y + u.h > this.player.y && u.y < this.player.y + this.player.h
        ) {
          this.particles.spawnExplosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, COLORS[u.type], Math.PI, Math.PI);
          if (!this.debugMode) {
            if (u.type === 'shield') {
              this.shieldHits = 1;
              this.hasShieldSystem = true;
              this.lastShieldLostTime = -1;
            }
            if (u.type === 'double') {
              if (this.shotCount < 4) this.shotCount++;
              else if (this.playerDamage < 5) this.playerDamage++;
            }
            if (u.type === 'rocket' && this.rocketLevel < 5) this.rocketLevel++;
            if (u.type === 'pierce') this.hasPierce = true;
            if (u.type === 'heal' && this.lives < 5) this.lives++;
            this.ui.updateStats(this);
          }
          return false;
        }
        return true;
      });

      // Update Shield
      if (this.hasShieldSystem && this.shieldHits === 0 && this.lastShieldLostTime >= 0) {
        if (now - this.lastShieldLostTime >= CONSTANTS.SHIELD_RECHARGE_MS) {
          this.shieldHits = 1;
          this.lastShieldLostTime = -1;
          this.ui.updateStats(this);
        }
      }
      
      this.updateRockets(now);
    }

    getLowestRowInvaders() {
      if (this.invaders.length === 0) return [];
      const lowestY = Math.max(...this.invaders.map((inv) => inv.y));
      return this.invaders.filter((inv) => inv.y >= lowestY - 2);
    }

    updateRockets(now) {
      const currentLowest = this.getLowestRowInvaders();
      if (this.rocketLevel > 0 && currentLowest.length > 0 && now - this.lastRocketTime >= CONSTANTS.ROCKET_INTERVAL_MS) {
        this.lastRocketTime = now;
        const targetInv = currentLowest[Math.floor(Math.random() * currentLowest.length)];
        this.rockets.push({
          x: this.player.x + this.player.w / 2 - CONSTANTS.ROCKET_W / 2,
          y: this.player.y,
          targetX: targetInv.x + targetInv.w / 2,
          targetY: targetInv.y + targetInv.h / 2,
          vx: 0, vy: -CONSTANTS.ROCKET_INITIAL_SPEED,
          distanceTraveled: 0,
        });
      }

      this.rockets = this.rockets.filter((r) => {
        if (currentLowest.length > 0) {
          let bestInv = null;
          let bestD = Infinity;
          for (const inv of currentLowest) {
            const d = (inv.x + inv.w / 2 - r.targetX) ** 2 + (inv.y + inv.h / 2 - r.targetY) ** 2;
            if (d < bestD) {
              bestD = d;
              bestInv = inv;
            }
          }
          if (bestInv) {
            r.targetX = bestInv.x + bestInv.w / 2;
            r.targetY = bestInv.y + bestInv.h / 2;
          }
        }

        const cx = r.x + CONSTANTS.ROCKET_W / 2;
        const cy = r.y + CONSTANTS.ROCKET_H / 2;
        const dx = r.targetX - cx;
        const dy = r.targetY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONSTANTS.ROCKET_HIT_RADIUS) {
          const blastRadius = this.rocketLevel * CONSTANTS.INVADER_W;
          
          // Huge visual explosion
          this.particles.spawnExplosion(cx, cy, COLORS.rocket, 0, Math.PI * 2, blastRadius);
          this.particles.spawnExplosion(cx, cy, '#ffffff', 0, Math.PI * 2, blastRadius * 0.5);

          // Find and damage all enemies in blast radius
          for (let i = this.invaders.length - 1; i >= 0; i--) {
            const inv = this.invaders[i];
            const invCx = inv.x + inv.w / 2;
            const invCy = inv.y + inv.h / 2;
            const distToInv = Math.sqrt((invCx - cx) ** 2 + (invCy - cy) ** 2);
            
            if (distToInv <= blastRadius + Math.max(inv.w, inv.h) / 2) {
              inv.hp -= this.playerDamage * 2; // Rockets do double player damage to make them impactful
              if (inv.hp <= 0) {
                this.score += Math.floor(inv.scoreValue * 1.5);
                this.particles.spawnExplosion(invCx, invCy, inv.color, 0, Math.PI * 2);
                
                if (inv.isBoss) {
                  this.particles.spawnExplosion(inv.x + inv.w / 4, inv.y + inv.h / 4, inv.color);
                  this.particles.spawnExplosion(inv.x + inv.w * 0.75, inv.y + inv.h * 0.75, inv.color);
                  this.spawnUpgrade(inv.x + inv.w / 4, inv.y + inv.h / 2);
                  this.spawnUpgrade(inv.x + inv.w * 0.75, inv.y + inv.h / 2);
                  this.spawnUpgrade(inv.x + inv.w / 2, inv.y + inv.h / 2);
                } else {
                  this.spawnUpgrade(inv.x, inv.y);
                }
                
                this.invaders.splice(i, 1);
              }
            }
          }
          this.ui.updateStats(this);
          return false;
        }

        if (dist > 0 && r.distanceTraveled >= CONSTANTS.ROCKET_VERTICAL_PHASE) {
          const desiredDx = dx / dist;
          const desiredDy = dy / dist;
          const steerX = desiredDx * CONSTANTS.ROCKET_MAX_SPEED - r.vx;
          const steerY = desiredDy * CONSTANTS.ROCKET_MAX_SPEED - r.vy;
          r.vx += steerX * CONSTANTS.ROCKET_STEER_STRENGTH;
          r.vy += steerY * CONSTANTS.ROCKET_STEER_STRENGTH;
        }

        const speed = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
        if (speed > 0) {
          const thrustX = (r.vx / speed) * CONSTANTS.ROCKET_THRUST;
          const thrustY = (r.vy / speed) * CONSTANTS.ROCKET_THRUST;
          r.vx += thrustX;
          r.vy += thrustY;
          const newSpeed = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
          if (newSpeed > CONSTANTS.ROCKET_MAX_SPEED) {
            r.vx = (r.vx / newSpeed) * CONSTANTS.ROCKET_MAX_SPEED;
            r.vy = (r.vy / newSpeed) * CONSTANTS.ROCKET_MAX_SPEED;
          }
        }
        r.x += r.vx;
        r.y += r.vy;
        this.particles.spawnRocketTrail(r.x + CONSTANTS.ROCKET_W / 2, r.y + CONSTANTS.ROCKET_H / 2, r.vx, r.vy);
        r.distanceTraveled += Math.sqrt(r.vx * r.vx + r.vy * r.vy);
        
        if (r.y < -CONSTANTS.ROCKET_H * 2 || r.y > H + CONSTANTS.ROCKET_H || r.x < -CONSTANTS.ROCKET_W * 2 || r.x > W + CONSTANTS.ROCKET_W) return false;
        return true;
      });
    }

    checkCollisions(now) {
      this.bullets = this.bullets.filter(b => {
        for (let i = 0; i < this.invaders.length; i++) {
          const inv = this.invaders[i];
          if (b.x + 4 > inv.x && b.x < inv.x + inv.w && b.y < inv.y + inv.h && b.y + 12 > inv.y) {
            inv.hp -= this.playerDamage;
            if (inv.hp <= 0) {
              this.score += inv.scoreValue;
              this.particles.spawnExplosion(inv.x + inv.w / 2, inv.y + inv.h / 2, inv.color, 0, Math.PI * 2);
              
              if (inv.isBoss) {
                this.particles.spawnExplosion(inv.x + inv.w / 4, inv.y + inv.h / 4, inv.color);
                this.particles.spawnExplosion(inv.x + inv.w * 0.75, inv.y + inv.h * 0.75, inv.color);
                this.spawnUpgrade(inv.x + inv.w / 4, inv.y + inv.h / 2);
                this.spawnUpgrade(inv.x + inv.w * 0.75, inv.y + inv.h / 2);
                this.spawnUpgrade(inv.x + inv.w / 2, inv.y + inv.h / 2);
              } else {
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
            this.particles.spawnExplosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, COLORS.player, Math.PI, Math.PI);
            if (this.shieldHits > 0) {
              this.shieldHits = 0;
              this.lastShieldLostTime = now;
            } else {
              this.lives--;
            }
            this.ui.updateStats(this);
          }
          return false;
        }
        return true;
      });

      this.bossMissiles = this.bossMissiles.filter(m => {
        if (m.x + m.w > this.player.x && m.x < this.player.x + this.player.w && m.y + m.h > this.player.y && m.y < this.player.y + this.player.h) {
          if (!this.debugMode) {
            this.particles.spawnExplosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, COLORS.player, Math.PI, Math.PI);
            if (this.shieldHits > 0) {
              this.shieldHits = 0;
              this.lastShieldLostTime = now;
            } else {
              this.lives--;
            }
            this.ui.updateStats(this);
          }
          return false;
        }
        return true;
      });
    }

    checkLose() {
      for (const inv of this.invaders) {
        if (inv.y + inv.h >= this.player.y) return !this.debugMode;
      }
      return this.lives <= 0;
    }

    draw() {
      ctx.fillStyle = '#0d0d14';
      ctx.fillRect(0, 0, W, H);

      // Draw Invaders
      this.invaders.forEach((inv) => {
        const ratio = 0.45 + 0.55 * (inv.hp / inv.maxHp);
        const color = ratio >= 1 ? inv.color : darkenColor(inv.color, ratio);
        drawRect(ctx, inv.x, inv.y, inv.w, inv.h, color, true);
        if (this.debugMode) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px Orbitron';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(inv.hp + '/' + inv.maxHp, inv.x + inv.w / 2, inv.y + inv.h / 2);
        }
      });

      // Draw Bullets
      ctx.fillStyle = COLORS.bullet;
      ctx.shadowColor = COLORS.bullet;
      ctx.shadowBlur = 8;
      this.bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 12));
      
      ctx.fillStyle = COLORS.invader1;
      ctx.shadowColor = COLORS.invader1;
      this.invaderBullets.forEach(b => ctx.fillRect(b.x, b.y, 6, 10));
      
      // Draw Boss Missiles
      ctx.fillStyle = '#ff0844'; // Use boss color for its missiles
      ctx.shadowColor = '#ff0844';
      ctx.shadowBlur = 12;
      this.bossMissiles.forEach(m => {
        ctx.save();
        ctx.translate(m.x + m.w / 2, m.y + m.h / 2);
        // Add PI/2 because default draw expects straight down
        ctx.rotate(m.angle - Math.PI / 2);
        ctx.fillRect(-m.w / 2, -m.h / 2, m.w, m.h);
        ctx.restore();
      });
      ctx.shadowBlur = 0;

      // Draw Rocket Targets
      const neonRed = '#ff0844';
      this.rockets.forEach(r => {
        let tx = r.targetX - CONSTANTS.INVADER_W / 2;
        let ty = r.targetY - CONSTANTS.INVADER_H / 2;
        let bestD = Infinity;
        for (const inv of this.invaders) {
          const icx = inv.x + inv.w / 2;
          const icy = inv.y + inv.h / 2;
          const d = (icx - r.targetX) ** 2 + (icy - r.targetY) ** 2;
          if (d < bestD) {
            bestD = d;
            tx = inv.x; ty = inv.y;
          }
        }
        ctx.strokeStyle = neonRed; ctx.shadowColor = neonRed; ctx.shadowBlur = 18; ctx.lineWidth = 3;
        ctx.strokeRect(tx, ty, CONSTANTS.INVADER_W, CONSTANTS.INVADER_H);
        ctx.shadowBlur = 0;
      });

      // Draw Rockets
      this.rockets.forEach(r => {
        const cx = r.x + CONSTANTS.ROCKET_W / 2;
        const cy = r.y + CONSTANTS.ROCKET_H / 2;
        const angle = Math.atan2(r.vy, r.vx);
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(angle); ctx.translate(-CONSTANTS.ROCKET_W / 2, -CONSTANTS.ROCKET_H / 2);
        ctx.fillStyle = COLORS.rocket; ctx.shadowColor = COLORS.rocket; ctx.shadowBlur = 15;
        ctx.fillRect(0, 0, CONSTANTS.ROCKET_W, CONSTANTS.ROCKET_H);
        ctx.shadowBlur = 0;
        ctx.restore();
      });

      // Draw Upgrades
      const radius = CONSTANTS.UPGRADE_W / 2;
      this.upgrades.forEach(u => {
        const c = COLORS[u.type] || COLORS.heal;
        ctx.shadowColor = c; ctx.shadowBlur = 12; ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(u.x + radius, u.y + radius, radius, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });

      this.particles.draw(ctx);
      this.player.draw(ctx, this.shieldHits);

      if (this.debugMode) {
        ctx.font = 'bold 56px Orbitron'; ctx.fillStyle = '#ff0844'; ctx.shadowColor = '#ff0844'; ctx.shadowBlur = 20;
        ctx.textAlign = 'center'; ctx.fillText('DEBUG MODE', W / 2, 72); ctx.shadowBlur = 0;
      }
    }

    gameLoop(now) {
      requestAnimationFrame(this.gameLoop);

      if (!this.gameRunning) return;
      if (this.isPaused) return;

      this.updateEntities(now);
      this.playerShoot(now);
      this.invaderShoot(now);
      this.bossShoot(now);
      this.checkCollisions(now);
      this.particles.update();
      this.draw();

      if (this.invaders.length === 0) {
        this.level++;
        this.ui.updateStats(this);
        this.bullets = []; this.invaderBullets = []; this.bossMissiles = []; this.upgrades = []; this.rockets = [];
        this.initInvaders();
        this.lastInvaderShoot = now;
        this.lastBossShoot = now;
      } else if (this.checkLose()) {
        this.endGame(false);
      }
    }

    bindInputs() {
      document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyH' && this.gameRunning && this.ui.els.overlay.classList.contains('hidden')) {
          this.isPaused = !this.isPaused;
          this.ui.toggleHelp(this.isPaused);
          return;
        }
        if (this.isPaused) return;

        if (e.code === 'KeyD' && this.gameRunning) {
          this.debugMode = !this.debugMode;
          if (this.debugMode) {
            this.shieldHits = 0; this.shotCount = 1; this.rocketLevel = 0; this.hasPierce = false;
            this.ui.updateStats(this);
          }
          return;
        }
        if (e.code === 'KeyA' && this.gameRunning && this.debugMode) {
          this.invaders = [];
          return;
        }

        if (e.code === 'ArrowLeft') this.player.dir = -1;
        if (e.code === 'ArrowRight') this.player.dir = 1;
        if (e.code === 'Space') {
          e.preventDefault();
          this.spacePressed = true;
          this.ui.setShootActive(true);
          if (!this.gameRunning && !this.ui.els.startScreen.classList.contains('hidden')) {
            this.startGame();
          }
        }
      });

      document.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' && this.player.dir === -1) this.player.dir = 0;
        if (e.code === 'ArrowRight' && this.player.dir === 1) this.player.dir = 0;
        if (e.code === 'Space') {
          this.spacePressed = false;
          this.ui.setShootActive(false);
        }
      });

      if (this.ui.els.restartBtn) {
        this.ui.els.restartBtn.addEventListener('click', () => {
          this.startGame();
        });
      }

      const handlePointerDown = (btn, action) => {
        if(!btn) return;
        btn.addEventListener('pointerdown', (e) => {
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          e.preventDefault();
          btn.setPointerCapture(e.pointerId);
          action(true);
        });
      };

      const handlePointerUp = (btn, action) => {
        if(!btn) return;
        btn.addEventListener('pointerup', (e) => {
          e.preventDefault();
          btn.releasePointerCapture(e.pointerId);
          action(false);
        });
        btn.addEventListener('pointercancel', (e) => {
          e.preventDefault();
          action(false);
        });
      };

      handlePointerDown(this.ui.els.btnLeft, (active) => { if (active) this.player.dir = -1; });
      handlePointerUp(this.ui.els.btnLeft, (active) => { if (!active && this.player.dir === -1) this.player.dir = 0; });

      handlePointerDown(this.ui.els.btnRight, (active) => { if (active) this.player.dir = 1; });
      handlePointerUp(this.ui.els.btnRight, (active) => { if (!active && this.player.dir === 1) this.player.dir = 0; });

      handlePointerDown(this.ui.els.btnShoot, () => {
        if (!this.gameRunning || this.isPaused) {
          if (!this.ui.els.startScreen.classList.contains('hidden')) {
            this.startGame();
          } else if (this.isPaused) {
            this.isPaused = false;
            this.ui.toggleHelp(false);
          }
          this.spacePressed = true;
          this.ui.setShootActive(true);
          return;
        }
        this.spacePressed = !this.spacePressed;
        this.ui.setShootActive(this.spacePressed);
      });

      handlePointerDown(this.ui.els.btnPause, (active) => {
        if (active && this.gameRunning && this.ui.els.overlay.classList.contains('hidden')) {
          this.isPaused = !this.isPaused;
          this.ui.toggleHelp(this.isPaused);
        }
      });

      this.ui.els.startScreen.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        if (this.gameRunning && !this.isPaused) return;
        this.startGame();
      });

      this.ui.els.helpScreen.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        if (this.isPaused) {
          this.isPaused = false;
          this.ui.toggleHelp(false);
        }
      });

      this.ui.els.overlay.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (!this.ui.els.overlay.classList.contains('hidden')) {
          if (e.target.id !== 'restart') {
            e.preventDefault();
            this.ui.els.startScreen.classList.add('hidden');
            if (!this.gameRunning) this.startGame();
          }
        }
      });
    }
  }

  // Init
  const game = new Game();
})();