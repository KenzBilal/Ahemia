import { WeaponType } from "@shared/gameTypes";

export interface AudioSettings {
  masterVolume: number; // 0-1
  sfxVolume: number; // 0-1
  musicVolume: number; // 0-1
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private settings: AudioSettings;
  private soundCache: Map<string, AudioBuffer> = new Map();
  private currentMusic: OscillatorNode | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;

  constructor(settings: Partial<AudioSettings> = {}) {
    this.settings = {
      masterVolume: settings.masterVolume ?? 0.7,
      sfxVolume: settings.sfxVolume ?? 0.8,
      musicVolume: settings.musicVolume ?? 0.5,
      vibrationEnabled: settings.vibrationEnabled ?? true,
      soundEnabled: settings.soundEnabled ?? true,
    };

    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      // Create gain nodes for volume control
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.gain.value = this.settings.masterVolume;
      this.masterGainNode.connect(this.audioContext.destination);

      this.sfxGainNode = this.audioContext.createGain();
      this.sfxGainNode.gain.value = this.settings.sfxVolume;
      this.sfxGainNode.connect(this.masterGainNode);

      this.musicGainNode = this.audioContext.createGain();
      this.musicGainNode.gain.value = this.settings.musicVolume;
      this.musicGainNode.connect(this.masterGainNode);
    } catch (error) {
      console.warn("AudioContext not available:", error);
    }
  }

  // Weapon sounds
  playWeaponSound(weapon: WeaponType) {
    if (!this.settings.soundEnabled) return;

    const frequencies: Record<WeaponType, { freq: number; duration: number; type: OscillatorType }> = {
      [WeaponType.PISTOL]: { freq: 800, duration: 0.1, type: "sine" },
      [WeaponType.RIFLE]: { freq: 600, duration: 0.15, type: "square" },
      [WeaponType.SHOTGUN]: { freq: 400, duration: 0.2, type: "sawtooth" },
      [WeaponType.SNIPER]: { freq: 1000, duration: 0.25, type: "sine" },
    };

    const config = frequencies[weapon];
    this.playTone(config.freq, config.duration, config.type, 0.3);
  }

  // Hit sounds
  playHitSound(isHeadshot: boolean = false) {
    if (!this.settings.soundEnabled) return;

    const freq = isHeadshot ? 1200 : 600;
    this.playTone(freq, 0.1, "sine", 0.2);
  }

  // Explosion sound
  playExplosionSound() {
    if (!this.settings.soundEnabled) return;

    this.playTone(200, 0.3, "sawtooth", 0.4);
    this.playTone(100, 0.2, "sine", 0.3);
  }

  // Jetpack sound
  playJetpackSound() {
    if (!this.settings.soundEnabled) return;

    this.playTone(400, 0.2, "sine", 0.2);
  }

  // Pickup sound
  playPickupSound() {
    if (!this.settings.soundEnabled) return;

    this.playTone(800, 0.1, "sine", 0.15);
    this.playTone(1000, 0.1, "sine", 0.15);
  }

  // Kill confirm sound
  playKillConfirmSound() {
    if (!this.settings.soundEnabled) return;

    this.playTone(1000, 0.15, "sine", 0.3);
    this.playTone(1200, 0.15, "sine", 0.3);
  }

  // Multi-kill sound (escalating tones)
  playMultiKillSound(killCount: number) {
    if (!this.settings.soundEnabled) return;

    const baseFreq = 800 + killCount * 200;
    this.playTone(baseFreq, 0.2, "sine", 0.4);
  }

  // Death sound
  playDeathSound() {
    if (!this.settings.soundEnabled) return;

    this.playTone(300, 0.3, "sine", 0.3);
    this.playTone(200, 0.2, "sine", 0.2);
  }

  // Respawn sound
  playRespawnSound() {
    if (!this.settings.soundEnabled) return;

    this.playTone(800, 0.1, "sine", 0.2);
    this.playTone(1000, 0.1, "sine", 0.2);
    this.playTone(1200, 0.1, "sine", 0.2);
  }

  // Match start sound
  playMatchStartSound() {
    if (!this.settings.soundEnabled) return;

    this.playTone(1000, 0.2, "sine", 0.4);
    this.playTone(1200, 0.2, "sine", 0.4);
  }

  // Match end sound (victory)
  playVictorySound() {
    if (!this.settings.soundEnabled) return;

    this.playTone(1000, 0.2, "sine", 0.3);
    this.playTone(1200, 0.2, "sine", 0.3);
    this.playTone(1400, 0.3, "sine", 0.4);
  }

  // Match end sound (defeat)
  playDefeatSound() {
    if (!this.settings.soundEnabled) return;

    this.playTone(400, 0.2, "sine", 0.3);
    this.playTone(300, 0.3, "sine", 0.3);
  }

  // Generic tone generator
  private playTone(frequency: number, duration: number, type: OscillatorType, volume: number) {
    if (!this.audioContext || !this.sfxGainNode) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGainNode);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn("Failed to play tone:", error);
    }
  }

  // Background music (simple implementation)
  playBackgroundMusic(mapType: string) {
    if (!this.settings.soundEnabled || !this.audioContext) return;

    // In a real implementation, this would load and play actual audio files
    // For now, we'll create a simple ambient tone
    const frequencies: Record<string, number> = {
      base: 100,
      lava: 80,
      space: 120,
    };

    const freq = frequencies[mapType] || 100;
    this.playAmbientTone(freq, 0.1);
  }

  private playAmbientTone(frequency: number, volume: number) {
    if (!this.audioContext || !this.musicGainNode) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.connect(this.musicGainNode);
      oscillator.connect(gainNode);

      this.currentMusic = oscillator;
      oscillator.start();
    } catch (error) {
      console.warn("Failed to play ambient tone:", error);
    }
  }

  stopBackgroundMusic() {
    if (this.currentMusic) {
      try {
        this.currentMusic.stop();
        this.currentMusic = null;
      } catch (error) {
        console.warn("Failed to stop music:", error);
      }
    }
  }

  // Vibration/Haptics
  vibrate(pattern: number | number[] = 100) {
    if (!this.settings.vibrationEnabled || !navigator.vibrate) return;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn("Vibration not available:", error);
    }
  }

  // Settings management
  setMasterVolume(volume: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.settings.masterVolume;
    }
  }

  setSFXVolume(volume: number) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.settings.sfxVolume;
    }
  }

  setMusicVolume(volume: number) {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.settings.musicVolume;
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.settings.soundEnabled = enabled;
  }

  setVibrationEnabled(enabled: boolean) {
    this.settings.vibrationEnabled = enabled;
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  dispose() {
    this.stopBackgroundMusic();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
