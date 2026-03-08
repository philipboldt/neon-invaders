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

  resumeContext() {
    if (typeof PIXI.sound === 'undefined') return;
    
    // Pixi Sound has its own context manager
    const context = PIXI.sound.context;
    if (context && context.audioContext && context.audioContext.state === 'suspended') {
      context.audioContext.resume().then(() => {
        console.log('AudioContext resumed successfully');
      }).catch(err => {
        console.warn('Failed to resume AudioContext:', err);
      });
    }
  }

  playBGM() {
    if (typeof PIXI.sound === 'undefined') return;
    if (!PIXI.sound.exists('bgm')) return;
    
    const bgm = PIXI.sound.find('bgm');
    // Important: Only trigger play if not already playing AND not already loading/readying
    if (!bgm.isPlaying && !bgm.isPaused) {
      PIXI.sound.play('bgm');
    } else if (bgm.isPaused) {
      PIXI.sound.resume('bgm');
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
