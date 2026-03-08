import { CONSTANTS } from './constants.js';

export class AudioManager {
  constructor(game) {
    this.game = game;
    this.bgm = null;
    this.sfx = new Map();
    this.isMuted = false;
    this.init();
  }

  init() {
    // PIXI.sound is globally available via the script tag in index.html
    if (typeof PIXI.sound === 'undefined') {
      console.warn('PIXI.sound not found. Audio will be disabled.');
      return;
    }

    // Pre-load BGM
    PIXI.sound.add('bgm', {
      url: CONSTANTS.AUDIO_ASSETS.BGM,
      loop: true,
      volume: CONSTANTS.AUDIO_BGM_VOLUME,
      preload: true
    });
  }

  playBGM() {
    if (typeof PIXI.sound === 'undefined') return;
    
    // Ensure BGM is playing and handle browser auto-play restrictions
    if (!PIXI.sound.exists('bgm')) return;
    
    const bgm = PIXI.sound.find('bgm');
    if (!bgm.isPlaying) {
      PIXI.sound.play('bgm');
    }
  }

  stopBGM() {
    if (typeof PIXI.sound !== 'undefined' && PIXI.sound.exists('bgm')) {
      PIXI.sound.stop('bgm');
    }
  }

  pauseBGM() {
    if (typeof PIXI.sound !== 'undefined' && PIXI.sound.exists('bgm')) {
      PIXI.sound.pause('bgm');
    }
  }

  resumeBGM() {
    if (typeof PIXI.sound !== 'undefined' && PIXI.sound.exists('bgm')) {
      PIXI.sound.resume('bgm');
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (typeof PIXI.sound !== 'undefined') {
      if (this.isMuted) PIXI.sound.muteAll();
      else PIXI.sound.unmuteAll();
    }
    return this.isMuted;
  }
}
