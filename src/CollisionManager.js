import { COLORS } from './constants.js';

export class CollisionManager {
  constructor(game) {
    this.game = game;
  }

  checkCollisions(now) {
    this.game.bullets = this.game.bullets.filter(b => {
      for (let i = 0; i < this.game.invaders.length; i++) {
        const inv = this.game.invaders[i];
        if (b.x + 4 > inv.x && b.x < inv.x + inv.w && b.y < inv.y + inv.h && b.y + 12 > inv.y) {
          this.game.particles.spawnDamageText(inv.x + inv.w / 2, inv.y + inv.h / 2, this.game.playerDamage);
          inv.hp -= this.game.playerDamage;
          if (inv.isBoss) this.game.shake = Math.min(this.game.shake + 1, 5);
          if (inv.hp <= 0) {
            this.game.score += inv.scoreValue;
            this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 20, inv.scoreValue);
            
            if (inv.isBoss) {
              this.game.shake = 30;
              this.game.particles.spawnStunningExplosion(inv.x + inv.w / 2, inv.y + inv.h / 2, inv.color);
              this.game.spawnUpgrade(inv.x + inv.w / 4, inv.y + inv.h / 2);
              this.game.spawnUpgrade(inv.x + inv.w * 0.75, inv.y + inv.h / 2);
              this.game.spawnUpgrade(inv.x + inv.w / 2, inv.y + inv.h / 2);

              // Boss reward: increase player potential
              this.game.maxLives += 2;
              this.game.maxDamage += 2;
              this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 60, "POTENTIAL INCREASED!");

              if (this.game.level === 5) {
                this.game.player.pods.left.active = true;
                this.game.player.pods.left.hp = 3;
                this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 40, "LEFT POD UNLOCKED!");
              } else if (this.game.level === 10) {
                this.game.player.pods.right.active = true;
                this.game.player.pods.right.hp = 3;
                this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 40, "RIGHT POD UNLOCKED!");
              } else if (this.game.level > 10) {
                let restored = false;
                if (!this.game.player.pods.left.active || this.game.player.pods.left.hp < 3) { this.game.player.pods.left.active = true; this.game.player.pods.left.hp = 3; restored = true; }
                if (!this.game.player.pods.right.active || this.game.player.pods.right.hp < 3) { this.game.player.pods.right.active = true; this.game.player.pods.right.hp = 3; restored = true; }
                if (restored) this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 40, "PODS RESTORED!");
              } else if (this.game.level > 5 && this.game.level < 10) {
                if (!this.game.player.pods.left.active || this.game.player.pods.left.hp < 3) {
                  this.game.player.pods.left.active = true; this.game.player.pods.left.hp = 3;
                  this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 40, "LEFT POD RESTORED!");
                }
              }
            } else {
              this.game.particles.spawnExplosion(inv.x + inv.w / 2, inv.y + inv.h / 2, inv.color, 0, Math.PI * 2);
              this.game.spawnUpgrade(inv.x, inv.y);
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
      if (b.x + 6 > this.game.player.x && b.x < this.game.player.x + this.game.player.w && b.y + 10 > this.game.player.y && b.y < this.game.player.y + this.game.player.h) {
        if (!this.game.debugMode) {
          this.game.shake = 15;
          this.game.particles.spawnExplosion(this.game.player.x + this.game.player.w / 2, this.game.player.y + this.game.player.h / 2, COLORS.player, Math.PI, Math.PI);
          if (this.game.shieldHits > 0) { this.game.shieldHits = 0; this.game.lastShieldLostTime = now; } else { this.game.lives--; }
          this.game.ui.updateStats(this.game);
        }
        return false;
      }
      const podY = this.game.player.y + (this.game.player.h - this.game.player.podH) / 2;
      if (this.game.player.pods.left.active) {
        const lx = this.game.player.x - this.game.player.podGap - this.game.player.podW;
        if (b.x + 6 > lx && b.x < lx + this.game.player.podW && b.y + 10 > podY && b.y < podY + this.game.player.podH) {
          if (!this.game.debugMode) {
            this.game.shake = 10;
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
        if (b.x + 6 > rx && b.x < rx + this.game.player.podW && b.y + 10 > podY && b.y < podY + this.game.player.podH) {
          if (!this.game.debugMode) {
            this.game.shake = 10;
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
          this.game.shake = 15;
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
            this.game.shake = 10;
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
            this.game.shake = 10;
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
      u.y += 2; // UPGRADE_FALL_SPEED from constants
      if (u.y > this.game.H) return false;
      
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
          if (u.type === 'shield') { this.game.shieldHits = 1; this.game.hasShieldSystem = true; this.game.lastShieldLostTime = -1; }
          if (u.type === 'double') { 
            if (this.game.shotCount < 4) this.game.shotCount++; 
            else if (this.game.playerDamage < this.game.maxDamage) this.game.playerDamage++; 
          }
          if (u.type === 'rocket' && this.game.rocketLevel < 5) this.game.rocketLevel++;
          if (u.type === 'pierce') this.game.hasPierce = true;
          if (u.type === 'heal' && this.game.lives < this.game.maxLives) this.game.lives++;
          if (u.type === 'points') {
            const amount = this.game.level * 100;
            this.game.score += amount;
            this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 20, amount);
          }
          this.game.ui.updateStats(this.game);        
        }
        return false;
      }
      return true;
    });
  }
}
