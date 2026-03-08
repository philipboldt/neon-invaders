import { CONSTANTS } from './constants.js';

export class InputManager {
  constructor(game) {
    this.game = game;
  }

  bindInputs() {
    // 1. Unified Pointer/Tap Router
    this.game.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      
      const { GAME_STATES } = CONSTANTS;
      switch(this.game.state) {
        case GAME_STATES.START:
          this.game.startGame();
          break;
        case GAME_STATES.GAMEOVER:
          this.game.restartGame();
          break;
        case GAME_STATES.PAUSED:
          this.game.togglePause();
          break;
        case GAME_STATES.BOSSKILLED:
          this.game.ui.hideBossClear();
          break;
      }
    }, { capture: true });

    // 2. Unified Key Router
    document.addEventListener('keydown', (e) => {
      const { state } = this.game;
      const { GAME_STATES } = CONSTANTS;

      // H Key is the universal Help toggle
      if (e.code === 'KeyH') {
        if (state === GAME_STATES.PLAYING || state === GAME_STATES.PAUSED || state === GAME_STATES.START) {
          this.game.togglePause();
        }
        return;
      }

      // State-Specific Routing
      switch(state) {
        case GAME_STATES.START:
          if (e.code === 'Space' || e.code === 'Enter') {
            this.game.startGame();
          }
          break;

        case GAME_STATES.GAMEOVER:
          if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
            this.game.restartGame();
          }
          break;

        case GAME_STATES.PLAYING:
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

        case GAME_STATES.PAUSED:
          if (e.code === 'Space' || e.code === 'Enter') {
            this.game.togglePause(); // Resume
          } else if (e.code === 'Escape') {
            this.game.endGame(false); // Quit from pause
          }
          break;

        case GAME_STATES.HIGHSCORE:
          this.game.ui.handleNameInputKey(e);
          break;

        case GAME_STATES.BOSSKILLED:
          if (e.code === 'Space' || e.code === 'Enter') {
            this.game.ui.hideBossClear();
          }
          break;
      }
    });

    document.addEventListener('keyup', (e) => {
      if (this.game.state !== CONSTANTS.GAME_STATES.PLAYING) return;
      
      if (e.code === 'ArrowLeft' && this.game.player.dir === -1) this.game.player.dir = 0;
      if (e.code === 'ArrowRight' && this.game.player.dir === 1) this.game.player.dir = 0;
      if (e.code === 'Space') {
        this.game.spacePressed = false;
        this.game.ui.setShootActive(false);
      }
    });

    // Touch Button Handlers
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

    handleTouch(CONSTANTS.ID_BTN_LEFT, (active) => {
      if (this.game.state === CONSTANTS.GAME_STATES.PLAYING) this.game.player.dir = active ? -1 : 0;
    });

    handleTouch(CONSTANTS.ID_BTN_RIGHT, (active) => {
      if (this.game.state === CONSTANTS.GAME_STATES.PLAYING) this.game.player.dir = active ? 1 : 0;
    });

    handleTouch(CONSTANTS.ID_BTN_SHOOT, (active, e) => {
      if (!active) return;
      const { state } = this.game;
      const { GAME_STATES } = CONSTANTS;
      
      switch(state) {
        case GAME_STATES.START:
          this.game.startGame();
          break;
        case GAME_STATES.GAMEOVER:
          this.game.restartGame();
          break;
        case GAME_STATES.PLAYING:
          this.game.spacePressed = !this.game.spacePressed;
          this.game.ui.setShootActive(this.game.spacePressed);
          break;
        case GAME_STATES.PAUSED:
          this.game.togglePause();
          break;
        case GAME_STATES.BOSSKILLED:
          this.game.ui.hideBossClear();
          break;
      }
    });

    handleTouch(CONSTANTS.ID_BTN_PAUSE, (active) => {
      if (active && (this.game.state === CONSTANTS.GAME_STATES.PLAYING || this.game.state === CONSTANTS.GAME_STATES.PAUSED)) {
        this.game.togglePause();
      }
    });
  }
}
