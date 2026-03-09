import { CONSTANTS } from '../constants.js';

/**
 * Reusable Neon Button Component
 */
export class UIButton extends PIXI.Container {
  /**
   * @param {string} label - The text to display
   * @param {number} color - Hex color for the text and glow
   * @param {Function} onClick - Callback function
   */
  constructor(label, color, onClick) {
    super();
    this.baseLabel = label;
    this.baseColor = color;
    this.onClick = onClick;
    
    this.eventMode = 'static';
    this.cursor = 'pointer';
    
    this.text = new PIXI.Text(this.formatLabel(label), {
      fontFamily: 'Orbitron',
      fontSize: CONSTANTS.FONT_SIZE_HEADER,
      fontWeight: 'bold',
      fill: color,
      letterSpacing: CONSTANTS.UI_SETTINGS_LETTER_SPACING_BUTTON
    });
    this.text.anchor.set(0.5);
    this.addChild(this.text);
    
    this.setupEvents();
  }

  formatLabel(text) {
    return `[ ${text.toUpperCase()} ]`;
  }

  setLabel(newLabel) {
    this.baseLabel = newLabel;
    this.text.text = this.formatLabel(newLabel);
  }

  setColor(newColor) {
    this.baseColor = newColor;
    this.text.style.fill = newColor;
  }

  setupEvents() {
    this.on('pointerover', () => {
      this.text.style.fill = 0xFFFFFF;
    });

    this.on('pointerout', () => {
      this.text.style.fill = this.baseColor;
    });

    this.on('pointertap', (e) => {
      e.stopPropagation();
      if (this.onClick) this.onClick();
    });
  }
}
