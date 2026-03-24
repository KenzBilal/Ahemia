import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GameState,
  HeroType,
  MapType,
  PlayerState,
  WeaponType,
} from '../shared/gameTypes';

export interface LobbyPlayer {
  id: string;
  name: string;
  heroId: HeroType;
  ready: boolean;
}

export interface LobbyState {
  map: string;
  timeLimit: number;
}

interface GameStore {
  gameState: GameState | null;
  localPlayerId: string | null;
  selectedHero: HeroType | null;
  isGameRunning: boolean;
  isHost: boolean;
  roomId: string | null;
  lobbyState: LobbyState;
  lobbyPlayers: LobbyPlayer[];
  discoveredGames: Array<{ id: string; name: string; host: string; port: number }>;
  ammoByWeapon: Record<WeaponType, number>;
  
  // Persistent Player Identity
  playerName: string;
  playerSkin: string;
  
  // Persistent Settings
  bgmVolume: number;
  sfxVolume: number;
  joystickSize: 'small' | 'medium' | 'large';
  joystickSensitivity: number;
  localAimAngle: number;

  setGameState: (state: GameState) => void;
  setLocalPlayerId: (id: string) => void;
  setSelectedHero: (hero: HeroType) => void;
  setGameRunning: (running: boolean) => void;
  setIsHost: (host: boolean) => void;
  setRoomId: (roomId: string | null) => void;
  setLobbyState: (state: Partial<LobbyState>) => void;
  setLobbyPlayers: (players: LobbyPlayer[]) => void;
  setDiscoveredGames: (games: Array<{ id: string; name: string; host: string; port: number }>) => void;
  setAmmoByWeapon: (ammo: Record<WeaponType, number>) => void;
  updatePlayer: (player: PlayerState) => void;
  resetForNewMatch: () => void;

  setPlayerName: (name: string) => void;
  setPlayerSkin: (skin: string) => void;
  setBgmVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setJoystickSize: (s: 'small' | 'medium' | 'large') => void;
  setJoystickSensitivity: (v: number) => void;
  setLocalAimAngle: (angle: number) => void;
  loadPersistedData: () => Promise<void>;
}

const EMPTY_AMMO: Record<WeaponType, number> = {
  [WeaponType.PISTOL]: 0,
  [WeaponType.RIFLE]: 0,
  [WeaponType.SHOTGUN]: 0,
  [WeaponType.SNIPER]: 0,
  [WeaponType.WEB]: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  localPlayerId: null,
  selectedHero: null,
  isGameRunning: false,
  isHost: false,
  roomId: null,
  lobbyState: { map: 'base', timeLimit: 10 },
  lobbyPlayers: [],
  discoveredGames: [],
  ammoByWeapon: EMPTY_AMMO,

  playerName: '',
  playerSkin: 'default',
  bgmVolume: 0.7,
  sfxVolume: 0.8,
  joystickSize: 'medium',
  joystickSensitivity: 0.5,
  localAimAngle: 0,

  setGameState: (state) => set({ gameState: state }),
  setLocalPlayerId: (id) => set({ localPlayerId: id }),
  setSelectedHero: (hero) => set({ selectedHero: hero }),
  setGameRunning: (running) => set({ isGameRunning: running }),
  setIsHost: (host) => set({ isHost: host }),
  setRoomId: (roomId) => set({ roomId }),
  setLobbyState: (state) =>
    set((current) => ({
      lobbyState: {
        ...current.lobbyState,
        ...state,
      },
    })),
  setLobbyPlayers: (players) => set({ lobbyPlayers: players }),
  setDiscoveredGames: (games) => set({ discoveredGames: games }),
  setAmmoByWeapon: (ammo) => set({ ammoByWeapon: ammo }),
  updatePlayer: (player) => {
    const current = get().gameState;
    if (!current) {
      return;
    }

    set({
      gameState: {
        ...current,
        players: {
          ...current.players,
          [player.id]: player,
        },
      },
    });
  },
  resetForNewMatch: () =>
    set({
      gameState: null,
      localPlayerId: null,
      isGameRunning: false,
      roomId: null,
      lobbyState: { map: 'base', timeLimit: 10 },
      lobbyPlayers: [],
      discoveredGames: [],
      ammoByWeapon: EMPTY_AMMO,
    }),

  setPlayerName: (name) => {
    set({ playerName: name });
    AsyncStorage.setItem('ahemia_player_name', name);
  },
  setPlayerSkin: (skin) => {
    set({ playerSkin: skin });
    AsyncStorage.setItem('ahemia_player_skin', skin);
  },
  setBgmVolume: (v) => {
    set({ bgmVolume: v });
    AsyncStorage.setItem('ahemia_settings_bgm', String(v));
  },
  setSfxVolume: (v) => {
    set({ sfxVolume: v });
    AsyncStorage.setItem('ahemia_settings_sfx', String(v));
  },
  setJoystickSize: (s) => {
    set({ joystickSize: s });
    AsyncStorage.setItem('ahemia_joystick_size', s);
  },
  setJoystickSensitivity: (v) => {
    set({ joystickSensitivity: v });
    AsyncStorage.setItem('ahemia_joystick_sensitivity', String(v));
  },
  setLocalAimAngle: (angle) => set({ localAimAngle: angle }),
  loadPersistedData: async () => {
    try {
      const keys = [
        'ahemia_player_name',
        'ahemia_player_skin',
        'ahemia_settings_bgm',
        'ahemia_settings_sfx',
        'ahemia_joystick_size',
        'ahemia_joystick_sensitivity'
      ];
      const values = await AsyncStorage.multiGet(keys);
      const updates: Partial<GameStore> = {};
      
      values.forEach(([key, value]) => {
        if (value === null) return;
        switch(key) {
          case 'ahemia_player_name':
            updates.playerName = value;
            break;
          case 'ahemia_player_skin':
            updates.playerSkin = value;
            break;
          case 'ahemia_settings_bgm':
            updates.bgmVolume = parseFloat(value);
            break;
          case 'ahemia_settings_sfx':
            updates.sfxVolume = parseFloat(value);
            break;
          case 'ahemia_joystick_size':
            updates.joystickSize = value as 'small' | 'medium' | 'large';
            break;
          case 'ahemia_joystick_sensitivity':
            updates.joystickSensitivity = parseFloat(value);
            break;
        }
      });
      set(updates);
    } catch (e) {
      console.error('Failed to load persisted data', e);
    }
  },
}));

export const defaultLobbyMap = MapType.TEST_ZONE;
