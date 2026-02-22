(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const livesEl = document.getElementById('lives');
  const shieldEl = document.getElementById('shield');
  const pierceEl = document.getElementById('pierce');
  const damageEl = document.getElementById('damage');
  const overlay = document.getElementById('overlay');
  const overlayText = document.getElementById('overlay-text');
  const restartBtn = document.getElementById('restart');
  const startScreen = document.getElementById('start-screen');
  const helpScreen = document.getElementById('help-screen');

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
    heal: '#ff3366',
    pierce: '#ffff00',
  };

  const ROCKET_W = 10;
  const ROCKET_H = 24;
  const ROCKET_INITIAL_SPEED = 1;
  const ROCKET_MAX_SPEED = 9;
  const ROCKET_THRUST = 0.25;
  const ROCKET_STEER_STRENGTH = 0.12;
  const ROCKET_VERTICAL_PHASE = 55;
  const ROCKET_HIT_RADIUS = 28;

  let gameRunning = false;
  let score = 0;
  let lives = 3;
  let level = 1;

  const UPGRADE_TYPES = ['shield', 'double', 'rocket', 'pierce', 'heal'];
  const DROP_CHANCE = 0.18;
  const UPGRADE_FALL_SPEED = 3;
  const UPGRADE_W = 24;
  const UPGRADE_H = 24;
  const ROCKET_INTERVAL_MS = 5000;
  const SHIELD_RECHARGE_MS = 5000;

  const EXPLOSION_PARTICLES = 18;
  const PARTICLE_MAX_SIZE = 14;
  const PARTICLE_LIFE = 28;
  const PARTICLE_SPEED = 5;
  const ROCKET_TRAIL_SIZE = 5;
  const ROCKET_TRAIL_LIFE = 14;
  const ROCKET_TRAIL_DRAG = 0.25;

  let upgrades = [];
  let rockets = [];
  let particles = [];
  let shieldHits = 0;
  let hasShieldSystem = false;
  let lastShieldLostTime = -1;
  let shotCount = 1;
  let playerDamage = 1;
  let hasRocket = false;
  let hasPierce = false;
  let lastRocketTime = 0;
  let debugMode = false;
  let isPaused = false;
  let spacePressed = false;
  let lastPlayerShot = 0;
  const PLAYER_SHOOT_COOLDOWN = 200;

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
    const radius = UPGRADE_W / 2;
    upgrades.forEach((u) => {
      let c;
      if (u.type === 'shield') c = COLORS.shield;
      else if (u.type === 'double') c = COLORS.double;
      else if (u.type === 'rocket') c = COLORS.rocket;
      else if (u.type === 'pierce') c = COLORS.pierce;
      else c = COLORS.heal;

      const cx = u.x + radius;
      const cy = u.y + radius;
      ctx.shadowColor = c;
      ctx.shadowBlur = 12;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function spawnExplosion(cx, cy, color, angleStart = 0, angleRange = Math.PI * 2) {
    for (let n = 0; n < EXPLOSION_PARTICLES; n++) {
      const angle = angleStart + (angleRange * n) / EXPLOSION_PARTICLES + (Math.random() - 0.5) * (angleRange / EXPLOSION_PARTICLES);
      const speed = PARTICLE_SPEED * (0.6 + Math.random() * 0.8);
      const maxSize = PARTICLE_MAX_SIZE * (0.4 + Math.random() * 0.6);
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: maxSize,
        maxSize,
        life: 0,
        maxLife: PARTICLE_LIFE,
        color,
      });
    }
  }

  function spawnRocketTrail(cx, cy, vx, vy) {
    const speed = Math.sqrt(vx * vx + vy * vy) || 1;
    const backX = (-vx / speed) * ROCKET_TRAIL_DRAG * speed;
    const backY = (-vy / speed) * ROCKET_TRAIL_DRAG * speed;
    particles.push({
      x: cx,
      y: cy,
      vx: backX + (Math.random() - 0.5) * 1.5,
      vy: backY + (Math.random() - 0.5) * 1.5,
      size: ROCKET_TRAIL_SIZE,
      maxSize: ROCKET_TRAIL_SIZE * (0.6 + Math.random() * 0.4),
      life: 0,
      maxLife: ROCKET_TRAIL_LIFE,
      color: COLORS.rocket,
    });
  }

  function updateParticles() {
    particles = particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      return p.life < p.maxLife;
    });
  }

  function drawParticles() {
    particles.forEach((p) => {
      const t = p.life / p.maxLife;
      const size = Math.max(0, p.maxSize * (1 - t));
      if (size <= 0) return;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      ctx.shadowBlur = 0;
    });
  }

  function drawRocketTargets() {
    const neonRed = '#ff0844';
    rockets.forEach((r) => {
      let tx = r.targetX - INVADER_W / 2;
      let ty = r.targetY - INVADER_H / 2;
      let bestD = Infinity;
      for (const inv of invaders) {
        const icx = inv.x + inv.w / 2;
        const icy = inv.y + inv.h / 2;
        const d = (icx - r.targetX) ** 2 + (icy - r.targetY) ** 2;
        if (d < bestD) {
          bestD = d;
          tx = inv.x;
          ty = inv.y;
        }
      }
      ctx.strokeStyle = neonRed;
      ctx.shadowColor = neonRed;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3;
      ctx.strokeRect(tx, ty, INVADER_W, INVADER_H);
      ctx.shadowBlur = 0;
    });
  }

  function drawRockets() {
    rockets.forEach((r) => {
      const cx = r.x + ROCKET_W / 2;
      const cy = r.y + ROCKET_H / 2;
      const angle = Math.atan2(r.vy, r.vx);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.translate(-ROCKET_W / 2, -ROCKET_H / 2);
      ctx.fillStyle = COLORS.rocket;
      ctx.shadowColor = COLORS.rocket;
      ctx.shadowBlur = 15;
      ctx.fillRect(0, 0, ROCKET_W, ROCKET_H);
      ctx.shadowBlur = 0;
      ctx.restore();
    });
  }

  function initInvaders() {
    invaders = [];
    const startX = 80;
    const startY = 80;
    const gap = 8;
    const rows = Math.min(INVADER_ROWS + Math.floor(level / 2), 7);
    const cols = Math.min(INVADER_COLS + Math.floor(level / 3), 14);
    const block = Math.floor((level - 1) / 4);
    const p = (level - 1) % 4;
    baseHp = 1 + block;
    higherHp = baseHp + 1;
    rowsWithHigher = p * 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const color =
          row === 0 ? COLORS.invader3 :
          row < Math.ceil(rows / 2) ? COLORS.invader1 : COLORS.invader2;
        const maxHp = row < rowsWithHigher ? higherHp : baseHp;
        invaders.push({
          x: startX + col * (INVADER_W + gap),
          y: startY + row * (INVADER_H + gap),
          w: INVADER_W,
          h: INVADER_H,
          color,
          maxHp,
          hp: maxHp,
        });
      }
    }
  }

  function darkenColor(hex, ratio) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.floor(((n >> 16) & 0xff) * ratio));
    const g = Math.max(0, Math.floor(((n >> 8) & 0xff) * ratio));
    const b = Math.max(0, Math.floor((n & 0xff) * ratio));
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  function drawInvaders() {
    invaders.forEach((inv) => {
      const ratio = 0.45 + 0.55 * (inv.hp / inv.maxHp);
      const color = ratio >= 1 ? inv.color : darkenColor(inv.color, ratio);
      drawRect(inv.x, inv.y, inv.w, inv.h, color, true);
      if (debugMode) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(inv.hp + '/' + inv.maxHp, inv.x + inv.w / 2, inv.y + inv.h / 2);
      }
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
    if (invaders.length === 0) return;

    // Smooth speed calculation based on level
    const speed = (40 + level * 15) / 60;
    let moveDown = false;
    const margin = 40;
    const moveX = invaderDir * speed;

    for (const inv of invaders) {
      if (invaderDir > 0 && inv.x + inv.w + moveX >= W - margin) moveDown = true;
      if (invaderDir < 0 && inv.x + moveX <= margin) moveDown = true;
    }

    if (moveDown) {
      invaderDir *= -1;
      invaders.forEach((inv) => (inv.y += 20));
    } else {
      invaders.forEach((inv) => (inv.x += moveX));
    }
  }

  function playerShoot(now) {
    if (!spacePressed || now - lastPlayerShot < PLAYER_SHOOT_COOLDOWN) return;
    lastPlayerShot = now;
    const maxBullets = 5 + shotCount * 2;
    if (bullets.length < maxBullets) {
      const spread = 14;
      const startX = player.x + player.w / 2 - 2 - (shotCount - 1) * (spread / 2);
      for (let i = 0; i < shotCount; i++) {
        bullets.push({ x: startX + i * spread, y: player.y, w: 4, h: 12 });
      }
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
    
    const availableTypes = UPGRADE_TYPES.filter(type => {
      if (type === 'shield' && hasShieldSystem) return false;
      if (type === 'rocket' && hasRocket) return false;
      if (type === 'pierce' && hasPierce) return false;
      if (type === 'heal' && lives >= 5) return false;
      return true;
    });

    if (availableTypes.length === 0) return;

    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
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
        spawnExplosion(player.x + player.w / 2, player.y + player.h / 2, COLORS[u.type], Math.PI, Math.PI);
        if (!debugMode) {
          if (u.type === 'shield') {
            shieldHits = 1;
            hasShieldSystem = true;
            lastShieldLostTime = -1;
            shieldEl.textContent = 'activated';
          }
          if (u.type === 'double') {
            if (shotCount < 4) {
              shotCount++;
            } else {
              playerDamage++;
              damageEl.textContent = playerDamage;
            }
          }
          if (u.type === 'rocket') hasRocket = true;
          if (u.type === 'pierce') {
            hasPierce = true;
            pierceEl.textContent = 'active';
          }
          if (u.type === 'heal') {
            if (lives < 5) {
              lives++;
              livesEl.textContent = lives;
            }
          }
        }
        return false;
      }
      return true;
    });
  }

  function getLowestRowInvaders() {
    if (invaders.length === 0) return [];
    const lowestY = Math.max(...invaders.map((inv) => inv.y));
    return invaders.filter((inv) => inv.y >= lowestY - 2);
  }

  function updateRockets(now) {
    const currentLowest = getLowestRowInvaders();
    if (hasRocket && currentLowest.length > 0 && now - lastRocketTime >= ROCKET_INTERVAL_MS) {
      lastRocketTime = now;
      const targetInv = currentLowest[Math.floor(Math.random() * currentLowest.length)];
      rockets.push({
        x: player.x + player.w / 2 - ROCKET_W / 2,
        y: player.y,
        w: ROCKET_W,
        h: ROCKET_H,
        targetX: targetInv.x + targetInv.w / 2,
        targetY: targetInv.y + targetInv.h / 2,
        vx: 0,
        vy: -ROCKET_INITIAL_SPEED,
        distanceTraveled: 0,
      });
    }
    rockets = rockets.filter((r) => {
      if (currentLowest.length > 0) {
        let bestInv = null;
        let bestD = Infinity;
        for (const inv of currentLowest) {
          const d = (inv.x + inv.w / 2 - r.targetX) ** 2 + (inv.y + inv.h / 2 - r.targetY) ** 2;
          if (d < bestD) {
            bestD = d;
            bestInv = inv;
          }
        }
        if (bestInv) {
          r.targetX = bestInv.x + bestInv.w / 2;
          r.targetY = bestInv.y + bestInv.h / 2;
        }
      }

      const cx = r.x + ROCKET_W / 2;
      const cy = r.y + ROCKET_H / 2;
      const dx = r.targetX - cx;
      const dy = r.targetY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ROCKET_HIT_RADIUS) {
        let bestI = -1;
        let bestD = Infinity;
        for (let i = 0; i < invaders.length; i++) {
          const inv = invaders[i];
          if (!currentLowest.includes(inv)) continue;
          const d = (inv.x + inv.w / 2 - r.targetX) ** 2 + (inv.y + inv.h / 2 - r.targetY) ** 2;
          if (d < bestD) {
            bestD = d;
            bestI = i;
          }
        }
        if (bestI >= 0) {
          const inv = invaders[bestI];
          const invCx = inv.x + inv.w / 2;
          const invCy = inv.y + inv.h / 2;
          score += 15 * (inv.color === COLORS.invader3 ? 3 : inv.color === COLORS.invader1 ? 2 : 1);
          spawnExplosion(invCx, invCy, inv.color);
          spawnUpgrade(inv.x, inv.y);
          invaders.splice(bestI, 1);
          scoreEl.textContent = score;
        }
        return false;
      }
      if (dist > 0 && r.distanceTraveled >= ROCKET_VERTICAL_PHASE) {
        const desiredDx = dx / dist;
        const desiredDy = dy / dist;
        const steerX = desiredDx * ROCKET_MAX_SPEED - r.vx;
        const steerY = desiredDy * ROCKET_MAX_SPEED - r.vy;
        r.vx += steerX * ROCKET_STEER_STRENGTH;
        r.vy += steerY * ROCKET_STEER_STRENGTH;
      }
      const speed = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
      if (speed > 0) {
        const thrustX = (r.vx / speed) * ROCKET_THRUST;
        const thrustY = (r.vy / speed) * ROCKET_THRUST;
        r.vx += thrustX;
        r.vy += thrustY;
        const newSpeed = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
        if (newSpeed > ROCKET_MAX_SPEED) {
          r.vx = (r.vx / newSpeed) * ROCKET_MAX_SPEED;
          r.vy = (r.vy / newSpeed) * ROCKET_MAX_SPEED;
        }
      }
      r.x += r.vx;
      r.y += r.vy;
      spawnRocketTrail(r.x + ROCKET_W / 2, r.y + ROCKET_H / 2, r.vx, r.vy);
      r.distanceTraveled += Math.sqrt(r.vx * r.vx + r.vy * r.vy);
      if (r.y < -ROCKET_H * 2 || r.y > H + ROCKET_H || r.x < -ROCKET_W * 2 || r.x > W + ROCKET_W) return false;
      return true;
    });
  }

  function updateShieldRecharge(now) {
    if (shieldHits > 0 || lastShieldLostTime < 0) return;
    if (now - lastShieldLostTime >= SHIELD_RECHARGE_MS) {
      shieldHits = 1;
      lastShieldLostTime = -1;
      shieldEl.textContent = 'activated';
    }
  }

  function checkCollisions(now) {
    bullets = bullets.filter((b) => {
      for (let i = 0; i < invaders.length; i++) {
        const inv = invaders[i];
        if (
          b.x + 4 > inv.x && b.x < inv.x + inv.w &&
          b.y < inv.y + inv.h && b.y + 12 > inv.y
        ) {
          inv.hp -= playerDamage;
          if (inv.hp <= 0) {
            score += 10 * (invaders[i].color === COLORS.invader3 ? 3 : invaders[i].color === COLORS.invader1 ? 2 : 1);
            spawnExplosion(inv.x + inv.w / 2, inv.y + inv.h / 2, inv.color);
            spawnUpgrade(inv.x, inv.y);
            invaders.splice(i, 1);
            scoreEl.textContent = score;

            if (hasPierce && !b.pierced) {
              b.pierced = true;
              return true;
            }
          }
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
        if (!debugMode) {
          spawnExplosion(player.x + player.w / 2, player.y + player.h / 2, COLORS.player, Math.PI, Math.PI);
          if (shieldHits > 0) {
            shieldHits = 0;
            lastShieldLostTime = now;
            shieldEl.textContent = 'deactivated';
          } else {
            lives--;
            livesEl.textContent = lives;
          }
        }
        return false;
      }
      return true;
    });
  }

  function checkLose() {
    if (debugMode) {
      for (const inv of invaders) {
        if (inv.y + inv.h >= player.y) return true;
      }
      return false;
    }
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
    if (isPaused) {
      requestAnimationFrame(gameLoop);
      return;
    }

    ctx.fillStyle = '#0d0d14';
    ctx.fillRect(0, 0, W, H);

    updatePlayer(16);
    updateBullets(16);
    playerShoot(now);
    updateInvaders(now);
    invaderShoot(now);
    checkCollisions(now);
    updateUpgrades();
    updateRockets(now);
    updateShieldRecharge(now);
    updateParticles();

    drawInvaders();
    drawBullets();
    drawRocketTargets();
    drawRockets();
    drawParticles();
    drawUpgrades();
    drawPlayer();

    if (debugMode) {
      ctx.font = 'bold 56px Orbitron';
      ctx.fillStyle = '#ff0844';
      ctx.shadowColor = '#ff0844';
      ctx.shadowBlur = 20;
      ctx.textAlign = 'center';
      ctx.fillText('DEBUG MODE', W / 2, 72);
      ctx.shadowBlur = 0;
    }

    if (invaders.length === 0) {
      level++;
      levelEl.textContent = level;
      bullets = [];
      invaderBullets = [];
      upgrades = [];
      rockets = [];
      initInvaders();
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
    helpScreen.classList.add('hidden');
    score = 0;
    lives = 3;
    level = 1;
    shotCount = 1;
    playerDamage = 1;
    isPaused = false;
    scoreEl.textContent = score;
    levelEl.textContent = level;
    livesEl.textContent = lives;
    damageEl.textContent = playerDamage;
    player.x = W / 2 - 20;
    player.y = H - 60;
    bullets = [];
    invaderBullets = [];
    rockets = [];
    upgrades = [];
    particles = [];
    shieldHits = 0;
    hasShieldSystem = false;
    lastShieldLostTime = -1;
    shieldEl.textContent = 'no shield';
    pierceEl.textContent = 'none';
    hasRocket = false;
    hasPierce = false;
    lastRocketTime = 0;
    invaderDir = 1;
    lastInvaderShoot = 0;
    initInvaders();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyH' && gameRunning && overlay.classList.contains('hidden')) {
      isPaused = !isPaused;
      helpScreen.classList.toggle('hidden', !isPaused);
      return;
    }
    if (isPaused) return;

    if (e.code === 'KeyD' && gameRunning) {
      debugMode = !debugMode;
      if (debugMode) {
        shieldHits = 0;
        shotCount = 1;
        hasRocket = false;
        hasPierce = false;
        shieldEl.textContent = 'no shield';
        pierceEl.textContent = 'none';
      }
      return;
    }
    if (e.code === 'KeyA' && gameRunning && debugMode) {
      invaders = [];
      return;
    }
    if (e.code === 'ArrowLeft') player.dir = -1;
    if (e.code === 'ArrowRight') player.dir = 1;
    if (e.code === 'Space') {
      e.preventDefault();
      spacePressed = true;
      if (!gameRunning && !startScreen.classList.contains('hidden')) {
        startGame();
        return;
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' && player.dir === -1) player.dir = 0;
    if (e.code === 'ArrowRight' && player.dir === 1) player.dir = 0;
    if (e.code === 'Space') spacePressed = false;
  });

  restartBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    startGame();
  });
})();
