import { BaseEntity } from './BaseEntity.js';
import { COLORS, CONSTANTS } from '../constants.js';

export class Invader extends BaseEntity {
  constructor(game, x, y, config) {
    super(game, x, y, config.w, config.h);
    this.color = config.color;
    this.maxHp = config.maxHp;
    this.hp = config.hp;
    this.isBoss = config.isBoss || false;
    this.scoreValue = config.scoreValue;
    
    this.initSprite();
  }

  initSprite() {
    const textureKey = `inv_${this.color}`;
    this.sprite = new PIXI.Sprite(this.game.sprites.getTexture(textureKey));
    this.sprite.anchor.set(0.5);
    
    if (this.isBoss) {
      this.sprite.width = this.w + 40;
      this.sprite.height = this.h + 40;
    } else {
      this.sprite.width = this.w;
      this.sprite.height = this.h;
    }

    this.game.entityLayer.addChild(this.sprite);
    this.syncSprite();
    this.syncTint();
  }

  // Invaders move as a grid, so x/y are updated by EntityManager
  // but they handle their own tinting and sprite syncing
  update(now) {
    this.syncSprite();
    this.syncTint();
  }

  syncTint() {
    const ratio = this.maxHp > 1 ? 0.45 + 0.55 * (this.hp / this.maxHp) : 1;
    if (ratio < 1) {
      const val = Math.floor(255 * ratio);
      const targetTint = (val << 16) | (val << 8) | val;
      if (this.sprite.tint !== targetTint) this.sprite.tint = targetTint;
    } else if (this.sprite.tint !== 0xFFFFFF) {
      this.sprite.tint = 0xFFFFFF;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    return this.hp <= 0;
  }
}
