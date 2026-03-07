import { COLORS, CONSTANTS } from './constants.js';
import { drawRect } from './utils.js';

export class Player {
  constructor(W, H, game) {
    this.W = W;
    this.H = H;
    this.game = game;
    this.w = CONSTANTS.PLAYER_W;
    this.h = CONSTANTS.PLAYER_H;
    this.x = W / 2 - this.w / 2;
    this.y = H - 60;
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
    this.shieldGraphics = null;
    this.initPixi();
  }

  initPixi() {
    this.sprite = new PIXI.Graphics();
    this.drawShipGraphics(this.sprite, COLORS.player);
    this.game.entityLayer.addChild(this.sprite);

    this.leftPodSprite = new PIXI.Graphics();
    this.drawPodGraphics(this.leftPodSprite, COLORS.player);
    this.leftPodSprite.visible = false;
    this.game.entityLayer.addChild(this.leftPodSprite);

    this.rightPodSprite = new PIXI.Graphics();
    this.drawPodGraphics(this.rightPodSprite, COLORS.player);
    this.rightPodSprite.visible = false;
    this.game.entityLayer.addChild(this.rightPodSprite);

    this.shieldGraphics = new PIXI.Graphics();
    this.game.effectLayer.addChild(this.shieldGraphics);
  }

  drawShipGraphics(g, color) {
    g.clear();
    g.beginFill(this.parseColor(color));
    g.drawRect(0, 0, this.w, this.h);
    g.endFill();
    // Windows
    g.beginFill(0x0a0a0f);
    g.drawRect(8, 4, 8, 8);
    g.drawRect(this.w - 16, 4, 8, 8);
    g.endFill();
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
    this.y = this.H - 80;
    this.dir = 0;
    this.pods.left = { active: false, hp: CONSTANTS.POD_MAX_HP, maxHp: CONSTANTS.POD_MAX_HP };
    this.pods.right = { active: false, hp: CONSTANTS.POD_MAX_HP, maxHp: CONSTANTS.POD_MAX_HP };
    this.syncRender();
  }

  update() {
    this.x += this.dir * this.speed;
    
    // Movement constraints based on active sidepods
    const leftLimit = this.pods.left.active ? this.podW + this.podGap : 0;
    const rightLimit = this.pods.right.active ? this.podW + this.podGap : 0;
    
    this.x = Math.max(leftLimit, Math.min(this.W - this.w - rightLimit, this.x));
    this.syncRender();
  }

  syncRender() {
    if (!this.sprite) return;
    this.sprite.position.set(this.x, this.y);
    
    const podY = this.y + (this.h - this.podH) / 2;
    
    if (this.pods.left.active) {
      this.leftPodSprite.visible = true;
      this.leftPodSprite.position.set(this.x - this.podGap - this.podW, podY);
      const ratio = this.pods.left.hp / this.pods.left.maxHp;
      this.leftPodSprite.tint = ratio >= 1 ? 0xFFFFFF : this.getTint(ratio);
    } else {
      this.leftPodSprite.visible = false;
    }

    if (this.pods.right.active) {
      this.rightPodSprite.visible = true;
      this.rightPodSprite.position.set(this.x + this.w + this.podGap, podY);
      const ratio = this.pods.right.hp / this.pods.right.maxHp;
      this.rightPodSprite.tint = ratio >= 1 ? 0xFFFFFF : this.getTint(ratio);
    } else {
      this.rightPodSprite.visible = false;
    }

    // Shield
    this.shieldGraphics.clear();
    if (this.game.shieldHits > 0) {
      this.shieldGraphics.lineStyle(3, this.parseColor(COLORS.shield), 1);
      let sX = this.x - 4;
      let sW = this.w + 8;
      if (this.pods.left.active) { sX -= (this.podW + this.podGap); sW += (this.podW + this.podGap); }
      if (this.pods.right.active) { sW += (this.podW + this.podGap); }
      this.shieldGraphics.drawRect(sX, this.y - 4, sW, this.h + 8);
    }
  }

  getTint(ratio) {
    const val = Math.floor(255 * (0.45 + 0.55 * ratio));
    return (val << 16) | (val << 8) | val;
  }

  draw(ctx, shieldHits) {
    // Legacy draw for progressive migration, will be removed later
  }
}
