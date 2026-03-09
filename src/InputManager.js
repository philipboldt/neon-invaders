import { CONSTANTS } from './constants.js';

export class InputManager {
  constructor(game) {
    this.game = game;
    this.activePointers = new Map();
    this.lastTopTap = 0;
  }

  bindInputs() {
    const { GAME_STATES } = CONSTANTS;

    // 1. Unified Pointer Router (Zone Based)
    this.game.canvas.addEventListener('pointerdown', (e) => {
      this.game.ui.resetIdleTimer();
      if (this.game.audio) this.game.audio.resumeContext();
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.game.canvas.setPointerCapture(e.pointerId);
      
      const logicalCoords = this.getLogicalCoords(e);
      this.activePointers.set(e.pointerId, logicalCoords);
      this.handlePointerAction(logicalCoords, true);
    });

    this.game.canvas.addEventListener('pointermove', (e) => {
      this.game.ui.resetIdleTimer();
      if (!this.activePointers.has(e.pointerId)) return;
      
      const newCoords = this.getLogicalCoords(e);
      const oldCoords = this.activePointers.get(e.pointerId);
      
      // Update tracking
      this.activePointers.set(e.pointerId, newCoords);
      
      // If zone changed during move, we need to refresh actions
      if (this.getZone(newCoords) !== this.getZone(oldCoords)) {
        this.handlePointerAction(oldCoords, false); // End old
        this.handlePointerAction(newCoords, true);  // Start new
      }
    });

    this.game.canvas.addEventListener('pointerup', (e) => {
      this.game.ui.resetIdleTimer();
      if (!this.activePointers.has(e.pointerId)) return;
      const coords = this.activePointers.get(e.pointerId);
      this.handlePointerAction(coords, false);
      this.activePointers.delete(e.pointerId);
    });

    this.game.canvas.addEventListener('pointercancel', (e) => {
      this.game.ui.resetIdleTimer();
      if (!this.activePointers.has(e.pointerId)) return;
      const coords = this.activePointers.get(e.pointerId);
      this.handlePointerAction(coords, false);
      this.activePointers.delete(e.pointerId);
    });

    // 2. Keyboard Router (Unified with State)
    document.addEventListener('keydown', (e) => {
      if (this.game.audio) this.game.audio.resumeContext();
      this.game.ui.resetIdleTimer();
      const { state } = this.game;
      
      // Universal Keys
      if (e.code === 'KeyH') {
        if (state === GAME_STATES.PLAYING || state === GAME_STATES.PAUSED || state === GAME_STATES.START) {
          this.game.togglePause();
        }
        return;
      }

      if (e.code === 'KeyM') {
        this.game.audio.muteAll();
        if (state === GAME_STATES.SETTINGS) {
          this.game.ui.views.settings.updateMusicButtonText();
          this.game.ui.views.settings.updateSoundButtonText();
        }
        return;
      }

      switch(state) {
        case GAME_STATES.CREDITS:
          this.game.state = this.game.ui.creditsReturnState || GAME_STATES.START;
          this.game.ui.handleStateChange(this.game.state);
          break;
        case GAME_STATES.START:
          if (e.code === 'Space' || e.code === 'Enter') this.game.startGame();
          else if (e.code === 'Escape') {
            this.game.previousState = GAME_STATES.START;
            this.game.state = GAME_STATES.SETTINGS;
            this.game.ui.handleStateChange(this.game.state);
          }
          break;
        case GAME_STATES.GAMEOVER:
          if (e.code === 'Space' || e.code === 'Enter') this.game.restartGame();
          else if (e.code === 'Escape') {
            this.game.previousState = GAME_STATES.GAMEOVER;
            this.game.state = GAME_STATES.SETTINGS;
            this.game.ui.handleStateChange(this.game.state);
          }
          break;
        case GAME_STATES.PLAYING:
          if (e.code === 'ArrowLeft') this.game.player.dir = -1;
          if (e.code === 'ArrowRight') this.game.player.dir = 1;
          if (e.code === 'Space') { 
            this.game.spacePressed = !this.game.spacePressed; 
            this.game.ui.setShootActive(this.game.spacePressed); 
            e.preventDefault(); 
          }
          if (e.code === 'Escape') {
            this.game.previousState = GAME_STATES.PLAYING;
            this.game.state = GAME_STATES.SETTINGS;
            this.game.ui.handleStateChange(this.game.state);
          }
          if (e.code === 'KeyD') { this.game.debugMode = !this.game.debugMode; this.game.ui.updateStats(this.game); }
          break;
        case GAME_STATES.PAUSED:
          if (e.code === 'Space' || e.code === 'Enter') this.game.togglePause();
          else if (e.code === 'Escape') {
            this.game.previousState = GAME_STATES.PAUSED;
            this.game.state = GAME_STATES.SETTINGS;
            this.game.ui.handleStateChange(this.game.state);
          }
          break;
        case GAME_STATES.SETTINGS:
          if (e.code === 'Escape') {
            // Only confirm quit if we came from a "living" game state
            if (this.game.previousState === GAME_STATES.PLAYING || this.game.previousState === GAME_STATES.PAUSED) {
              this.game.endGame(false);
            } else {
              this.game.state = this.game.previousState || GAME_STATES.START;
              this.game.ui.handleStateChange(this.game.state);
            }
          } else if (e.code === 'Space' || e.code === 'Enter') {
            this.game.state = this.game.previousState || GAME_STATES.PLAYING;
            this.game.ui.handleStateChange(this.game.state);
          }
          break;
        case GAME_STATES.HIGHSCORE:
          this.game.ui.handleNameInputKey(e);
          break;
        case GAME_STATES.BOSSKILLED:
          if (e.code === 'Space' || e.code === 'Enter') this.game.ui.hideBossClear();
          break;
      }
    });

    document.addEventListener('keyup', (e) => {
      if (this.game.state !== GAME_STATES.PLAYING) return;
      if (e.code === 'ArrowLeft' && this.game.player.dir === -1) this.game.player.dir = 0;
      if (e.code === 'ArrowRight' && this.game.player.dir === 1) this.game.player.dir = 0;
    });
  }

  getLogicalCoords(e) {
    const rect = this.game.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // Map to logical system
    const lx = (px / rect.width) * this.game.appW;
    const ly = (py / rect.height) * this.game.appH;
    return { lx, ly };
  }

  getZone(coords) {
    const { lx, ly } = coords;
    const { appH, appW } = this.game;
    
    if (ly < appH * 0.33) return 'TOP';
    if (ly < appH * 0.66) return 'MIDDLE';
    
    // Bottom 1/3
    if (lx < appW * 0.33) return 'BOTTOM_LEFT';
    if (lx < appW * 0.66) return 'BOTTOM_CENTER';
    return 'BOTTOM_RIGHT';
  }

  handlePointerAction(coords, isActive) {
    const zone = this.getZone(coords);
    const { GAME_STATES } = CONSTANTS;
    const { state } = this.game;

    // 1. Menu Interactions (Always Single Taps)
    if (isActive) {
      if (state === GAME_STATES.CREDITS) {
        this.game.state = this.game.ui.creditsReturnState || GAME_STATES.START;
        this.game.ui.handleStateChange(this.game.state);
        return;
      }
      if (state === GAME_STATES.START) { this.game.startGame(); return; }
      if (state === GAME_STATES.GAMEOVER) { this.game.restartGame(); return; }
      if (state === GAME_STATES.BOSSKILLED) { this.game.ui.hideBossClear(); return; }
      if (state === GAME_STATES.SETTINGS) {
        // 1. Check if we hit a specific button first
        const settingsView = this.game.ui.views.settings;
        const point = new PIXI.Point(lx, ly);
        if (settingsView.musicButton.containsPoint(point) || 
            settingsView.soundButton.containsPoint(point) || 
            settingsView.creditsButton.containsPoint(point)) {
          return; // Let Pixi's static event listeners handle it
        }

        // 2. Default behavior (resume or quit)
        if (zone === 'TOP') {
          const now = performance.now();
          if (now - this.lastTopTap < CONSTANTS.TOUCH_DOUBLE_TAP_MS) {
            // Only confirm quit if we came from a "living" game state
            if (this.game.previousState === GAME_STATES.PLAYING || this.game.previousState === GAME_STATES.PAUSED) {
              this.game.endGame(false);
            } else {
              this.game.state = this.game.previousState || GAME_STATES.START;
              this.game.ui.handleStateChange(this.game.state);
            }
          }
          this.lastTopTap = now;
        } else {
          // Tap anywhere else to resume
          this.game.state = this.game.previousState || GAME_STATES.PLAYING;
          this.game.ui.handleStateChange(this.game.state);
        }
        return;
      }
    }

    // 2. Playing/Paused Interactions
    switch(zone) {
      case 'TOP':
        if (isActive) {
          const now = performance.now();
          if (now - this.lastTopTap < CONSTANTS.TOUCH_DOUBLE_TAP_MS) {
            if (state === GAME_STATES.PLAYING || state === GAME_STATES.PAUSED || state === GAME_STATES.START || state === GAME_STATES.GAMEOVER) {
              this.game.previousState = state;
              this.game.state = GAME_STATES.SETTINGS;
              this.game.ui.handleStateChange(this.game.state);
            }
          }
          this.lastTopTap = now;
        }
        break;

      case 'MIDDLE':
        if (isActive) {
          if (state === GAME_STATES.PLAYING || state === GAME_STATES.PAUSED) {
            this.game.togglePause();
          }
        }
        break;

      case 'BOTTOM_LEFT':
        if (state === GAME_STATES.PLAYING) {
          this.game.player.dir = isActive ? -1 : (this.isZoneActive('BOTTOM_RIGHT') ? 1 : 0);
        }
        break;

      case 'BOTTOM_RIGHT':
        if (state === GAME_STATES.PLAYING) {
          this.game.player.dir = isActive ? 1 : (this.isZoneActive('BOTTOM_LEFT') ? -1 : 0);
        }
        break;

      case 'BOTTOM_CENTER':
        if (state === GAME_STATES.PLAYING) {
          if (isActive) {
            this.game.spacePressed = !this.game.spacePressed; // Toggle for mobile
            this.game.ui.setShootActive(this.game.spacePressed);
          }
        }
        break;
    }
  }

  isZoneActive(targetZone) {
    for (const coords of this.activePointers.values()) {
      if (this.getZone(coords) === targetZone) return true;
    }
    return false;
  }
}
