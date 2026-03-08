import { CONSTANTS, COLORS } from '../constants.js';
import { HudView } from './HudView.js';
import { StartView } from './StartView.js';
import { HelpView } from './HelpView.js';
import { GameOverView } from './GameOverView.js';
import { BossClearView } from './BossClearView.js';

export class UIManager {
  constructor() {
    this.els = {
      overlay: document.getElementById('overlay'),
      nameInputContainer: document.getElementById('name-input-container'),
      saveNameBtn: document.getElementById('save-name'),
      charEls: Array.from(document.querySelectorAll('.arcade-input .char')),
      touchArrows: document.querySelectorAll('.touch-arrow'),
      btnShoot: document.getElementById('btn-shoot'),
      btnLeft: document.getElementById('btn-left'),
      btnRight: document.getElementById('btn-right'),
      btnPause: document.getElementById('btn-pause'),
      restartBtn: document.getElementById('restart'),
      helpScreen: document.getElementById('help-screen')
    };
    
    this.nameInputActive = false;
    this.currentCharIndex = 0;
    this.chars = ['A', 'A', 'A'];
    this.pendingScore = 0;
    
    this.views = {};
  }

  initPixiHUD(game) {
    this.game = game;
    
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

    this.views.hud = new HudView(game);
    this.views.start = new StartView(game);
    this.views.help = new HelpView(game);
    this.views.gameOver = new GameOverView(game);
    this.views.bossClear = new BossClearView(game);

    this.updateHighScores();
    this.bindNameInputTouch();
  }

  parseHexColor(hex) {
    return parseInt(hex.replace('#', '0x'));
  }

  handleStateChange(newState) {
    Object.values(this.views).forEach(v => v.hide());
    
    if (newState === CONSTANTS.GAME_STATES.START) {
      this.views.hud.hide();
    } else {
      this.views.hud.show();
    }

    this.watermarkContainer.visible = (newState === CONSTANTS.GAME_STATES.PLAYING);

    if (this.highscorePixiContainer) {
      this.highscorePixiContainer.visible = (newState === CONSTANTS.GAME_STATES.START || newState === CONSTANTS.GAME_STATES.GAMEOVER);
    }

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
    }
  }

  updateLayout(game) {
    Object.values(this.views).forEach(v => v.updateLayout(game.W, game.H));
    if (this.watermarkContainer) this.watermarkContainer.position.set(20, game.H - 45);
    if (this.highscorePixiContainer) this.highscorePixiContainer.position.set(game.W / 2, 220);
  }

  updateStats(gameState) { this.views.hud.updateStats(gameState); }
  updateFPS(fps) { this.views.hud.updateFPS(fps); }

  showStartScreen() { this.handleStateChange(CONSTANTS.GAME_STATES.START); }
  hideScreens() { this.handleStateChange(CONSTANTS.GAME_STATES.PLAYING); }

  showGameOver(won) {
    this.views.gameOver.setResult(won);
    this.handleStateChange(CONSTANTS.GAME_STATES.GAMEOVER);
    if (this.els.overlay) this.els.overlay.classList.remove('hidden');
    this.els.nameInputContainer.classList.add('hidden');
  }

  showBossClear(level, rewards) {
    this.views.bossClear.setData(level, rewards);
    this.handleStateChange(CONSTANTS.GAME_STATES.BOSSKILLED);
  }

  showNameInput(score) {
    this.handleStateChange(CONSTANTS.GAME_STATES.HIGHSCORE);
    this.pendingScore = score;
    this.nameInputActive = true;
    this.currentCharIndex = 0;
    this.chars = ['A', 'A', 'A'];
    this.updateCharDisplay();
    this.els.nameInputContainer.classList.remove('hidden');
    if (this.els.overlay) this.els.overlay.classList.remove('hidden');
  }

  saveHighscore() {
    const name = this.chars.join('');
    this.updateHighScores({ name, score: this.pendingScore });
    this.nameInputActive = false;
    this.els.nameInputContainer.classList.add('hidden');
    this.game.state = CONSTANTS.GAME_STATES.GAMEOVER;
    this.handleStateChange(this.game.state);
  }

  toggleHelp(isVisible) {
    this.handleStateChange(this.game.state);
    if (this.els.helpScreen) {
      this.els.helpScreen.classList.toggle('hidden', !isVisible);
    }
  }

  updateHighScores(newEntry) {
    let scores = [];
    try {
      const saved = localStorage.getItem('neonInvadersHighScores');
      if (saved) {
        scores = JSON.parse(saved);
        scores = scores.map(s => {
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
    this.highscorePixiContainer = this.views.start.highscoreContainer;
  }

  update(now) {
    Object.values(this.views).forEach(v => {
      if (v.update) v.update(now);
    });
  }

  bindNameInputTouch() {
    this.els.touchArrows.forEach(arrow => {
      arrow.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const index = parseInt(arrow.dataset.index);
        const dir = arrow.dataset.dir;
        this.currentCharIndex = index;
        this.changeChar(index, dir === 'up' ? 1 : -1);
      });
    });
    if (this.els.saveNameBtn) {
      this.els.saveNameBtn.addEventListener('pointerdown', (e) => {
        if (!this.nameInputActive) return;
        e.preventDefault(); e.stopPropagation();
        this.saveHighscore();
      });
    }
    this.els.charEls.forEach((charEl, index) => {
      charEl.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        this.currentCharIndex = index;
        this.updateCharDisplay();
      });
    });
  }

  changeChar(index, delta) {
    let charCode = this.chars[index].charCodeAt(0);
    charCode = ((charCode - 65 + delta + 26) % 26) + 65;
    this.chars[index] = String.fromCharCode(charCode);
    this.updateCharDisplay();
  }

  updateCharDisplay() {
    this.els.charEls.forEach((el, i) => {
      el.textContent = this.chars[i];
      el.classList.toggle('active', i === this.currentCharIndex);
    });
  }

  handleNameInputKey(e) {
    if (!this.nameInputActive) return;
    if (e.code === 'ArrowLeft') this.currentCharIndex = (this.currentCharIndex - 1 + 3) % 3;
    else if (e.code === 'ArrowRight') this.currentCharIndex = (this.currentCharIndex + 1) % 3;
    else if (e.code === 'ArrowUp') this.changeChar(this.currentCharIndex, 1);
    else if (e.code === 'ArrowDown') this.changeChar(this.currentCharIndex, -1);
    else if (e.code === 'Enter' || e.code === 'Space') { this.saveHighscore(); return; }
    this.updateCharDisplay();
    e.preventDefault();
  }

  setShootActive(isActive) {
    if (this.els.btnShoot) this.els.btnShoot.classList.toggle('active', isActive);
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
