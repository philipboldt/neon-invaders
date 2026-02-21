(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const livesEl = document.getElementById('lives');
  const shieldEl = document.getElementById('shield');
  const overlay = document.getElementById('overlay');
  const overlayText = document.getElementById('overlay-text');
  const restartBtn = document.getElementById('restart');
  const startScreen = document.getElementById('start-screen');

  const W = canvas.width;
  const H = canvas.height;

  const COLORS = {
    player: '#00f5ff',
    invader1: '#ff00ff',
    invader2: '#39ff14',
    invader3: '#ff6600',
    bullet: '#00f5ff',
    glow: 'rgba(0, 245, 255, 0.6)',
    shield: '#00f5ff',
    double: '#39ff14',
    rocket: '#ff6600',
  };

  const ROCKET_W = 10;
  const ROCKET_H = 24;
  const ROCKET_HOMING_SPEED = 11;
  const ROCKET_HIT_RADIUS = 28;

  let gameRunning = false;
  let score = 0;
  let lives = 3;
  let level = 1;

  const UPGRADE_TYPES = ['shield', 'double', 'rocket'];
  const DROP_CHANCE = 0.18;
  const UPGRADE_FALL_SPEED = 3;
  const UPGRADE_W = 24;
  const UPGRADE_H = 24;
  const ROCKET_INTERVAL_MS = 5000;
  const SHIELD_HITS = 2;

  let upgrades = [];
  let rockets = [];
  let shieldHits = 0;
  let doubleShot = false;
  let hasRocket = false;
  let lastRocketTime = 0;

  const player = {
    x: W / 2 - 20,
    y: H - 60,
    w: 40,
    h: 24,
    speed: 6,
    dir: 0,
  };

  let invaders = [];
  let bullets = [];
  let invaderBullets = [];
  const BULLET_SPEED = -10;
  const INVADER_BULLET_SPEED = 4;
  const INVADER_ROWS = 5;
  const INVADER_COLS = 11;
  const INVADER_W = 36;
  const INVADER_H = 24;
  let invaderDir = 1;
  let invaderDown = false;
  let invaderTick = 0;
  const INVADER_STEP_MS_BASE = 500;
  let lastInvaderStep = 0;
  let lastInvaderShoot = 0;
  const INVADER_SHOOT_INTERVAL_BASE = 1000;

  function drawRect(x, y, w, h, fill, glow) {
    if (glow) {
      ctx.shadowColor = fill;
      ctx.shadowBlur = 15;
    }
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0;
  }

  function drawPlayer() {
    const { x, y, w, h } = player;
    if (shieldHits > 0) {
      ctx.strokeStyle = COLORS.shield;
      ctx.shadowColor = COLORS.shield;
      ctx.shadowBlur = 20;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
      ctx.shadowBlur = 0;
    }
    drawRect(x, y, w, h, COLORS.player, true);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(x + 8, y + 4, 8, 8);
    ctx.fillRect(x + w - 16, y + 4, 8, 8);
  }

  function drawUpgrades() {
    upgrades.forEach((u) => {
      const c = u.type === 'shield' ? COLORS.shield : u.type === 'double' ? COLORS.double : COLORS.rocket;
      ctx.shadowColor = c;
      ctx.shadowBlur = 12;
      ctx.fillStyle = c;
      ctx.fillRect(u.x, u.y, UPGRADE_W, UPGRADE_H);
      ctx.shadowBlur = 0;
    });
  }

  function drawRockets() {
    ctx.fillStyle = COLORS.rocket;
    ctx.shadowColor = COLORS.rocket;
    ctx.shadowBlur = 15;
    rockets.forEach((r) => {
      ctx.fillRect(r.x, r.y, ROCKET_W, ROCKET_H);
    });
    ctx.shadowBlur = 0;
  }

  function initInvaders() {
    invaders = [];
    const startX = 80;
    const startY = 80;
    const gap = 8;
    const rows = Math.min(INVADER_ROWS + Math.floor(level / 2), 7);
    const cols = Math.min(INVADER_COLS + Math.floor(level / 3), 14);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const color =
          row === 0 ? COLORS.invader3 :
          row < Math.ceil(rows / 2) ? COLORS.invader1 : COLORS.invader2;
        invaders.push({
          x: startX + col * (INVADER_W + gap),
          y: startY + row * (INVADER_H + gap),
          w: INVADER_W,
          h: INVADER_H,
          color,
        });
      }
    }
  }

  function drawInvaders() {
    invaders.forEach((inv) => {
      drawRect(inv.x, inv.y, inv.w, inv.h, inv.color, true);
    });
  }

  function drawBullets() {
    ctx.fillStyle = COLORS.bullet;
    ctx.shadowColor = COLORS.bullet;
    ctx.shadowBlur = 8;
    bullets.forEach((b) => {
      ctx.fillRect(b.x, b.y, 4, 12);
    });
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.invader1;
    ctx.shadowColor = COLORS.invader1;
    ctx.shadowBlur = 6;
    invaderBullets.forEach((b) => {
      ctx.fillRect(b.x, b.y, 6, 10);
    });
    ctx.shadowBlur = 0;
  }

  function updatePlayer(dt) {
    player.x += player.dir * player.speed;
    player.x = Math.max(0, Math.min(W - player.w, player.x));
  }

  function updateBullets(dt) {
    bullets = bullets.filter((b) => {
      b.y += BULLET_SPEED;
      return b.y > -20;
    });
    invaderBullets = invaderBullets.filter((b) => {
      b.y += INVADER_BULLET_SPEED;
      return b.y < H + 20;
    });
  }

  function updateInvaders(now) {
    const stepMs = Math.max(180, INVADER_STEP_MS_BASE - level * 35);
    if (now - lastInvaderStep < stepMs) return;
    lastInvaderStep = now;

    let moveDown = false;
    const margin = 40;
    for (const inv of invaders) {
      if (invaderDir > 0 && inv.x + inv.w >= W - margin) moveDown = true;
      if (invaderDir < 0 && inv.x <= margin) moveDown = true;
    }
    if (moveDown) {
      invaderDir *= -1;
      invaders.forEach((inv) => (inv.y += 20));
    } else {
      invaders.forEach((inv) => (inv.x += invaderDir * 12));
    }
  }

  function invaderShoot(now) {
    const shootInterval = Math.max(350, INVADER_SHOOT_INTERVAL_BASE - level * 60);
    if (invaders.length === 0 || now - lastInvaderShoot < shootInterval) return;
    lastInvaderShoot = now;
    const idx = Math.floor(Math.random() * invaders.length);
    const inv = invaders[idx];
    invaderBullets.push({
      x: inv.x + inv.w / 2 - 3,
      y: inv.y + inv.h,
      w: 6,
      h: 10,
    });
  }

  function spawnUpgrade(x, y) {
    if (Math.random() >= DROP_CHANCE) return;
    const type = UPGRADE_TYPES[Math.floor(Math.random() * UPGRADE_TYPES.length)];
    upgrades.push({
      x: x + INVADER_W / 2 - UPGRADE_W / 2,
      y: y,
      w: UPGRADE_W,
      h: UPGRADE_H,
      type,
    });
  }

  function updateUpgrades() {
    upgrades = upgrades.filter((u) => {
      u.y += UPGRADE_FALL_SPEED;
      if (u.y > H) return false;
      if (
        u.x + u.w > player.x && u.x < player.x + player.w &&
        u.y + u.h > player.y && u.y < player.y + player.h
      ) {
        if (u.type === 'shield') {
          shieldHits = SHIELD_HITS;
          shieldEl.textContent = shieldHits;
        }
        if (u.type === 'double') doubleShot = true;
        if (u.type === 'rocket') hasRocket = true;
        return false;
      }
      return true;
    });
  }

  function updateRockets(now) {
    if (hasRocket && invaders.length > 0 && now - lastRocketTime >= ROCKET_INTERVAL_MS) {
      lastRocketTime = now;
      const targetInv = invaders[Math.floor(Math.random() * invaders.length)];
      const targetX = targetInv.x + targetInv.w / 2;
      const targetY = targetInv.y + targetInv.h / 2;
      rockets.push({
        x: player.x + player.w / 2 - ROCKET_W / 2,
        y: player.y,
        w: ROCKET_W,
        h: ROCKET_H,
        targetX,
        targetY,
      });
    }
    rockets = rockets.filter((r) => {
      const cx = r.x + ROCKET_W / 2;
      const cy = r.y + ROCKET_H / 2;
      const dx = r.targetX - cx;
      const dy = r.targetY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < ROCKET_HIT_RADIUS) {
        for (let i = 0; i < invaders.length; i++) {
          const inv = invaders[i];
          const invCx = inv.x + inv.w / 2;
          const invCy = inv.y + inv.h / 2;
          const d = Math.sqrt((cx - invCx) ** 2 + (cy - invCy) ** 2);
          if (d < ROCKET_HIT_RADIUS) {
            score += 15 * (invaders[i].color === COLORS.invader3 ? 3 : invaders[i].color === COLORS.invader1 ? 2 : 1);
            spawnUpgrade(inv.x, inv.y);
            invaders.splice(i, 1);
            scoreEl.textContent = score;
            return false;
          }
        }
        return false;
      }
      if (dist > 0) {
        r.x += (dx / dist) * ROCKET_HOMING_SPEED;
        r.y += (dy / dist) * ROCKET_HOMING_SPEED;
      }
      if (r.y < -ROCKET_H * 2 || r.y > H + ROCKET_H || r.x < -ROCKET_W * 2 || r.x > W + ROCKET_W) return false;
      return true;
    });
  }

  function checkCollisions() {
    bullets = bullets.filter((b) => {
      for (let i = 0; i < invaders.length; i++) {
        const inv = invaders[i];
        if (
          b.x + 4 > inv.x && b.x < inv.x + inv.w &&
          b.y < inv.y + inv.h && b.y + 12 > inv.y
        ) {
          score += 10 * (invaders[i].color === COLORS.invader3 ? 3 : invaders[i].color === COLORS.invader1 ? 2 : 1);
          spawnUpgrade(inv.x, inv.y);
          invaders.splice(i, 1);
          scoreEl.textContent = score;
          return false;
        }
      }
      return true;
    });

    invaderBullets = invaderBullets.filter((b) => {
      if (
        b.x + 6 > player.x && b.x < player.x + player.w &&
        b.y + 10 > player.y && b.y < player.y + player.h
      ) {
        if (shieldHits > 0) {
          shieldHits--;
          shieldEl.textContent = shieldHits;
        } else {
          lives--;
          livesEl.textContent = lives;
        }
        return false;
      }
      return true;
    });
  }

  function checkLose() {
    for (const inv of invaders) {
      if (inv.y + inv.h >= player.y) return true;
    }
    return lives <= 0;
  }

  function endGame(won) {
    gameRunning = false;
    overlay.classList.remove('hidden');
    overlayText.textContent = won ? 'YOU WIN!' : 'GAME OVER';
    overlayText.classList.toggle('win', won);
  }

  function gameLoop(now = 0) {
    if (!gameRunning) return;

    ctx.fillStyle = '#0d0d14';
    ctx.fillRect(0, 0, W, H);

    updatePlayer(16);
    updateBullets(16);
    updateInvaders(now);
    invaderShoot(now);
    checkCollisions();
    updateUpgrades();
    updateRockets(now);

    drawInvaders();
    drawBullets();
    drawRockets();
    drawUpgrades();
    drawPlayer();

    if (invaders.length === 0) {
      level++;
      levelEl.textContent = level;
      initInvaders();
      lastInvaderStep = now;
      lastInvaderShoot = now;
      requestAnimationFrame(gameLoop);
      return;
    }
    if (checkLose()) {
      endGame(false);
      return;
    }

    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    startScreen.classList.add('hidden');
    overlay.classList.add('hidden');
    score = 0;
    lives = 3;
    level = 1;
    scoreEl.textContent = score;
    levelEl.textContent = level;
    livesEl.textContent = lives;
    player.x = W / 2 - 20;
    player.y = H - 60;
    bullets = [];
    invaderBullets = [];
    rockets = [];
    upgrades = [];
    shieldHits = 0;
    shieldEl.textContent = 0;
    doubleShot = false;
    hasRocket = false;
    lastRocketTime = 0;
    invaderDir = 1;
    lastInvaderStep = 0;
    lastInvaderShoot = 0;
    initInvaders();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') player.dir = -1;
    if (e.code === 'ArrowRight') player.dir = 1;
    if (e.code === 'Space') {
      e.preventDefault();
      if (!gameRunning && !startScreen.classList.contains('hidden')) {
        startGame();
        return;
      }
      if (gameRunning) {
        const maxBullets = doubleShot ? 8 : 5;
        if (bullets.length < maxBullets) {
          if (doubleShot) {
            bullets.push({ x: player.x + player.w / 2 - 2 - 12, y: player.y, w: 4, h: 12 });
            bullets.push({ x: player.x + player.w / 2 - 2 + 12, y: player.y, w: 4, h: 12 });
          } else {
            bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 12 });
          }
        }
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' && player.dir === -1) player.dir = 0;
    if (e.code === 'ArrowRight' && player.dir === 1) player.dir = 0;
  });

  restartBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    startGame();
  });
})();
