import { COLORS, CONSTANTS } from '../constants.js';
import { BaseView } from './BaseView.js';

export class BossClearView extends BaseView {
  constructor(game) {
    super(game);
    this.init();
  }

  init() {
    this.content = new PIXI.Container();
    this.header = new PIXI.Text('BOSS DEFEATED!', {
      fontFamily: 'Orbitron', fontSize: 32, fontWeight: 'bold', fill: this.parseHexColor(COLORS.invader2),
      dropShadow: true, dropShadowColor: this.parseHexColor(COLORS.invader2), dropShadowBlur: 10
    });
    this.header.anchor.set(0.5, 0);

    this.levelText = new PIXI.Text('LEVEL COMPLETE', {
      fontFamily: 'Orbitron', fontSize: 18, fill: this.parseHexColor(COLORS.text), letterSpacing: 2
    });
    this.levelText.anchor.set(0.5, 0);
    this.levelText.position.set(0, 50);

    this.rewardContainer = new PIXI.Container();
    this.rewardContainer.position.set(0, 90);

    this.prompt = new PIXI.Text('Press SPACE or Tap to continue', {
      fontFamily: 'Orbitron', fontSize: 16, fill: 0xFFFFFF, alpha: 0.8
    });
    this.prompt.anchor.set(0.5, 0);
    this.prompt.position.set(0, 240);

    this.content.addChild(this.header, this.levelText, this.rewardContainer, this.prompt);
    this.container.addChild(this.content);
  }

  setData(level, rewards) {
    this.levelText.text = `LEVEL ${level} COMPLETE`;
    this.rewardContainer.removeChildren();
    
    rewards.forEach((r, i) => {
      const text = new PIXI.Text(`▶ ${r}`, {
        fontFamily: 'Orbitron', fontSize: 16, fill: this.parseHexColor(COLORS.invader2), fontWeight: 'bold'
      });
      text.anchor.set(0.5, 0);
      text.position.set(0, i * 25);
      this.rewardContainer.addChild(text);
    });
  }

  updateLayout(W, H) {
    this.content.position.set(W / 2, 180);
  }

  update(now) {
    if (this.container.visible) {
      this.prompt.alpha = 0.5 + Math.sin(now / CONSTANTS.ANIM_BLINK_SPEED) * 0.5;
    }
  }
}
