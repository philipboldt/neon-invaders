import { CONSTANTS } from '../constants.js';

/**
 * Reusable Neon Slider Component
 */
export class UISlider extends PIXI.Container {
  /**
   * @param {string} label - Display label
   * @param {number} color - Hex color
   * @param {number} initialValue - 0.0 to 1.0
   * @param {Function} onChanged - Callback(value)
   */
  constructor(label, color, initialValue, onChanged) {
    super();
    this.baseLabel = label;
    this.baseColor = color;
    this.onChanged = onChanged;
    this.value = initialValue;
    this.isDragging = false;

    this.width_px = CONSTANTS.UI_SLIDER_WIDTH;
    
    // 1. Label
    this.labelText = new PIXI.Text(this.formatLabel(label, initialValue), {
      fontFamily: 'Orbitron',
      fontSize: CONSTANTS.FONT_SIZE_SUBTITLE,
      fontWeight: 'bold',
      fill: color
    });
    this.labelText.anchor.set(0.5, 1);
    this.labelText.position.set(0, -15);
    this.addChild(this.labelText);

    // 2. Track
    this.track = new PIXI.Graphics();
    this.drawTrack();
    this.addChild(this.track);

    // 3. Handle
    this.handle = new PIXI.Graphics();
    this.drawHandle();
    this.handle.eventMode = 'static';
    this.handle.cursor = 'pointer';
    this.updateHandlePosition();
    this.addChild(this.handle);

    this.setupEvents();
  }

  formatLabel(text, val) {
    return `${text}: ${Math.round(val * 100)}%`;
  }

  drawTrack() {
    this.track.clear();
    this.track.beginFill(0x333333);
    this.track.drawRect(-this.width_px / 2, -CONSTANTS.UI_SLIDER_TRACK_HEIGHT / 2, this.width_px, CONSTANTS.UI_SLIDER_TRACK_HEIGHT);
    this.track.endFill();
    
    // Filled part
    this.track.beginFill(this.baseColor);
    const filledW = this.width_px * this.value;
    this.track.drawRect(-this.width_px / 2, -CONSTANTS.UI_SLIDER_TRACK_HEIGHT / 2, filledW, CONSTANTS.UI_SLIDER_TRACK_HEIGHT);
    this.track.endFill();
  }

  drawHandle() {
    this.handle.clear();
    this.handle.beginFill(0xFFFFFF);
    this.handle.drawRect(-CONSTANTS.UI_SLIDER_HANDLE_SIZE / 2, -CONSTANTS.UI_SLIDER_HANDLE_SIZE / 2, CONSTANTS.UI_SLIDER_HANDLE_SIZE, CONSTANTS.UI_SLIDER_HANDLE_SIZE);
    this.handle.endFill();
    
    // Glow
    this.handle.lineStyle(2, this.baseColor, 1);
    this.handle.drawRect(-CONSTANTS.UI_SLIDER_HANDLE_SIZE / 2, -CONSTANTS.UI_SLIDER_HANDLE_SIZE / 2, CONSTANTS.UI_SLIDER_HANDLE_SIZE, CONSTANTS.UI_SLIDER_HANDLE_SIZE);
  }

  updateHandlePosition() {
    this.handle.x = -this.width_px / 2 + this.width_px * this.value;
  }

  setValue(val) {
    this.value = Math.max(0, Math.min(1, val));
    this.updateHandlePosition();
    this.drawTrack();
    this.labelText.text = this.formatLabel(this.baseLabel, this.value);
  }

  setupEvents() {
    const onDrag = (e) => {
      if (this.isDragging) {
        const localPos = this.toLocal(e.global);
        const newValue = (localPos.x + this.width_px / 2) / this.width_px;
        this.setValue(newValue);
        if (this.onChanged) this.onChanged(this.value);
      }
    };

    this.handle.on('pointerdown', (e) => {
      this.isDragging = true;
      this.handle.alpha = 0.8;
    });

    // Global listeners for smooth dragging
    this.handle.on('globalpointermove', onDrag);
    
    const stopDrag = () => {
      this.isDragging = false;
      this.handle.alpha = 1;
    };
    
    this.handle.on('pointerup', stopDrag);
    this.handle.on('pointerupoutside', stopDrag);
  }
}
