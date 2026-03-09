import { CONSTANTS, COLORS } from '../constants.js';
import { HudView } from './HudView.js';
import { StartView } from './StartView.js';
import { HelpView } from './HelpView.js';
import { GameOverView } from './GameOverView.js';
import { BossClearView } from './BossClearView.js';
import { NameEntryView } from './NameEntryView.js';
import { ControlOverlayView } from './ControlOverlayView.js';
import { SettingsView } from './SettingsView.js';
import { CreditsView } from './CreditsView.js';

export class UIManager {
  constructor() {
    this.nameInputActive = false;
    this.bossClearActive = false;
    this.pendingScore = 0;
    this.views = {};
    this.lastInputTime = performance.now();
    this.attractModeActive = false;
    this.creditsReturnState = null;
  }

  initPixiHUD(game) {
    this.game = game;
    
    // Background Watermark (Persistent across all states)
    this.watermarkContainer = new PIXI.Container();
    const waterTitle = new PIXI.Text(CONSTANTS.TITLE, {
      fontFamily: 'Orbitron', fontSize: 20, fontWeight: 900, fill: this.parseHexColor(COLORS.text), letterSpacing: 2
    });
    const waterVer = new PIXI.Text(CONSTANTS.VERSION, {
      fontFamily: 'Orbitron', fontSize: 10, fontWeight: 'bold', fill: this.parseHexColor(COLORS.text), alpha: 0.5
    });
    waterVer.position.set(0, 22);
    this.watermarkContainer.addChild(waterTitle, waterVer);
    this.game.bgLayer.addChild(this.watermarkContainer);

    // Global Marquee (Title & Version)
    this.marqueeContainer = new PIXI.Container();
    const marqueeTitle = new PIXI.Text(CONSTANTS.TITLE, {
      fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_TITLE, fontWeight: 900, fill: this.parseHexColor(COLORS.text), letterSpacing: 8,
      dropShadow: true, dropShadowColor: this.parseHexColor(COLORS.text), dropShadowBlur: CONSTANTS.GLOW_BLUR, dropShadowDistance: 0
    });
    marqueeTitle.anchor.set(0.5, 0);
    const marqueeVer = new PIXI.Text(CONSTANTS.VERSION, {
      fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_SUBTITLE, fontWeight: 'bold', fill: this.parseHexColor(COLORS.text), alpha: 0.6
    });
    marqueeVer.anchor.set(0.5, 0);
    marqueeVer.position.set(0, CONSTANTS.FONT_SIZE_TITLE + 5);
    this.marqueeContainer.addChild(marqueeTitle, marqueeVer);
    this.game.fullScreenTopLayer.addChild(this.marqueeContainer);

    // Initialize View Modules
    this.views.overlay = new ControlOverlayView(game);
    this.views.hud = new HudView(game);
    this.views.start = new StartView(game);
    this.views.help = new HelpView(game);
    this.views.gameOver = new GameOverView(game);
    this.views.bossClear = new BossClearView(game);
    this.views.nameEntry = new NameEntryView(game);
    this.views.settings = new SettingsView(game);
    this.views.credits = new CreditsView(game);

    // In-Canvas Border & Global Instructions
    this.borderGraphics = new PIXI.Graphics();
    this.game.uiLayer.addChild(this.borderGraphics);

    this.controlsText = new PIXI.Text(CONSTANTS.UI_CONTROLS_TEXT, {
      fontFamily: 'Orbitron', fontSize: 12, fill: 0xFFFFFF, alpha: 0.4
    });
    this.controlsText.anchor.set(0.5, 1);
    this.game.uiLayer.addChild(this.controlsText);

    this.updateHighScores();
  }

  parseHexColor(hex) {
    return parseInt(hex.replace('#', '0x'));
  }

  resetIdleTimer() {
    this.lastInputTime = performance.now();
    if (this.attractModeActive) {
      this.attractModeActive = false;
      // Re-trigger the current state to hide credits and show original UI
      this.handleStateChange(this.game.state);
    }
  }

  handleStateChange(newState) {
    // Hide all menu views by default
    Object.values(this.views).forEach(v => {
      if (v !== this.views.overlay) v.hide();
    });
    
    // HUD visibility
    if (newState === CONSTANTS.GAME_STATES.START) {
      this.views.hud.hide();
    } else {
      this.views.hud.show();
    }

    // Control Overlay visibility & state
    this.views.overlay.update(newState);

    // Desktop Controls Text visibility
    if (this.controlsText) {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      this.controlsText.visible = !isTouch && (newState === CONSTANTS.GAME_STATES.START || newState === CONSTANTS.GAME_STATES.PLAYING || newState === CONSTANTS.GAME_STATES.PAUSED);
    }

    // Highscore board visibility
    if (this.views.start.highscoreContainer) {
      this.views.start.highscoreContainer.visible = (newState === CONSTANTS.GAME_STATES.START) && !this.attractModeActive;
    }
    if (this.views.gameOver.highscoreContainer) {
      this.views.gameOver.highscoreContainer.visible = (newState === CONSTANTS.GAME_STATES.GAMEOVER) && !this.attractModeActive;
    }

    // Update global marquee visibility and layout whenever state changes
    this.updateLayout(this.game);

    // Show specific view
    switch(newState) {
      case CONSTANTS.GAME_STATES.START:
        if (this.attractModeActive) {
          this.views.start.highscoreContainer.visible = false;
          this.views.credits.show();
        } else {
          this.views.start.show();
        }
        break;
      case CONSTANTS.GAME_STATES.GAMEOVER:
        if (this.attractModeActive) {
          this.views.credits.show();
        } else {
          this.views.gameOver.show();
        }
        break;
      case CONSTANTS.GAME_STATES.PAUSED:
        this.views.help.show();
        break;
      case CONSTANTS.GAME_STATES.BOSSKILLED:
        this.views.bossClear.show();
        break;
      case CONSTANTS.GAME_STATES.HIGHSCORE:
        this.views.nameEntry.show();
        break;
      case CONSTANTS.GAME_STATES.SETTINGS:
        this.views.settings.onShow();
        this.views.settings.show();
        break;
      case CONSTANTS.GAME_STATES.CREDITS:
        this.views.credits.show();
        break;
    }
  }

  updateLayout(game) {
    Object.values(this.views).forEach(v => {
      if (v === this.views.overlay) {
        v.updateLayout(game.appW, game.appH);
      } else {
        v.updateLayout(game.W, game.H);
      }
    });

    if (this.watermarkContainer) {
      this.watermarkContainer.position.set(CONSTANTS.UI_WATERMARK_X, game.H - CONSTANTS.UI_WATERMARK_Y_OFFSET);
      // Hide watermark in letterbox mode (since we have the global marquee)
      this.watermarkContainer.visible = (game.state === CONSTANTS.GAME_STATES.PLAYING) && (game.gameOffsetY <= 100);
    }
    
    if (this.borderGraphics) {
      this.borderGraphics.clear();
      // Only draw the border if we are in letterbox mode (X letterbox)
      if (game.isLetterboxedX) {
        const thickness = CONSTANTS.UI_BORDER_THICKNESS * (game.heightFactor || 1);
        this.borderGraphics.lineStyle(thickness, this.parseHexColor(COLORS.player), 1);
        this.borderGraphics.drawRect(0, 0, game.W, game.H);
      }
    }

    if (this.controlsText) {
      this.controlsText.position.set(game.W / 2, game.H - 10);
    }

    // Global Marquee positioning and visibility logic
    if (this.marqueeContainer) {
      const isMenuState = [
        CONSTANTS.GAME_STATES.START, 
        CONSTANTS.GAME_STATES.PAUSED, 
        CONSTANTS.GAME_STATES.GAMEOVER, 
        CONSTANTS.GAME_STATES.BOSSKILLED
      ].includes(game.state);

      if (game.gameOffsetY > CONSTANTS.UI_MARQUEE_RESPONSIVE_THRESHOLD) {
        // Space available: Show permanently in the letterbox above the game
        this.marqueeContainer.visible = true;
        this.marqueeContainer.position.set(game.appW / 2, game.gameOffsetY / 2 - CONSTANTS.UI_MARQUEE_Y_OFFSET);
      } else {
        // No space: Only show during specific menus inside the active game area
        this.marqueeContainer.visible = isMenuState;
        this.marqueeContainer.position.set(game.appW / 2, game.gameOffsetY + CONSTANTS.UI_HEADER_Y);
      }
    }
  }

  updateStats(gameState) { this.views.hud.updateStats(gameState); }
  updateFPS(fps) { this.views.hud.updateFPS(fps); }

  showStartScreen() { this.handleStateChange(CONSTANTS.GAME_STATES.START); }
  hideScreens() { this.handleStateChange(CONSTANTS.GAME_STATES.PLAYING); }

  showGameOver(won) {
    this.views.gameOver.setResult(won);
    this.handleStateChange(CONSTANTS.GAME_STATES.GAMEOVER);
  }

  showBossClear(level, rewards) {
    this.views.bossClear.setData(level, rewards);
    this.bossClearActive = true;
    this.game.state = CONSTANTS.GAME_STATES.BOSSKILLED;
    this.handleStateChange(this.game.state);
  }

  hideBossClear() {
    this.bossClearActive = false;
    this.game.state = CONSTANTS.GAME_STATES.PLAYING;
    this.handleStateChange(this.game.state);
  }

  showNameInput(score) {
    this.pendingScore = score;
    this.nameInputActive = true;
    this.views.nameEntry.reset();
    this.game.state = CONSTANTS.GAME_STATES.HIGHSCORE;
    this.handleStateChange(this.game.state);
  }

  saveHighscore() {
    const name = this.views.nameEntry.getName();
    this.updateHighScores({ name, score: this.pendingScore });
    this.nameInputActive = false;
    this.game.state = CONSTANTS.GAME_STATES.GAMEOVER;
    this.handleStateChange(this.game.state);
  }

  toggleHelp(isVisible) {
    this.handleStateChange(this.game.state);
  }

  updateHighScores(newEntry) {
    let scores = [];
    try {
      const saved = localStorage.getItem('neonInvadersHighScores');
      if (saved) {
        scores = JSON.parse(saved).map(s => {
          if (typeof s === 'number') return { name: '???' , score: s };
          if (s && typeof s.score === 'number') return s;
          return { name: '???' , score: 0 };
        });
      } else {
        scores = [{ name: 'NEO', score: 1000 }, { name: 'TRN', score: 500 }, { name: 'FLY', score: 250 }];
      }
    } catch (e) { console.warn(e); }
    
    if (newEntry !== undefined) {
      scores.push(newEntry);
      scores.sort((a, b) => b.score - a.score);
      scores = scores.slice(0, 3);
      try { localStorage.setItem('neonInvadersHighScores', JSON.stringify(scores)); } catch (e) { console.warn(e); }
    }

    if (this.views.start) this.views.start.updateHighScores(scores);
    if (this.views.gameOver) this.views.gameOver.updateHighScores(scores);
  }

  update(now) {
    if (this.marqueeContainer && this.marqueeContainer.visible) {
      const scale = 1 + Math.sin(now / CONSTANTS.ANIM_BREATH_SPEED) * CONSTANTS.ANIM_BREATH_STRENGTH;
      this.marqueeContainer.scale.set(scale);
    }

    // Attract Mode Logic
    const isAttractEligible = this.game.state === CONSTANTS.GAME_STATES.START || this.game.state === CONSTANTS.GAME_STATES.GAMEOVER;
    if (isAttractEligible && !this.attractModeActive) {
      if (now - this.lastInputTime > CONSTANTS.UI_IDLE_TIMER_MS) { 
        this.attractModeActive = true;
        this.creditsReturnState = this.game.state;
        this.handleStateChange(this.game.state);
      }
    }

    Object.values(this.views).forEach(v => {
      if (v.update) v.update(now);
    });
  }

  handleNameInputKey(e) {
    if (this.game.state !== CONSTANTS.GAME_STATES.HIGHSCORE) return;
    if (e.code === 'ArrowLeft') this.views.nameEntry.moveSlot(-1);
    else if (e.code === 'ArrowRight') this.views.nameEntry.moveSlot(1);
    else if (e.code === 'ArrowUp') this.views.nameEntry.changeChar(1);
    else if (e.code === 'ArrowDown') this.views.nameEntry.changeChar(-1);
    else if (e.code === 'Enter' || e.code === 'Space') { this.saveHighscore(); return; }
    e.preventDefault();
  }

  setShootActive(isActive) {
    // No-op: Visual feedback now handled via overlay/labels or internally
  }

  isHighscore(score) {
    let scores = [];
    try {
      const saved = localStorage.getItem('neonInvadersHighScores');
      if (saved) scores = JSON.parse(saved);
      else scores = [{ score: 1000 }, { score: 500 }, { score: 250 }];
    } catch (e) { return false; }
    return score > 0 && (scores.length < 3 || score > scores[scores.length - 1].score);
  }
}
