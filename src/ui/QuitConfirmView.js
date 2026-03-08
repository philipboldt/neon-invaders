import { COLORS, CONSTANTS } from '../constants.js';
import { BaseView } from './BaseView.js';

export class QuitConfirmView extends BaseView {
  constructor(game) {
    super(game);
    this.init();
  }

  init() {
    this.titleContainer = new PIXI.Container();
    this.container.addChild(this.titleContainer);

    this.title = new PIXI.Text('ABORT MISSION?', {
      fontFamily: 'Orbitron',
      fontSize: CONSTANTS.FONT_SIZE_TITLE,
      fontWeight: 900,
      fill: this.parseHexColor(COLORS.textRed),
      letterSpacing: 4,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 4,
      dropShadowDistance: 4
    });
    this.title.anchor.set(0.5);
    this.titleContainer.addChild(this.title);

    this.warning = new PIXI.Text('PRESS ESC OR DOUBLE-TAP TOP TO CONFIRM.', {
      fontFamily: 'Orbitron',
      fontSize: CONSTANTS.FONT_SIZE_SUBTITLE,
      fill: 0xFFFFFF,
      align: 'center'
    });
    this.warning.anchor.set(0.5);
    this.container.addChild(this.warning);

    this.prompt = new PIXI.Text('PRESS SPACE OR TAP BOTTOM TO RESUME BATTLE.', {
      fontFamily: 'Orbitron',
      fontSize: CONSTANTS.FONT_SIZE_PROMPT,
      fontWeight: 'bold',
      fill: this.parseHexColor(COLORS.player),
      align: 'center'
    });
    this.prompt.anchor.set(0.5);
    this.container.addChild(this.prompt);
  }

  updateLayout(W, H) {
    this.titleContainer.position.set(W / 2, H * 0.35);
    this.warning.position.set(W / 2, H * 0.5);
    this.prompt.position.set(W / 2, H * 0.65);
  }

  update(now) {
    if (this.container.visible) {
      const scale = 1 + Math.sin(now / CONSTANTS.ANIM_BREATH_SPEED) * CONSTANTS.ANIM_BREATH_STRENGTH;
      this.titleContainer.scale.set(scale);
      this.prompt.alpha = 0.5 + Math.sin(now / CONSTANTS.ANIM_BLINK_SPEED) * 0.5;
    }
  }
}
