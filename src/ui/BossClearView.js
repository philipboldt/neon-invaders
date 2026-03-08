import { COLORS, CONSTANTS } from '../constants.js';
import { BaseView } from './BaseView.js';

export class BossClearView extends BaseView {
  constructor(game) {
    super(game);
    this.init();
  }

  init() {
    this.titleContainer = new PIXI.Container();
    const titleText = new PIXI.Text(CONSTANTS.TITLE, {
      fontFamily: 'Orbitron', fontSize: 48, fontWeight: 900, fill: this.parseHexColor(COLORS.text), letterSpacing: 8,
      dropShadow: true, dropShadowColor: this.parseHexColor(COLORS.text), dropShadowBlur: 15, dropShadowDistance: 0
    });
    titleText.anchor.set(0.5, 0);
    const versionText = new PIXI.Text(CONSTANTS.VERSION, {
      fontFamily: 'Orbitron', fontSize: 14, fontWeight: 'bold', fill: this.parseHexColor(COLORS.text), alpha: 0.6
    });
    versionText.anchor.set(0.5, 0);
    versionText.position.set(0, 55);
    this.titleContainer.addChild(titleText, versionText);

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
    this.container.addChild(this.titleContainer, this.content);
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
    this.titleContainer.position.set(W / 2, 80);
    this.content.position.set(W / 2, 180);
  }

  update(now) {
    if (this.container.visible) {
      const scale = 1 + Math.sin(now / 500) * 0.03;
      this.titleContainer.scale.set(scale);
      this.prompt.alpha = 0.5 + Math.sin(now / 300) * 0.5;
    }
  }
}
