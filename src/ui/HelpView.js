import { COLORS, CONSTANTS } from '../constants.js';
import { BaseView } from './BaseView.js';

export class HelpView extends BaseView {
  constructor(game) {
    super(game);
    this.init();
  }

  init() {
    this.titleContainer = new PIXI.Container();
    const titleText = new PIXI.Text(CONSTANTS.TITLE, {
      fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_TITLE, fontWeight: 900, fill: this.parseHexColor(COLORS.text), letterSpacing: 8,
      dropShadow: true, dropShadowColor: this.parseHexColor(COLORS.text), dropShadowBlur: 15, dropShadowDistance: 0
    });
    titleText.anchor.set(0.5, 0);
    const versionText = new PIXI.Text(CONSTANTS.VERSION, {
      fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_SUBTITLE, fontWeight: 'bold', fill: this.parseHexColor(COLORS.text), alpha: 0.6
    });
    versionText.anchor.set(0.5, 0);
    versionText.position.set(0, 55);
    this.titleContainer.addChild(titleText, versionText);

    this.content = new PIXI.Container();
    const header = new PIXI.Text('UPGRADES', {
      fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_HEADER, fontWeight: 'bold', fill: this.parseHexColor(COLORS.text), letterSpacing: 4
    });
    header.anchor.set(0.5, 0);
    this.content.addChild(header);

    const upgrades = [
      { name: 'Shield', color: COLORS.shield, desc: 'Permanent recharge system' },
      { name: 'Double', color: COLORS.double, desc: 'Add projectile (max 4), then +1 damage' },
      { name: 'Rocket', color: COLORS.rocket, desc: 'Auto-targeting missile' },
      { name: 'Pierce', color: COLORS.pierce, desc: 'Shot passes through 1 enemy on kill' },
      { name: 'Heal', color: COLORS.heal, desc: 'Restores 1 life' },
      { name: 'Points', color: COLORS.points, desc: 'Gives Level x 100 Bonus Points' }
    ];

    upgrades.forEach((u, i) => {
      const row = new PIXI.Container();
      row.position.set(-180, 45 + i * 30);

      const dot = new PIXI.Graphics();
      dot.beginFill(this.parseHexColor(u.color));
      dot.drawCircle(0, 8, 6);
      dot.endFill();
      
      const label = new PIXI.Text(u.name + ':', { 
        fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_UPGRADE_LABEL, fontWeight: 'bold', fill: this.parseHexColor(u.color) 
      });
      label.position.set(20, 0);

      const desc = new PIXI.Text(u.desc, { 
        fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_UPGRADE_DESC, fill: 0xFFFFFF, alpha: 0.8 
      });
      desc.position.set(100, 2);

      row.addChild(dot, label, desc);
      this.content.addChild(row);
    });

    const controlsHeader = new PIXI.Text('CONTROLS', {
      fontFamily: 'Orbitron', fontSize: 18, fontWeight: 'bold', fill: this.parseHexColor(COLORS.invader3), letterSpacing: 2
    });
    controlsHeader.anchor.set(0.5, 0);
    controlsHeader.position.set(0, 240);
    this.content.addChild(controlsHeader);

    const controlsText = new PIXI.Text('ARROWS: Move · SPACE: Shoot\nH: Toggle Help · ESC: End Game', {
      fontFamily: 'Orbitron', fontSize: 12, fill: 0xFFFFFF, align: 'center', alpha: 0.8, lineHeight: 20
    });
    controlsText.anchor.set(0.5, 0);
    controlsText.position.set(0, 270);
    this.content.addChild(controlsText);

    const footer = new PIXI.Text('Tap screen or Press H to continue', {
      fontFamily: 'Orbitron', fontSize: 14, fontWeight: 'bold', fill: this.parseHexColor(COLORS.text), alpha: 0.9
    });
    footer.anchor.set(0.5, 0);
    footer.position.set(0, 320);
    this.content.addChild(footer);

    this.container.addChild(this.titleContainer, this.content);
  }

  updateLayout(W, H) {
    this.titleContainer.position.set(W / 2, CONSTANTS.UI_HEADER_Y);
    this.content.position.set(W / 2, CONSTANTS.UI_HIGHSCORE_Y);
  }

  update(now) {
    if (this.container.visible) {
      const scale = 1 + Math.sin(now / CONSTANTS.ANIM_BREATH_SPEED) * CONSTANTS.ANIM_BREATH_STRENGTH;
      this.titleContainer.scale.set(scale);
    }
  }
}
