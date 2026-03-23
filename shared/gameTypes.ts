// Game constants and types shared between client and server

export enum GameMode {
  DEATHMATCH = "deathmatch",
  TEAM_DEATHMATCH = "team_deathmatch",
  CAPTURE_THE_FLAG = "ctf",
  SURVIVAL = "survival",
}

export enum MapType {
  BASE = "base",
  LAVA = "lava",
  SPACE = "space",
}

export enum WeaponType {
  PISTOL = "pistol",
  RIFLE = "rifle",
  SHOTGUN = "shotgun",
  SNIPER = "sniper",
}

export enum PlayerTeam {
  RED = "red",
  BLUE = "blue",
  NONE = "none",
}

export interface WeaponConfig {
  type: WeaponType;
  damage: number;
  fireRate: number; // ms between shots
  ammoPerMag: number;
  reloadTime: number; // ms
  bulletSpeed: number;
  spread: number; // degrees
  range: number;
}

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  [WeaponType.PISTOL]: {
    type: WeaponType.PISTOL,
    damage: 10,
    fireRate: 100,
    ammoPerMag: 15,
    reloadTime: 1000,
    bulletSpeed: 400,
    spread: 5,
    range: 800,
  },
  [WeaponType.RIFLE]: {
    type: WeaponType.RIFLE,
    damage: 25,
    fireRate: 80,
    ammoPerMag: 30,
    reloadTime: 2000,
    bulletSpeed: 500,
    spread: 3,
    range: 1200,
  },
  [WeaponType.SHOTGUN]: {
    type: WeaponType.SHOTGUN,
    damage: 60,
    fireRate: 500,
    ammoPerMag: 8,
    reloadTime: 2500,
    bulletSpeed: 300,
    spread: 20,
    range: 300,
  },
  [WeaponType.SNIPER]: {
    type: WeaponType.SNIPER,
    damage: 100,
    fireRate: 1500,
    ammoPerMag: 5,
    reloadTime: 3000,
    bulletSpeed: 600,
    spread: 0.5,
    range: 2000,
  },
};

export interface GameSettings {
  mode: GameMode;
  map: MapType;
  maxPlayers: number;
  timeLimit: number; // seconds
  killLimit: number;
  respawnTime: number; // ms
  friendlyFire: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  team: PlayerTeam;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  maxHealth: number;
  ammo: Record<WeaponType, number>;
  currentWeapon: WeaponType;
  kills: number;
  deaths: number;
  isAlive: boolean;
  isInvincible: boolean;
}

export interface GameState {
  gameId: string;
  settings: GameSettings;
  players: Record<string, PlayerState>;
  bullets: Bullet[];
  flags?: FlagState[];
  startTime: number;
  isRunning: boolean;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  playerId: string;
  weapon: WeaponType;
  createdAt: number;
}

export interface FlagState {
  id: string;
  team: PlayerTeam;
  x: number;
  y: number;
  carriedBy?: string; // playerId
}

export interface NetworkMessage {
  type: string;
  payload: unknown;
}

export interface JoinGameMessage extends NetworkMessage {
  type: "join_game";
  payload: {
    playerName: string;
    team?: PlayerTeam;
  };
}

export interface GameUpdateMessage extends NetworkMessage {
  type: "game_update";
  payload: {
    players: Record<string, PlayerState>;
    bullets: Bullet[];
    flags?: FlagState[];
    timestamp: number;
  };
}

export interface PlayerActionMessage extends NetworkMessage {
  type: "player_action";
  payload: {
    playerId: string;
    action: "move" | "shoot" | "reload" | "switch_weapon";
    data: unknown;
  };
}

export const MAP_CONFIGS: Record<MapType, { width: number; height: number; spawnPoints: Array<{ x: number; y: number }> }> = {
  [MapType.BASE]: {
    width: 1600,
    height: 900,
    spawnPoints: [
      { x: 200, y: 450 },
      { x: 1400, y: 450 },
      { x: 800, y: 200 },
      { x: 800, y: 700 },
      { x: 400, y: 200 },
      { x: 1200, y: 700 },
    ],
  },
  [MapType.LAVA]: {
    width: 1600,
    height: 900,
    spawnPoints: [
      { x: 200, y: 200 },
      { x: 1400, y: 200 },
      { x: 200, y: 700 },
      { x: 1400, y: 700 },
      { x: 800, y: 100 },
      { x: 800, y: 800 },
    ],
  },
  [MapType.SPACE]: {
    width: 1600,
    height: 900,
    spawnPoints: [
      { x: 200, y: 450 },
      { x: 1400, y: 450 },
      { x: 800, y: 200 },
      { x: 800, y: 700 },
      { x: 400, y: 300 },
      { x: 1200, y: 600 },
    ],
  },
};
