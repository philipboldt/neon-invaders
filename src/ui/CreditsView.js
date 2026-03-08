import { COLORS, CONSTANTS } from '../constants.js';
import { BaseView } from './BaseView.js';

export class CreditsView extends BaseView {
  constructor(game) {
    super(game);
    this.scrollSpeed = 1.2;
    this.creditsData = [];
    this.isLoaded = false;
    this.init();
    this.loadCredits();
  }

  init() {
    // 1. Scroll Container
    this.scrollContainer = new PIXI.Container();
    this.container.addChild(this.scrollContainer);

    // 2. Mask (to keep credits inside the play area)
    this.viewportMask = new PIXI.Graphics();
    this.container.addChild(this.viewportMask);
    this.scrollContainer.mask = this.viewportMask;
  }

  async loadCredits() {
    try {
      const response = await fetch('res/credits.json');
      this.creditsData = await response.json();
      this.buildCredits();
      this.isLoaded = true;
    } catch (err) {
      console.error('Failed to load credits:', err);
    }
  }

  buildCredits() {
    this.scrollContainer.removeChildren();
    let currentY = 0;

    this.creditsData.forEach(item => {
      if (item.type === 'spacer') {
        currentY += item.size;
        return;
      }

      const style = this.getStyleForType(item.type, item.color);
      const text = new PIXI.Text(item.text, style);
      text.anchor.set(0.5, 0);
      text.position.set(0, currentY);
      
      // Add data for color cycling effect
      text.baseColor = item.color;
      
      this.scrollContainer.addChild(text);
      currentY += text.height + 10;
    });

    // Mark the full height for looping
    this.fullHeight = currentY;
    this.resetScroll();
  }

  getStyleForType(type, colorKey) {
    const color = this.parseHexColor(COLORS[colorKey] || COLORS.text);
    const baseStyle = {
      fontFamily: 'Orbitron',
      fill: color,
      align: 'center',
      dropShadow: true,
      dropShadowColor: color,
      dropShadowBlur: 8,
      dropShadowDistance: 0
    };

    switch (type) {
      case 'header':
        return { ...baseStyle, fontSize: 32, fontWeight: 900, letterSpacing: 4, dropShadowBlur: 12 };
      case 'quote':
        return { ...baseStyle, fontSize: 16, fontWeight: 'bold', fontStyle: 'italic' };
      case 'role':
        return { ...baseStyle, fontSize: 14, fontWeight: 'bold', alpha: 0.7 };
      case 'name':
        return { ...baseStyle, fontSize: 24, fontWeight: 900 };
      case 'link':
        return { ...baseStyle, fontSize: 14, letterSpacing: 2 };
      default:
        return { ...baseStyle, fontSize: 18 };
    }
  }

  resetScroll() {
    this.scrollContainer.y = this.lastH || 600;
  }

  updateLayout(W, H) {
    this.lastH = H;
    this.scrollContainer.x = W / 2;
    
    // Update mask to match current viewport bounds
    this.viewportMask.clear();
    this.viewportMask.beginFill(0x000000);
    // Draw mask from just below the marquee to just above the footer
    this.viewportMask.drawRect(0, 80, W, H - 160);
    this.viewportMask.endFill();

    if (!this.isLoaded) this.resetScroll();
  }

  update(now) {
    if (!this.container.visible || !this.isLoaded) return;

    // 1. Scroll logic
    this.scrollContainer.y -= this.scrollSpeed;

    // 2. Loop logic
    if (this.scrollContainer.y + this.fullHeight < 0) {
      this.resetScroll();
    }

    // 3. Visual FX: Breathing Glow & Color Shift
    const breath = Math.sin(now / CONSTANTS.ANIM_BREATH_SPEED);
    const glowScale = 0.8 + (breath * 0.2);
    
    this.scrollContainer.children.forEach(child => {
      if (child instanceof PIXI.Text) {
        // Pulse the glow
        child.style.dropShadowBlur = (child.style.fontSize > 20 ? 12 : 8) * glowScale;
        
        // Optional: slow color pulse for headers
        if (child.baseColor === 'player') {
           // Shift cyan slightly towards white and back
           const val = Math.floor(200 + breath * 55);
           child.tint = (val << 16) | (255 << 8) | 255;
        }
      }
    });
  }
}
