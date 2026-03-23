import { create } from "zustand";
import { GameMode, GameSettings, GameState, MapType, PlayerState, PlayerTeam, WeaponType } from "@shared/gameTypes";

export interface GameStoreState {
  // Game state
  gameState: GameState | null;
  localPlayerId: string | null;
  isGameRunning: boolean;
  isInLobby: boolean;

  // Lobby state
  hostId: string | null;
  players: Record<string, PlayerState>;
  gameSettings: GameSettings | null;

  // UI state
  selectedTeam: PlayerTeam;
  playerName: string;
  selectedMap: MapType;
  selectedMode: GameMode;

  // Actions
  setGameState: (state: GameState) => void;
  setLocalPlayerId: (id: string) => void;
  setGameRunning: (running: boolean) => void;
  setInLobby: (inLobby: boolean) => void;
  setHostId: (id: string) => void;
  setPlayers: (players: Record<string, PlayerState>) => void;
  setGameSettings: (settings: GameSettings) => void;
  setSelectedTeam: (team: PlayerTeam) => void;
  setPlayerName: (name: string) => void;
  setSelectedMap: (map: MapType) => void;
  setSelectedMode: (mode: GameMode) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  gameState: null,
  localPlayerId: null,
  isGameRunning: false,
  isInLobby: false,
  hostId: null,
  players: {},
  gameSettings: null,
  selectedTeam: PlayerTeam.NONE,
  playerName: "",
  selectedMap: MapType.BASE,
  selectedMode: GameMode.DEATHMATCH,

  setGameState: (state) => set({ gameState: state }),
  setLocalPlayerId: (id) => set({ localPlayerId: id }),
  setGameRunning: (running) => set({ isGameRunning: running }),
  setInLobby: (inLobby) => set({ isInLobby: inLobby }),
  setHostId: (id) => set({ hostId: id }),
  setPlayers: (players) => set({ players }),
  setGameSettings: (settings) => set({ gameSettings: settings }),
  setSelectedTeam: (team) => set({ selectedTeam: team }),
  setPlayerName: (name) => set({ playerName: name }),
  setSelectedMap: (map) => set({ selectedMap: map }),
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  resetGame: () =>
    set({
      gameState: null,
      localPlayerId: null,
      isGameRunning: false,
      isInLobby: false,
      hostId: null,
      players: {},
      gameSettings: null,
      selectedTeam: PlayerTeam.NONE,
    }),
}));
