export class InputManager {
  constructor(game) {
    this.game = game;
  }

  bindInputs() {
    // 1. Unified Pointer/Tap Router
    this.game.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      
      switch(this.game.state) {
        case 'START':
        case 'GAMEOVER':
          this.game.startGame();
          break;
        case 'PAUSED':
          this.game.togglePause();
          break;
        case 'BOSSKILLED':
          this.game.ui.hideBossClear();
          break;
        case 'HIGHSCORE':
          // HIGHSCORE clicks could be handled inside NameEntryView if we add buttons later
          break;
      }
    }, { capture: true });

    // 2. Unified Key Router
    document.addEventListener('keydown', (e) => {
      const { state } = this.game;

      // Global Keys (Working in multiple states)
      if (e.code === 'KeyH') {
        if (state === 'PLAYING' || state === 'PAUSED' || state === 'START') {
          this.game.togglePause();
        }
        return;
      }

      // State-Specific Routing
      switch(state) {
        case 'START':
        case 'GAMEOVER':
          if (e.code === 'Space' || e.code === 'Enter') {
            this.game.startGame();
          }
          break;

        case 'PLAYING':
          if (e.code === 'ArrowLeft') this.game.player.dir = -1;
          if (e.code === 'ArrowRight') this.game.player.dir = 1;
          if (e.code === 'Space') {
            this.game.spacePressed = true;
            this.game.ui.setShootActive(true);
            e.preventDefault();
          }
          if (e.code === 'Escape') {
            this.game.endGame(false);
          }
          if (e.code === 'KeyD') {
            this.game.debugMode = !this.game.debugMode;
            this.game.ui.updateStats(this.game);
          }
          break;

        case 'PAUSED':
          if (e.code === 'Space' || e.code === 'KeyH' || e.code === 'Escape') {
            this.game.togglePause();
          }
          break;

        case 'HIGHSCORE':
          this.game.ui.handleNameInputKey(e);
          break;

        case 'BOSSKILLED':
          if (e.code === 'Space' || e.code === 'Enter') {
            this.game.ui.hideBossClear();
          }
          break;
      }
    });

    document.addEventListener('keyup', (e) => {
      if (this.game.state !== 'PLAYING') return;
      
      if (e.code === 'ArrowLeft' && this.game.player.dir === -1) this.game.player.dir = 0;
      if (e.code === 'ArrowRight' && this.game.player.dir === 1) this.game.player.dir = 0;
      if (e.code === 'Space') {
        this.game.spacePressed = false;
        this.game.ui.setShootActive(false);
      }
    });

    // Touch Button Handlers (Maintain HTML buttons for reliability)
    const handleTouch = (id, action) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      
      btn.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        btn.setPointerCapture(e.pointerId);
        action(true, e);
      });
      btn.addEventListener('pointerup', (e) => {
        e.preventDefault();
        btn.releasePointerCapture(e.pointerId);
        action(false, e);
      });
    };

    handleTouch('btn-left', (active) => {
      if (this.game.state === 'PLAYING') this.game.player.dir = active ? -1 : 0;
    });

    handleTouch('btn-right', (active) => {
      if (this.game.state === 'PLAYING') this.game.player.dir = active ? 1 : 0;
    });

    handleTouch('btn-shoot', (active, e) => {
      if (!active) return; // Only trigger on down
      
      switch(this.game.state) {
        case 'START':
        case 'GAMEOVER':
          this.game.startGame();
          break;
        case 'PLAYING':
          this.game.spacePressed = !this.game.spacePressed;
          this.game.ui.setShootActive(this.game.spacePressed);
          break;
        case 'PAUSED':
          this.game.togglePause();
          break;
        case 'BOSSKILLED':
          this.game.ui.hideBossClear();
          break;
      }
    });

    handleTouch('btn-pause', (active) => {
      if (active && this.game.state === 'PLAYING') {
        this.game.togglePause();
      }
    });
  }
}
