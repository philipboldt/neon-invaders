export class InputManager {
  constructor(game) {
    this.game = game;
  }

  bindInputs() {
    const handleStart = (e) => {
      if (this.game.ui.nameInputActive) return;
      if (this.game.gameRunning && !this.game.isPaused) return;
      
      const isStartVisible = !this.game.ui.els.startScreen.classList.contains('hidden');
      const isOverlayVisible = !this.game.ui.els.overlay.classList.contains('hidden');

      if (isStartVisible || isOverlayVisible) {
        if (e && e.type.startsWith('pointer') && e.pointerType === 'mouse' && e.button !== 0) return;
        
        this.game.ui.hideScreens();
        this.game.startGame();
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
      }
    };

    // Global pointerdown listener to catch start on any mobile tap
    window.addEventListener('pointerdown', (e) => {
      if (!this.game.gameRunning && !this.game.ui.els.startScreen.classList.contains('hidden')) {
        handleStart(e);
      }
    }, { capture: true });

    // Support generic click as well
    window.addEventListener('click', (e) => {
      if (!this.game.gameRunning && !this.game.ui.els.startScreen.classList.contains('hidden')) {
        handleStart(e);
      }
    }, { capture: true });

    document.addEventListener('keydown', (e) => {
      // Space to Start logic - highest priority
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        if (!this.game.gameRunning && !this.game.ui.els.startScreen.classList.contains('hidden')) {
          handleStart(e);
          return;
        }
      }

      if (this.game.ui.nameInputActive) {
        this.game.ui.handleNameInputKey(e);
        return;
      }
      if (this.game.ui.bossClearActive) {
        if (e.code === 'Space' || e.code === 'Enter') {
          this.game.ui.hideBossClear();
          this.game.isPaused = false;
        }
        return;
      }
      // Toggle Help (Pause)
      if (e.code === 'KeyH') {
        if (this.game.state === CONSTANTS.GAME_STATES.PLAYING) {
          this.game.state = CONSTANTS.GAME_STATES.PAUSED;
          this.game.ui.toggleHelp(true);
        } else if (this.game.state === CONSTANTS.GAME_STATES.PAUSED) {
          this.game.state = CONSTANTS.GAME_STATES.PLAYING;
          this.game.ui.toggleHelp(false);
        }
        return;
      }
      
      // End Game
      if (e.code === 'Escape' && this.game.state === CONSTANTS.GAME_STATES.PLAYING) {
        this.game.endGame(false);
        return;
      }
      
      if (this.game.state !== CONSTANTS.GAME_STATES.PLAYING) return;

      if (e.code === 'KeyD' && this.game.gameRunning) {
        this.game.debugMode = !this.game.debugMode;
        if (this.game.debugMode) {
          this.game.shieldHits = 0; 
          this.game.shotCount = 1; 
          this.game.rocketLevel = 0; 
          this.game.hasPierce = false;
          this.game.ui.updateStats(this.game);
        }
        return;
      }
      if (e.code === 'KeyA' && this.game.gameRunning && this.game.debugMode) {
        this.game.invaders = [];
        return;
      }

      if (e.code === 'ArrowLeft') this.game.player.dir = -1;
      if (e.code === 'ArrowRight') this.game.player.dir = 1;
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        this.game.spacePressed = true;
        this.game.ui.setShootActive(true);
        if (!this.game.gameRunning && !this.game.ui.els.startScreen.classList.contains('hidden')) {
          handleStart(e);
        } else {
          e.preventDefault();
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' && this.game.player.dir === -1) this.game.player.dir = 0;
      if (e.code === 'ArrowRight' && this.game.player.dir === 1) this.game.player.dir = 0;
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        this.game.spacePressed = false;
        this.game.ui.setShootActive(false);
      }
    });

    if (this.game.ui.els.restartBtn) {
      this.game.ui.els.restartBtn.addEventListener('click', () => {
        this.game.startGame();
      });
      this.game.ui.els.restartBtn.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        this.game.startGame();
      });
    }

    const handlePointerDown = (btn, action) => {
      if(!btn) return;
      btn.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        btn.setPointerCapture(e.pointerId);
        action(true);
      });
    };

    const handlePointerUp = (btn, action) => {
      if(!btn) return;
      btn.addEventListener('pointerup', (e) => {
        e.preventDefault();
        btn.releasePointerCapture(e.pointerId);
        action(false);
      });
      btn.addEventListener('pointercancel', (e) => {
        e.preventDefault();
        action(false);
      });
    };

    handlePointerDown(this.game.ui.els.btnLeft, (active) => { if (active) this.game.player.dir = -1; });
    handlePointerUp(this.game.ui.els.btnLeft, (active) => { if (!active && this.game.player.dir === -1) this.game.player.dir = 0; });

    handlePointerDown(this.game.ui.els.btnRight, (active) => { if (active) this.game.player.dir = 1; });
    handlePointerUp(this.game.ui.els.btnRight, (active) => { if (!active && this.game.player.dir === 1) this.game.player.dir = 0; });

    handlePointerDown(this.game.ui.els.btnShoot, (e) => {
      if (this.game.ui.bossClearActive) {
        this.game.ui.hideBossClear();
        this.game.isPaused = false;
        return;
      }
      if (!this.game.gameRunning || this.game.isPaused) {
        if (!this.game.ui.els.startScreen.classList.contains('hidden')) {
          handleStart(e);
        } else if (this.game.isPaused) {
          this.game.isPaused = false;
          this.game.ui.toggleHelp(false);
        }
        this.game.spacePressed = true;
        this.game.ui.setShootActive(true);
        return;
      }
      this.game.spacePressed = !this.game.spacePressed;
      this.game.ui.setShootActive(this.game.spacePressed);
    });

    handlePointerDown(this.game.ui.els.btnPause, (active) => {
      if (active && this.game.gameRunning && this.game.ui.els.overlay.classList.contains('hidden')) {
        this.game.isPaused = !this.game.isPaused;
        this.game.ui.toggleHelp(this.game.isPaused);
      }
    });

    this.game.ui.els.startScreen.addEventListener('pointerdown', handleStart);

    this.game.ui.els.helpScreen.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      if (this.game.isPaused) {
        this.game.isPaused = false;
        this.game.ui.toggleHelp(false);
      }
    });

    this.game.ui.els.bossClearScreen.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      if (this.game.ui.bossClearActive) {
        this.game.ui.hideBossClear();
        this.game.isPaused = false;
      }
    });

    this.game.ui.els.overlay.addEventListener('pointerdown', (e) => {
      if (this.game.ui.nameInputActive) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!this.game.ui.els.overlay.classList.contains('hidden')) {
        if (e.target.id !== 'restart') {
          e.preventDefault();
          this.game.ui.els.startScreen.classList.add('hidden');
          if (!this.game.gameRunning) {
            this.game.startGame();
          }
        }
      }
    });
  }
}
