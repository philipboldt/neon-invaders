export class Renderer {
  constructor(game) {
    this.game = game;
  }

  update() {
    // Screen Shake via Pixi Stage offset
    if (this.game.shake > 0) {
      this.game.stage.position.set(
        (Math.random() - 0.5) * this.game.shake * 2,
        (Math.random() - 0.5) * this.game.shake * 2
      );
    } else {
      this.game.stage.position.set(0, 0);
    }

    // Logic-to-UI sync (dirty checks inside updateStats)
    this.game.ui.updateStats(this.game);
    
    // Breathing animation for title if visible
    if (this.game.ui.mainTitleContainer && this.game.ui.mainTitleContainer.alpha > 0.5) {
      const scale = 1 + Math.sin(performance.now() / 500) * 0.03;
      this.game.ui.mainTitleContainer.scale.set(scale);
    } else if (this.game.ui.mainTitleContainer) {
      this.game.ui.mainTitleContainer.scale.set(1.0);
    }

    // Blinking animation for start prompt
    if (this.game.ui.startPromptText && this.game.ui.startPromptText.visible) {
      this.game.ui.startPromptText.alpha = 0.5 + Math.sin(performance.now() / 300) * 0.5;
    }
    
    // Explicitly clear transient effects if they were reset
    if (!this.game.activeLightning && this.game.weapons.lightningGraphics) {
      this.game.weapons.lightningGraphics.clear();
    }
    if (!this.game.activePDCTracer && this.game.weapons.pdcGraphics) {
      this.game.weapons.pdcGraphics.clear();
    }
  }
}
