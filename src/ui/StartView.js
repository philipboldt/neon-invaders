import { COLORS, CONSTANTS } from '../constants.js';
import { BaseView } from './BaseView.js';

export class StartView extends BaseView {
  constructor(game) {
    super(game);
    this.init();
  }

  init() {
    this.titleContainer = new PIXI.Container();
    this.titleText = new PIXI.Text(CONSTANTS.TITLE, {
      fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_TITLE, fontWeight: 900, fill: this.parseHexColor(COLORS.text), letterSpacing: 8,
      dropShadow: true, dropShadowColor: this.parseHexColor(COLORS.text), dropShadowBlur: 15, dropShadowDistance: 0
    });
    this.titleText.anchor.set(0.5, 0);
    this.versionText = new PIXI.Text(CONSTANTS.VERSION, {
      fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_SUBTITLE, fontWeight: 'bold', fill: this.parseHexColor(COLORS.text), alpha: 0.6
    });
    this.versionText.anchor.set(0.5, 0);
    this.versionText.position.set(0, 55);
    this.titleContainer.addChild(this.titleText, this.versionText);

    this.highscoreContainer = new PIXI.Container();
    this.startPrompt = new PIXI.Text('Press SPACE or Tap to start', {
      fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_PROMPT, fill: this.parseHexColor(COLORS.text),
      dropShadow: true, dropShadowColor: this.parseHexColor(COLORS.text), dropShadowBlur: 10
    });
    this.startPrompt.anchor.set(0.5, 0);

    this.container.addChild(this.titleContainer, this.highscoreContainer, this.startPrompt);
  }

  updateHighScores(scores) {
    this.highscoreContainer.removeChildren();
    const header = new PIXI.Text('HIGH SCORES', {
      fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_HEADER, fontWeight: 'bold', fill: this.parseHexColor(COLORS.text), letterSpacing: 4
    });
    header.anchor.set(0.5, 0);
    this.highscoreContainer.addChild(header);

    scores.forEach((entry, i) => {
      const entryContainer = new PIXI.Container();
      entryContainer.position.set(0, 45 + i * 35);
      const color = i === 0 ? COLORS.invader2 : (i === 1 ? COLORS.text : COLORS.invader3);
      const style = {
        fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_SCORE_ITEM, fontWeight: 'bold', fill: this.parseHexColor(color),
        dropShadow: true, dropShadowColor: this.parseHexColor(color), dropShadowBlur: 5
      };
      const rank = new PIXI.Text(`${i + 1}.`, style); rank.anchor.set(1, 0); rank.position.set(-80, 0);
      const name = new PIXI.Text(entry.name, style); name.anchor.set(0, 0); name.position.set(-60, 0);
      const score = new PIXI.Text(entry.score.toString().padStart(5, '0'), style); score.anchor.set(0, 0); score.position.set(40, 0);
      entryContainer.addChild(rank, name, score);
      this.highscoreContainer.addChild(entryContainer);
    });
  }

  updateLayout(W, H) {
    this.titleContainer.position.set(W / 2, CONSTANTS.UI_HEADER_Y);
    this.highscoreContainer.position.set(W / 2, CONSTANTS.UI_HIGHSCORE_Y);
    const playerY = H - CONSTANTS.PLAYER_Y_OFFSET;
    this.startPrompt.position.set(W / 2, playerY - CONSTANTS.UI_PROMPT_Y_OFFSET);
  }

  update(now) {
    if (this.container.visible) {
      // Breathing title
      const scale = 1 + Math.sin(now / CONSTANTS.ANIM_BREATH_SPEED) * CONSTANTS.ANIM_BREATH_STRENGTH;
      this.titleContainer.scale.set(scale);
      // Blinking prompt
      this.startPrompt.alpha = 0.5 + Math.sin(now / CONSTANTS.ANIM_BLINK_SPEED) * 0.5;
    }
  }
}
