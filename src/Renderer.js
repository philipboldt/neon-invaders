export class Renderer {
  constructor(game) {
    this.game = game;
  }

  draw() {
    // Screen Shake via Pixi Stage offset
    if (this.game.shake > 0) {
      this.game.stage.position.set(
        (Math.random() - 0.5) * this.game.shake * 2,
        (Math.random() - 0.5) * this.game.shake * 2
      );
    } else {
      this.game.stage.position.set(0, 0);
    }

    // Final HUD/Projectiles sync that might happen every frame
    this.game.weapons.updateProjectilesRender();
    this.game.ui.updateStats(this.game);
    
    // Explicitly clear transient effects if they were reset
    if (!this.game.activeLightning && this.game.weapons.lightningGraphics) {
      this.game.weapons.lightningGraphics.clear();
    }
    if (!this.game.activePDCTracer && this.game.weapons.pdcGraphics) {
      this.game.weapons.pdcGraphics.clear();
    }
  }
}
