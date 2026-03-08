export class InputManager {
  constructor(game) {
    this.game = game;
  }

  bindInputs() {
    const handleStart = (e) => {
      if (this.game.ui.nameInputActive) return;
      if (this.game.state === 'PLAYING') return;
      
      if (this.game.state === 'START' || this.game.state === 'GAMEOVER') {
        if (e && e.type.startsWith('pointer') && e.pointerType === 'mouse' && e.button !== 0) return;
        this.game.startGame();
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
      }
    };

    // Global pointerdown listener to catch start on any canvas tap
    this.game.canvas.addEventListener('pointerdown', (e) => {
      if (this.game.state === 'START' || this.game.state === 'GAMEOVER') {
        handleStart(e);
      } else if (this.game.state === 'PAUSED') {
        this.game.state = 'PLAYING';
        this.game.ui.toggleHelp(false);
      } else if (this.game.ui.bossClearActive) {
        this.game.ui.hideBossClear();
        this.game.state = 'PLAYING';
      }
    }, { capture: true });

    document.addEventListener('keydown', (e) => {
      // Space to Start logic - highest priority
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        if (this.game.state === 'START' || this.game.state === 'GAMEOVER') {
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
          this.game.state = 'PLAYING';
        }
        return;
      }

      // Toggle Help (Pause)
      if (e.code === 'KeyH') {
        if (this.game.state === 'PLAYING') {
          this.game.state = 'PAUSED';
          this.game.ui.toggleHelp(true);
        } else if (this.game.state === 'PAUSED') {
          this.game.state = 'PLAYING';
          this.game.ui.toggleHelp(false);
        }
        return;
      }
      
      // End Game
      if (e.code === 'Escape' && this.game.state === 'PLAYING') {
        this.game.endGame(false);
        return;
      }
      
      if (this.game.state !== 'PLAYING') return;

      if (e.code === 'KeyD') {
        this.game.debugMode = !this.game.debugMode;
        if (this.game.debugMode) {
          this.game.shieldHits = 0; this.game.shotCount = 1; this.game.rocketLevel = 0; this.game.hasPierce = false;
          this.game.ui.updateStats(this.game);
        }
        return;
      }
      if (e.code === 'KeyA' && this.game.debugMode) {
        this.game.invaders = [];
        return;
      }

      if (e.code === 'ArrowLeft') this.game.player.dir = -1;
      if (e.code === 'ArrowRight') this.game.player.dir = 1;
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        this.game.spacePressed = true;
        this.game.ui.setShootActive(true);
        e.preventDefault();
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
        this.game.state = 'PLAYING';
        return;
      }
      if (this.game.state === 'START' || this.game.state === 'GAMEOVER') {
        handleStart(e);
        this.game.spacePressed = true;
        this.game.ui.setShootActive(true);
        return;
      } else if (this.game.state === 'PAUSED') {
        this.game.state = 'PLAYING';
        this.game.ui.toggleHelp(false);
        this.game.spacePressed = true;
        this.game.ui.setShootActive(true);
        return;
      }
      this.game.spacePressed = !this.game.spacePressed;
      this.game.ui.setShootActive(this.game.spacePressed);
    });

    handlePointerDown(this.game.ui.els.btnPause, (active) => {
      if (active && this.game.state === 'PLAYING') {
        this.game.state = 'PAUSED';
        this.game.ui.toggleHelp(true);
      }
    });
  }
}
