import { BaseEntity } from './BaseEntity.js';
import { CONSTANTS, COLORS } from '../constants.js';

export class Upgrade extends BaseEntity {
  constructor(game, x, y, type, level) {
    super(game, x, y, CONSTANTS.UPGRADE_W, CONSTANTS.UPGRADE_H);
    this.type = type;
    this.level = level;
    this.vy = CONSTANTS.UPGRADE_SPEED;
    
    this.initSprite();
  }

  initSprite() {
    this.sprite = new PIXI.Sprite(this.game.sprites.getTexture(`upg_${this.type}`));
    this.sprite.anchor.set(0.5);
    this.game.entityLayer.addChild(this.sprite);
    
    if (this.type === 'points') {
      const amount = this.level * CONSTANTS.POINTS_MULTIPLIER;
      const textStr = amount >= 1000 ? (amount / 1000).toFixed(1) + 'k' : amount;
      const text = new PIXI.Text(textStr, { 
        fontFamily: 'Orbitron', fontSize: 10, fontWeight: 'bold', fill: 0x000000, align: 'center' 
      });
      text.anchor.set(0.5);
      text.position.set(0, 1);
      this.sprite.addChild(text);
    }
    
    this.syncSprite();
  }

  update(now) {
    this.y += this.vy;
    this.syncSprite();
    
    if (this.y > this.game.H + 50) {
      this.destroy();
    }
  }
}
