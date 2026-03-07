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
import { drawRect } from './utils.js';

export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx; // Legacy context support for progressive migration
    this.W = canvas.width;
    this.H = canvas.height;

    // Initialize PixiJS
    this.app = new PIXI.Application({
      view: canvas,
      width: this.W,
      height: this.H,
      backgroundColor: 0x0d0d14,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    // Create Layers (Containers)
    this.stage = this.app.stage;
    this.bgLayer = new PIXI.Container();
    this.entityLayer = new PIXI.Container();
    this.projectileLayer = new PIXI.Container();
    this.effectLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();

    this.stage.addChild(this.bgLayer, this.entityLayer, this.projectileLayer, this.effectLayer, this.uiLayer);

    this.ui = new UIManager();
    this.particles = new ParticleSystem();
    this.player = new Player(this.W, this.H);
    this.sprites = new SpriteManager(this.app); // Pass app for texture generation
    this.starfield = new Starfield(this.W, this.H);
    this.inputs = new InputManager(this);
    this.weapons = new WeaponManager(this);
    this.entities = new EntityManager(this);
    this.collisions = new CollisionManager(this);
    this.renderer = new Renderer(this);
    
    this.initSprites();
    this.resetState();
    this.inputs.bindInputs();
    
    console.log('Neon Invaders Initialized with PixiJS');
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }

  initSprites() {
    [COLORS.invader1, COLORS.invader2, COLORS.invader3, '#ff0844'].forEach(color => {
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
  }

  resetState() {
    this.gameRunning = false; this.isPaused = false; this.debugMode = false;
    this.score = 0;
    this.lives = 3;
    this.maxLives = 5;
    this.level = 1;
    this.shotCount = 1;
    this.playerDamage = 1;
    this.maxDamage = 5;
    this.shieldHits = 0; this.hasShieldSystem = false; this.lastShieldLostTime = -1;
    this.rocketLevel = 0; this.lightningLevel = 1; this.hasPierce = false; this.spacePressed = false; this.shake = 0;
    
    this.invaders = []; this.bullets = []; this.invaderBullets = []; this.bossMissiles = []; this.upgrades = []; this.rockets = [];
    this.activeLightning = null; this.lastPlayerShot = 0; this.lastInvaderShoot = 0; this.lastBossShoot = 0;
    this.lastRocketTime = 0; this.lastLightningTime = 0; this.lastPDCTime = 0;
    this.activePDCTracer = null; this.pdcTarget = null; this.invaderDir = 1;
    
    this.ui.updateStats(this);
    this.ui.setShootActive(false);
    this.player.reset();
  }

  startGame() {
    this.resetState();
    this.ui.hideScreens();
    this.entities.initInvaders();
    this.gameRunning = true;
  }

  endGame(won) {
    this.gameRunning = false; this.spacePressed = false;
    this.ui.setShootActive(false);
    if (this.ui.isHighscore(this.score)) {
      this.ui.showNameInput(this.score);
    } else {
      this.ui.updateHighScores();
      this.ui.showGameOver(won);
    }
  }

  spawnUpgrade(x, y) {
    if (Math.random() >= CONSTANTS.DROP_CHANCE) return;
    const availableTypes = CONSTANTS.UPGRADE_TYPES.filter(type => {
      if (type === 'shield' && this.hasShieldSystem) return false;
      if (type === 'double' && this.shotCount >= 4 && this.playerDamage >= this.maxDamage) return false;
      if (type === 'rocket' && this.rocketLevel >= 5) return false;
      if (type === 'pierce' && this.hasPierce) return false;
      if (type === 'heal' && this.lives >= this.maxLives) return false;
      return true;
    });
    if (availableTypes.length === 0) return;
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    this.upgrades.push({
      x: x + CONSTANTS.INVADER_W / 2 - CONSTANTS.UPGRADE_W / 2, y: y,
      w: CONSTANTS.UPGRADE_W, h: CONSTANTS.UPGRADE_H, type, level: this.level 
    });
  }

  updateEntities(now) {
    if (this.shake > 0) { this.shake *= 0.9; if (this.shake < 0.1) this.shake = 0; }
    this.player.update();
    this.entities.updateProjectiles();
    this.entities.updateInvaders();
    this.collisions.updateUpgrades(now);

    if (this.hasShieldSystem && this.shieldHits === 0 && this.lastShieldLostTime >= 0) {
      if (now - this.lastShieldLostTime >= CONSTANTS.SHIELD_RECHARGE_MS) {
        this.shieldHits = 1; this.lastShieldLostTime = -1; this.ui.updateStats(this);
      }
    }
    
    this.weapons.updateRockets(now);
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

  gameLoop(now) {
    requestAnimationFrame(this.gameLoop);
    this.starfield.update();
    if (this.gameRunning && !this.isPaused) {
      this.updateEntities(now);
      this.weapons.playerShoot(now);
      this.entities.invaderShoot(now);
      this.entities.bossShoot(now);
      this.collisions.checkCollisions(now);
      this.particles.update();
    }
    this.renderer.draw();
    if (!this.gameRunning || this.isPaused) return;
    if (this.invaders.length === 0 && !this.particles.hasActiveParticles && this.rockets.length === 0 && this.bossMissiles.length === 0 && this.upgrades.length === 0 && this.activeLightning === null) {
      const isBossOrMiniBoss = this.level % 5 === 0;
      const rewards = ['+2 Max Health', '+2 Max Damage'];
      
      if (this.level === 5) rewards.push('Left Pod Unlocked: PDC');
      else if (this.level === 10) rewards.push('Right Pod Unlocked: Lightning');
      else if (this.level % 10 === 0) rewards.push('Sidepods Fully Restored');
      else if (this.level % 5 === 0) rewards.push('Sidepods Partially Repaired');

      if (isBossOrMiniBoss) {
        this.ui.showBossClear(this.level, rewards);
        this.isPaused = true;
      }

      this.level++; this.ui.updateStats(this);
      this.bullets = []; this.invaderBullets = []; this.bossMissiles = []; this.upgrades = []; this.rockets = [];
      this.entities.initInvaders(); this.lastInvaderShoot = now; this.lastBossShoot = now;
    } else if (this.checkLose()) {
      this.endGame(false);
    }
  }
}
