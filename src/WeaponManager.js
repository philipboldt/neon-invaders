import { COLORS, CONSTANTS } from './constants.js';

export class WeaponManager {
  constructor(game) {
    this.game = game;
  }

  playerShoot(now) {
    if (!this.game.spacePressed || now - this.game.lastPlayerShot < CONSTANTS.PLAYER_SHOOT_COOLDOWN) return;
    this.game.lastPlayerShot = now;
    const maxBullets = 15; 
    
    // Main ship bullets
    if (this.game.bullets.length < maxBullets) {
      const spread = 14;
      const startX = this.game.player.x + this.game.player.w / 2 - 2 - (this.game.shotCount - 1) * (spread / 2);
      for (let i = 0; i < this.game.shotCount; i++) {
        this.game.bullets.push({ x: startX + i * spread, y: this.game.player.y, w: 4, h: 12 });
      }
    }
  }

  updatePDC(now) {
    // Clear old tracer
    if (this.game.activePDCTracer && now - this.game.activePDCTracer.startTime > 40) {
      this.game.activePDCTracer = null;
    }

    if (!this.game.player.pods.left.active) {
      this.game.pdcTarget = null;
      return;
    }

    const podX = this.game.player.x - this.game.player.podGap - this.game.player.podW / 2;
    const podY = this.game.player.y + this.game.player.h / 2;

    // Validate current target
    if (this.game.pdcTarget) {
      const targets = [...this.game.invaderBullets, ...this.game.bossMissiles];
      const stillExists = targets.includes(this.game.pdcTarget);
      const isAbovePlayer = this.game.pdcTarget.y < this.game.player.y;
      
      if (!stillExists || !isAbovePlayer) {
        this.game.pdcTarget = null;
      }
    }

    // Find new target if needed
    if (!this.game.pdcTarget) {
      const targets = [...this.game.invaderBullets, ...this.game.bossMissiles];
      let bestTarget = null;
      let minDist = CONSTANTS.PDC_RANGE;

      targets.forEach(t => {
        if (t.y < this.game.player.y) {
          const dx = (t.x + t.w / 2) - podX;
          const dy = (t.y + t.h / 2) - podY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            bestTarget = t;
          }
        }
      });
      this.game.pdcTarget = bestTarget;
    }

    if (this.game.pdcTarget && now - this.game.lastPDCTime >= CONSTANTS.PDC_INTERVAL_MS) {
      this.game.lastPDCTime = now;
      
      // Firing visual (tracer)
      this.game.activePDCTracer = {
        startTime: now,
        startX: podX,
        startY: podY,
        target: this.game.pdcTarget 
      };

      // 10% chance to destroy
      if (Math.random() < CONSTANTS.PDC_CHANCE) {
        const bIdx = this.game.invaderBullets.indexOf(this.game.pdcTarget);
        if (bIdx > -1) {
          this.game.invaderBullets.splice(bIdx, 1);
        } else {
          const mIdx = this.game.bossMissiles.indexOf(this.game.pdcTarget);
          if (mIdx > -1) this.game.bossMissiles.splice(mIdx, 1);
        }
        this.game.particles.spawnExplosion(this.game.pdcTarget.x + this.game.pdcTarget.w / 2, this.game.pdcTarget.y + this.game.pdcTarget.h / 2, '#ffffff', 0, Math.PI * 2, 5);
        this.game.pdcTarget = null; // Clear target after destruction
      }
    }
  }

  updateLightning(now) {
    if (this.game.activeLightning && now - this.game.activeLightning.startTime > CONSTANTS.LIGHTNING_DURATION_MS) {
      this.game.activeLightning = null;
    }

    if (this.game.lightningLevel <= 0 || !this.game.player.pods.right.active || this.game.invaders.length === 0) return;

    if (now - this.game.lastLightningTime >= CONSTANTS.LIGHTNING_INTERVAL_MS) {
      const randomIdx = Math.floor(Math.random() * this.game.invaders.length);
      const target = this.game.invaders[randomIdx];

      if (target) {
        this.game.lastLightningTime = now;
        
        this.game.particles.spawnDamageText(target.x + target.w / 2, target.y + target.h / 2, this.game.playerDamage);
        this.game.particles.spawnLightningHit(target.x + target.w / 2, target.y + target.h / 2);
        target.hp -= this.game.playerDamage;
        if (target.hp <= 0) {
          this.game.score += target.scoreValue;
          this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 20, target.scoreValue);
          this.game.particles.spawnExplosion(target.x + target.w / 2, target.y + target.h / 2, target.color);
          this.game.spawnUpgrade(target.x, target.y);
          this.game.invaders.splice(randomIdx, 1);
          this.game.ui.updateStats(this.game);
        }

        const rx = this.game.player.x + this.game.player.w + this.game.player.podGap + this.game.player.podW / 2;
        const ry = this.game.player.y + this.game.player.h / 2;
        const targetX = target.x + target.w / 2;
        const targetY = target.y + target.h / 2;
        
        const dist = Math.sqrt((targetX - rx) ** 2 + (targetY - ry) ** 2);
        const segments = Math.max(4, Math.floor(dist / 30)); 
        
        const points = [];
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const x = rx + (targetX - rx) * t;
          const y = ry + (targetY - ry) * t;
          
          let offX = 0, offY = 0;
          if (i > 0 && i < segments) {
            offX = (Math.random() - 0.5) * CONSTANTS.LIGHTNING_OFFSET * 2;
            offY = (Math.random() - 0.5) * CONSTANTS.LIGHTNING_OFFSET * 2;
          }
          points.push({ x: x + offX, y: y + offY });
        }

        this.game.activeLightning = {
          startTime: now,
          points,
          target: target,
          isPodLightning: true
        };
      }
    }
  }

  updateRockets(now) {
    const currentLowest = this.game.getLowestRowInvaders();
    if (this.game.rocketLevel > 0 && currentLowest.length > 0 && now - this.game.lastRocketTime >= CONSTANTS.ROCKET_INTERVAL_MS) {
      this.game.lastRocketTime = now;
      const targetInv = currentLowest[Math.floor(Math.random() * currentLowest.length)];
      this.game.rockets.push({
        x: this.game.player.x + this.game.player.w / 2 - CONSTANTS.ROCKET_W / 2,
        y: this.game.player.y,
        targetX: targetInv.x + targetInv.w / 2,
        targetY: targetInv.y + targetInv.h / 2,
        vx: 0, vy: -CONSTANTS.ROCKET_INITIAL_SPEED,
        distanceTraveled: 0,
      });
    }

    this.game.rockets = this.game.rockets.filter((r) => {
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
      const distSq = dx * dx + dy * dy;
      const hitRadiusSq = CONSTANTS.ROCKET_HIT_RADIUS * CONSTANTS.ROCKET_HIT_RADIUS;

      if (distSq < hitRadiusSq) {
        const blastRadius = this.game.rocketLevel * CONSTANTS.INVADER_W;
        this.game.shake = 10;
        
        this.game.particles.spawnExplosion(cx, cy, COLORS.rocket, 0, Math.PI * 2, blastRadius * 0.8);
        this.game.particles.spawnExplosion(cx, cy, '#ffffff', 0, Math.PI * 2, blastRadius * 0.4);

        for (let i = this.game.invaders.length - 1; i >= 0; i--) {
          const inv = this.game.invaders[i];
          const invCx = inv.x + inv.w / 2;
          const invCy = inv.y + inv.h / 2;
          const distSqToInv = (invCx - cx) ** 2 + (invCy - cy) ** 2;
          const checkRange = blastRadius + Math.max(inv.w, inv.h) / 2;
          
          if (distSqToInv <= checkRange * checkRange) {
            this.game.particles.spawnDamageText(invCx, invCy, this.game.playerDamage);
            inv.hp -= this.game.playerDamage;
            if (inv.hp <= 0) {
              const gain = Math.floor(inv.scoreValue * 1.5);
              this.game.score += gain;
              this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 20, gain);
              this.game.particles.spawnExplosion(invCx, invCy, inv.color, 0, Math.PI * 2, 0);
              
              if (inv.isBoss) {
                this.game.shake = 40;
                this.game.particles.spawnExplosion(inv.x + inv.w / 4, inv.y + inv.h / 4, inv.color, 0, Math.PI * 2, 20);
                this.game.particles.spawnExplosion(inv.x + inv.w * 0.75, inv.y + inv.h * 0.75, inv.color, 0, Math.PI * 2, 20);
                this.game.spawnUpgrade(inv.x + inv.w / 4, inv.y + inv.h / 2);
                this.game.spawnUpgrade(inv.x + inv.w * 0.75, inv.y + inv.h / 2);
                this.game.spawnUpgrade(inv.x + inv.w / 2, inv.y + inv.h / 2);
              } else {
                this.game.spawnUpgrade(inv.x, inv.y);
              }
              
              this.game.invaders.splice(i, 1);
            }
          }
        }
        this.game.ui.updateStats(this.game);
        return false;
      }

      const dist = Math.sqrt(distSq);
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
      this.game.particles.spawnRocketTrail(r.x + CONSTANTS.ROCKET_W / 2, r.y + CONSTANTS.ROCKET_H / 2, r.vx, r.vy);
      r.distanceTraveled += Math.sqrt(r.vx * r.vx + r.vy * r.vy);
      
      if (r.y < -CONSTANTS.ROCKET_H * 2 || r.y > this.game.H + CONSTANTS.ROCKET_H || r.x < -CONSTANTS.ROCKET_W * 2 || r.x > this.game.W + CONSTANTS.ROCKET_W) return false;
      return true;
    });
  }
}
