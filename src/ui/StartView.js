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
    
    this.prompt = new PIXI.Text('PRESS SPACE OR ENTER', {
      fontFamily: 'Orbitron',
      fontSize: CONSTANTS.FONT_SIZE_PROMPT,
      fontWeight: 'bold',
      fill: this.parseHexColor(COLORS.player),
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 4
    });
    this.prompt.anchor.set(0.5);
    
    this.startButton = new UIButton('TAP TO START', this.parseHexColor(COLORS.invader2), () => {
      this.game.startGame();
    });
    // This button is primarily for touch, but always showing it is fine for consistency
    this.startButton.visible = true;

    this.container.addChild(this.header, this.prompt, this.startButton);
  }

  updateLayout(W, H) {
    this.bg.clear();
    this.bg.beginFill(0x000000, 0.001);
    this.bg.drawRect(0, 0, W, H);
    this.bg.endFill();

    this.header.position.set(W / 2, CONSTANTS.UI_HEADER_Y);
    this.prompt.position.set(W / 2, H * 0.6);
    this.startButton.position.set(W / 2, H * CONSTANTS.UI_START_PROMPT_Y_RATIO);
  }

  update(now) {
    if (this.container.visible) {
      this.prompt.alpha = 0.5 + Math.sin(now / CONSTANTS.ANIM_BLINK_SPEED) * 0.5;
      
      const scale = 1 + Math.sin(now / CONSTANTS.ANIM_BREATH_SPEED) * CONSTANTS.ANIM_BREATH_STRENGTH;
      this.startButton.scale.set(scale);
    }
  }
}
