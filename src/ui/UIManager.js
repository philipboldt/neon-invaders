import { CONSTANTS, COLORS } from '../constants.js';
import { HudView } from './HudView.js';
import { StartView } from './StartView.js';
import { HelpView } from './HelpView.js';
import { GameOverView } from './GameOverView.js';
import { BossClearView } from './BossClearView.js';
import { NameEntryView } from './NameEntryView.js';

export class UIManager {
  constructor() {
    this.nameInputActive = false;
    this.bossClearActive = false;
    this.pendingScore = 0;
    this.views = {};
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

    // Initialize View Modules
    this.views.hud = new HudView(game);
    this.views.start = new StartView(game);
    this.views.help = new HelpView(game);
    this.views.gameOver = new GameOverView(game);
    this.views.bossClear = new BossClearView(game);
    this.views.nameEntry = new NameEntryView(game);

    // In-Canvas Border & Global Instructions
    this.borderGraphics = new PIXI.Graphics();
    this.game.uiLayer.addChild(this.borderGraphics);

    this.controlsText = new PIXI.Text('← → move · SPACE shoot · H help · ESC end', {
      fontFamily: 'Orbitron', fontSize: 12, fill: 0xFFFFFF, alpha: 0.4
    });
    this.controlsText.anchor.set(0.5, 1);
    this.game.uiLayer.addChild(this.controlsText);

    this.updateHighScores();
  }

  parseHexColor(hex) {
    return parseInt(hex.replace('#', '0x'));
  }

  handleStateChange(newState) {
    // Hide all menu views by default
    Object.values(this.views).forEach(v => v.hide());
    
    // HUD visibility
    if (newState === CONSTANTS.GAME_STATES.START) {
      this.views.hud.hide();
    } else {
      this.views.hud.show();
    }

    // Watermark visibility
    this.watermarkContainer.visible = (newState === CONSTANTS.GAME_STATES.PLAYING);

    // Highscore board visibility
    if (this.views.start.highscoreContainer) {
      this.views.start.highscoreContainer.visible = (newState === CONSTANTS.GAME_STATES.START);
    }
    if (this.views.gameOver.highscoreContainer) {
      this.views.gameOver.highscoreContainer.visible = (newState === CONSTANTS.GAME_STATES.GAMEOVER);
    }

    // Show specific view
    switch(newState) {
      case CONSTANTS.GAME_STATES.START:
        this.views.start.show();
        break;
      case CONSTANTS.GAME_STATES.PAUSED:
        this.views.help.show();
        break;
      case CONSTANTS.GAME_STATES.GAMEOVER:
        this.views.gameOver.show();
        break;
      case CONSTANTS.GAME_STATES.BOSSKILLED:
        this.views.bossClear.show();
        break;
      case CONSTANTS.GAME_STATES.HIGHSCORE:
        this.views.nameEntry.show();
        break;
    }
  }

  updateLayout(game) {
    Object.values(this.views).forEach(v => v.updateLayout(game.W, game.H));
    if (this.watermarkContainer) this.watermarkContainer.position.set(20, game.H - 45);
    
    if (this.borderGraphics) {
      this.borderGraphics.clear();
      this.borderGraphics.lineStyle(2, this.parseHexColor(COLORS.player), 1);
      this.borderGraphics.drawRect(0, 0, game.W, game.H);
    }

    if (this.controlsText) {
      this.controlsText.position.set(game.W / 2, game.H - 10);
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
    this.handleStateChange(CONSTANTS.GAME_STATES.BOSSKILLED);
  }

  hideBossClear() {
    this.bossClearActive = false;
    this.handleStateChange(CONSTANTS.GAME_STATES.PLAYING);
  }

  showNameInput(score) {
    this.pendingScore = score;
    this.nameInputActive = true;
    this.views.nameEntry.reset();
    this.handleStateChange(CONSTANTS.GAME_STATES.HIGHSCORE);
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
    const btn = document.getElementById('btn-shoot');
    if (btn) btn.classList.toggle('active', isActive);
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
