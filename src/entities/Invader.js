import { BaseEntity } from './BaseEntity.js';
import { COLORS, CONSTANTS } from '../constants.js';

export class Invader extends BaseEntity {
  constructor(game, x, y, config) {
    const w = config.w || CONSTANTS.INVADER_W;
    const h = config.h || CONSTANTS.INVADER_H;
    super(game, x, y, w, h);
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
    this.game.entityLayer.addChild(this.sprite);

    // Always scale sprite based on logical width relative to standard invader
    this.sprite.scale.set(this.w / CONSTANTS.INVADER_W);

    this.syncSprite();
    this.syncTint();
  }

  update(now) {
    this.syncSprite();
    this.syncTint();
  }

  syncTint() {
    const ratio = this.maxHp > 1 ? CONSTANTS.INVADER_TINT_MIN + CONSTANTS.INVADER_TINT_RANGE * (this.hp / this.maxHp) : 1;
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
