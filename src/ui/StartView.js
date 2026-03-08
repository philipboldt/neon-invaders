import { COLORS, CONSTANTS } from '../constants.js';
import { BaseView } from './BaseView.js';

export class StartView extends BaseView {
  constructor(game) {
    super(game);
    this.init();
  }

  init() {
    this.highscoreContainer = new PIXI.Container();
    this.startPrompt = new PIXI.Text('Press SPACE or Tap to start', {
      fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_PROMPT, fill: this.parseHexColor(COLORS.text),
      dropShadow: true, dropShadowColor: this.parseHexColor(COLORS.text), dropShadowBlur: 10
    });
    this.startPrompt.anchor.set(0.5, 0);

    this.container.addChild(this.highscoreContainer, this.startPrompt);
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
    this.highscoreContainer.position.set(W / 2, CONSTANTS.UI_HIGHSCORE_Y);
    const playerY = H - CONSTANTS.PLAYER_Y_OFFSET;
    this.startPrompt.position.set(W / 2, playerY - CONSTANTS.UI_PROMPT_Y_OFFSET);
  }

  update(now) {
    if (this.container.visible) {
      // Blinking prompt
      this.startPrompt.alpha = 0.5 + Math.sin(now / CONSTANTS.ANIM_BLINK_SPEED) * 0.5;
    }
  }
}
