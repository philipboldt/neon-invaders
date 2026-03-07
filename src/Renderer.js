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

    // Sync entities that don't update themselves in the loop
    // Actually, most entities now update their pixi objects in their update/sync methods
    
    // Final HUD/Projectiles sync that might happen every frame
    this.game.weapons.updateProjectilesRender();
    this.game.ui.updateStats(this.game);
  }
}
