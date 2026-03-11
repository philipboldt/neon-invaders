import { COLORS, CONSTANTS } from '../constants.js';
import { BaseView } from './BaseView.js';
import { UIButton } from './UIButton.js';

export class StartView extends BaseView {
  constructor(game) {
    super(game);
    this.init();
  }

  init() {
    this.bg = new PIXI.Graphics();
    this.bg.beginFill(0x000000, 0.001); // Invisible but interactive
    this.bg.drawRect(0, 0, 100, 100);
    this.bg.endFill();
    this.container.addChild(this.bg);

    this.header = new PIXI.Container();
    
    this.startButton = new UIButton('PRESS SPACE OR TAP TO START', this.parseHexColor(COLORS.text), () => {
      this.game.startGame();
    });
    // This button is primarily for touch, but always showing it is fine for consistency
    this.startButton.visible = true;

    this.container.addChild(this.header, this.startButton);
  }

  updateLayout(W, H) {
    this.bg.clear();
    this.bg.beginFill(0x000000, 0.001);
    this.bg.drawRect(0, 0, W, H);
    this.bg.endFill();

    this.header.position.set(W / 2, CONSTANTS.UI_HEADER_Y);
    this.startButton.position.set(W / 2, H * 0.65);
  }

  update(now) {
    if (this.container.visible) {
      const scale = 1 + Math.sin(now / CONSTANTS.ANIM_BREATH_SPEED) * CONSTANTS.ANIM_BREATH_STRENGTH;
      this.startButton.scale.set(scale);
    }
  }
}
