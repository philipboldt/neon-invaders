import { COLORS, CONSTANTS } from '../constants.js';
import { BaseView } from './BaseView.js';
import { UIButton } from './UIButton.js';

export class SettingsView extends BaseView {
  constructor(game) {
    super(game);
    this.init();
  }

  init() {
    this.titleContainer = new PIXI.Container();
    this.container.addChild(this.titleContainer);

    this.title = new PIXI.Text('MISSION SETTINGS', {
      fontFamily: 'Orbitron',
      fontSize: CONSTANTS.FONT_SIZE_TITLE,
      fontWeight: 900,
      fill: this.parseHexColor(COLORS.text),
      letterSpacing: CONSTANTS.UI_SETTINGS_LETTER_SPACING_TITLE,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: CONSTANTS.UI_SETTINGS_DROP_SHADOW_BLUR,
      dropShadowDistance: CONSTANTS.UI_SETTINGS_DROP_SHADOW_DISTANCE
    });
    this.title.anchor.set(0.5);
    this.titleContainer.addChild(this.title);

    // Music Toggle Button
    this.musicButton = new UIButton('MUSIC: ON', this.parseHexColor(COLORS.player), () => {
      this.game.audio.toggleMusic();
      this.updateMusicButtonText();
    });
    this.container.addChild(this.musicButton);

    // Sound Toggle Button
    this.soundButton = new UIButton('SOUND: ON', this.parseHexColor(COLORS.player), () => {
      this.game.audio.toggleSFX();
      this.updateSoundButtonText();
    });
    this.container.addChild(this.soundButton);

    // Credits Button
    this.creditsButton = new UIButton('VIEW CREDITS', this.parseHexColor(COLORS.invader2), () => {
      this.game.ui.creditsReturnState = CONSTANTS.GAME_STATES.SETTINGS;
      this.game.state = CONSTANTS.GAME_STATES.CREDITS;
      this.game.ui.handleStateChange(this.game.state);
    });
    this.container.addChild(this.creditsButton);

    this.warning = new PIXI.Text('PRESS ESC OR DOUBLE-TAP TOP TO ABORT MISSION.', {
      fontFamily: 'Orbitron',
      fontSize: CONSTANTS.FONT_SIZE_SUBTITLE,
      fill: this.parseHexColor(COLORS.textRed),
      align: 'center'
    });
    this.warning.anchor.set(0.5);
    this.container.addChild(this.warning);

    this.prompt = new PIXI.Text('PRESS SPACE OR TAP BOTTOM TO RESUME.', {
      fontFamily: 'Orbitron',
      fontSize: CONSTANTS.FONT_SIZE_PROMPT,
      fontWeight: 'bold',
      fill: this.parseHexColor(COLORS.player),
      align: 'center'
    });
    this.prompt.anchor.set(0.5);
    this.container.addChild(this.prompt);
  }

  updateMusicButtonText() {
    const isMuted = this.game.audio.isMusicMuted;
    this.musicButton.setLabel(`MUSIC: ${isMuted ? 'OFF' : 'ON'}`);
    this.musicButton.setColor(isMuted ? CONSTANTS.UI_SETTINGS_COLOR_MUTED : this.parseHexColor(COLORS.player));
  }

  updateSoundButtonText() {
    const isMuted = this.game.audio.isSFXMuted;
    this.soundButton.setLabel(`SOUND: ${isMuted ? 'OFF' : 'ON'}`);
    this.soundButton.setColor(isMuted ? CONSTANTS.UI_SETTINGS_COLOR_MUTED : this.parseHexColor(COLORS.player));
  }

  onShow() {
    this.updateMusicButtonText();
    this.updateSoundButtonText();
  }

  updateLayout(W, H) {
    this.titleContainer.position.set(W / 2, H * CONSTANTS.UI_SETTINGS_TITLE_Y_RATIO);
    this.musicButton.position.set(W / 2, H * CONSTANTS.UI_SETTINGS_MUSIC_Y_RATIO);
    this.soundButton.position.set(W / 2, H * CONSTANTS.UI_SETTINGS_SOUND_Y_RATIO);
    this.creditsButton.position.set(W / 2, H * CONSTANTS.UI_SETTINGS_CREDITS_Y_RATIO);
    this.warning.position.set(W / 2, H * CONSTANTS.UI_SETTINGS_WARNING_Y_RATIO);
    this.prompt.position.set(W / 2, H * CONSTANTS.UI_SETTINGS_PROMPT_Y_RATIO);
  }

  update(now) {
    if (this.container.visible) {
      const scale = 1 + Math.sin(now / CONSTANTS.ANIM_BREATH_SPEED) * CONSTANTS.ANIM_BREATH_STRENGTH;
      this.titleContainer.scale.set(scale);
      this.prompt.alpha = 0.5 + Math.sin(now / CONSTANTS.ANIM_BLINK_SPEED) * 0.5;
    }
  }
}
