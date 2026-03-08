import { COLORS, CONSTANTS } from './constants.js';

export class UIManager {
  constructor() {
    this.els = {
      score: document.getElementById('score'),
      level: document.getElementById('level'),
      lives: document.getElementById('lives'),
      shield: document.getElementById('shield'),
      pierce: document.getElementById('pierce'),
      damage: document.getElementById('damage'),
      overlay: document.getElementById('overlay'),
      overlayText: document.getElementById('overlay-text'),
      nameInputContainer: document.getElementById('name-input-container'),
      saveNameBtn: document.getElementById('save-name'),
      charEls: document.querySelectorAll('.arcade-input .char'),
      touchArrows: document.querySelectorAll('.touch-arrow'),
      startScreen: document.getElementById('start-screen'),
      helpScreen: document.getElementById('help-screen'),
      bossClearScreen: document.getElementById('boss-clear-screen'),
      bossLevelText: document.getElementById('boss-level-text'),
      rewardList: document.getElementById('reward-list'),
      btnShoot: document.getElementById('btn-shoot'),
      btnLeft: document.getElementById('btn-left'),
      btnRight: document.getElementById('btn-right'),
      btnPause: document.getElementById('btn-pause'),
      restartBtn: document.getElementById('restart'),
      rocket: document.getElementById('rocket')
    };
    this.charEls = Array.from(document.querySelectorAll('.arcade-input .char'));
    this.nameInputActive = false;
    this.bossClearActive = false;
    this.currentCharIndex = 0;
    this.chars = ['A', 'A', 'A'];
    this.pendingScore = 0;
    this.hudTexts = {};
  }

  initPixiHUD(game) {
    this.game = game;
    this.lastStats = {};
    const padding = 15;
    const y = 15;
    const colWidth = (this.game.W - padding * 2) / 4;

    this.hudTexts.score = this.createHudText('Score: 0', padding, y, this.parseHexColor(COLORS.invader2));
    this.hudTexts.level = this.createHudText('Level: 1', padding + colWidth, y, this.parseHexColor(COLORS.invader3));
    this.hudTexts.lives = this.createHudText('Lives: 3', padding + colWidth * 2, y, this.parseHexColor(COLORS.heal));
    this.hudTexts.shield = this.createHudText('Shield: NONE', padding + colWidth * 3, y, this.parseHexColor(COLORS.shield));

    const y2 = y + 25;
    this.hudTexts.pierce = this.createHudText('Pierce: NONE', padding, y2, this.parseHexColor(COLORS.pierce));
    this.hudTexts.damage = this.createHudText('Damage: 1', padding + colWidth, y2, this.parseHexColor(COLORS.invader2));
    this.hudTexts.rocket = this.createHudText('Rocket: NONE', padding + colWidth * 2, y2, this.parseHexColor(COLORS.rocket));
    this.hudTexts.fps = this.createHudText('FPS: 60', padding + colWidth * 3, y2, this.parseHexColor(COLORS.textYellow));

    // 1. Big Main Title (For Menus)
    this.mainTitleContainer = new PIXI.Container();
    
    this.mainTitleText = new PIXI.Text(CONSTANTS.TITLE, {
      fontFamily: 'Orbitron',
      fontSize: 48,
      fontWeight: 900,
      fill: this.parseHexColor(COLORS.text),
      letterSpacing: 8,
      dropShadow: true,
      dropShadowColor: this.parseHexColor(COLORS.text),
      dropShadowBlur: 15,
      dropShadowDistance: 0
    });
    this.mainTitleText.anchor.set(0.5, 0);
    
    this.versionText = new PIXI.Text(CONSTANTS.VERSION, {
      fontFamily: 'Orbitron',
      fontSize: 14,
      fontWeight: 'bold',
      fill: this.parseHexColor(COLORS.text),
      alpha: 0.6
    });
    this.versionText.anchor.set(0.5, 0);
    this.versionText.position.set(0, 55);

    this.mainTitleContainer.addChild(this.mainTitleText, this.versionText);
    this.game.uiLayer.addChild(this.mainTitleContainer);

    // 2. Background Watermark (For Gameplay)
    this.watermarkContainer = new PIXI.Container();
    
    const waterTitle = new PIXI.Text(CONSTANTS.TITLE, {
      fontFamily: 'Orbitron',
      fontSize: 20,
      fontWeight: 900,
      fill: this.parseHexColor(COLORS.text),
      letterSpacing: 2
    });
    
    const waterVer = new PIXI.Text(CONSTANTS.VERSION, {
      fontFamily: 'Orbitron',
      fontSize: 10,
      fontWeight: 'bold',
      fill: this.parseHexColor(COLORS.text),
      alpha: 0.5
    });
    waterVer.position.set(0, 22);

    this.watermarkContainer.addChild(waterTitle, waterVer);
    this.watermarkContainer.alpha = 1.0;
    this.watermarkContainer.visible = false;
    this.game.bgLayer.addChild(this.watermarkContainer);

    // 3. Highscore Container (Pixi)
    this.highscorePixiContainer = new PIXI.Container();
    this.highscorePixiContainer.visible = false;
    this.game.uiLayer.addChild(this.highscorePixiContainer);

    // 4. Help Container (Pixi)
    this.helpPixiContainer = new PIXI.Container();
    this.helpPixiContainer.visible = false;
    this.game.uiLayer.addChild(this.helpPixiContainer);
    this.createPixiHelp();

    this.debugText = new PIXI.Text('DEBUG MODE', {
      fontFamily: 'Orbitron',
      fontSize: 56,
      fontWeight: 'bold',
      fill: this.parseHexColor(COLORS.boss),
      dropShadow: true,
      dropShadowColor: this.parseHexColor(COLORS.boss),
      dropShadowBlur: 20
    });
    this.debugText.anchor.set(0.5);
    this.debugText.position.set(this.game.W / 2, 160);
    this.debugText.visible = false;
    this.game.uiLayer.addChild(this.debugText);

    this.updateHighScores();
  }

  createPixiHelp() {
    const header = new PIXI.Text('UPGRADES', {
      fontFamily: 'Orbitron',
      fontSize: 24,
      fontWeight: 'bold',
      fill: this.parseHexColor(COLORS.text),
      letterSpacing: 4
    });
    header.anchor.set(0.5, 0);
    this.helpPixiContainer.addChild(header);

    const upgrades = [
      { name: 'Shield', color: COLORS.shield, desc: 'Permanent recharge system' },
      { name: 'Double', color: COLORS.double, desc: 'Add projectile (max 4), then +1 damage' },
      { name: 'Rocket', color: COLORS.rocket, desc: 'Auto-targeting missile' },
      { name: 'Pierce', color: COLORS.pierce, desc: 'Shot passes through 1 enemy on kill' },
      { name: 'Heal', color: COLORS.heal, desc: 'Restores 1 life' },
      { name: 'Points', color: COLORS.points, desc: 'Gives Level x 100 Bonus Points' }
    ];

    upgrades.forEach((u, i) => {
      const row = new PIXI.Container();
      row.position.set(-180, 45 + i * 30);

      const dot = new PIXI.Graphics();
      dot.beginFill(this.parseHexColor(u.color));
      dot.drawCircle(0, 8, 6);
      dot.endFill();
      
      const label = new PIXI.Text(u.name + ':', {
        fontFamily: 'Orbitron',
        fontSize: 14,
        fontWeight: 'bold',
        fill: this.parseHexColor(u.color)
      });
      label.position.set(20, 0);

      const desc = new PIXI.Text(u.desc, {
        fontFamily: 'Orbitron',
        fontSize: 12,
        fill: 0xFFFFFF,
        alpha: 0.8
      });
      desc.position.set(100, 2);

      row.addChild(dot, label, desc);
      this.helpPixiContainer.addChild(row);
    });

    const footer = new PIXI.Text('ESC: End Game · H or Tap to continue', {
      fontFamily: 'Orbitron',
      fontSize: 12,
      fill: this.parseHexColor(COLORS.text),
      alpha: 0.7
    });
    footer.anchor.set(0.5, 0);
    footer.position.set(0, 240);
    this.helpPixiContainer.addChild(footer);
  }

  parseHexColor(hex) {
    return parseInt(hex.replace('#', '0x'));
  }

  createHudText(text, x, y, valueColor) {
    const container = new PIXI.Container();
    container.position.set(x, y);
    const labelStr = text.split(': ')[0] + ': ';
    const valStr = text.split(': ')[1];
    const label = new PIXI.Text(labelStr, {
      fontFamily: 'Orbitron',
      fontSize: 16,
      fontWeight: 'bold',
      fill: this.parseHexColor(COLORS.text)
    });
    const value = new PIXI.Text(valStr, {
      fontFamily: 'Orbitron',
      fontSize: 16,
      fontWeight: 'bold',
      fill: valueColor,
      dropShadow: true,
      dropShadowColor: valueColor,
      dropShadowBlur: 8
    });
    value.x = label.width;
    container.addChild(label, value);
    this.game.uiLayer.addChild(container);
    return { container, label, value };
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

  updateStats(gameState) {
    if (!this.hudTexts.score) return;
    const updateIfChanged = (key, newVal) => {
      if (this.lastStats[key] !== newVal) {
        this.hudTexts[key].value.text = newVal;
        this.lastStats[key] = newVal;
      }
    };
    updateIfChanged('score', gameState.score);
    updateIfChanged('level', gameState.level);
    updateIfChanged('lives', gameState.lives);
    updateIfChanged('damage', gameState.playerDamage);
    const shieldStatus = gameState.shieldHits > 0 ? 'ON' : (gameState.hasShieldSystem ? 'OFF' : 'NONE');
    updateIfChanged('shield', shieldStatus);
    const pierceStatus = gameState.hasPierce ? 'YES' : 'NONE';
    updateIfChanged('pierce', pierceStatus);
    const rocketStatus = gameState.rocketLevel > 0 ? gameState.rocketLevel : 'NONE';
    updateIfChanged('rocket', rocketStatus);
    if (this.debugText) {
      if (this.lastStats.debugVisible !== gameState.debugMode) {
        this.debugText.visible = gameState.debugMode;
        this.lastStats.debugVisible = gameState.debugMode;
      }
      if (gameState.debugMode) this.debugText.position.set(gameState.W / 2, 160);
    }
  }

  updateFPS(fps) {
    if (this.hudTexts.fps) this.hudTexts.fps.value.text = Math.round(fps || 0);
  }

  updateLayout(game) {
    const padding = 15;
    const y = 15;
    const colWidth = (game.W - padding * 2) / 4;
    if (this.hudTexts.score) this.hudTexts.score.container.position.set(padding, y);
    if (this.hudTexts.level) this.hudTexts.level.container.position.set(padding + colWidth, y);
    if (this.hudTexts.lives) this.hudTexts.lives.container.position.set(padding + colWidth * 2, y);
    if (this.hudTexts.shield) this.hudTexts.shield.container.position.set(padding + colWidth * 3, y);
    const y2 = y + 25;
    if (this.hudTexts.pierce) this.hudTexts.pierce.container.position.set(padding, y2);
    if (this.hudTexts.damage) this.hudTexts.damage.container.position.set(padding + colWidth, y2);
    if (this.hudTexts.rocket) this.hudTexts.rocket.container.position.set(padding + colWidth * 2, y2);
    if (this.hudTexts.fps) this.hudTexts.fps.container.position.set(padding + colWidth * 3, y2);

    if (this.mainTitleContainer) this.mainTitleContainer.position.set(game.W / 2, 100);
    if (this.watermarkContainer) this.watermarkContainer.position.set(20, game.H - 45);
    if (this.debugText) this.debugText.position.set(game.W / 2, 160);
    if (this.highscorePixiContainer) this.highscorePixiContainer.position.set(game.W / 2, 220);
    if (this.helpPixiContainer) this.helpPixiContainer.position.set(game.W / 2, 220);
  }

  setShootActive(isActive) {
    if (this.els.btnShoot) this.els.btnShoot.classList.toggle('active', isActive);
  }

  showStartScreen() {
    if (this.mainTitleContainer) { this.mainTitleContainer.alpha = 1.0; this.mainTitleText.style.dropShadow = true; }
    if (this.watermarkContainer) this.watermarkContainer.visible = false;
    if (this.highscorePixiContainer) this.highscorePixiContainer.visible = true;
    if (this.helpPixiContainer) this.helpPixiContainer.visible = false;
    this.els.startScreen.classList.remove('hidden');
    this.els.overlay.classList.add('hidden');
    this.els.helpScreen.classList.add('hidden');
    this.els.bossClearScreen.classList.add('hidden');
  }

  hideScreens() {
    if (this.mainTitleContainer) this.mainTitleContainer.alpha = 0;
    if (this.watermarkContainer) this.watermarkContainer.visible = true;
    if (this.highscorePixiContainer) this.highscorePixiContainer.visible = false;
    if (this.helpPixiContainer) this.helpPixiContainer.visible = false;
    this.els.startScreen.classList.add('hidden');
    this.els.overlay.classList.add('hidden');
    this.els.helpScreen.classList.add('hidden');
    this.els.bossClearScreen.classList.add('hidden');
    this.bossClearActive = false;
  }

  showGameOver(won) {
    if (this.mainTitleContainer) { this.mainTitleContainer.alpha = 1.0; this.mainTitleText.style.dropShadow = true; }
    if (this.watermarkContainer) this.watermarkContainer.visible = false;
    if (this.highscorePixiContainer) this.highscorePixiContainer.visible = true;
    if (this.helpPixiContainer) this.helpPixiContainer.visible = false;
    this.els.overlay.classList.remove('hidden');
    this.els.overlayText.textContent = won ? 'YOU WIN!' : 'GAME OVER';
    this.els.overlayText.classList.toggle('win', won);
    this.nameInputActive = false; this.bossClearActive = false;
    this.els.nameInputContainer.classList.add('hidden');
    this.els.bossClearScreen.classList.add('hidden');
    this.updateHighScores();
  }

  showBossClear(level, rewards) {
    this.bossClearActive = true;
    this.els.bossLevelText.textContent = `LEVEL ${level} COMPLETE`;
    this.els.rewardList.innerHTML = '';
    rewards.forEach(r => {
      const li = document.createElement('li'); li.textContent = r;
      this.els.rewardList.appendChild(li);
    });
    this.els.bossClearScreen.classList.remove('hidden');
  }

  hideBossClear() {
    this.bossClearActive = false;
    this.els.bossClearScreen.classList.add('hidden');
  }

  showNameInput(score) {
    if (this.mainTitleContainer) { this.mainTitleContainer.alpha = 1.0; this.mainTitleText.style.dropShadow = true; }
    if (this.watermarkContainer) this.watermarkContainer.visible = false;
    if (this.highscorePixiContainer) this.highscorePixiContainer.visible = false;
    if (this.helpPixiContainer) this.helpPixiContainer.visible = false;
    this.pendingScore = score;
    this.nameInputActive = true;
    this.currentCharIndex = 0;
    this.chars = ['A', 'A', 'A'];
    this.updateCharDisplay();
    this.els.nameInputContainer.classList.remove('hidden');
    this.els.overlay.classList.remove('hidden');
    this.els.overlayText.textContent = 'NEW HIGH SCORE!';
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

  saveHighscore() {
    if (!this.nameInputActive) return;
    const name = this.chars.join('');
    this.updateHighScores({ name, score: this.pendingScore });
    this.nameInputActive = false;
    this.els.nameInputContainer.classList.add('hidden');
    this.els.overlayText.textContent = 'SCORE SAVED!';
    if (this.highscorePixiContainer) this.highscorePixiContainer.visible = true;
  }

  toggleHelp(isVisible) {
    if (this.mainTitleContainer) this.mainTitleContainer.alpha = isVisible ? 1.0 : 0;
    if (this.watermarkContainer) this.watermarkContainer.visible = !isVisible;
    if (this.highscorePixiContainer) this.highscorePixiContainer.visible = false;
    if (this.helpPixiContainer) this.helpPixiContainer.visible = isVisible;
    this.els.helpScreen.classList.toggle('hidden', !isVisible);
  }

  updateHighScores(newEntry) {
    let scores = [];
    try {
      const saved = localStorage.getItem('neonInvadersHighScores');
      if (saved) {
        scores = JSON.parse(saved);
        if (scores.length > 0 && typeof scores[0] === 'number') scores = scores.map(s => ({ name: '???' , score: s }));
      } else {
        scores = [{ name: 'NEO', score: 1000 }, { name: 'TRN', score: 500 }, { name: 'FLY', score: 250 }];
      }
    } catch (e) { console.warn('LocalStorage not available', e); }
    if (newEntry !== undefined) {
      scores.push(newEntry);
      scores.sort((a, b) => b.score - a.score);
      scores = scores.slice(0, 3);
      try { localStorage.setItem('neonInvadersHighScores', JSON.stringify(scores)); } catch (e) { console.warn('Failed to save highscore', e); }
    }
    if (this.highscorePixiContainer) {
      this.highscorePixiContainer.removeChildren();
      const header = new PIXI.Text('HIGH SCORES', {
        fontFamily: 'Orbitron', fontSize: 24, fontWeight: 'bold', fill: this.parseHexColor(COLORS.text), letterSpacing: 4
      });
      header.anchor.set(0.5, 0);
      this.highscorePixiContainer.addChild(header);
      scores.forEach((entry, i) => {
        const entryContainer = new PIXI.Container();
        entryContainer.position.set(0, 45 + i * 35);
        const color = i === 0 ? COLORS.invader2 : (i === 1 ? COLORS.text : COLORS.invader3);
        const style = {
          fontFamily: 'Orbitron', fontSize: 20, fontWeight: 'bold', fill: this.parseHexColor(color),
          dropShadow: true, dropShadowColor: this.parseHexColor(color), dropShadowBlur: 5
        };
        const rank = new PIXI.Text(`${i + 1}.`, style); rank.anchor.set(1, 0); rank.position.set(-80, 0);
        const name = new PIXI.Text(entry.name, style); name.anchor.set(0, 0); name.position.set(-60, 0);
        const score = new PIXI.Text(entry.score.toString().padStart(5, '0'), style); score.anchor.set(0, 0); score.position.set(40, 0);
        entryContainer.addChild(rank, name, score);
        this.highscorePixiContainer.addChild(entryContainer);
      });
    }
  }

  isHighscore(score) {
    let scores = [];
    try {
      const saved = localStorage.getItem('neonInvadersHighScores');
      if (saved) {
        scores = JSON.parse(saved);
        if (scores.length > 0 && typeof scores[0] === 'number') scores = scores.map(s => ({ name: '???' , score: s }));
      } else { scores = [{ score: 1000 }, { score: 500 }, { score: 250 }]; }
    } catch (e) { return false; }
    return score > 0 && (scores.length < 3 || score > scores[scores.length - 1].score);
  }
}
