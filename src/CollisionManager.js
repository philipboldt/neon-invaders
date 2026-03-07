import { COLORS, CONSTANTS } from './constants.js';

export class CollisionManager {
  constructor(game) {
    this.game = game;
  }

  checkCollisions(now) {
    this.game.bullets = this.game.bullets.filter(b => {
      for (let i = 0; i < this.game.invaders.length; i++) {
        const inv = this.game.invaders[i];
        if (b.x + CONSTANTS.BULLET_W > inv.x && b.x < inv.x + inv.w && b.y < inv.y + inv.h && b.y + CONSTANTS.BULLET_H > inv.y) {
          this.game.particles.spawnDamageText(inv.x + inv.w / 2, inv.y + inv.h / 2, this.game.playerDamage);
          inv.hp -= this.game.playerDamage;
          if (inv.isBoss) this.game.shake = Math.min(this.game.shake + CONSTANTS.SHAKE_BOSS_HIT, CONSTANTS.SHAKE_MAX_BOSS_ACCUMULATION);
          if (inv.hp <= 0) {
            this.game.score += inv.scoreValue;
            this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 20, inv.scoreValue);
            
            if (inv.isBoss) {
              this.game.shake = CONSTANTS.SHAKE_BOSS_DEATH;
              this.game.particles.spawnStunningExplosion(inv.x + inv.w / 2, inv.y + inv.h / 2, inv.color);
              this.game.spawnUpgrade(inv.x + inv.w / 4, inv.y + inv.h / 2);
              this.game.spawnUpgrade(inv.x + inv.w * 0.75, inv.y + inv.h / 2);
              this.game.spawnUpgrade(inv.x + inv.w / 2, inv.y + inv.h / 2);

              // Boss reward: increase player potential
              this.game.maxLives += CONSTANTS.STAT_POTENTIAL_GAIN;
              this.game.maxDamage += CONSTANTS.STAT_POTENTIAL_GAIN;
              this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 60, "POTENTIAL INCREASED!");

              if (this.game.level === CONSTANTS.BOSS_UNLOCK_LEFT) {
                this.game.player.pods.left.active = true;
                this.game.player.pods.left.hp = CONSTANTS.POD_MAX_HP;
                this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 40, "LEFT POD UNLOCKED!");
              } else if (this.game.level === CONSTANTS.BOSS_UNLOCK_RIGHT) {
                this.game.player.pods.right.active = true;
                this.game.player.pods.right.hp = CONSTANTS.POD_MAX_HP;
                this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 40, "RIGHT POD UNLOCKED!");
              } else if (this.game.level > CONSTANTS.BOSS_UNLOCK_RIGHT) {
                let restored = false;
                if (!this.game.player.pods.left.active || this.game.player.pods.left.hp < CONSTANTS.POD_MAX_HP) { 
                  this.game.player.pods.left.active = true; this.game.player.pods.left.hp = CONSTANTS.POD_MAX_HP; restored = true; 
                }
                if (!this.game.player.pods.right.active || this.game.player.pods.right.hp < CONSTANTS.POD_MAX_HP) { 
                  this.game.player.pods.right.active = true; this.game.player.pods.right.hp = CONSTANTS.POD_MAX_HP; restored = true; 
                }
                if (restored) this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 40, "PODS RESTORED!");
              } else if (this.game.level > CONSTANTS.BOSS_UNLOCK_LEFT && this.game.level < CONSTANTS.BOSS_UNLOCK_RIGHT) {
                if (!this.game.player.pods.left.active || this.game.player.pods.left.hp < CONSTANTS.POD_MAX_HP) {
                  this.game.player.pods.left.active = true;
                  this.game.player.pods.left.hp = CONSTANTS.POD_MAX_HP;
                  this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 40, "LEFT POD RESTORED!");
                }
              }
            } else {
              this.game.particles.spawnExplosion(inv.x + inv.w / 2, inv.y + inv.h / 2, inv.color, 0, Math.PI * 2);
              this.game.spawnUpgrade(inv.x, inv.y);
            }
            
            if (inv.sprite) {
              this.game.entityLayer.removeChild(inv.sprite);
              inv.sprite.destroy();
            }
            this.game.invaders.splice(i, 1);
            this.game.ui.updateStats(this.game);

            if (this.game.hasPierce && !b.pierced) {
              b.pierced = true;
              return true;
            }
          }
          return false;
        }
      }
      return true;
    });

    this.game.invaderBullets = this.game.invaderBullets.filter(b => {
      if (b.x + CONSTANTS.INVADER_BULLET_W > this.game.player.x && b.x < this.game.player.x + this.game.player.w && b.y + CONSTANTS.INVADER_BULLET_H > this.game.player.y && b.y < this.game.player.y + this.game.player.h) {
        if (!this.game.debugMode) {
          this.game.shake = CONSTANTS.SHAKE_PLAYER_HIT;
          this.game.particles.spawnExplosion(this.game.player.x + this.game.player.w / 2, this.game.player.y + this.game.player.h / 2, COLORS.player, Math.PI, Math.PI);
          if (this.game.shieldHits > 0) { this.game.shieldHits = 0; this.game.lastShieldLostTime = now; } else { this.game.lives--; }
          this.game.ui.updateStats(this.game);
        }
        return false;
      }
      const podY = this.game.player.y + (this.game.player.h - this.game.player.podH) / 2;
      if (this.game.player.pods.left.active) {
        const lx = this.game.player.x - this.game.player.podGap - this.game.player.podW;
        if (b.x + CONSTANTS.INVADER_BULLET_W > lx && b.x < lx + this.game.player.podW && b.y + CONSTANTS.INVADER_BULLET_H > podY && b.y < podY + this.game.player.podH) {
          if (!this.game.debugMode) {
            this.game.shake = CONSTANTS.SHAKE_POD_HIT;
            this.game.particles.spawnExplosion(lx + this.game.player.podW / 2, podY + this.game.player.podH / 2, COLORS.player, Math.PI, Math.PI);
            if (this.game.shieldHits > 0) { this.game.shieldHits = 0; this.game.lastShieldLostTime = now; } else {
              this.game.player.pods.left.hp--;
              if (this.game.player.pods.left.hp <= 0) this.game.player.pods.left.active = false;
            }
          }
          return false;
        }
      }
      if (this.game.player.pods.right.active) {
        const rx = this.game.player.x + this.game.player.w + this.game.player.podGap;
        if (b.x + CONSTANTS.INVADER_BULLET_W > rx && b.x < rx + this.game.player.podW && b.y + CONSTANTS.INVADER_BULLET_H > podY && b.y < podY + this.game.player.podH) {
          if (!this.game.debugMode) {
            this.game.shake = CONSTANTS.SHAKE_POD_HIT;
            this.game.particles.spawnExplosion(rx + this.game.player.podW / 2, podY + this.game.player.podH / 2, COLORS.player, Math.PI, Math.PI);
            if (this.game.shieldHits > 0) { this.game.shieldHits = 0; this.game.lastShieldLostTime = now; } else {
              this.game.player.pods.right.hp--;
              if (this.game.player.pods.right.hp <= 0) this.game.player.pods.right.active = false;
            }
          }
          return false;
        }
      }
      return true;
    });

    this.game.bossMissiles = this.game.bossMissiles.filter(m => {
      if (m.x + m.w > this.game.player.x && m.x < this.game.player.x + this.game.player.w && m.y + m.h > this.game.player.y && m.y < this.game.player.y + this.game.player.h) {
        if (!this.game.debugMode) {
          this.game.shake = CONSTANTS.SHAKE_PLAYER_HIT;
          this.game.particles.spawnExplosion(this.game.player.x + this.game.player.w / 2, this.game.player.y + this.game.player.h / 2, COLORS.player, Math.PI, Math.PI);
          if (this.game.shieldHits > 0) { this.game.shieldHits = 0; this.game.lastShieldLostTime = now; } else { this.game.lives--; }
          this.game.ui.updateStats(this.game);
        }
        return false;
      }
      const podY = this.game.player.y + (this.game.player.h - this.game.player.podH) / 2;
      if (this.game.player.pods.left.active) {
        const lx = this.game.player.x - this.game.player.podGap - this.game.player.podW;
        if (m.x + m.w > lx && m.x < lx + this.game.player.podW && m.y + m.h > podY && m.y < podY + this.game.player.podH) {
          if (!this.game.debugMode) {
            this.game.shake = CONSTANTS.SHAKE_POD_HIT;
            this.game.particles.spawnExplosion(lx + this.game.player.podW / 2, podY + this.game.player.podH / 2, COLORS.player, Math.PI, Math.PI);
            if (this.game.shieldHits > 0) { this.game.shieldHits = 0; this.game.lastShieldLostTime = now; } else {
              this.game.player.pods.left.hp--;
              if (this.game.player.pods.left.hp <= 0) this.game.player.pods.left.active = false;
            }
          }
          return false;
        }
      }
      if (this.game.player.pods.right.active) {
        const rx = this.game.player.x + this.game.player.w + this.game.player.podGap;
        if (m.x + m.w > rx && m.x < rx + this.game.player.podW && m.y + m.h > podY && m.y < podY + this.game.player.podH) {
          if (!this.game.debugMode) {
            this.game.shake = CONSTANTS.SHAKE_POD_HIT;
            this.game.particles.spawnExplosion(rx + this.game.player.podW / 2, podY + this.game.player.podH / 2, COLORS.player, Math.PI, Math.PI);
            if (this.game.shieldHits > 0) { this.game.shieldHits = 0; this.game.lastShieldLostTime = now; } else {
              this.game.player.pods.right.hp--;
              if (this.game.player.pods.right.hp <= 0) this.game.player.pods.right.active = false;
            }
          }
          return false;
        }
      }
      return true;
    });
  }

  updateUpgrades(now) {
    this.game.upgrades = this.game.upgrades.filter(u => {
      u.y += CONSTANTS.UPGRADE_FALL_SPEED * this.game.heightFactor;
      if (u.sprite) u.sprite.position.set(u.x + u.w / 2, u.y + u.h / 2);
      
      if (u.y > this.game.H) {
        if (u.sprite) {
          this.game.entityLayer.removeChild(u.sprite);
          u.sprite.destroy();
        }
        return false;
      }
      
      let collected = false;
      if (u.x + u.w > this.game.player.x && u.x < this.game.player.x + this.game.player.w && u.y + u.h > this.game.player.y && u.y < this.game.player.y + this.game.player.h) {
        collected = true;
      }
      
      if (!collected) {
        const podY = this.game.player.y + (this.game.player.h - this.game.player.podH) / 2;
        if (this.game.player.pods.left.active) {
          const lx = this.game.player.x - this.game.player.podGap - this.game.player.podW;
          if (u.x + u.w > lx && u.x < lx + this.game.player.podW && u.y + u.h > podY && u.y < podY + this.game.player.podH) collected = true;
        }
        if (!collected && this.game.player.pods.right.active) {
          const rx = this.game.player.x + this.game.player.w + this.game.player.podGap;
          if (u.x + u.w > rx && u.x < rx + this.game.player.podW && u.y + u.h > podY && u.y < podY + this.game.player.podH) collected = true;
        }
      }

      if (collected) {
        this.game.particles.spawnExplosion(this.game.player.x + this.game.player.w / 2, this.game.player.y + this.game.player.h / 2, COLORS[u.type], Math.PI, Math.PI);
        if (!this.game.debugMode) {
          const type = u.type;
          let limitReached = false;

          if (type === 'shield') { 
            this.game.shieldHits = 1; this.game.hasShieldSystem = true; this.game.lastShieldLostTime = -1; 
            limitReached = true; 
          }
          if (type === 'double') { 
            if (this.game.shotCount < CONSTANTS.PLAYER_MAX_SHOT_COUNT) {
              this.game.shotCount++;
              if (this.game.shotCount === CONSTANTS.PLAYER_MAX_SHOT_COUNT && this.game.playerDamage >= this.game.maxDamage) limitReached = true;
            } else if (this.game.playerDamage < this.game.maxDamage) {
              this.game.playerDamage++;
              if (this.game.playerDamage === this.game.maxDamage) limitReached = true;
            }
          }
          if (type === 'rocket') {
            if (this.game.rocketLevel < CONSTANTS.PLAYER_MAX_ROCKET_LEVEL) {
              this.game.rocketLevel++;
              if (this.game.rocketLevel === CONSTANTS.PLAYER_MAX_ROCKET_LEVEL) limitReached = true;
            }
          }
          if (type === 'pierce') {
            this.game.hasPierce = true;
            limitReached = true;
          }
          if (type === 'heal') {
            if (this.game.lives < this.game.maxLives) {
              this.game.lives++;
              if (this.game.lives === this.game.maxLives) limitReached = true;
            }
          }
          if (type === 'points') {
            const amount = this.game.level * CONSTANTS.POINTS_MULTIPLIER;
            this.game.score += amount;
            this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 20, amount);
          }

          if (limitReached && type !== 'points') {
            this.game.upgrades.forEach(otherU => {
              if (otherU.type === type) {
                otherU.type = 'points';
                if (otherU.sprite) {
                  otherU.sprite.texture = this.game.sprites.getTexture('upg_points');
                  this.game.addPointsTextToUpgrade(otherU);
                }
              }
            });
          }

          this.game.ui.updateStats(this.game);        
        }
        if (u.sprite) {
          this.game.entityLayer.removeChild(u.sprite);
          u.sprite.destroy();
        }
        return false;
      }
      return true;
    });
  }
}
