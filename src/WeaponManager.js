import { COLORS, CONSTANTS } from './constants.js';
import { Projectile } from './entities/Projectile.js';

export class WeaponManager {
  constructor(game) {
    this.game = game;
    
    // Pooled Sprites (The PIXI objects)
    this.pools = {
      bullet: [],
      invaderBullet: [],
      bossMissile: [],
      rocket: []
    };
    
    this.lightningGraphics = new PIXI.Graphics();
    this.game.effectLayer.addChild(this.lightningGraphics);

    this.pdcGraphics = new PIXI.Graphics();
    this.game.effectLayer.addChild(this.pdcGraphics);

    this.markerGraphics = new PIXI.Graphics();
    this.game.effectLayer.addChild(this.markerGraphics);
  }

  getSprite(type) {
    let sprite = this.pools[type].pop();
    if (!sprite) {
      sprite = new PIXI.Sprite(this.game.sprites.getTexture(type));
      sprite.anchor.set(0.5);
      this.game.projectileLayer.addChild(sprite);
    }
    sprite.visible = true;
    return sprite;
  }

  returnSprite(type, sprite) {
    if (sprite) {
      sprite.visible = false;
      this.pools[type].push(sprite);
    }
  }

  parseColor(hex) {
    return parseInt(hex.replace('#', '0x'));
  }

  playerShoot(now) {
    if (!this.game.spacePressed || now - this.game.lastPlayerShot < CONSTANTS.PLAYER_SHOOT_COOLDOWN) return;
    this.game.lastPlayerShot = now;
    
    if (this.game.bullets.length < CONSTANTS.WEAPON_MAX_BULLETS) {
      const spread = CONSTANTS.WEAPON_BULLET_SPREAD;
      const startX = this.game.player.x + this.game.player.w / 2 - CONSTANTS.BULLET_W / 2 - (this.game.shotCount - 1) * (spread / 2);
      for (let i = 0; i < this.game.shotCount; i++) {
        this.game.bullets.push(new Projectile(this.game, 
          startX + i * spread, this.game.player.y, 
          'bullet', 
          { w: CONSTANTS.BULLET_W, h: CONSTANTS.BULLET_H, pierceCount: this.game.hasPierce ? 1 : 0 }
        ));
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
        this.game.pdcTarget.deactivate();
        this.game.audio.playSFX('explosion');
        
        const hitX = this.game.pdcTarget.x + this.game.pdcTarget.w / 2;
        const hitY = this.game.pdcTarget.y + this.game.pdcTarget.h / 2;
        this.game.particles.spawnExplosion(hitX, hitY, '#ffffff', 0, Math.PI * 2, CONSTANTS.WEAPON_PDC_EXPLOSION_RADIUS);
        
        this.game.activePDCTracer.destroyed = true;
        this.game.activePDCTracer.frozenX = hitX;
        this.game.activePDCTracer.frozenY = hitY;
        this.game.pdcTarget = null;
      }
    }

    if (this.game.activePDCTracer) {
      const tracer = this.game.activePDCTracer;
      const endX = tracer.destroyed ? tracer.frozenX : (tracer.target.x + tracer.target.w / 2);
      const endY = tracer.destroyed ? tracer.frozenY : (tracer.target.y + tracer.target.h / 2);
      
      this.pdcGraphics.clear();
      this.pdcGraphics.lineStyle(CONSTANTS.WEAPON_PDC_TRACER_WIDTH, 0xffffff, 1);
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
        
        if (target.takeDamage(this.game.playerDamage)) {
          this.game.collisions.handleInvaderDeath(target, randomIdx);
        }

        const rx = this.game.player.x + this.game.player.w + this.game.player.podGap + this.game.player.podW / 2;
        const ry = this.game.player.y + this.game.player.h / 2;
        const targetX = target.x + target.w / 2;
        const targetY = target.y + target.h / 2;
        
        const dist = Math.sqrt((targetX - rx) ** 2 + (targetY - ry) ** 2);
        const segments = Math.max(CONSTANTS.WEAPON_LIGHTNING_SEGMENTS_MIN, Math.floor(dist / CONSTANTS.LIGHTNING_SEGMENT_DIST)); 
        
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
    const bw = t < 0.5 ? CONSTANTS.WEAPON_LIGHTNING_LINE_WIDTH_BASE : CONSTANTS.WEAPON_LIGHTNING_LINE_WIDTH_GLOW * (1 - t);

    this.lightningGraphics.clear();
    this.lightningGraphics.lineStyle(bw + CONSTANTS.WEAPON_LIGHTNING_LINE_WIDTH_OUTLINE, 0x000000, 1);
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

  updateRockets(dt = 1) {
    this.markerGraphics.clear();
    const now = performance.now();
    const currentLowest = this.game.getLowestRowInvaders();
    
    if (this.game.rocketLevel > 0 && currentLowest.length > 0 && now - this.game.lastRocketTime >= CONSTANTS.ROCKET_INTERVAL_MS) {
      this.game.lastRocketTime = now;
      const targetInv = currentLowest[Math.floor(Math.random() * currentLowest.length)];
      
      this.game.rockets.push(new Projectile(this.game,
        this.game.player.x + this.game.player.w / 2 - CONSTANTS.ROCKET_W / 2,
        this.game.player.y,
        'rocket',
        { 
          w: CONSTANTS.ROCKET_W, h: CONSTANTS.ROCKET_H,
          targetX: targetInv.x + targetInv.w / 2, targetY: targetInv.y + targetInv.h / 2,
          vy: -CONSTANTS.ROCKET_INITIAL_SPEED * this.game.heightFactor
        }
      ));
    }

    for (let j = this.game.rockets.length - 1; j >= 0; j--) {
      const r = this.game.rockets[j];
      r.update(dt);
      
      if (r.toDestroy) {
        this.game.rockets.splice(j, 1);
        continue;
      }

      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const distSq = (r.targetX - cx) ** 2 + (r.targetY - cy) ** 2;
      const hitRadiusSq = CONSTANTS.ROCKET_HIT_RADIUS * CONSTANTS.ROCKET_HIT_RADIUS;

      if (distSq < hitRadiusSq) {
        const blastRadius = this.game.rocketLevel * CONSTANTS.INVADER_W;
        this.game.shake = CONSTANTS.SHAKE_POD_HIT; // Using POD_HIT as a base for rocket shake
        this.game.audio.playSFX('explosion');
        
        this.game.particles.spawnExplosion(cx, cy, COLORS.rocket, 0, Math.PI * 2, blastRadius * CONSTANTS.WEAPON_ROCKET_EXPLOSION_SPEED_MULT);
        this.game.particles.spawnExplosion(cx, cy, '#ffffff', 0, Math.PI * 2, blastRadius * CONSTANTS.WEAPON_ROCKET_EXPLOSION_WHITE_MULT);

        for (let i = this.game.invaders.length - 1; i >= 0; i--) {
          const inv = this.game.invaders[i];
          const distSqToInv = (inv.x + inv.w/2 - cx) ** 2 + (inv.y + inv.h/2 - cy) ** 2;
          const checkRange = blastRadius + Math.max(inv.w, inv.h) / 2;
          
          if (distSqToInv <= checkRange * checkRange) {
            this.game.particles.spawnDamageText(inv.x + inv.w/2, inv.y + inv.h/2, this.game.playerDamage);
            if (inv.takeDamage(this.game.playerDamage)) {
              this.game.collisions.handleInvaderDeath(inv, i);
            }
          }
        }
        this.game.ui.updateStats(this.game);
        r.deactivate();
        this.game.rockets.splice(j, 1);
      } else {
        // Draw Target Marker
        const rocketColor = this.parseColor(COLORS.rocket);
        this.markerGraphics.lineStyle(CONSTANTS.WEAPON_ROCKET_MARKER_LINE_WIDTH, rocketColor, CONSTANTS.WEAPON_ROCKET_MARKER_ALPHA);
        const size = CONSTANTS.WEAPON_ROCKET_MARKER_SIZE;
        this.markerGraphics.drawCircle(r.targetX, r.targetY, size);
        this.markerGraphics.moveTo(r.targetX - size, r.targetY);
        this.markerGraphics.lineTo(r.targetX + size, r.targetY);
        this.markerGraphics.moveTo(r.targetX, r.targetY - size);
        this.markerGraphics.lineTo(r.targetX, r.targetY + size);
      }
    }
  }
}
