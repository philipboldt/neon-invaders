import { COLORS, CONSTANTS } from '../constants.js';
import { BaseView } from './BaseView.js';

export class ControlOverlayView extends BaseView {
  constructor(game) {
    super(game);
    this.game.uiLayer.removeChild(this.container);
    this.game.fullScreenBgLayer.addChild(this.container);
    this.init();
  }

  init() {
    this.graphics = new PIXI.Graphics();
    this.container.addChild(this.graphics);
    this.labels = new PIXI.Container();
    this.container.addChild(this.labels);
    this.container.zIndex = -1; // Keep behind other UI elements
    this.container.visible = true; // Always visible as long as it's needed
  }

  updateLayout(W, H) {
    this.graphics.clear();
    this.labels.removeChildren();

    const lineAlpha = 0.1;
    const labelAlpha = CONSTANTS.TOUCH_LABEL_ALPHA;
    const color = this.parseHexColor(COLORS.player);
    const style = {
      fontFamily: 'Orbitron',
      fontSize: 14,
      fill: color,
      alpha: labelAlpha,
      fontWeight: 'bold',
      align: 'center'
    };

    // 1. Horizontal Lines (Top, Mid, Bottom)
    this.graphics.lineStyle(2, color, lineAlpha);
    // Line at 1/3
    this.graphics.moveTo(0, H * 0.33);
    this.graphics.lineTo(W, H * 0.33);
    // Line at 2/3
    this.graphics.moveTo(0, H * 0.66);
    this.graphics.lineTo(W, H * 0.66);

    // 2. Vertical Dividers (Bottom 1/3 only)
    this.graphics.moveTo(W * 0.33, H * 0.66);
    this.graphics.lineTo(W * 0.33, H);
    this.graphics.moveTo(W * 0.66, H * 0.66);
    this.graphics.lineTo(W * 0.66, H);

    // 3. Labels
    const createLabel = (text, x, y) => {
      const t = new PIXI.Text(text, style);
      t.anchor.set(0.5);
      t.position.set(x, y);
      t.alpha = labelAlpha;
      this.labels.addChild(t);
    };

    createLabel('EXIT (DOUBLE TAP)', W / 2, H * 0.165);
    createLabel('PAUSE / HELP', W / 2, H * 0.5);
    createLabel('LEFT', W * 0.165, H * 0.83);
    createLabel('AUTO-SHOOT', W / 2, H * 0.83);
    createLabel('RIGHT', W * 0.835, H * 0.83);
  }

  update(state) {
    const { GAME_STATES } = CONSTANTS;
    // Only show control overlay on coarse (touch) devices
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!isTouch) {
      this.container.visible = false;
      return;
    }

    this.container.visible = true;
    const isPlaying = state === GAME_STATES.PLAYING;
    const isPaused = state === GAME_STATES.PAUSED;
    const isStart = state === GAME_STATES.START;
    const isGameOver = state === GAME_STATES.GAMEOVER;

    this.labels.alpha = isPlaying ? 0.4 : 1.0;
    
    // Show/Hide labels based on state
    this.labels.children.forEach(label => {
      const text = label.text;
      if (text.includes('EXIT')) {
        label.visible = isPlaying || isPaused || isStart || isGameOver;
      } else if (text.includes('PAUSE')) {
        label.visible = isPlaying || isPaused || isStart;
      } else if (text.includes('LEFT') || text.includes('RIGHT') || text.includes('SHOOT')) {
        label.visible = isPlaying || isPaused;
      }
    });

    // Special labels for non-playing states
    if (isGameOver) {
      // Find or create a RESTART label in the middle
      let restartLabel = this.labels.children.find(l => l.text === 'TAP TO RESTART');
      if (!restartLabel) {
        const style = this.labels.children[0].style;
        restartLabel = new PIXI.Text('TAP TO RESTART', style);
        restartLabel.anchor.set(0.5);
        restartLabel.position.set(this.game.appW / 2, this.game.appH * 0.75);
        this.labels.addChild(restartLabel);
      }
      restartLabel.visible = true;
    } else {
      const restartLabel = this.labels.children.find(l => l.text === 'TAP TO RESTART');
      if (restartLabel) restartLabel.visible = false;
    }
  }
}
