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
    this.nameInputActive = false;
    this.bossClearActive = false;
    this.currentCharIndex = 0;
    this.chars = ['A', 'A', 'A'];
    this.pendingScore = 0;
    this.updateHighScores();
    this.bindNameInputTouch();
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
    if (this.els.score) this.els.score.textContent = gameState.score;
    if (this.els.level) this.els.level.textContent = gameState.level;
    if (this.els.lives) this.els.lives.textContent = gameState.lives;
    if (this.els.damage) this.els.damage.textContent = gameState.playerDamage;
    if (this.els.shield) this.els.shield.textContent = gameState.shieldHits > 0 ? 'activated' : (gameState.hasShieldSystem ? 'deactivated' : 'no shield');
    if (this.els.pierce) this.els.pierce.textContent = gameState.hasPierce ? 'active' : 'none';
    if (this.els.rocket) this.els.rocket.textContent = gameState.rocketLevel > 0 ? gameState.rocketLevel : 'none';
  }

  drawHUD(ctx, gameState) {
    ctx.save();
    ctx.font = 'bold 16px Orbitron';
    ctx.textBaseline = 'top';
    const padding = 15;
    const y = 15;
    const colWidth = (gameState.W - padding * 2) / 4;

    // Row 1
    this.drawStat(ctx, 'Score: ', gameState.score, padding, y, '#39ff14');
    this.drawStat(ctx, 'Level: ', gameState.level, padding + colWidth, y, '#ff6600');
    this.drawStat(ctx, 'Lives: ', gameState.lives, padding + colWidth * 2, y, '#ff3366');
    
    const shieldText = gameState.shieldHits > 0 ? 'ON' : (gameState.hasShieldSystem ? 'OFF' : 'NONE');
    this.drawStat(ctx, 'Shield: ', shieldText, padding + colWidth * 3, y, '#00f5ff');

    // Row 2
    const y2 = y + 25;
    this.drawStat(ctx, 'Pierce: ', gameState.hasPierce ? 'YES' : 'NONE', padding, y2, '#bc13fe');
    this.drawStat(ctx, 'Damage: ', gameState.playerDamage, padding + colWidth, y2, '#39ff14');
    this.drawStat(ctx, 'Rocket: ', gameState.rocketLevel > 0 ? gameState.rocketLevel : 'NONE', padding + colWidth * 2, y2, '#ff6600');

    ctx.restore();
  }

  drawStat(ctx, label, value, x, y, valueColor) {
    ctx.fillStyle = '#00f5ff';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y);
    const labelWidth = ctx.measureText(label).width;
    ctx.fillStyle = valueColor;
    ctx.shadowColor = valueColor;
    ctx.shadowBlur = 8;
    ctx.fillText(value, x + labelWidth, y);
    ctx.shadowBlur = 0;
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
        rankSpan.textContent = `${i + 1}. ${entry.name}`;
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'score-val';
        scoreSpan.textContent = entry.score.toString().padStart(5, '0');
        li.appendChild(rankSpan);
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
