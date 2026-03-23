import { create } from 'zustand';
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

interface GameStore {
  gameState: GameState | null;
  localPlayerId: string | null;
  selectedHero: HeroType | null;
  isGameRunning: boolean;
  isHost: boolean;
  roomId: string | null;
  lobbyPlayers: LobbyPlayer[];
  discoveredGames: Array<{ id: string; name: string; host: string; port: number }>;
  ammoByWeapon: Record<WeaponType, number>;
  setGameState: (state: GameState) => void;
  setLocalPlayerId: (id: string) => void;
  setSelectedHero: (hero: HeroType) => void;
  setGameRunning: (running: boolean) => void;
  setIsHost: (host: boolean) => void;
  setRoomId: (roomId: string | null) => void;
  setLobbyPlayers: (players: LobbyPlayer[]) => void;
  setDiscoveredGames: (games: Array<{ id: string; name: string; host: string; port: number }>) => void;
  setAmmoByWeapon: (ammo: Record<WeaponType, number>) => void;
  updatePlayer: (player: PlayerState) => void;
  resetForNewMatch: () => void;
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
  lobbyPlayers: [],
  discoveredGames: [],
  ammoByWeapon: EMPTY_AMMO,
  setGameState: (state) => set({ gameState: state }),
  setLocalPlayerId: (id) => set({ localPlayerId: id }),
  setSelectedHero: (hero) => set({ selectedHero: hero }),
  setGameRunning: (running) => set({ isGameRunning: running }),
  setIsHost: (host) => set({ isHost: host }),
  setRoomId: (roomId) => set({ roomId }),
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
      lobbyPlayers: [],
      discoveredGames: [],
      ammoByWeapon: EMPTY_AMMO,
    }),
}));

export const defaultLobbyMap = MapType.BASE;
