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
  constructor(canvas) {
    this.canvas = canvas;
    
    // Initial dimensions
    this.updateDimensions();

    console.log('Initializing PixiJS with resolution:', window.devicePixelRatio || 1);
    if (typeof PIXI === 'undefined') {
      console.error('CRITICAL: PIXI is not defined! Check index.html script loading.');
      throw new Error('PIXI not found');
    }
    try {
      // Initialize PixiJS
      this.app = new PIXI.Application({
        view: canvas,
        width: this.W,
        height: this.H,
        backgroundColor: CONSTANTS.BG_COLOR,
        antialias: true,
        resolution: 1, 
        autoDensity: false
      });
      console.log('PixiJS Application created successfully');
    } catch (err) {
      console.error('Failed to create PixiJS Application:', err);
      throw err;
    }

    // Create Layers (Containers)
    this.stage = this.app.stage;
    this.bgLayer = new PIXI.Container();
    this.entityLayer = new PIXI.Container();
    this.projectileLayer = new PIXI.Container();
    this.effectLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();

    this.stage.addChild(this.bgLayer, this.entityLayer, this.projectileLayer, this.effectLayer, this.uiLayer);

    this.invaders = [];
    this.bullets = [];
    this.invaderBullets = [];
    this.bossMissiles = [];
    this.upgrades = [];
    this.rockets = [];

    this.ui = new UIManager();
    this.particles = new ParticleSystem(this);
    this.player = new Player(this.W, this.H, this);
    this.sprites = new SpriteManager(this.app); 
    this.starfield = new Starfield(this.W, this.H, this);
    this.inputs = new InputManager(this);
    this.weapons = new WeaponManager(this);
    this.entities = new EntityManager(this);
    this.collisions = new CollisionManager(this);
    this.renderer = new Renderer(this);
    
    this.ui.initPixiHUD(this);
    this.ui.updateLayout(this);
    this.initSprites();
    this.resetState();
    this.inputs.bindInputs();
    
    window.addEventListener('resize', () => this.handleResize());
    
    console.log('Neon Invaders Initialized with PixiJS');
    this.gameLoop = this.gameLoop.bind(this);
    this.app.ticker.add(this.gameLoop);
  }

  updateDimensions() {
    // Get available space from the container
    const container = this.canvas.parentElement;
    const availW = container.clientWidth;
    const availH = container.clientHeight;
    
    // Base logical dimensions
    this.W = 800;
    
    // Calculate the scale needed to fit a 4:3 box (800x600) into available space
    const scale = Math.min(availW / 800, availH / 600);
    
    if (availW / 800 < availH / 600) {
        // PORTRAIT (or very narrow): Width is the bottleneck
        // Use full width, grow logical height to fill physical space
        this.H = Math.floor(800 * (availH / availW));
        // Clamp logical height to avoid extreme values
        this.H = Math.min(1400, Math.max(600, this.H));
        
        // Physical size fills the width
        this.canvas.style.width = `${availW}px`;
        this.canvas.style.height = `${availH}px`;
    } else {
        // LANDSCAPE: Height is the bottleneck (letterbox case)
        // Keep perfect 4:3 logical resolution
        this.H = 600;
        
        // Physical width is proportional to height to keep 4:3
        const physW = Math.floor(availH * (800 / 600));
        this.canvas.style.width = `${physW}px`;
        this.canvas.style.height = `${availH}px`;
    }
    
    // Multiplier for balancing speeds based on how "tall" the screen is vs the 4:3 base
    this.heightFactor = this.H / 600;
  }

  handleResize() {
    const oldH = this.H;
    this.updateDimensions();
    
    if (this.app) {
      this.app.renderer.resize(this.W, this.H);
    }
    
    // Update managers that care about dimensions
    if (this.player) {
      this.player.W = this.W;
      this.player.H = this.H;
      this.player.y = this.H - 80;
      this.player.syncRender();
    }
    
    if (this.starfield) {
      this.starfield.W = this.W;
      this.starfield.H = this.H;
      // Stars will wrap naturally on next update
    }

    if (this.ui) {
      this.ui.updateLayout(this);
    }
    
    console.log(`Resized: ${this.W}x${this.H} (Factor: ${this.heightFactor.toFixed(2)})`);
  }

  initSprites() {
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

    // Pre-render Projectiles
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
    // 1. Clear Invaders (Destroy Sprites)
    if (this.invaders) {
      this.invaders.forEach(inv => {
        if (inv.sprite) {
          this.entityLayer.removeChild(inv.sprite);
          inv.sprite.destroy({ children: true });
        }
      });
      this.invaders = [];
    }

    // 2. Clear Projectiles (Return to Pools)
    if (this.weapons) {
      if (this.bullets) this.bullets.forEach(b => { 
        if (b.sprite) {
          b.sprite.visible = false;
          this.weapons.returnSprite('bullet', b.sprite); 
        }
      });
      if (this.invaderBullets) this.invaderBullets.forEach(b => { 
        if (b.sprite) {
          b.sprite.visible = false;
          this.weapons.returnSprite('invaderBullet', b.sprite); 
        }
      });
      if (this.bossMissiles) this.bossMissiles.forEach(m => { 
        if (m.sprite) {
          m.sprite.visible = false;
          this.weapons.returnSprite('bossMissile', m.sprite); 
        }
      });
      if (this.rockets) this.rockets.forEach(r => { 
        if (r.sprite) {
          r.sprite.visible = false;
          this.weapons.returnSprite('rocket', r.sprite); 
        }
      });
      
      // Clear Graphics
      if (this.weapons.lightningGraphics) this.weapons.lightningGraphics.clear();
      if (this.weapons.pdcGraphics) this.weapons.pdcGraphics.clear();
      if (this.weapons.markerGraphics) this.weapons.markerGraphics.clear();
    }
    
    this.bullets = [];
    this.invaderBullets = [];
    this.bossMissiles = [];
    this.rockets = [];

    // 3. Clear Upgrades (Destroy Sprites)
    if (this.upgrades) {
      this.upgrades.forEach(u => {
        if (u.sprite) {
          this.entityLayer.removeChild(u.sprite);
          u.sprite.destroy({ children: true });
        }
      });
      this.upgrades = [];
    }

    // 4. Other transients
    this.activeLightning = null;
    this.activePDCTracer = null;
    this.pdcTarget = null;
    
    if (this.particles) this.particles.reset();
  }

  resetState() {
    this.clearAllEntities();
    this.gameRunning = false; this.isPaused = false; this.debugMode = false;
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
      if (type === 'double' && this.shotCount >= CONSTANTS.PLAYER_MAX_SHOT_COUNT && this.playerDamage >= this.maxDamage) return false;
      if (type === 'rocket' && this.rocketLevel >= CONSTANTS.PLAYER_MAX_ROCKET_LEVEL) return false;
      if (type === 'pierce' && this.hasPierce) return false;
      if (type === 'heal' && this.lives >= this.maxLives) return false;
      return true;
    });
    if (availableTypes.length === 0) return;
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const u = {
      x: x + CONSTANTS.INVADER_W / 2 - CONSTANTS.UPGRADE_W / 2, y: y,
      w: CONSTANTS.UPGRADE_W, h: CONSTANTS.UPGRADE_H, type, level: this.level 
    };

    // Initialize Pixi Sprite for upgrade
    u.sprite = new PIXI.Sprite(this.sprites.getTexture(`upg_${type}`));
    u.sprite.anchor.set(0.5);
    u.sprite.position.set(u.x + u.w / 2, u.y + u.h / 2);
    this.entityLayer.addChild(u.sprite);

    if (type === 'points') {
      this.addPointsTextToUpgrade(u);
    }

    this.upgrades.push(u);
  }

  addPointsTextToUpgrade(u) {
    const amount = u.level * CONSTANTS.POINTS_MULTIPLIER;
    const textStr = amount >= 1000 ? (amount / 1000).toFixed(1) + 'k' : amount;
    
    const text = new PIXI.Text(textStr, {
      fontFamily: 'Orbitron',
      fontSize: 10,
      fontWeight: 'bold',
      fill: 0x000000,
      align: 'center'
    });
    text.anchor.set(0.5);
    // Position relative to sprite center (0,0 because anchor is 0.5)
    text.position.set(0, 1); 
    u.sprite.addChild(text);
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

  gameLoop() {
    // PIXI.Ticker handles 'now' via performance.now() internally
    const now = performance.now();
    
    this.starfield.update();
    if (this.gameRunning && !this.isPaused) {
      this.updateEntities(now);
      this.weapons.playerShoot(now);
      this.entities.invaderShoot(now);
      this.entities.bossShoot(now);
      this.collisions.checkCollisions(now);
      this.particles.update();
    }
    
    // Smooth Renderer updates (Screen shake, HUD dirty checks)
    this.renderer.update();

    // Update FPS once per second
    if (now - this.lastFpsUpdate >= 1000) {
      this.ui.updateFPS(this.app.ticker.FPS);
      this.lastFpsUpdate = now;
    }

    if (!this.gameRunning || this.isPaused) return;
    if (this.invaders.length === 0 && this.invaderBullets.length === 0 && !this.particles.hasActiveParticles && this.rockets.length === 0 && this.bossMissiles.length === 0 && this.upgrades.length === 0 && this.activeLightning === null) {
      const isBossOrMiniBoss = this.level % 5 === 0;
      const rewards = ['+2 Max Health', '+2 Max Damage'];
      
      if (this.level === CONSTANTS.BOSS_UNLOCK_LEFT) rewards.push('Left Pod Unlocked: PDC');
      else if (this.level === CONSTANTS.BOSS_UNLOCK_RIGHT) rewards.push('Right Pod Unlocked: Lightning');
      else if (this.level % 10 === 0) rewards.push('Sidepods Fully Restored');
      else if (this.level % 5 === 0) rewards.push('Sidepods Partially Repaired');

      if (isBossOrMiniBoss) {
        this.ui.showBossClear(this.level, rewards);
        this.isPaused = true;
      }

      this.level++; this.ui.updateStats(this);
      this.clearAllEntities();
      this.entities.initInvaders(); this.lastInvaderShoot = now; this.lastBossShoot = now;
    } else if (this.checkLose()) {
      this.endGame(false);
    }
  }
}
