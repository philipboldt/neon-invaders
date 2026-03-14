import { COLORS, CONSTANTS } from './constants.js';

export class Player {
  constructor(W, H, game) {
    this.W = W;
    this.H = H;
    this.game = game;
    this.w = CONSTANTS.PLAYER_W;
    this.h = CONSTANTS.PLAYER_H;
    this.x = W / 2 - this.w / 2;
    this.y = H - CONSTANTS.PLAYER_Y_OFFSET;
    this.speed = CONSTANTS.PLAYER_SPEED;
    this.dir = 0;
    
    // Sidepods
    this.podW = CONSTANTS.POD_W;
    this.podH = CONSTANTS.POD_H;
    this.podGap = CONSTANTS.POD_GAP;
    this.pods = {
      left: { active: false, hp: CONSTANTS.POD_MAX_HP, maxHp: CONSTANTS.POD_MAX_HP },
      right: { active: false, hp: CONSTANTS.POD_MAX_HP, maxHp: CONSTANTS.POD_MAX_HP }
    };

    // PixiJS Sprites
    this.sprite = null;
    this.leftPodSprite = null;
    this.rightPodSprite = null;
    this.initPixi();
  }

  initPixi() {
    this.sprite = new PIXI.Sprite(this.game.sprites.getTexture('player'));
    this.sprite.width = this.w;
    this.sprite.height = this.h;
    this.game.entityLayer.addChild(this.sprite);

    this.leftPodSprite = new PIXI.Graphics();
    this.drawPodGraphics(this.leftPodSprite, COLORS.player);
    this.leftPodSprite.visible = false;
    this.game.entityLayer.addChild(this.leftPodSprite);

    this.rightPodSprite = new PIXI.Graphics();
    this.drawPodGraphics(this.rightPodSprite, COLORS.player);
    this.rightPodSprite.visible = false;
    this.game.entityLayer.addChild(this.rightPodSprite);
  }

  drawPodGraphics(g, color) {
    g.clear();
    g.beginFill(this.parseColor(color));
    g.drawRect(0, 0, this.podW, this.podH);
    g.endFill();
  }

  parseColor(hex) {
    return parseInt(hex.replace('#', '0x'));
  }

  reset() {
    this.x = this.W / 2 - this.w / 2;
    this.y = this.H - CONSTANTS.PLAYER_Y_OFFSET;
    this.dir = 0;
    this.pods.left = { active: false, hp: CONSTANTS.POD_MAX_HP, maxHp: CONSTANTS.POD_MAX_HP };
    this.pods.right = { active: false, hp: CONSTANTS.POD_MAX_HP, maxHp: CONSTANTS.POD_MAX_HP };
    this.updateSpritePositions();
  }

  update(dt = 1) {
    this.x += this.dir * this.speed * dt;
    
    const leftLimit = this.pods.left.active ? this.podW + this.podGap : 0;
    const rightLimit = this.pods.right.active ? this.podW + this.podGap : 0;
    
    this.x = Math.max(leftLimit, Math.min(this.W - this.w - rightLimit, this.x));
    this.updateSpritePositions();
  }

  updateSpritePositions() {
    if (!this.sprite) return;
    this.sprite.position.set(this.x, this.y);
    
    // Switch texture based on shield state
    const textureKey = this.game.shieldHits > 0 ? 'player_shield' : 'player';
    this.sprite.texture = this.game.sprites.getTexture(textureKey);
    
    const podY = this.y + (this.h - this.podH) / 2;
    
    if (this.pods.left.active) {
      this.leftPodSprite.visible = true;
      this.leftPodSprite.position.set(this.x - this.podGap - this.podW, podY);
      const ratio = this.pods.left.hp / this.pods.left.maxHp;
      this.leftPodSprite.tint = ratio >= 1 ? 0xFFFFFF : this.getHealthTint(ratio);
    } else {
      this.leftPodSprite.visible = false;
    }

    if (this.pods.right.active) {
      this.rightPodSprite.visible = true;
      this.rightPodSprite.position.set(this.x + this.w + this.podGap, podY);
      const ratio = this.pods.right.hp / this.pods.right.maxHp;
      this.rightPodSprite.tint = ratio >= 1 ? 0xFFFFFF : this.getHealthTint(ratio);
    } else {
      this.rightPodSprite.visible = false;
    }
  }

  getHealthTint(ratio) {
    const val = Math.floor(255 * (0.45 + 0.55 * ratio));
    return (val << 16) | (val << 8) | val;
  }

  getLeftPodBounds() {
    if (!this.pods.left.active) return null;
    return {
      x: this.x - this.podGap - this.podW,
      y: this.y + (this.h - this.podH) / 2,
      w: this.podW,
      h: this.podH
    };
  }

  getRightPodBounds() {
    if (!this.pods.right.active) return null;
    return {
      x: this.x + this.w + this.podGap,
      y: this.y + (this.h - this.podH) / 2,
      w: this.podW,
      h: this.podH
    };
  }
}
