import { COLORS } from '../constants.js';
import { BaseView } from './BaseView.js';

export class HudView extends BaseView {
  constructor(game) {
    super(game);
    this.hudTexts = {};
    this.lastStats = {};
    this.init();
  }

  init() {
    const padding = 15;
    const y = 15;
    const colWidth = (this.game.W - padding * 2) / 4;

    this.hudTexts.score = this.createHudText('Score: 0', padding, y, this.parseHexColor(COLORS.invader2));
    this.hudTexts.level = this.createHudText('Level: 1', padding + colWidth, y, this.parseHexColor(COLORS.invader3));
    this.hudTexts.lives = this.createHudText('Lives: 3', padding + colWidth * 2, y, this.parseHexColor(COLORS.heal));
    this.hudTexts.shield = this.createHudText('Shield: NONE', padding + colWidth * 3, y, this.parseHexColor(COLORS.shield));

    const y2 = y + 25;
    this.hudTexts.pierce = this.createHudText('Pierce: NONE', padding, y2, this.parseHexColor(COLORS.pierce));
    this.hudTexts.damage = this.createHudText('Damage: 1', padding + colWidth, y2, this.parseHexColor(COLORS.invader2));
    this.hudTexts.rocket = this.createHudText('Rocket: NONE', padding + colWidth * 2, y2, this.parseHexColor(COLORS.rocket));
    this.hudTexts.fps = this.createHudText('FPS: 60', padding + colWidth * 3, y2, this.parseHexColor(COLORS.textYellow));
  }

  createHudText(text, x, y, valueColor) {
    const container = new PIXI.Container();
    container.position.set(x, y);
    const labelStr = text.split(': ')[0] + ': ';
    const valStr = text.split(': ')[1];
    const label = new PIXI.Text(labelStr, { fontFamily: 'Orbitron', fontSize: 16, fontWeight: 'bold', fill: this.parseHexColor(COLORS.text) });
    const value = new PIXI.Text(valStr, {
      fontFamily: 'Orbitron', fontSize: 16, fontWeight: 'bold', fill: valueColor,
      dropShadow: true, dropShadowColor: valueColor, dropShadowBlur: 8
    });
    value.x = label.width;
    container.addChild(label, value);
    this.container.addChild(container);
    return { container, label, value };
  }

  updateStats(gameState) {
    const updateIfChanged = (key, newVal) => {
      if (this.lastStats[key] !== newVal) {
        this.hudTexts[key].value.text = newVal;
        this.lastStats[key] = newVal;
      }
    };
    updateIfChanged('score', gameState.score);
    updateIfChanged('level', gameState.level);
    updateIfChanged('lives', gameState.lives);
    updateIfChanged('damage', gameState.playerDamage);
    const shieldStatus = gameState.shieldHits > 0 ? 'ON' : (gameState.hasShieldSystem ? 'OFF' : 'NONE');
    updateIfChanged('shield', shieldStatus);
    const pierceStatus = gameState.hasPierce ? 'YES' : 'NONE';
    updateIfChanged('pierce', pierceStatus);
    const rocketStatus = gameState.rocketLevel > 0 ? gameState.rocketLevel : 'NONE';
    updateIfChanged('rocket', rocketStatus);
  }

  updateFPS(fps) {
    if (this.hudTexts.fps) this.hudTexts.fps.value.text = Math.round(fps || 0);
  }

  updateLayout(W, H) {
    const padding = 15;
    const y = 15;
    const colWidth = (W - padding * 2) / 4;
    const y2 = y + 25;

    this.hudTexts.score.container.position.set(padding, y);
    this.hudTexts.level.container.position.set(padding + colWidth, y);
    this.hudTexts.lives.container.position.set(padding + colWidth * 2, y);
    this.hudTexts.shield.container.position.set(padding + colWidth * 3, y);
    this.hudTexts.pierce.container.position.set(padding, y2);
    this.hudTexts.damage.container.position.set(padding + colWidth, y2);
    this.hudTexts.rocket.container.position.set(padding + colWidth * 2, y2);
    this.hudTexts.fps.container.position.set(padding + colWidth * 3, y2);
  }
}
