import { COLORS, CONSTANTS } from './constants.js';
import { drawRect, darkenColor } from './utils.js';

export class EntityManager {
  constructor(game) {
    this.game = game;
  }

  initInvaders() {
    this.game.invaders = [];
    const gap = 8;
    
    // Dynamic Grid based on aspect ratio
    const isPortrait = this.game.H > this.game.W;
    let baseCols = isPortrait ? 6 : 11;
    let baseRows = isPortrait ? 9 : 5;

    const rows = Math.min(baseRows + Math.floor(this.game.level / 2), isPortrait ? 12 : CONSTANTS.INVADER_MAX_ROWS);
    const cols = Math.min(baseCols + Math.floor(this.game.level / 3), isPortrait ? 8 : CONSTANTS.INVADER_MAX_COLS);
    
    // Calculate startX to center the grid
    const totalGridW = cols * (CONSTANTS.INVADER_W + gap) - gap;
    let startX = (this.game.W - totalGridW) / 2;
    let startY = 80;
    
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
        this.game.invaders.push({
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
    this.game.invaderDir = 1;
    this.game.gridX = startX;
    this.game.gridW = totalGridW;
    
    if (isBossLevel || isMiniBossLevel) {
      const bossMaxHp = isBossLevel ? (1 + block * 2) * CONSTANTS.BOSS_HP_MULT : (1 + block * 2) * CONSTANTS.BOSS_HP_MULT_MINI;
      const bossColor = isBossLevel ? COLORS.boss : COLORS.invader3; 
      const bX = this.game.W / 2 - bossW / 2;
      const bY = startY - bossH - gap * 2;
      this.game.invaders.push({
        x: bX,
        y: bY,
        w: bossW,
        h: bossH,
        color: bossColor,
        maxHp: bossMaxHp,
        hp: bossMaxHp,
        isBoss: true,
        scoreValue: isBossLevel ? CONSTANTS.BOSS_SCORE : CONSTANTS.BOSS_SCORE_MINI
      });
    }

    // Initialize Pixi Sprites for all invaders (including bosses)
    this.game.invaders.forEach(inv => {
      // Use pre-rendered textures from SpriteManager
      const textureKey = `inv_${inv.color}`;
      inv.sprite = new PIXI.Sprite(this.game.sprites.getTexture(textureKey));
      inv.sprite.anchor.set(0.5);
      // Sprite is larger than hit area due to glow, so we center it on the hit area
      inv.sprite.position.set(inv.x + inv.w / 2, inv.y + inv.h / 2);
      
      // Scale boss sprite if it's a boss (pre-rendered textures are usually small)
      if (inv.isBoss) {
        inv.sprite.width = inv.w + 40; // +40 for glow padding
        inv.sprite.height = inv.h + 40;
      }

      this.game.entityLayer.addChild(inv.sprite);
    });
  }

  updateInvaders() {
    if (this.game.invaders.length > 0) {
      const speed = (CONSTANTS.INVADER_SPEED_BASE + this.game.level * CONSTANTS.INVADER_SPEED_INC) / 60;
      let moveDown = false;
      const margin = CONSTANTS.INVADER_MARGIN;
      const moveX = this.game.invaderDir * speed;

      if (this.game.invaderDir > 0 && this.game.gridX + this.game.gridW + moveX >= this.game.W - margin) moveDown = true;
      if (this.game.invaderDir < 0 && this.game.gridX + moveX <= margin) moveDown = true;

      if (moveDown) {
        this.game.invaderDir *= -1;
        this.game.invaders.forEach(inv => {
          inv.y += CONSTANTS.INVADER_DROP_DOWN * this.game.heightFactor;
          if (inv.sprite) inv.sprite.y = inv.y + inv.h / 2;
        });
      } else {
        this.game.gridX += moveX;
        this.game.invaders.forEach(inv => {
          inv.x += moveX;
          if (inv.sprite) inv.sprite.x = inv.x + inv.w / 2;
        });
      }

      // Sync health tint
      this.game.invaders.forEach(inv => {
        if (inv.sprite) {
          const ratio = inv.maxHp > 1 ? 0.45 + 0.55 * (inv.hp / inv.maxHp) : 1;
          if (ratio < 1) {
            const val = Math.floor(255 * ratio);
            inv.sprite.tint = (val << 16) | (val << 8) | val;
          } else {
            inv.sprite.tint = 0xFFFFFF;
          }
        }
      });
    }
  }

  invaderShoot(now) {
    const shootInterval = Math.max(CONSTANTS.INVADER_SHOOT_INTERVAL_MIN, CONSTANTS.INVADER_SHOOT_INTERVAL_BASE - this.game.level * 60);
    if (this.game.invaders.length === 0 || now - this.game.lastInvaderShoot < shootInterval) return;
    this.game.lastInvaderShoot = now;
    const idx = Math.floor(Math.random() * this.game.invaders.length);
    const inv = this.game.invaders[idx];
    if (inv.y + inv.h < 0) return;
    this.game.invaderBullets.push({
      x: inv.x + inv.w / 2 - CONSTANTS.INVADER_BULLET_W / 2,
      y: inv.y + inv.h,
      w: CONSTANTS.INVADER_BULLET_W,
      h: CONSTANTS.INVADER_BULLET_H,
    });
  }

  bossShoot(now) {
    if (now - this.game.lastBossShoot < CONSTANTS.BOSS_SHOOT_INTERVAL) return;
    const bosses = this.game.invaders.filter(inv => inv.isBoss);
    if (bosses.length === 0) return;
    
    this.game.lastBossShoot = now;
    bosses.forEach(boss => {
      if (boss.y + boss.h < 0) return;
      
      const startX = boss.x + boss.w / 2;
      const startY = boss.y + boss.h;
      
      const playerCx = this.game.player.x + this.game.player.w / 2;
      const playerCy = this.game.player.y + this.game.player.h / 2;
      
      const dx = playerCx - startX;
      const dy = playerCy - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Scale speed by height factor to maintain Time-to-Impact rhythm
      const speed = CONSTANTS.BOSS_MISSILE_SPEED * this.game.heightFactor; 
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;
      
      this.game.bossMissiles.push({
        x: startX - CONSTANTS.BOSS_MISSILE_W / 2, 
        y: startY,
        w: CONSTANTS.BOSS_MISSILE_W,
        h: CONSTANTS.BOSS_MISSILE_H,
        vx,
        vy,
        angle: Math.atan2(vy, vx) // Angle in buffer pixels
      });
    });
  }

  updateProjectiles() {
    for (let i = this.game.bullets.length - 1; i >= 0; i--) {
      const b = this.game.bullets[i];
      b.y += CONSTANTS.BULLET_SPEED * this.game.heightFactor;
      if (b.y <= -20) {
        this.game.bullets.splice(i, 1);
      }
    }

    for (let i = this.game.invaderBullets.length - 1; i >= 0; i--) {
      const b = this.game.invaderBullets[i];
      b.y += CONSTANTS.INVADER_BULLET_SPEED * this.game.heightFactor;
      if (b.y >= this.game.H + 20) {
        this.game.invaderBullets.splice(i, 1);
      }
    }

    for (let i = this.game.bossMissiles.length - 1; i >= 0; i--) {
      const m = this.game.bossMissiles[i];
      m.x += m.vx;
      m.y += m.vy;
      if (m.y >= this.game.H + 50 || m.x <= -50 || m.x >= this.game.W + 50) {
        this.game.bossMissiles.splice(i, 1);
      }
    }
  }
}
