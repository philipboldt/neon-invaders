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
      startScreen: document.getElementById('start-screen'),
      helpScreen: document.getElementById('help-screen'),
      btnShoot: document.getElementById('btn-shoot'),
      btnLeft: document.getElementById('btn-left'),
      btnRight: document.getElementById('btn-right'),
      btnPause: document.getElementById('btn-pause'),
      restartBtn: document.getElementById('restart'),
      rocket: document.getElementById('rocket')
    };
    this.updateHighScores();
  }

  updateStats(gameState) {
    this.els.score.textContent = gameState.score;
    this.els.level.textContent = gameState.level;
    this.els.lives.textContent = gameState.lives;
    this.els.damage.textContent = gameState.playerDamage;
    this.els.shield.textContent = gameState.shieldHits > 0 ? 'activated' : (gameState.hasShieldSystem ? 'deactivated' : 'no shield');
    this.els.pierce.textContent = gameState.hasPierce ? 'active' : 'none';
    this.els.rocket.textContent = gameState.rocketLevel > 0 ? `Level ${gameState.rocketLevel}` : 'none';
  }

  setShootActive(isActive) {
    if (this.els.btnShoot) this.els.btnShoot.classList.toggle('active', isActive);
  }

  showStartScreen() {
    this.els.startScreen.classList.remove('hidden');
    this.els.overlay.classList.add('hidden');
    this.els.helpScreen.classList.add('hidden');
  }

  hideScreens() {
    this.els.startScreen.classList.add('hidden');
    this.els.overlay.classList.add('hidden');
    this.els.helpScreen.classList.add('hidden');
  }

  showGameOver(won) {
    this.els.overlay.classList.remove('hidden');
    this.els.overlayText.textContent = won ? 'YOU WIN!' : 'GAME OVER';
    this.els.overlayText.classList.toggle('win', won);
  }

  toggleHelp(isVisible) {
    this.els.helpScreen.classList.toggle('hidden', !isVisible);
  }

  updateHighScores(newScore) {
    let scores = JSON.parse(localStorage.getItem('neonInvadersHighScores') || '[0,0,0]');
    if (newScore !== undefined) {
      scores.push(newScore);
      scores.sort((a, b) => b - a);
      scores = scores.slice(0, 3);
      localStorage.setItem('neonInvadersHighScores', JSON.stringify(scores));
    }
    const listEls = document.querySelectorAll('.highscore-list');
    listEls.forEach(listEl => {
      listEl.innerHTML = '';
      scores.forEach((s, i) => {
        const li = document.createElement('li');
        const rankSpan = document.createElement('span');
        rankSpan.className = 'rank';
        rankSpan.textContent = `${i + 1}.`;
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'score-val';
        scoreSpan.textContent = s.toString().padStart(5, '0');
        li.appendChild(rankSpan);
        li.appendChild(scoreSpan);
        listEl.appendChild(li);
      });
    });
  }
}
