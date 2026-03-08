export class BaseEntity {
  constructor(game, x, y, w, h) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.sprite = null;
    this.toDestroy = false;
  }

  // Update logic - to be overridden
  update(now) {
    this.x += this.vx;
    this.y += this.vy;
    this.syncSprite();
  }

  // Common sprite syncing
  syncSprite() {
    if (this.sprite) {
      // Anchors are usually 0.5 for centered entities
      this.sprite.position.set(this.x + this.w / 2, this.y + this.h / 2);
    }
  }

  // Cleanup helper
  destroy() {
    if (this.sprite) {
      this.game.entityLayer.removeChild(this.sprite);
      this.sprite.destroy({ children: true });
      this.sprite = null;
    }
    this.toDestroy = true;
  }
}
