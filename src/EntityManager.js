import { COLORS, CONSTANTS } from './constants.js';
import { Invader } from './entities/Invader.js';
import { Projectile } from './entities/Projectile.js';

export class EntityManager {
  constructor(game) {
    this.game = game;
    this.Projectile = Projectile;
    this.Invader = Invader;
  }

  spawnInvader(x, y, config) {
    const inv = new Invader(this.game, x, y, config);
    this.game.invaders.push(inv);
    return inv;
  }

  initInvaders() {
    this.game.invaders = [];
    const gap = CONSTANTS.INVADER_GAP;
    
    // 1. Calculate Dynamic Scale
    const currentScale = Math.min(CONSTANTS.INVADER_MAX_SCALE, Math.max(CONSTANTS.INVADER_MIN_SCALE, this.game.heightFactor || 1.0));
    const invW = CONSTANTS.INVADER_W * currentScale;
    const invH = CONSTANTS.INVADER_H * currentScale;

    // 2. Determine Target Threat Volume (Independent of Ratio)
    const targetTotal = CONSTANTS.INVADER_BASE_TOTAL + (this.game.level * CONSTANTS.INVADER_GROWTH_PER_LEVEL);

    // 3. Solve for Tactical Grid (Ratio Dependent)
    // Goal: Fill ~60% of width
    const targetGridW = this.game.W * CONSTANTS.INVADER_TARGET_WIDTH_FACTOR;
    let cols = Math.max(CONSTANTS.INVADER_MIN_COLS, Math.floor(targetGridW / (invW + gap)));
    let rows = Math.max(CONSTANTS.INVADER_MIN_ROWS, Math.round(targetTotal / cols));
    
    // Height Safety Check: Grid should not take more than 45% of screen height
    const maxGridHeight = this.game.H * 0.45;
    while (rows * (invH + gap) > maxGridHeight && cols < 12) {
      cols++;
      rows = Math.ceil(targetTotal / cols);
    }
    
    const totalGridW = cols * (invW + gap) - gap;
    let startX = (this.game.W - totalGridW) / 2;
    let startY = this.game.H * CONSTANTS.INVADER_START_Y_RATIO;
    
    const isBossLevel = this.game.level % 10 === 0;
    const isMiniBossLevel = this.game.level % 10 === 5;
    
    const bossW = isBossLevel ? invW * CONSTANTS.BOSS_W_MULT : (isMiniBossLevel ? invW * CONSTANTS.BOSS_W_MULT_MINI : 0);
    const bossH = isBossLevel ? invH * CONSTANTS.BOSS_H_MULT : (isMiniBossLevel ? invH * CONSTANTS.BOSS_H_MULT_MINI : 0);

    const block = Math.floor((this.game.level - 1) / CONSTANTS.INVADER_HP_BLOCK_SIZE);
    const p = (this.game.level - 1) % CONSTANTS.INVADER_HP_BLOCK_SIZE;
    const baseHp = CONSTANTS.INVADER_HP_BASE + block * CONSTANTS.INVADER_HP_INC;
    const higherHp = baseHp + CONSTANTS.INVADER_HP_INC;
    const rowsWithHigher = p * CONSTANTS.INVADER_HIGHER_HP_ROWS_MULT;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const color =
          row === 0 ? COLORS.invader3 :
          row < Math.ceil(rows / 2) ? COLORS.invader1 : COLORS.invader2;
        const maxHp = row < rowsWithHigher ? higherHp : baseHp;
        const scoreValue = color === COLORS.invader3 ? CONSTANTS.INVADER_SCORE_L1 : color === COLORS.invader1 ? CONSTANTS.INVADER_SCORE_L2 : CONSTANTS.INVADER_SCORE_L3;
        
        const invX = startX + col * (invW + gap);
        const invY = startY + row * (invH + gap);
        
        this.game.invaders.push(new Invader(this.game, invX, invY, {
          w: invW, h: invH,
          color, maxHp, hp: maxHp, scoreValue
        }));
      }
    }
    this.game.invaderDir = 1;
    this.game.gridX = startX;
    this.game.gridW = totalGridW;
    
    if (isBossLevel || isMiniBossLevel) {
      const bossMaxHp = isBossLevel ? (1 + block * 2) * CONSTANTS.BOSS_HP_MULT : (1 + block * 2) * CONSTANTS.BOSS_HP_MULT_MINI;
      const bossColor = isBossLevel ? COLORS.boss : COLORS.invader3; 
      const bX = this.game.W / 2 - bossW / 2;
      const bY = startY - bossH - gap * 2;
      
      this.game.invaders.push(new Invader(this.game, bX, bY, {
        w: bossW, h: bossH, color: bossColor,
        maxHp: bossMaxHp, hp: bossMaxHp, isBoss: true,
        scoreValue: isBossLevel ? CONSTANTS.BOSS_SCORE : CONSTANTS.BOSS_SCORE_MINI
      }));
    }
  }

  updateInvaders(dt = 1) {
    if (this.game.invaders.length > 0) {
      const speed = (CONSTANTS.INVADER_SPEED_BASE + this.game.level * CONSTANTS.INVADER_SPEED_INC) / CONSTANTS.FPS_TARGET;
      let moveDown = false;
      const margin = CONSTANTS.INVADER_MARGIN;
      const moveX = this.game.invaderDir * speed * dt;

      if (this.game.invaderDir > 0 && this.game.gridX + this.game.gridW + moveX >= this.game.W - margin) moveDown = true;
      if (this.game.invaderDir < 0 && this.game.gridX + moveX <= margin) moveDown = true;

      if (moveDown) {
        this.game.invaderDir *= -1;
        this.game.invaders.forEach(inv => {
          inv.y += CONSTANTS.INVADER_DROP_DOWN * this.game.heightFactor * dt;
          inv.update(dt);
        });
      } else {
        this.game.gridX += moveX;
        this.game.invaders.forEach(inv => {
          inv.x += moveX;
          inv.update(dt);
        });
      }
    }
  }

  invaderShoot(now) {
    const shootInterval = Math.max(CONSTANTS.INVADER_SHOOT_INTERVAL_MIN, CONSTANTS.INVADER_SHOOT_INTERVAL_BASE - this.game.level * CONSTANTS.INVADER_SHOOT_LEVEL_MULT);
    if (this.game.invaders.length === 0 || now - this.game.lastInvaderShoot < shootInterval) return;
    this.game.lastInvaderShoot = now;
    const idx = Math.floor(Math.random() * this.game.invaders.length);
    const inv = this.game.invaders[idx];
    if (inv.y + inv.h < 0) return;
    
    this.game.invaderBullets.push(new Projectile(this.game, 
      inv.x + inv.w / 2 - CONSTANTS.INVADER_BULLET_W / 2, 
      inv.y + inv.h, 
      'invaderBullet', 
      { w: CONSTANTS.INVADER_BULLET_W, h: CONSTANTS.INVADER_BULLET_H }
    ));
  }

  bossShoot(now) {
    if (now - this.game.lastBossShoot < CONSTANTS.BOSS_SHOOT_INTERVAL) return;
    const bosses = this.game.invaders.filter(inv => inv.isBoss);
    if (bosses.length === 0) return;
    
    this.game.lastBossShoot = now;
    bosses.forEach(boss => {
      if (boss.y + boss.h < 0) return;
      
      const dx = (this.game.player.x + this.game.player.w / 2) - (boss.x + boss.w / 2);
      const dy = (this.game.player.y + this.game.player.h / 2) - (boss.y + boss.h);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = CONSTANTS.BOSS_MISSILE_SPEED * this.game.heightFactor; 
      
      this.game.bossMissiles.push(new Projectile(this.game,
        boss.x + boss.w / 2 - CONSTANTS.BOSS_MISSILE_W / 2,
        boss.y + boss.h,
        'bossMissile',
        { 
          w: CONSTANTS.BOSS_MISSILE_W, h: CONSTANTS.BOSS_MISSILE_H,
          vx: (dx / dist) * speed, vy: (dy / dist) * speed,
          angle: Math.atan2(dy, dx)
        }
      ));
    });
  }

  updateProjectiles(dt = 1) {
    const processArr = (arr) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        arr[i].update(dt);
        if (arr[i].toDestroy) arr.splice(i, 1);
      }
    };
    processArr(this.game.bullets);
    processArr(this.game.invaderBullets);
    processArr(this.game.bossMissiles);
    if (this.game.rockets) processArr(this.game.rockets);
  }
}
