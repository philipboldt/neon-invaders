import { BaseEntity } from './BaseEntity.js';
import { CONSTANTS, COLORS } from '../constants.js';

export class Projectile extends BaseEntity {
  constructor(game, x, y, type, config = {}) {
    super(game, x, y, config.w || 0, config.h || 0);
    this.type = type;
    this.config = config;
    
    // For Pooled Projectiles, we reuse the instance but re-init data
    this.init(x, y, config);
  }

  init(x, y, config) {
    this.x = x;
    this.y = y;
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.w = config.w || this.w;
    this.h = config.h || this.h;
    this.toDestroy = false;
    
    // Unique data for rockets
    this.targetX = config.targetX || 0;
    this.targetY = config.targetY || 0;
    this.distanceTraveled = 0;

    // Get/Reset sprite from pool
    if (!this.sprite) {
      this.sprite = this.game.weapons.getSprite(this.type);
    }
    this.sprite.visible = true;
    this.syncSprite();
    
    if (this.type === 'bossMissile') {
      this.sprite.rotation = (config.angle || 0) - Math.PI / 2;
    }
  }

  update(now) {
    this.x += this.vx;
    this.y += this.vy;
    
    if (this.type === 'rocket') {
      this.updateRocketLogic();
    }

    this.syncSprite();
    if (this.type === 'rocket') {
      this.sprite.rotation = Math.atan2(this.vy, this.vx) + Math.PI / 2;
      this.game.particles.spawnRocketTrail(this.x + this.w / 2, this.y + this.h / 2, this.vx, this.vy);
      this.distanceTraveled += Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }

    this.checkBounds();
  }

  updateRocketLogic() {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    
    // Dynamic Retargeting
    const currentLowest = this.game.getLowestRowInvaders();
    if (currentLowest.length > 0) {
      let bestInv = null;
      let bestD = Infinity;
      for (const inv of currentLowest) {
        const d = (inv.x + inv.w/2 - cx) ** 2 + (inv.y + inv.h/2 - cy) ** 2;
        if (d < bestD) { bestD = d; bestInv = inv; }
      }
      if (bestInv) {
        this.targetX = bestInv.x + bestInv.w / 2;
        this.targetY = bestInv.y + bestInv.h / 2;
      }
    }

    const dx = this.targetX - cx;
    const dy = this.targetY - cy;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    const maxSpeed = CONSTANTS.ROCKET_MAX_SPEED * this.game.heightFactor;
    const thrust = CONSTANTS.ROCKET_THRUST * this.game.heightFactor;
    const verticalPhaseLimit = CONSTANTS.ROCKET_VERTICAL_PHASE * this.game.heightFactor;

    if (dist > 0 && this.distanceTraveled >= verticalPhaseLimit) {
      const desiredDx = (dx / dist) * maxSpeed;
      const desiredDy = (dy / dist) * maxSpeed;
      this.vx += (desiredDx - this.vx) * CONSTANTS.ROCKET_STEER_STRENGTH;
      this.vy += (desiredDy - this.vy) * CONSTANTS.ROCKET_STEER_STRENGTH;
    }

    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed > 0) {
      this.vx += (this.vx / currentSpeed) * thrust;
      this.vy += (this.vy / currentSpeed) * thrust;
      const finalSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (finalSpeed > maxSpeed) {
        this.vx = (this.vx / finalSpeed) * maxSpeed;
        this.vy = (this.vy / finalSpeed) * maxSpeed;
      }
    }
  }

  checkBounds() {
    const buffer = 50;
    if (this.y < -buffer || this.y > this.game.H + buffer || this.x < -buffer || this.x > this.game.W + buffer) {
      this.deactivate();
    }
  }

  deactivate() {
    if (this.sprite) {
      this.game.weapons.returnSprite(this.type, this.sprite);
      this.sprite = null; // Important: we release the sprite back to the pool
    }
    this.toDestroy = true;
  }
}
