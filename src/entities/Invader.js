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
    const textureKey = this.isBoss ? `inv_${this.color}` : 'enemy';
    this.sprite = new PIXI.Sprite(this.game.sprites.getTexture(textureKey));
    this.sprite.anchor.set(0.5);
    this.game.entityLayer.addChild(this.sprite);

    // Set absolute size in logical units
    this.sprite.width = this.w;
    this.sprite.height = this.h;

    this.syncSprite();
    this.syncTint();
  }

  update(now) {
    this.syncSprite();
    this.syncTint();
  }

  syncTint() {
    const hpRatio = this.maxHp > 1 ? CONSTANTS.INVADER_TINT_MIN + CONSTANTS.INVADER_TINT_RANGE * (this.hp / this.maxHp) : 1;
    
    // Use the assigned row color as the base tint for ALL invaders
    const baseColor = this.game.ui.parseHexColor(this.color);
    
    if (hpRatio < 1) {
      // Decompose base color into RGB
      const r = (baseColor >> 16) & 0xFF;
      const g = (baseColor >> 8) & 0xFF;
      const b = baseColor & 0xFF;
      
      // Apply hpRatio to each component to darken the neon color as HP drops
      const tr = Math.floor(r * hpRatio);
      const tg = Math.floor(g * hpRatio);
      const tb = Math.floor(b * hpRatio);
      
      const targetTint = (tr << 16) | (tg << 8) | tb;
      if (this.sprite.tint !== targetTint) this.sprite.tint = targetTint;
    } else if (this.sprite.tint !== baseColor) {
      this.sprite.tint = baseColor;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    return this.hp <= 0;
  }
}
