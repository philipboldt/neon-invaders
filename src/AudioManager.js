import { CONSTANTS } from './constants.js';

export class AudioManager {
  constructor(game) {
    this.game = game;
    this.isMusicMuted = false;
    this.isSFXMuted = false;
    this.init();
  }

  init() {
    if (typeof PIXI.sound === 'undefined') {
      console.warn('PIXI.sound not found. Audio will be disabled.');
      return;
    }

    // Pre-load BGM (Apply quadratic curve to initial volume)
    PIXI.sound.add('bgm', {
      url: CONSTANTS.AUDIO_ASSETS.BGM,
      loop: true,
      volume: CONSTANTS.AUDIO_BGM_VOLUME * CONSTANTS.AUDIO_BGM_VOLUME * CONSTANTS.AUDIO_MASTER_VOLUME,
      preload: true
    });

    // Pre-load Explosion SFX (Apply quadratic curve to initial volume)
    PIXI.sound.add('explosion', {
      url: CONSTANTS.AUDIO_ASSETS.EXPLOSION,
      volume: CONSTANTS.AUDIO_SFX_VOLUME * CONSTANTS.AUDIO_SFX_VOLUME * CONSTANTS.AUDIO_GAIN_EXPLOSION * CONSTANTS.AUDIO_MASTER_VOLUME,
      preload: true
    });

    // Pre-load Laser SFX (Apply quadratic curve to initial volume)
    PIXI.sound.add('laser', {
      url: CONSTANTS.AUDIO_ASSETS.LASER,
      volume: CONSTANTS.AUDIO_SFX_VOLUME * CONSTANTS.AUDIO_SFX_VOLUME * CONSTANTS.AUDIO_GAIN_LASER * CONSTANTS.AUDIO_MASTER_VOLUME,
      preload: true
    });
  }

  resumeContext() {
    if (typeof PIXI.sound === 'undefined') return;
    const context = PIXI.sound.context;
    if (context && context.audioContext && context.audioContext.state === 'suspended') {
      context.audioContext.resume().catch(err => console.warn('Failed to resume AudioContext:', err));
    }
  }

  playBGM() {
    if (typeof PIXI.sound === 'undefined' || !PIXI.sound.exists('bgm')) return;
    const bgm = PIXI.sound.find('bgm');
    if (!bgm.isPlaying && !bgm.isPaused) {
      PIXI.sound.play('bgm', { muted: this.isMusicMuted });
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
    if (typeof PIXI.sound !== 'undefined' && PIXI.sound.exists('bgm') && !this.isMusicMuted) {
      PIXI.sound.resume('bgm');
    }
  }

  playSFX(name) {
    if (typeof PIXI.sound === 'undefined' || this.isSFXMuted || !PIXI.sound.exists(name)) return;
    PIXI.sound.play(name);
  }

  toggleMusic() {
    this.isMusicMuted = !this.isMusicMuted;
    if (typeof PIXI.sound !== 'undefined' && PIXI.sound.exists('bgm')) {
      if (this.isMusicMuted) PIXI.sound.find('bgm').muted = true;
      else PIXI.sound.find('bgm').muted = false;
    }
    return this.isMusicMuted;
  }

  toggleSFX() {
    this.isSFXMuted = !this.isSFXMuted;
    return this.isSFXMuted;
  }

  setMusicVolume(vol) {
    if (typeof PIXI.sound === 'undefined') return;
    const bgm = PIXI.sound.find('bgm');
    // Quadratic curve for more natural volume control
    if (bgm) bgm.volume = vol * vol * CONSTANTS.AUDIO_MASTER_VOLUME;
  }

  setSFXVolume(vol) {
    if (typeof PIXI.sound === 'undefined') return;
    // Quadratic curve for more natural volume control
    const baseVol = vol * vol * CONSTANTS.AUDIO_MASTER_VOLUME;
    const exp = PIXI.sound.find('explosion');
    if (exp) exp.volume = baseVol * CONSTANTS.AUDIO_GAIN_EXPLOSION;
    const lsr = PIXI.sound.find('laser');
    if (lsr) lsr.volume = baseVol * CONSTANTS.AUDIO_GAIN_LASER;
  }

  get isMuted() {
    return this.isMusicMuted && this.isSFXMuted;
  }

  muteAll() {
    this.isMusicMuted = true;
    this.isSFXMuted = true;
    if (typeof PIXI.sound !== 'undefined') {
      if (PIXI.sound.exists('bgm')) PIXI.sound.find('bgm').muted = true;
    }
  }

  toggleMuteAll() {
    const target = !this.isMuted;
    this.isMusicMuted = target;
    this.isSFXMuted = target;
    if (typeof PIXI.sound !== 'undefined' && PIXI.sound.exists('bgm')) {
      PIXI.sound.find('bgm').muted = target;
    }
    return target;
  }
}
