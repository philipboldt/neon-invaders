import { CONSTANTS } from './constants.js';

export class Renderer {
  constructor(game) {
    this.game = game;
  }

  update(state) {
    // 1. Global World Dimming
    if (this.game.gameWorld) {
      const isMenu = state !== CONSTANTS.GAME_STATES.PLAYING;
      this.game.gameWorld.alpha = isMenu ? 0.3 : 1.0;
    }

    // Screen Shake via GameWorld offset (keeps UI stable)
    if (this.game.shake > 0) {
      this.game.gameWorld.position.set(
        (Math.random() - 0.5) * this.game.shake * 2,
        (Math.random() - 0.5) * this.game.shake * 2
      );
    } else {
      this.game.gameWorld.position.set(0, 0);
    }

    // Ensure stage is always at zero
    this.game.stage.position.set(0, 0);

    // Logic-to-UI sync (dirty checks inside updateStats)
    this.game.ui.updateStats(this.game);
    
    // Update UI animations (breathing, blinking)
    this.game.ui.update(performance.now());
    
    // Explicitly clear transient effects if they were reset
    if (!this.game.activeLightning && this.game.weapons.lightningGraphics) {
      this.game.weapons.lightningGraphics.clear();
    }
    if (!this.game.activePDCTracer && this.game.weapons.pdcGraphics) {
      this.game.weapons.pdcGraphics.clear();
    }
  }
}
