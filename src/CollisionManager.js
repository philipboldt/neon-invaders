import { COLORS, CONSTANTS } from './constants.js';
import { Upgrade } from './entities/Upgrade.js';

export class CollisionManager {
  constructor(game) {
    this.game = game;
  }

  checkCollisions(now) {
    // 1. Player Bullets vs Invaders
    for (let j = this.game.bullets.length - 1; j >= 0; j--) {
      const b = this.game.bullets[j];
      for (let i = this.game.invaders.length - 1; i >= 0; i--) {
        const inv = this.game.invaders[i];
        if (this.rectIntersect(b, inv)) {
          this.game.particles.spawnDamageText(inv.x + inv.w / 2, inv.y + inv.h / 2, this.game.playerDamage);
          
          if (inv.takeDamage(this.game.playerDamage)) {
            this.handleInvaderDeath(inv, i);
          }
          
          if (!this.game.hasPierce) {
            b.deactivate();
            this.game.bullets.splice(j, 1);
          }
          break;
        }
      }
    }

    // 2. Invader Bullets vs Player
    this.game.invaderBullets.forEach((b, i) => {
      if (this.rectIntersect(b, this.game.player)) {
        this.handlePlayerHit();
        b.deactivate();
        this.game.invaderBullets.splice(i, 1);
      }
    });

    // 3. Boss Missiles vs Player
    this.game.bossMissiles.forEach((m, i) => {
      if (this.rectIntersect(m, this.game.player)) {
        this.handlePlayerHit();
        m.deactivate();
        this.game.bossMissiles.splice(i, 1);
      }
    });

    // 4. Upgrades vs Player
    for (let i = this.game.upgrades.length - 1; i >= 0; i--) {
      const u = this.game.upgrades[i];
      if (this.rectIntersect(u, this.game.player)) {
        this.applyUpgrade(u.type, u.level);
        u.destroy();
        this.game.upgrades.splice(i, 1);
      }
    }
  }

  handleInvaderDeath(inv, index) {
    this.game.score += inv.scoreValue;
    this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 20, inv.scoreValue);
    this.game.particles.spawnExplosion(inv.x + inv.w / 2, inv.y + inv.h / 2, inv.color, 0, Math.PI * 2, 0);
    
    if (inv.isBoss) {
      this.game.shake = CONSTANTS.SHAKE_BIG_EXPLOSION;
      this.game.particles.spawnExplosion(inv.x + inv.w / 4, inv.y + inv.h / 4, inv.color, 0, Math.PI * 2, 20);
      this.game.particles.spawnExplosion(inv.x + inv.w * 0.75, inv.y + inv.h * 0.75, inv.color, 0, Math.PI * 2, 20);
      
      this.game.spawnUpgrade(inv.x + inv.w / 4, inv.y + inv.h / 2);
      this.game.spawnUpgrade(inv.x + inv.w * 0.75, inv.y + inv.h / 2);
      this.game.spawnUpgrade(inv.x + inv.w / 2, inv.y + inv.h / 2);
      
      this.game.maxLives += CONSTANTS.STAT_POTENTIAL_GAIN;
      this.game.maxDamage += CONSTANTS.STAT_POTENTIAL_GAIN;
      this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 60, "POTENTIAL INCREASED!");
    } else {
      this.game.spawnUpgrade(inv.x, inv.y);
    }
    
    inv.destroy();
    this.game.invaders.splice(index, 1);
    this.game.ui.updateStats(this.game);
  }

  handlePlayerHit() {
    if (this.game.shieldHits > 0) {
      this.game.shieldHits--;
      this.game.lastShieldLostTime = performance.now();
      this.game.shake = CONSTANTS.SHAKE_PLAYER_HIT;
      this.game.particles.spawnExplosion(this.game.player.x + this.game.player.w / 2, this.game.player.y + this.game.player.h / 2, COLORS.shield, 0, Math.PI * 2, 10);
    } else {
      this.game.lives--;
      this.game.shake = CONSTANTS.SHAKE_PLAYER_DEATH;
      this.game.particles.spawnExplosion(this.game.player.x + this.game.player.w / 2, this.game.player.y + this.game.player.h / 2, COLORS.player, 0, Math.PI * 2, 20);
      if (this.game.lives <= 0) {
        this.game.endGame(false);
      }
    }
    this.game.ui.updateStats(this.game);
  }

  applyUpgrade(type, level) {
    let text = "";
    switch (type) {
      case 'shield': this.game.hasShieldSystem = true; this.game.shieldHits = 1; text = "SHIELD ACTIVE"; break;
      case 'double': 
        if (this.game.shotCount < CONSTANTS.PLAYER_MAX_SHOT_COUNT) {
          this.game.shotCount++; text = "WEAPONS UPGRADED"; 
        } else {
          this.game.playerDamage++; text = "DAMAGE INCREASED";
        }
        break;
      case 'rocket': this.game.rocketLevel++; text = "ROCKETS ARMED"; break;
      case 'pierce': this.game.hasPierce = true; text = "PIERCING SHOTS"; break;
      case 'heal': this.game.lives = Math.min(this.game.maxLives, this.game.lives + 1); text = "HEALED"; break;
      case 'points':
        const gain = level * CONSTANTS.POINTS_MULTIPLIER;
        this.game.score += gain; text = `${gain} BONUS`; break;
    }
    this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 40, text);
    this.game.ui.updateStats(this.game);
  }

  updateUpgrades(now) {
    for (let i = this.game.upgrades.length - 1; i >= 0; i--) {
      this.game.upgrades[i].update(now);
      if (this.game.upgrades[i].toDestroy) {
        this.game.upgrades.splice(i, 1);
      }
    }
  }

  rectIntersect(r1, r2) {
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
  }
}
