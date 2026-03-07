import { COLORS, CONSTANTS } from './constants.js';

export class WeaponManager {
  constructor(game) {
    this.game = game;
    this.bulletGraphics = new PIXI.Graphics();
    this.game.projectileLayer.addChild(this.bulletGraphics);

    this.invaderBulletGraphics = new PIXI.Graphics();
    this.game.projectileLayer.addChild(this.invaderBulletGraphics);

    this.bossMissileGraphics = new PIXI.Graphics();
    this.game.projectileLayer.addChild(this.bossMissileGraphics);

    this.rocketGraphics = new PIXI.Graphics();
    this.game.projectileLayer.addChild(this.rocketGraphics);

    this.lightningGraphics = new PIXI.Graphics();
    this.game.effectLayer.addChild(this.lightningGraphics);

    this.pdcGraphics = new PIXI.Graphics();
    this.game.effectLayer.addChild(this.pdcGraphics);

    this.markerGraphics = new PIXI.Graphics();
    this.game.effectLayer.addChild(this.markerGraphics);
  }

  updateProjectilesRender() {
    // Bullets
    this.bulletGraphics.clear();
    this.bulletGraphics.beginFill(this.parseColor(COLORS.bullet));
    this.game.bullets.forEach(b => {
      this.bulletGraphics.drawRect(b.x, b.y, b.w, b.h);
    });
    this.bulletGraphics.endFill();

    // Invader Bullets
    this.invaderBulletGraphics.clear();
    this.invaderBulletGraphics.beginFill(this.parseColor(COLORS.invader1));
    this.game.invaderBullets.forEach(b => {
      this.invaderBulletGraphics.drawRect(b.x, b.y, b.w, b.h);
    });
    this.invaderBulletGraphics.endFill();

    // Boss Missiles
    this.bossMissileGraphics.clear();
    this.game.bossMissiles.forEach(m => {
      this.bossMissileGraphics.beginFill(this.parseColor(COLORS.boss));
      const matrix = new PIXI.Matrix();
      // Correct order for local rotation: rotate first, then translate to world coordinates
      matrix.rotate(m.angle - Math.PI / 2);
      matrix.translate(m.x + m.w / 2, m.y + m.h / 2);
      this.bossMissileGraphics.setMatrix(matrix);
      this.bossMissileGraphics.drawRect(-m.w / 2, -m.h / 2, m.w, m.h);
      this.bossMissileGraphics.setMatrix(new PIXI.Matrix());
      this.bossMissileGraphics.endFill();
    });

    // Rockets & Target Markers
    this.rocketGraphics.clear();
    this.markerGraphics.clear();
    const rocketColor = this.parseColor(COLORS.rocket);
    
    this.game.rockets.forEach(r => {
      // Draw Rocket
      this.rocketGraphics.beginFill(rocketColor);
      const matrix = new PIXI.Matrix();
      
      // Correct order for local rotation: rotate first, then translate to world coordinates
      matrix.rotate(Math.atan2(r.vy, r.vx) + Math.PI / 2);
      matrix.translate(r.x + CONSTANTS.ROCKET_W / 2, r.y + CONSTANTS.ROCKET_H / 2);
      
      this.rocketGraphics.setMatrix(matrix);
      this.rocketGraphics.drawRect(-CONSTANTS.ROCKET_W / 2, -CONSTANTS.ROCKET_H / 2, CONSTANTS.ROCKET_W, CONSTANTS.ROCKET_H);
      this.rocketGraphics.setMatrix(new PIXI.Matrix());
      this.rocketGraphics.endFill();

      // Draw Target Marker
      this.markerGraphics.lineStyle(2, rocketColor, 0.6);
      const size = 15;
      this.markerGraphics.drawCircle(r.targetX, r.targetY, size);
      this.markerGraphics.moveTo(r.targetX - size, r.targetY);
      this.markerGraphics.lineTo(r.targetX + size, r.targetY);
      this.markerGraphics.moveTo(r.targetX, r.targetY - size);
      this.markerGraphics.lineTo(r.targetX, r.targetY + size);
    });
  }

  parseColor(hex) {
    return parseInt(hex.replace('#', '0x'));
  }

  playerShoot(now) {
    if (!this.game.spacePressed || now - this.game.lastPlayerShot < CONSTANTS.PLAYER_SHOOT_COOLDOWN) return;
    this.game.lastPlayerShot = now;
    const maxBullets = 15; 
    
    if (this.game.bullets.length < maxBullets) {
      const spread = 14;
      const startX = this.game.player.x + this.game.player.w / 2 - CONSTANTS.BULLET_W / 2 - (this.game.shotCount - 1) * (spread / 2);
      for (let i = 0; i < this.game.shotCount; i++) {
        this.game.bullets.push({ x: startX + i * spread, y: this.game.player.y, w: CONSTANTS.BULLET_W, h: CONSTANTS.BULLET_H });
      }
    }
  }

  updatePDC(now) {
    if (this.game.activePDCTracer && now - this.game.activePDCTracer.startTime > CONSTANTS.PDC_TRACER_LIFE) {
      this.game.activePDCTracer = null;
      this.pdcGraphics.clear();
    }

    if (!this.game.player.pods.left.active) {
      this.game.pdcTarget = null;
      this.game.activePDCTracer = null;
      this.pdcGraphics.clear();
      return;
    }

    const podX = this.game.player.x - this.game.player.podGap - this.game.player.podW / 2;
    const podY = this.game.player.y + this.game.player.h / 2;

    if (this.game.pdcTarget) {
      const targets = [...this.game.invaderBullets, ...this.game.bossMissiles];
      const stillExists = targets.includes(this.game.pdcTarget);
      const isAbovePlayer = this.game.pdcTarget.y < this.game.player.y;
      
      if (!stillExists || !isAbovePlayer) {
        this.game.pdcTarget = null;
      }
    }

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
      
      this.game.activePDCTracer = {
        startTime: now,
        target: this.game.pdcTarget,
        destroyed: false,
        frozenX: 0,
        frozenY: 0
      };

      if (Math.random() < CONSTANTS.PDC_CHANCE) {
        const bIdx = this.game.invaderBullets.indexOf(this.game.pdcTarget);
        if (bIdx > -1) {
          this.game.invaderBullets.splice(bIdx, 1);
        } else {
          const mIdx = this.game.bossMissiles.indexOf(this.game.pdcTarget);
          if (mIdx > -1) this.game.bossMissiles.splice(mIdx, 1);
        }
        
        const hitX = this.game.pdcTarget.x + this.game.pdcTarget.w / 2;
        const hitY = this.game.pdcTarget.y + this.game.pdcTarget.h / 2;
        this.game.particles.spawnExplosion(hitX, hitY, '#ffffff', 0, Math.PI * 2, 5);
        
        this.game.activePDCTracer.destroyed = true;
        this.game.activePDCTracer.frozenX = hitX;
        this.game.activePDCTracer.frozenY = hitY;
        this.game.pdcTarget = null;
      }
    }

    // Dynamic redrawing for the lifetime of the tracer
    if (this.game.activePDCTracer) {
      const tracer = this.game.activePDCTracer;
      const endX = tracer.destroyed ? tracer.frozenX : (tracer.target.x + tracer.target.w / 2);
      const endY = tracer.destroyed ? tracer.frozenY : (tracer.target.y + tracer.target.h / 2);
      
      this.pdcGraphics.clear();
      this.pdcGraphics.lineStyle(2, 0xffffff, 1);
      this.pdcGraphics.moveTo(podX, podY);
      this.pdcGraphics.lineTo(endX, endY);
    }
  }

  updateLightning(now) {
    if (this.game.activeLightning && now - this.game.activeLightning.startTime > CONSTANTS.LIGHTNING_DURATION_MS) {
      this.game.activeLightning = null;
      this.lightningGraphics.clear();
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
          if (target.isBoss) {
            this.game.shake = CONSTANTS.SHAKE_BOSS_DEATH;
            this.game.particles.spawnStunningExplosion(target.x + target.w / 2, target.y + target.h / 2, target.color);
            this.game.spawnUpgrade(target.x + target.w / 4, target.y + target.h / 2);
            this.game.spawnUpgrade(target.x + target.w * 0.75, target.y + target.h / 2);
            this.game.spawnUpgrade(target.x + target.w / 2, target.y + target.h / 2);
            
            this.game.maxLives += CONSTANTS.STAT_POTENTIAL_GAIN;
            this.game.maxDamage += CONSTANTS.STAT_POTENTIAL_GAIN;
            this.game.particles.spawnScoreText(this.game.player.x + this.game.player.w / 2, this.game.player.y - 60, "POTENTIAL INCREASED!");
          } else {
            this.game.spawnUpgrade(target.x, target.y);
          }
          
          if (target.sprite) {
            this.game.entityLayer.removeChild(target.sprite);
            target.sprite.destroy();
          }
          this.game.invaders.splice(randomIdx, 1);

        const rx = this.game.player.x + this.game.player.w + this.game.player.podGap + this.game.player.podW / 2;
        const ry = this.game.player.y + this.game.player.h / 2;
        const targetX = target.x + target.w / 2;
        const targetY = target.y + target.h / 2;
        
        const dist = Math.sqrt((targetX - rx) ** 2 + (targetY - ry) ** 2);
        const segments = Math.max(4, Math.floor(dist / CONSTANTS.LIGHTNING_SEGMENT_DIST)); 
        
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

    if (this.game.activeLightning) {
      this.renderLightning(now);
    }
  }

  renderLightning(now) {
    if (!this.game.activeLightning) return;
    const age = now - this.game.activeLightning.startTime;
    const t = age / CONSTANTS.LIGHTNING_DURATION_MS;
    const rx = this.game.player.x + this.game.player.w + this.game.player.podGap + this.game.player.podW / 2;
    const ry = this.game.player.y + this.game.player.h / 2;
    const target = this.game.activeLightning.target;
    const tx = target.hp > 0 ? target.x + target.w / 2 : this.game.activeLightning.points[this.game.activeLightning.points.length-1].x;
    const ty = target.hp > 0 ? target.y + target.h / 2 : this.game.activeLightning.points[this.game.activeLightning.points.length-1].y;

    const color = t < 0.25 ? 0x555555 : t < 0.50 ? 0x00f5ff : t < 0.75 ? 0xffffff : t < 0.90 ? 0x00f5ff : 0x555555;
    const bw = t < 0.5 ? 12 : 24 * (1 - t);

    this.lightningGraphics.clear();
    this.lightningGraphics.lineStyle(bw + 4, 0x000000, 1);
    this.drawLightningPath(rx, ry, tx, ty, this.game.activeLightning.points);
    this.lightningGraphics.lineStyle(bw, color, 1);
    this.drawLightningPath(rx, ry, tx, ty, this.game.activeLightning.points);
  }

  drawLightningPath(rx, ry, tx, ty, origPoints) {
    this.lightningGraphics.moveTo(rx, ry);
    for (let i = 1; i < origPoints.length - 1; i++) {
      const segT = i / (origPoints.length - 1);
      const curX = rx + (tx - rx) * segT;
      const curY = ry + (ty - ry) * segT;
      const origBaseX = origPoints[0].x + (origPoints[origPoints.length-1].x - origPoints[0].x) * segT;
      const origBaseY = origPoints[0].y + (origPoints[origPoints.length-1].y - origPoints[0].y) * segT;
      this.lightningGraphics.lineTo(curX + (origPoints[i].x - origBaseX), curY + (origPoints[i].y - origBaseY));
    }
    this.lightningGraphics.lineTo(tx, ty);
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
        vx: 0, 
        vy: -CONSTANTS.ROCKET_INITIAL_SPEED * this.game.heightFactor,
        distanceTraveled: 0,
      });
    }

    this.game.rockets = this.game.rockets.filter((r) => {
      const cx = r.x + CONSTANTS.ROCKET_W / 2;
      const cy = r.y + CONSTANTS.ROCKET_H / 2;

      if (currentLowest.length > 0) {
        let bestInv = null;
        let bestD = Infinity;
        for (const inv of currentLowest) {
          const invCx = inv.x + inv.w / 2;
          const invCy = inv.y + inv.h / 2;
          const d = (invCx - cx) ** 2 + (invCy - cy) ** 2;
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
              
              if (inv.sprite) {
                this.game.entityLayer.removeChild(inv.sprite);
                inv.sprite.destroy();
              }
              this.game.invaders.splice(i, 1);
            }
          }
        }
        this.game.ui.updateStats(this.game);
        return false;
      }

      const dist = Math.sqrt(distSq);
      const maxSpeed = CONSTANTS.ROCKET_MAX_SPEED * this.game.heightFactor;
      const thrust = CONSTANTS.ROCKET_THRUST * this.game.heightFactor;
      const verticalPhaseLimit = CONSTANTS.ROCKET_VERTICAL_PHASE * this.game.heightFactor;

      if (dist > 0 && r.distanceTraveled >= verticalPhaseLimit) {
        const desiredDx = (dx / dist) * maxSpeed;
        const desiredDy = (dy / dist) * maxSpeed;
        const steerX = desiredDx - r.vx;
        const steerY = desiredDy - r.vy;
        r.vx += steerX * CONSTANTS.ROCKET_STEER_STRENGTH;
        r.vy += steerY * CONSTANTS.ROCKET_STEER_STRENGTH;
      }

      const speed = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
      if (speed > 0) {
        r.vx += (r.vx / speed) * thrust;
        r.vy += (r.vy / speed) * thrust;
        const newSpeed = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
        if (newSpeed > maxSpeed) {
          r.vx = (r.vx / newSpeed) * maxSpeed;
          r.vy = (r.vy / newSpeed) * maxSpeed;
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
