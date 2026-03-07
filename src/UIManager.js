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
    this.updateHighScores();
    this.bindNameInputTouch();
    this.hudTexts = {};
  }

  initPixiHUD(game) {
    this.game = game;
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
    this.debugText.position.set(this.game.W / 2, 72);
    this.debugText.visible = false;
    this.game.uiLayer.addChild(this.debugText);
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
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(arrow.dataset.index);
        const dir = arrow.dataset.dir;
        this.currentCharIndex = index;
        this.changeChar(index, dir === 'up' ? 1 : -1);
      });
    });

    if (this.els.saveNameBtn) {
      this.els.saveNameBtn.addEventListener('pointerdown', (e) => {
        if (!this.nameInputActive) return;
        e.preventDefault();
        e.stopPropagation();
        this.saveHighscore();
      });
    }

    // Allow clicking/tapping the characters themselves to select them
    this.els.charEls.forEach((charEl, index) => {
      charEl.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.currentCharIndex = index;
        this.updateCharDisplay();
      });
    });
  }

  changeChar(index, delta) {
    let charCode = this.chars[index].charCodeAt(0);
    // A-Z is 65-90
    charCode = ((charCode - 65 + delta + 26) % 26) + 65;
    this.chars[index] = String.fromCharCode(charCode);
    this.updateCharDisplay();
  }

  updateStats(gameState) {
    if (!this.hudTexts.score) return;

    this.hudTexts.score.value.text = gameState.score;
    this.hudTexts.level.value.text = gameState.level;
    this.hudTexts.lives.value.text = gameState.lives;
    this.hudTexts.damage.value.text = gameState.playerDamage;
    
    this.hudTexts.shield.value.text = gameState.shieldHits > 0 ? 'ON' : (gameState.hasShieldSystem ? 'OFF' : 'NONE');
    this.hudTexts.pierce.value.text = gameState.hasPierce ? 'YES' : 'NONE';
    this.hudTexts.rocket.value.text = gameState.rocketLevel > 0 ? gameState.rocketLevel : 'NONE';
    
    if (this.debugText) this.debugText.visible = gameState.debugMode;
  }

  drawHUD(ctx, gameState) {
    // Legacy draw, no longer needed
  }

  setShootActive(isActive) {
    if (this.els.btnShoot) this.els.btnShoot.classList.toggle('active', isActive);
  }

  showStartScreen() {
    this.els.startScreen.classList.remove('hidden');
    this.els.overlay.classList.add('hidden');
    this.els.helpScreen.classList.add('hidden');
    this.els.bossClearScreen.classList.add('hidden');
  }

  hideScreens() {
    this.els.startScreen.classList.add('hidden');
    this.els.overlay.classList.add('hidden');
    this.els.helpScreen.classList.add('hidden');
    this.els.bossClearScreen.classList.add('hidden');
    this.bossClearActive = false;
  }

  showGameOver(won) {
    this.els.overlay.classList.remove('hidden');
    this.els.overlayText.textContent = won ? 'YOU WIN!' : 'GAME OVER';
    this.els.overlayText.classList.toggle('win', won);
    
    // Hide other inputs
    this.nameInputActive = false;
    this.bossClearActive = false;
    this.els.nameInputContainer.classList.add('hidden');
    this.els.bossClearScreen.classList.add('hidden');
  }

  showBossClear(level, rewards) {
    this.bossClearActive = true;
    this.els.bossLevelText.textContent = `LEVEL ${level} COMPLETE`;
    this.els.rewardList.innerHTML = '';
    rewards.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      this.els.rewardList.appendChild(li);
    });
    this.els.bossClearScreen.classList.remove('hidden');
  }

  hideBossClear() {
    this.bossClearActive = false;
    this.els.bossClearScreen.classList.add('hidden');
  }

  showNameInput(score) {
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

    if (e.code === 'ArrowLeft') {
      this.currentCharIndex = (this.currentCharIndex - 1 + 3) % 3;
    } else if (e.code === 'ArrowRight') {
      this.currentCharIndex = (this.currentCharIndex + 1) % 3;
    } else if (e.code === 'ArrowUp') {
      this.changeChar(this.currentCharIndex, 1);
    } else if (e.code === 'ArrowDown') {
      this.changeChar(this.currentCharIndex, -1);
    } else if (e.code === 'Enter' || e.code === 'Space') {
      this.saveHighscore();
      return;
    }
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
  }

  toggleHelp(isVisible) {
    this.els.helpScreen.classList.toggle('hidden', !isVisible);
  }

  updateHighScores(newEntry) {
    let scores = [];
    try {
      const saved = localStorage.getItem('neonInvadersHighScores');
      if (saved) {
        scores = JSON.parse(saved);
        // Migration: convert old number-only scores to objects
        if (scores.length > 0 && typeof scores[0] === 'number') {
          scores = scores.map(s => ({ name: '???' , score: s }));
        }
      } else {
        scores = [
          { name: 'NEO', score: 1000 },
          { name: 'TRN', score: 500 },
          { name: 'FLY', score: 250 }
        ];
      }
    } catch (e) {
      console.warn('LocalStorage not available', e);
    }

    if (newEntry !== undefined) {
      scores.push(newEntry);
      scores.sort((a, b) => b.score - a.score);
      scores = scores.slice(0, 3);
      try {
        localStorage.setItem('neonInvadersHighScores', JSON.stringify(scores));
      } catch (e) {
        console.warn('Failed to save highscore', e);
      }
    }
    const listEls = document.querySelectorAll('.highscore-list');
    listEls.forEach(listEl => {
      listEl.innerHTML = '';
      scores.forEach((entry, i) => {
        const li = document.createElement('li');
        const rankSpan = document.createElement('span');
        rankSpan.className = 'rank';
        rankSpan.textContent = `${i + 1}.`;
        const nameSpan = document.createElement('span');
        nameSpan.className = 'name';
        nameSpan.textContent = entry.name;
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'score-val';
        scoreSpan.textContent = entry.score.toString().padStart(5, '0');
        li.appendChild(rankSpan);
        li.appendChild(nameSpan);
        li.appendChild(scoreSpan);
        listEl.appendChild(li);
      });
    });
  }

  isHighscore(score) {
    let scores = [];
    try {
      const saved = localStorage.getItem('neonInvadersHighScores');
      if (saved) {
        scores = JSON.parse(saved);
        if (scores.length > 0 && typeof scores[0] === 'number') {
          scores = scores.map(s => ({ name: '???' , score: s }));
        }
      } else {
        scores = [{ score: 1000 }, { score: 500 }, { score: 250 }];
      }
    } catch (e) {
      return false;
    }
    return scores.length < 3 || score > scores[scores.length - 1].score;
  }
}
