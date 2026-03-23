import { Audio, AVPlaybackSource } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { WeaponType } from '../shared/gameTypes';

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}

type SoundKey =
  | 'pistol_fire'
  | 'rifle_fire'
  | 'shotgun_fire'
  | 'sniper_fire'
  | 'hit'
  | 'headshot'
  | 'explosion'
  | 'death'
  | 'respawn'
  | 'kill_confirm'
  | 'jetpack'
  | 'pickup'
  | 'bgm_base'
  | 'bgm_lava'
  | 'bgm_space';

const SOUND_FILES: Record<SoundKey, AVPlaybackSource> = {
  pistol_fire: require('../../assets/sounds/pistol_fire.wav'),
  rifle_fire: require('../../assets/sounds/rifle_fire.wav'),
  shotgun_fire: require('../../assets/sounds/shotgun_fire.wav'),
  sniper_fire: require('../../assets/sounds/sniper_fire.wav'),
  hit: require('../../assets/sounds/hit.wav'),
  headshot: require('../../assets/sounds/headshot.wav'),
  explosion: require('../../assets/sounds/explosion.wav'),
  death: require('../../assets/sounds/death.wav'),
  respawn: require('../../assets/sounds/respawn.wav'),
  kill_confirm: require('../../assets/sounds/kill_confirm.wav'),
  jetpack: require('../../assets/sounds/jetpack.wav'),
  pickup: require('../../assets/sounds/pickup.wav'),
  bgm_base: require('../../assets/sounds/bgm_base.mp3'),
  bgm_lava: require('../../assets/sounds/bgm_lava.mp3'),
  bgm_space: require('../../assets/sounds/bgm_space.mp3'),
};

export class AudioManager {
  private settings: AudioSettings;
  private pool: Map<SoundKey, Audio.Sound[]> = new Map();
  private currentMusic: Audio.Sound | null = null;
  private loaded = false;

  constructor(settings: Partial<AudioSettings> = {}) {
    this.settings = {
      masterVolume: settings.masterVolume ?? 0.7,
      sfxVolume: settings.sfxVolume ?? 0.8,
      musicVolume: settings.musicVolume ?? 0.5,
      vibrationEnabled: settings.vibrationEnabled ?? true,
      soundEnabled: settings.soundEnabled ?? true,
    };
  }

  async initializeAudioContext(): Promise<void> {
    if (this.loaded) {
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
      playThroughEarpieceAndroid: false,
    });

    const load = async (key: SoundKey, poolSize: number) => {
      const sounds: Audio.Sound[] = [];
      for (let i = 0; i < poolSize; i += 1) {
        const { sound } = await Audio.Sound.createAsync(SOUND_FILES[key], {
          shouldPlay: false,
          volume: this.settings.masterVolume * this.settings.sfxVolume,
          isLooping: key === 'jetpack',
        });
        sounds.push(sound);
      }
      this.pool.set(key, sounds);
    };

    await Promise.all([
      load('pistol_fire', 4),
      load('rifle_fire', 6),
      load('shotgun_fire', 3),
      load('sniper_fire', 2),
      load('hit', 4),
      load('headshot', 2),
      load('explosion', 3),
      load('death', 2),
      load('respawn', 2),
      load('kill_confirm', 2),
      load('jetpack', 1),
      load('pickup', 2),
      load('bgm_base', 1),
      load('bgm_lava', 1),
      load('bgm_space', 1),
    ]);

    this.loaded = true;
  }

  private async playFromPool(key: SoundKey, isMusic = false): Promise<void> {
    if (!this.settings.soundEnabled || !this.loaded) {
      return;
    }

    const sounds = this.pool.get(key);
    if (!sounds || sounds.length === 0) {
      return;
    }

    const next = sounds[0];
    sounds.push(sounds.shift() as Audio.Sound);

    await next.setStatusAsync({ positionMillis: 0, shouldPlay: true, volume: this.getVolume(isMusic) });
  }

  private getVolume(isMusic: boolean): number {
    if (isMusic) {
      return this.settings.masterVolume * this.settings.musicVolume;
    }
    return this.settings.masterVolume * this.settings.sfxVolume;
  }

  async playWeaponSound(weapon: WeaponType): Promise<void> {
    if (weapon === WeaponType.PISTOL) await this.playFromPool('pistol_fire');
    if (weapon === WeaponType.RIFLE) await this.playFromPool('rifle_fire');
    if (weapon === WeaponType.SHOTGUN) await this.playFromPool('shotgun_fire');
    if (weapon === WeaponType.SNIPER) await this.playFromPool('sniper_fire');
  }

  async playHitSound(isHeadshot = false): Promise<void> {
    await this.playFromPool(isHeadshot ? 'headshot' : 'hit');
  }

  async playExplosionSound(): Promise<void> {
    await this.playFromPool('explosion');
  }

  async playJetpackSound(): Promise<void> {
    await this.playFromPool('jetpack');
  }

  async playPickupSound(): Promise<void> {
    await this.playFromPool('pickup');
  }

  async playKillConfirmSound(): Promise<void> {
    await this.playFromPool('kill_confirm');
  }

  async playMultiKillSound(killCount: number): Promise<void> {
    if (killCount >= 3) {
      await this.playFromPool('headshot');
      return;
    }
    await this.playFromPool('kill_confirm');
  }

  async playDeathSound(): Promise<void> {
    await this.playFromPool('death');
  }

  async playRespawnSound(): Promise<void> {
    await this.playFromPool('respawn');
  }

  async playMatchStartSound(): Promise<void> {
    await this.playFromPool('pickup');
  }

  async playVictorySound(): Promise<void> {
    await this.playFromPool('headshot');
  }

  async playDefeatSound(): Promise<void> {
    await this.playFromPool('death');
  }

  async playBackgroundMusic(mapType: string): Promise<void> {
    if (!this.settings.soundEnabled) {
      return;
    }

    await this.stopBackgroundMusic();

    const key = mapType === 'lava' ? 'bgm_lava' : mapType === 'space' ? 'bgm_space' : 'bgm_base';
    const music = this.pool.get(key)?.[0] ?? null;
    if (!music) {
      return;
    }

    this.currentMusic = music;
    await music.setStatusAsync({
      isLooping: true,
      positionMillis: 0,
      shouldPlay: true,
      volume: this.getVolume(true),
    });
  }

  async stopBackgroundMusic(): Promise<void> {
    if (!this.currentMusic) {
      return;
    }
    await this.currentMusic.stopAsync();
    this.currentMusic = null;
  }

  async vibrate(): Promise<void> {
    if (!this.settings.vibrationEnabled) {
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  async setMasterVolume(volume: number): Promise<void> {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    await this.refreshVolumes();
  }

  async setSFXVolume(volume: number): Promise<void> {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    await this.refreshVolumes();
  }

  async setMusicVolume(volume: number): Promise<void> {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    await this.refreshVolumes();
  }

  setSoundEnabled(enabled: boolean): void {
    this.settings.soundEnabled = enabled;
  }

  setVibrationEnabled(enabled: boolean): void {
    this.settings.vibrationEnabled = enabled;
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  private async refreshVolumes(): Promise<void> {
    const allEntries = Array.from(this.pool.entries());
    for (const [key, sounds] of allEntries) {
      const isMusic = key.startsWith('bgm_');
      const volume = this.getVolume(isMusic);
      await Promise.all(sounds.map((sound) => sound.setStatusAsync({ volume })));
    }
  }

  async dispose(): Promise<void> {
    await this.stopBackgroundMusic();
    const entries = Array.from(this.pool.values()).flat();
    await Promise.all(entries.map((sound) => sound.unloadAsync()));
    this.pool.clear();
    this.loaded = false;
  }
}

export const audioManager = new AudioManager();
