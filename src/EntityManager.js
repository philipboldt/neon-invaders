import { COLORS, CONSTANTS } from './constants.js';
import { Invader } from './entities/Invader.js';
import { Projectile } from './entities/Projectile.js';

export class EntityManager {
  constructor(game) {
    this.game = game;
  }

  initInvaders() {
    this.game.invaders = [];
    const gap = CONSTANTS.INVADER_GAP;
    
    const isPortrait = this.game.H > this.game.W;
    let baseCols = isPortrait ? CONSTANTS.INVADER_COLS_BASE_PORTRAIT : CONSTANTS.INVADER_COLS_BASE_LANDSCAPE;
    let baseRows = isPortrait ? CONSTANTS.INVADER_ROWS_BASE_PORTRAIT : CONSTANTS.INVADER_ROWS_BASE_LANDSCAPE;

    const rows = Math.min(baseRows + Math.floor(this.game.level / 2), isPortrait ? CONSTANTS.INVADER_MAX_ROWS + 5 : CONSTANTS.INVADER_MAX_ROWS);
    const cols = Math.min(baseCols + Math.floor(this.game.level / 3), isPortrait ? CONSTANTS.INVADER_MAX_COLS - 6 : CONSTANTS.INVADER_MAX_COLS);
    
    const totalGridW = cols * (CONSTANTS.INVADER_W + gap) - gap;
    let startX = (this.game.W - totalGridW) / 2;
    let startY = CONSTANTS.INVADER_START_Y;
    
    const isBossLevel = this.game.level % 10 === 0;
    const isMiniBossLevel = this.game.level % 10 === 5;
    
    const bossW = isBossLevel ? CONSTANTS.INVADER_W * CONSTANTS.BOSS_W_MULT : (isMiniBossLevel ? CONSTANTS.INVADER_W * CONSTANTS.BOSS_W_MULT_MINI : 0);
    const bossH = isBossLevel ? CONSTANTS.INVADER_H * CONSTANTS.BOSS_H_MULT : (isMiniBossLevel ? CONSTANTS.INVADER_H * CONSTANTS.BOSS_H_MULT_MINI : 0);

    const block = Math.floor((this.game.level - 1) / 4);
    const p = (this.game.level - 1) % 4;
    const baseHp = 1 + block * 2;
    const higherHp = baseHp + 2;
    const rowsWithHigher = p * 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const color =
          row === 0 ? COLORS.invader3 :
          row < Math.ceil(rows / 2) ? COLORS.invader1 : COLORS.invader2;
        const maxHp = row < rowsWithHigher ? higherHp : baseHp;
        const scoreValue = color === COLORS.invader3 ? 30 : color === COLORS.invader1 ? 20 : 10;
        
        const invX = startX + col * (CONSTANTS.INVADER_W + gap);
        const invY = startY + row * (CONSTANTS.INVADER_H + gap);
        
        this.game.invaders.push(new Invader(this.game, invX, invY, {
          w: CONSTANTS.INVADER_W, h: CONSTANTS.INVADER_H,
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

  updateInvaders(now) {
    if (this.game.invaders.length > 0) {
      const speed = (CONSTANTS.INVADER_SPEED_BASE + this.game.level * CONSTANTS.INVADER_SPEED_INC) / CONSTANTS.FPS_TARGET;
      let moveDown = false;
      const margin = CONSTANTS.INVADER_MARGIN;
      const moveX = this.game.invaderDir * speed;

      if (this.game.invaderDir > 0 && this.game.gridX + this.game.gridW + moveX >= this.game.W - margin) moveDown = true;
      if (this.game.invaderDir < 0 && this.game.gridX + moveX <= margin) moveDown = true;

      if (moveDown) {
        this.game.invaderDir *= -1;
        this.game.invaders.forEach(inv => {
          inv.y += CONSTANTS.INVADER_DROP_DOWN * this.game.heightFactor;
          inv.update(now);
        });
      } else {
        this.game.gridX += moveX;
        this.game.invaders.forEach(inv => {
          inv.x += moveX;
          inv.update(now);
        });
      }
    }
  }

  invaderShoot(now) {
    const shootInterval = Math.max(CONSTANTS.INVADER_SHOOT_INTERVAL_MIN, CONSTANTS.INVADER_SHOOT_INTERVAL_BASE - this.game.level * 60);
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

  updateProjectiles(now) {
    const processArr = (arr) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        arr[i].update(now);
        if (arr[i].toDestroy) arr.splice(i, 1);
      }
    };
    processArr(this.game.bullets);
    processArr(this.game.invaderBullets);
    processArr(this.game.bossMissiles);
  }
}
