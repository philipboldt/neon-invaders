import { COLORS, CONSTANTS } from '../constants.js';
import { BaseView } from './BaseView.js';

export class NameEntryView extends BaseView {
  constructor(game) {
    super(game);
    this.currentCharIndex = 0;
    this.chars = ['A', 'A', 'A'];
    this.charTexts = [];
    this.init();
  }

  init() {
    this.header = new PIXI.Text('NEW HIGH SCORE!', {
      fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_NAME_ENTRY_HEADER, fontWeight: 'bold', fill: this.parseHexColor(COLORS.invader2),
      dropShadow: true, dropShadowColor: this.parseHexColor(COLORS.invader2), dropShadowBlur: 10
    });
    this.header.anchor.set(0.5, 0);

    this.entryContainer = new PIXI.Container();
    
    // Create 3 slots for characters
    for (let i = 0; i < 3; i++) {
      const slot = new PIXI.Container();
      slot.position.set((i - 1) * CONSTANTS.UI_NAME_ENTRY_GAP, 0);

      const charText = new PIXI.Text('A', {
        fontFamily: 'Orbitron', fontSize: CONSTANTS.FONT_SIZE_NAME_ENTRY_CHAR, fontWeight: 900, fill: 0xFFFFFF
      });
      charText.anchor.set(0.5);
      
      const underline = new PIXI.Graphics();
      underline.beginFill(0xFFFFFF, 0.3);
      underline.drawRect(-25, 35, 50, 4);
      underline.endFill();

      slot.addChild(charText, underline);
      this.charTexts.push({ container: slot, text: charText, underline });
      this.entryContainer.addChild(slot);
    }

    this.footer = new PIXI.Text('ARROWS to change · ENTER to save', {
      fontFamily: 'Orbitron', fontSize: 16, fill: 0xFFFFFF, alpha: 0.6
    });
    this.footer.anchor.set(0.5, 0);

    this.container.addChild(this.header, this.entryContainer, this.footer);
  }

  reset() {
    this.currentCharIndex = 0;
    this.chars = ['A', 'A', 'A'];
    this.updateDisplay();
  }

  changeChar(delta) {
    let charCode = this.chars[this.currentCharIndex].charCodeAt(0);
    charCode = ((charCode - 65 + delta + 26) % 26) + 65;
    this.chars[this.currentCharIndex] = String.fromCharCode(charCode);
    this.updateDisplay();
  }

  moveSlot(delta) {
    this.currentCharIndex = (this.currentCharIndex + delta + 3) % 3;
    this.updateDisplay();
  }

  updateDisplay() {
    this.charTexts.forEach((ct, i) => {
      ct.text.text = this.chars[i];
      const isActive = i === this.currentCharIndex;
      ct.text.style.fill = isActive ? this.parseHexColor(COLORS.player) : 0xFFFFFF;
      ct.underline.alpha = isActive ? 1.0 : 0.2;
      ct.underline.clear();
      ct.underline.beginFill(isActive ? this.parseHexColor(COLORS.player) : 0xFFFFFF, isActive ? 1.0 : 0.3);
      ct.underline.drawRect(-25, 35, 50, 4);
      ct.underline.endFill();
    });
  }

  updateLayout(W, H) {
    this.header.position.set(W / 2, CONSTANTS.UI_NAME_ENTRY_HEADER_Y);
    this.entryContainer.position.set(W / 2, CONSTANTS.UI_NAME_ENTRY_SLOTS_Y);
    this.footer.position.set(W / 2, CONSTANTS.UI_NAME_ENTRY_FOOTER_Y);
  }

  update(now) {
    if (this.container.visible) {
      this.header.alpha = 0.7 + Math.sin(now / 200) * 0.3;
      // Pulse the active slot
      const activeSlot = this.charTexts[this.currentCharIndex].container;
      activeSlot.scale.set(1 + Math.sin(now / 150) * 0.05);
    }
  }

  getName() {
    return this.chars.join('');
  }
}
