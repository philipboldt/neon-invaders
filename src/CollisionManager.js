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
          
          const isFatal = inv.takeDamage(this.game.playerDamage);
          if (isFatal) {
            this.handleInvaderDeath(inv, i);
          }
          
          // PIERCE LOGIC:
          // 1. Never pierce bosses
          // 2. Only pierce if hit was fatal
          // 3. Only pierce if bullet has pierce capability remaining
          let shouldDeactivate = true;
          if (this.game.hasPierce && b.pierceCount > 0 && isFatal && !inv.isBoss) {
            b.pierceCount--;
            shouldDeactivate = false;
            // Update visual if pierce is spent
            if (b.pierceCount === 0 && b.sprite) {
              b.sprite.tint = 0xFFFFFF;
            }
          }

          if (shouldDeactivate) {
            b.deactivate();
            this.game.bullets.splice(j, 1);
          }
          break;
        }
      }
    }

    // 2. Invader Bullets vs Player & Pods
    this.game.invaderBullets.forEach((b, i) => {
      if (this.checkPlayerComponentCollision(b)) {
        b.deactivate();
        this.game.invaderBullets.splice(i, 1);
      }
    });

    // 3. Boss Missiles vs Player & Pods
    this.game.bossMissiles.forEach((m, i) => {
      if (this.checkPlayerComponentCollision(m)) {
        m.deactivate();
        this.game.bossMissiles.splice(i, 1);
      }
    });

    // 4. Upgrades vs Player & Pods
    for (let i = this.game.upgrades.length - 1; i >= 0; i--) {
      const u = this.game.upgrades[i];
      if (this.checkPlayerComponentCollision(u, true)) { // Passing true to ignore damage logic, just collect
        this.applyUpgrade(u.type, u.level);
        u.destroy();
        this.game.upgrades.splice(i, 1);
      }
    }
  }

  // Helper to check collision with shield, player, and pods
  checkPlayerComponentCollision(entity, isCollection = false) {
    const player = this.game.player;
    const lPod = player.getLeftPodBounds();
    const rPod = player.getRightPodBounds();

    // 1. Shield Check (Protects everything)
    if (!isCollection && this.game.shieldHits > 0) {
      if (this.rectIntersect(entity, player) || 
          (lPod && this.rectIntersect(entity, lPod)) || 
          (rPod && this.rectIntersect(entity, rPod))) {
        this.handlePlayerHit(); // handlePlayerHit already manages shield reduction
        return true;
      }
    }

    // 2. Direct Hit Checks
    if (this.rectIntersect(entity, player)) {
      if (!isCollection) this.handlePlayerHit();
      return true;
    }
    if (lPod && this.rectIntersect(entity, lPod)) {
      if (!isCollection) this.handlePodHit('left');
      return true;
    }
    if (rPod && this.rectIntersect(entity, rPod)) {
      if (!isCollection) this.handlePodHit('right');
      return true;
    }

    return false;
  }

  handleInvaderDeath(inv, index) {
    this.game.score += inv.scoreValue;
    this.game.audio.playSFX('explosion');
    this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - CONSTANTS.UI_FEEDBACK_SCORE_Y_OFFSET, inv.scoreValue, COLORS.textYellow);
    this.game.particles.spawnExplosion(inv.x + inv.w / 2, inv.y + inv.h / 2, inv.color, 0, Math.PI * 2, 0);
    
    if (inv.isBoss) {
      this.game.shake = CONSTANTS.SHAKE_BIG_EXPLOSION;
      this.game.particles.spawnExplosion(inv.x + inv.w / 4, inv.y + inv.h / 4, inv.color, 0, Math.PI * 2, CONSTANTS.EXPLOSION_RADIUS_BOSS_HIT);
      this.game.particles.spawnExplosion(inv.x + inv.w * 0.75, inv.y + inv.h * 0.75, inv.color, 0, Math.PI * 2, CONSTANTS.EXPLOSION_RADIUS_BOSS_HIT);
      
      this.game.spawnUpgrade(inv.x + inv.w / 4, inv.y + inv.h / 2);
      this.game.spawnUpgrade(inv.x + inv.w * 0.75, inv.y + inv.h / 2);
      this.game.spawnUpgrade(inv.x + inv.w / 2, inv.y + inv.h / 2);
      
      this.game.maxLives += CONSTANTS.STAT_POTENTIAL_GAIN;
      this.game.maxDamage += CONSTANTS.STAT_POTENTIAL_GAIN;
      this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - CONSTANTS.UI_FEEDBACK_BOSS_POT_Y_OFFSET, "POTENTIAL INCREASED!", COLORS.invader2);
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
      this.game.particles.spawnExplosion(this.game.player.x + this.game.player.w / 2, this.game.player.y + this.game.player.h / 2, COLORS.shield, 0, Math.PI * 2, CONSTANTS.EXPLOSION_RADIUS_SHIELD);
    } else {
      this.game.lives--;
      this.game.shake = CONSTANTS.SHAKE_PLAYER_DEATH;
      this.game.audio.playSFX('explosion');
      this.game.particles.spawnExplosion(this.game.player.x + this.game.player.w / 2, this.game.player.y + this.game.player.h / 2, COLORS.player, 0, Math.PI * 2, CONSTANTS.EXPLOSION_RADIUS_PLAYER);
      if (this.game.lives <= 0) {
        this.game.endGame(false);
      }
    }
    this.game.ui.updateStats(this.game);
  }

  handlePodHit(side) {
    const pod = this.game.player.pods[side];
    if (!pod.active) return;

    pod.hp--;
    this.game.shake = CONSTANTS.SHAKE_PLAYER_HIT;
    
    // Position for explosion
    const bounds = side === 'left' ? this.game.player.getLeftPodBounds() : this.game.player.getRightPodBounds();
    if (bounds) {
      this.game.particles.spawnExplosion(bounds.x + bounds.w / 2, bounds.y + bounds.h / 2, COLORS.player, 0, Math.PI * 2, CONSTANTS.EXPLOSION_RADIUS_POD);
    }

    if (pod.hp <= 0) {
      pod.active = false;
      this.game.audio.playSFX('explosion');
      this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - CONSTANTS.UI_FEEDBACK_POD_DEST_Y_OFFSET, `${side.toUpperCase()} POD DESTROYED!`, COLORS.textRed);
      this.game.player.updateSpritePositions();
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
        } else if (this.game.playerDamage < this.game.maxDamage) {
          this.game.playerDamage++; text = "DAMAGE INCREASED";
        } else {
          // Convert to points if fully maxed
          const gain = level * CONSTANTS.POINTS_MULTIPLIER;
          this.game.score += gain; text = `${gain} BONUS`;
        }
        break;
      case 'rocket': this.game.rocketLevel++; text = "ROCKETS ARMED"; break;
      case 'pierce': this.game.hasPierce = true; text = "PIERCING SHOTS"; break;
      case 'heal': this.game.lives = Math.min(this.game.maxLives, this.game.lives + 1); text = "HEALED"; break;
      case 'points':
        const gain = level * CONSTANTS.POINTS_MULTIPLIER;
        this.game.score += gain; text = `${gain} BONUS`; break;
    }
    const upgradeColor = COLORS[type] || COLORS.text;
    this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - CONSTANTS.UI_FEEDBACK_UPGRADE_Y_OFFSET, text, upgradeColor);
    this.game.transformMaxedUpgrades();
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
