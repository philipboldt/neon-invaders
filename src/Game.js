import { COLORS, CONSTANTS } from './constants.js';
import { SpriteManager } from './SpriteManager.js';
import { UIManager } from './UIManager.js';
import { ParticleSystem } from './ParticleSystem.js';
import { Player } from './Player.js';
import { Starfield } from './Starfield.js';
import { InputManager } from './InputManager.js';
import { WeaponManager } from './WeaponManager.js';
import { EntityManager } from './EntityManager.js';
import { CollisionManager } from './CollisionManager.js';
import { Renderer } from './Renderer.js';
import { AudioManager } from './AudioManager.js';
import { drawRect } from './utils.js';
import { Upgrade } from './entities/Upgrade.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = CONSTANTS.GAME_STATES.START;
    this.previousState = null;
    
    // Initial dimensions
    this.updateDimensions();

    if (typeof PIXI === 'undefined') {
      throw new Error('PIXI not found');
    }
    
    try {
      this.app = new PIXI.Application({
        view: canvas,
        width: this.appW,
        height: this.appH,
        background: CONSTANTS.BG_COLOR,
        antialias: true,
        resolution: 1, 
        autoDensity: false
      });
    } catch (err) {
      console.error('Failed to create PixiJS Application:', err);
      throw err;
    }

    // Create Layers (Containers) with explicit Z-Index sorting
    this.stage = this.app.stage;
    this.stage.sortableChildren = true;

    // Full Screen Background Layer (for Starfield & Controls)
    this.fullScreenBgLayer = new PIXI.Container();
    this.fullScreenBgLayer.zIndex = CONSTANTS.Z_BG;
    this.stage.addChild(this.fullScreenBgLayer);
    
    // Game Container (The inner viewport)
    this.gameContainer = new PIXI.Container();
    this.gameContainer.y = this.gameOffsetY;
    this.gameContainer.sortableChildren = true;
    this.stage.addChild(this.gameContainer);

    // Full Screen Top Layer (for Marquee & high-level UI that covers everything)
    this.fullScreenTopLayer = new PIXI.Container();
    this.fullScreenTopLayer.zIndex = CONSTANTS.Z_UI;
    this.stage.addChild(this.fullScreenTopLayer);
    
    // 1. Game World (The Dimmer Layer)
    this.gameWorld = new PIXI.Container();
    this.gameWorld.zIndex = CONSTANTS.Z_WORLD;
    this.gameWorld.sortableChildren = true;

    this.bgLayer = new PIXI.Container();
    this.bgLayer.zIndex = CONSTANTS.Z_BG;

    this.entityLayer = new PIXI.Container();
    this.entityLayer.zIndex = CONSTANTS.Z_ENTITIES;

    this.projectileLayer = new PIXI.Container();
    this.projectileLayer.zIndex = CONSTANTS.Z_PROJECTILES;

    this.effectLayer = new PIXI.Container();
    this.effectLayer.zIndex = CONSTANTS.Z_EFFECTS;
    
    this.gameWorld.addChild(this.bgLayer, this.entityLayer, this.projectileLayer, this.effectLayer);
    
    // 2. UI Layer (Always full brightness)
    this.uiLayer = new PIXI.Container();
    this.uiLayer.zIndex = CONSTANTS.Z_UI;

    this.gameContainer.addChild(this.gameWorld, this.uiLayer);

    this.invaders = [];
    this.bullets = [];
    this.invaderBullets = [];
    this.bossMissiles = [];
    this.upgrades = [];
    this.rockets = [];

    this.ui = new UIManager();
    this.particles = new ParticleSystem(this);
    this.sprites = new SpriteManager(this.app); 
    this.initSprites();
    this.player = new Player(this.W, this.H, this);
    this.starfield = new Starfield(this.appW, this.appH, this);
    this.inputs = new InputManager(this);
    this.weapons = new WeaponManager(this);
    this.entities = new EntityManager(this);
    this.collisions = new CollisionManager(this);
    this.renderer = new Renderer(this);
    this.audio = new AudioManager(this);
    
    this.ui.initPixiHUD(this);
    this.ui.updateLayout(this);
    this.resetState();
    this.inputs.bindInputs();
    
    window.addEventListener('resize', () => this.handleResize());
    
    this.gameLoop = this.gameLoop.bind(this);
    this.app.ticker.add(this.gameLoop);
  }

  updateDimensions() {
    const container = this.canvas.parentElement;
    const availW = container.clientWidth;
    const availH = container.clientHeight;
    
    // Hybrid Scaling Strategy:
    // 1. If screen is wider than 4:3, we scale to fit HEIGHT and letterbox horizontally.
    // 2. If screen is taller than 4:3, we scale to fit WIDTH and expand vertically.
    
    const scaleWidth = availW / CONSTANTS.LOGICAL_WIDTH;
    const scaleHeight = availH / CONSTANTS.LOGICAL_HEIGHT_MIN;

    if (scaleWidth > scaleHeight) {
      // Landscape / Wide - Fit to Height, Letterbox sides
      const scale = scaleHeight;
      this.appW = CONSTANTS.LOGICAL_WIDTH;
      this.appH = CONSTANTS.LOGICAL_HEIGHT_MIN;
      this.W = CONSTANTS.LOGICAL_WIDTH;
      this.H = CONSTANTS.LOGICAL_HEIGHT_MIN;
      this.canvas.style.width = `${this.W * scale}px`;
      this.canvas.style.height = `${this.H * scale}px`;
      this.isLetterboxedX = true;
    } else {
      // Portrait / Tall - Fit to Width, Expand Height
      const scale = scaleWidth;
      this.appW = CONSTANTS.LOGICAL_WIDTH;
      this.appH = availH / scale;
      this.W = CONSTANTS.LOGICAL_WIDTH;
      this.H = Math.min(this.appH, CONSTANTS.LOGICAL_HEIGHT_MAX);
      this.H = Math.max(this.H, CONSTANTS.LOGICAL_HEIGHT_MIN);
      this.canvas.style.width = `${availW}px`;
      this.canvas.style.height = `${availH}px`;
      this.isLetterboxedX = false;
    }
    
    this.gameOffsetY = (this.appH - this.H) / 2;
    this.heightFactor = this.H / CONSTANTS.LOGICAL_HEIGHT_MIN;
  }

  handleResize() {
    this.updateDimensions();
    if (this.app) this.app.renderer.resize(this.appW, this.appH);
    if (this.gameContainer) this.gameContainer.y = this.gameOffsetY;
    if (this.player) {
      this.player.W = this.W;
      this.player.H = this.H;
      this.player.y = this.H - CONSTANTS.PLAYER_Y_OFFSET;
      this.player.updateSpritePositions();
    }
    if (this.starfield) {
      this.starfield.W = this.appW;
      this.starfield.H = this.appH;
    }
    if (this.ui) this.ui.updateLayout(this);
  }

  initSprites() {
    this.sprites.loadTexture('player', 'res/player sprite.png');
    this.sprites.loadTexture('enemy', 'res/enemy sprite.png');
    [COLORS.invader1, COLORS.invader2, COLORS.invader3, COLORS.boss].forEach(color => {
      this.sprites.preRender(`inv_${color}`, CONSTANTS.INVADER_W, CONSTANTS.INVADER_H, (ctx) => {
        drawRect(ctx, 0, 0, CONSTANTS.INVADER_W, CONSTANTS.INVADER_H, color, true);
      });
    });
    CONSTANTS.UPGRADE_TYPES.forEach(type => {
      const color = COLORS[type] || COLORS.heal;
      const size = CONSTANTS.UPGRADE_W;
      const radius = size / 2;
      this.sprites.preRender(`upg_${type}`, size, size, (ctx) => {
        ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(radius, radius, radius, 0, Math.PI * 2); ctx.fill();
      });
    });
    this.sprites.preRender('bullet', CONSTANTS.BULLET_W, CONSTANTS.BULLET_H, (ctx) => {
      drawRect(ctx, 0, 0, CONSTANTS.BULLET_W, CONSTANTS.BULLET_H, COLORS.bullet, false);
    });
    this.sprites.preRender('invaderBullet', CONSTANTS.INVADER_BULLET_W, CONSTANTS.INVADER_BULLET_H, (ctx) => {
      drawRect(ctx, 0, 0, CONSTANTS.INVADER_BULLET_W, CONSTANTS.INVADER_BULLET_H, COLORS.invader1, false);
    });
    this.sprites.preRender('bossMissile', CONSTANTS.BOSS_MISSILE_W, CONSTANTS.BOSS_MISSILE_H, (ctx) => {
      drawRect(ctx, 0, 0, CONSTANTS.BOSS_MISSILE_W, CONSTANTS.BOSS_MISSILE_H, COLORS.boss, false);
    });
    this.sprites.preRender('rocket', CONSTANTS.ROCKET_W, CONSTANTS.ROCKET_H, (ctx) => {
      drawRect(ctx, 0, 0, CONSTANTS.ROCKET_W, CONSTANTS.ROCKET_H, COLORS.rocket, false);
    });
  }

  clearAllEntities() {
    if (this.invaders) {
      this.invaders.forEach(inv => inv.destroy());
      this.invaders = [];
    }
    if (this.weapons) {
      this.bullets.forEach(b => b.deactivate());
      this.invaderBullets.forEach(b => b.deactivate());
      this.bossMissiles.forEach(m => m.deactivate());
      this.rockets.forEach(r => r.deactivate());
      
      if (this.weapons.lightningGraphics) this.weapons.lightningGraphics.clear();
      if (this.weapons.pdcGraphics) this.weapons.pdcGraphics.clear();
      if (this.weapons.markerGraphics) this.weapons.markerGraphics.clear();
    }
    this.bullets = []; this.invaderBullets = []; this.bossMissiles = []; this.rockets = [];
    if (this.upgrades) {
      this.upgrades.forEach(u => u.deactivate());
      this.upgrades = [];
    }
    this.activeLightning = null; this.activePDCTracer = null; this.pdcTarget = null;
    if (this.particles) this.particles.reset();
  }

  resetState() {
    this.clearAllEntities();
    this.state = CONSTANTS.GAME_STATES.START;
    this.score = 0;
    this.lives = CONSTANTS.PLAYER_INITIAL_LIVES;
    this.maxLives = CONSTANTS.PLAYER_INITIAL_MAX_LIVES;
    this.level = 1;
    this.shotCount = 1;
    this.playerDamage = 1;
    this.maxDamage = CONSTANTS.PLAYER_INITIAL_MAX_DAMAGE;
    this.shieldHits = 0; this.hasShieldSystem = false; this.lastShieldLostTime = -1;
    this.rocketLevel = 0; this.lightningLevel = 1; this.hasPierce = false; this.spacePressed = false; this.shake = 0;
    this.lastPlayerShot = 0; this.lastInvaderShoot = 0; this.lastBossShoot = 0;
    this.lastRocketTime = 0; this.lastLightningTime = 0; this.lastPDCTime = 0;
    this.invaderDir = 1;
    this.fps = 60; this.lastFpsUpdate = 0; this.frameCount = 0;
    
    this.ui.updateStats(this);
    this.ui.updateLayout(this);
    this.ui.showStartScreen();
    this.ui.setShootActive(false);
    this.player.reset();
    
    // Position entities for background view on start screen
    this.entities.initInvaders();
  }

  startGame() {
    this.state = CONSTANTS.GAME_STATES.PLAYING;
    this.isPaused = false;
    this.ui.hideScreens();
    this.audio.playBGM();
  }

  restartGame() {
    this.resetState();
    this.startGame();
  }

  togglePause() {
    if (this.state === CONSTANTS.GAME_STATES.PAUSED) {
      this.state = this.previousState || CONSTANTS.GAME_STATES.PLAYING;
      this.ui.toggleHelp(false);
      this.audio.resumeBGM();
    } else {
      this.previousState = this.state;
      this.state = CONSTANTS.GAME_STATES.PAUSED;
      this.ui.toggleHelp(true);
      this.audio.pauseBGM();
    }
  }

  endGame(won) {
    this.isPaused = false;
    this.spacePressed = false;
    this.ui.setShootActive(false);
    
    if (this.ui.isHighscore(this.score)) {
      this.state = CONSTANTS.GAME_STATES.HIGHSCORE;
      this.ui.showNameInput(this.score);
    } else {
      this.state = CONSTANTS.GAME_STATES.GAMEOVER;
      this.ui.showGameOver(won);
    }
  }

  spawnUpgrade(x, y) {
    if (Math.random() >= CONSTANTS.DROP_CHANCE) return;
    
    // Roll a random type first
    let type = CONSTANTS.UPGRADE_TYPES[Math.floor(Math.random() * CONSTANTS.UPGRADE_TYPES.length)];
    
    // Check if the rolled type is maxed, fallback to points
    const isMaxed = 
      (type === 'shield' && this.hasShieldSystem) ||
      (type === 'double' && this.shotCount >= CONSTANTS.PLAYER_MAX_SHOT_COUNT && this.playerDamage >= this.maxDamage) ||
      (type === 'rocket' && this.rocketLevel >= CONSTANTS.PLAYER_MAX_ROCKET_LEVEL) ||
      (type === 'pierce' && this.hasPierce) ||
      (type === 'heal' && this.lives >= this.maxLives);

    if (isMaxed) {
      type = 'points';
    }
    
    const upgrade = new Upgrade(this, x, y, type, this.level);
    this.upgrades.push(upgrade);
  }

  transformMaxedUpgrades() {
    this.upgrades.forEach(u => {
      if (u.type === 'points') return;

      const isNowMaxed = 
        (u.type === 'shield' && this.hasShieldSystem) ||
        (u.type === 'double' && this.shotCount >= CONSTANTS.PLAYER_MAX_SHOT_COUNT && this.playerDamage >= this.maxDamage) ||
        (u.type === 'rocket' && this.rocketLevel >= CONSTANTS.PLAYER_MAX_ROCKET_LEVEL) ||
        (u.type === 'pierce' && this.hasPierce) ||
        (u.type === 'heal' && this.lives >= this.maxLives);

      if (isNowMaxed) {
        u.convertToPoints();
      }
    });
  }

  updateEntities(dt = 1) {
    const now = performance.now();
    if (this.shake > 0) { this.shake *= CONSTANTS.SHAKE_DECAY; if (this.shake < CONSTANTS.SHAKE_THRESHOLD) this.shake = 0; }
    this.player.update(dt);
    this.entities.updateProjectiles(dt);
    this.entities.updateInvaders(dt);
    this.collisions.updateUpgrades(dt);
    if (this.hasShieldSystem && this.shieldHits === 0 && this.lastShieldLostTime >= 0) {
      if (now - this.lastShieldLostTime >= CONSTANTS.SHIELD_RECHARGE_MS) {
        this.shieldHits = 1; this.lastShieldLostTime = -1; this.ui.updateStats(this);
      }
    }
    this.weapons.updateRockets(dt);
    this.weapons.updateLightning(now);
    this.weapons.updatePDC(now);
  }

  getLowestRowInvaders() {
    if (this.invaders.length === 0) return [];
    const lowestY = Math.max(...this.invaders.map((inv) => inv.y));
    return this.invaders.filter((inv) => inv.y >= lowestY - 2);
  }

  checkLose() {
    for (const inv of this.invaders) { if (inv.y + inv.h >= this.player.y) return !this.debugMode; }
    return this.lives <= 0;
  }

  gameLoop() {
    const now = performance.now();
    // Pixi ticker.deltaTime is normalized: 1.0 = 1/60s
    // Clamp to [0.1, 1.2] to handle lag/focus without massive jumps (slow-mo instead)
    const dt = Math.min(this.app.ticker.deltaTime, 1.2);

    this.starfield.update(dt);
    
    // In START state, we only update background elements (stars, layout)
    // In PLAYING state, we run full logic
    if (this.state === CONSTANTS.GAME_STATES.PLAYING) {
      this.updateEntities(dt);
      this.weapons.playerShoot(now);
      this.entities.invaderShoot(now);
      this.entities.bossShoot(now);
      this.collisions.checkCollisions(now);
      this.particles.update(dt);
    } else if (this.state === CONSTANTS.GAME_STATES.GAMEOVER || this.state === CONSTANTS.GAME_STATES.PAUSED || this.state === CONSTANTS.GAME_STATES.START || this.state === CONSTANTS.GAME_STATES.SETTINGS || this.state === CONSTANTS.GAME_STATES.BOSSKILLED) {
      this.player.updateSpritePositions();
    }
    
    this.renderer.update(this.state);

    if (now - this.lastFpsUpdate >= 1000) {
      this.ui.updateFPS(this.app.ticker.FPS);
      this.lastFpsUpdate = now;
    }

    if (this.state !== CONSTANTS.GAME_STATES.PLAYING) return;
    
    // Level end condition: Only wait for key visual/gameplay elements
    const noInvaders = this.invaders.length === 0;
    const noUpgrades = this.upgrades.length === 0;
    const noParticles = !this.particles.hasActiveParticles;

    if (noInvaders && noUpgrades && noParticles) {
      const isBossOrMiniBoss = this.level % 5 === 0;
      const rewards = ['+2 Max Health', '+2 Max Damage'];
      
      if (this.level === CONSTANTS.BOSS_UNLOCK_LEFT) {
        rewards.push('Left Pod Unlocked: PDC');
        this.player.pods.left.active = true;
      } else if (this.level === CONSTANTS.BOSS_UNLOCK_RIGHT) {
        rewards.push('Right Pod Unlocked: Lightning');
        this.player.pods.right.active = true;
      } else if (this.level % 10 === 0) {
        rewards.push('Sidepods Fully Restored');
      } else if (this.level % 5 === 0) {
        rewards.push('Sidepods Partially Repaired');
      }

      // Heal pods on every boss/miniboss kill
      if (isBossOrMiniBoss) {
        if (this.player.pods.left.active) this.player.pods.left.hp = this.player.pods.left.maxHp;
        if (this.player.pods.right.active) this.player.pods.right.hp = this.player.pods.right.maxHp;
        this.player.updateSpritePositions();
        this.ui.showBossClear(this.level, rewards);
        this.state = CONSTANTS.GAME_STATES.BOSSKILLED;
      }
      this.level++; this.ui.updateStats(this);
      this.clearAllEntities();
      this.entities.initInvaders(); this.lastInvaderShoot = now; this.lastBossShoot = now;
    } else if (this.checkLose()) {
      this.endGame(false);
    }
  }
}
