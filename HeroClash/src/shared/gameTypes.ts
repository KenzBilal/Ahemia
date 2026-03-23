// Game constants and types shared between native client and LAN host.

export enum GameMode {
  DEATHMATCH = 'deathmatch',
  TEAM_DEATHMATCH = 'team_deathmatch',
  CAPTURE_THE_FLAG = 'ctf',
  SURVIVAL = 'survival',
}

export enum MapType {
  BASE = 'base',
  LAVA = 'lava',
  SPACE = 'space',
  SURVIVAL_TEST = 'survival_test',
}

export enum WeaponType {
  PISTOL = 'pistol',
  RIFLE = 'rifle',
  SHOTGUN = 'shotgun',
  SNIPER = 'sniper',
  WEB = 'web',
}

export enum PlayerTeam {
  RED = 'red',
  BLUE = 'blue',
  NONE = 'none',
}

export enum HeroType {
  TITAN = 'titan',
  SHADOW = 'shadow',
  BLAZE = 'blaze',
  AEGIS = 'aegis',
  PHANTOM = 'phantom',
  VOLT = 'volt',
  RIFT = 'rift',
  ORACLE = 'oracle',
}

export interface WeaponConfig {
  type: WeaponType;
  damage: number;
  fireRate: number;
  ammoPerMag: number;
  reloadTime: number;
  bulletSpeed: number;
  spread: number;
  range: number;
}

export interface PlatformConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapConfig {
  width: number;
  height: number;
  groundY?: number;
  spawnPoints: Array<{ x: number; y: number }>;
  platforms: PlatformConfig[];
  bounds?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

export interface HeroConfig {
  id: HeroType;
  name: string;
  role: 'assault' | 'tank' | 'support' | 'mobility';
  maxHealth: number;
  speedMultiplier: number;
  armor: number;
  moveSpeed: number;
  armorRating: number;
  primaryWeapon: WeaponType;
  passive: string;
  abilityName: string;
  abilityCooldownMs: number;
  abilityCooldown: number;
  color: string;
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
  [WeaponType.WEB]: {
    type: WeaponType.WEB,
    damage: 0,
    fireRate: 900,
    ammoPerMag: 1,
    reloadTime: 1500,
    bulletSpeed: 420,
    spread: 0,
    range: 650,
  },
};

export const HERO_CONFIGS: Record<HeroType, HeroConfig> = {
  [HeroType.TITAN]: {
    id: HeroType.TITAN,
    name: 'Titan',
    role: 'tank',
    maxHealth: 150,
    speedMultiplier: 0.88,
    armor: 0.2,
    moveSpeed: 0.88,
    armorRating: 0.2,
    primaryWeapon: WeaponType.SHOTGUN,
    passive: 'Incoming damage reduced while grounded.',
    abilityName: 'Fortify',
    abilityCooldownMs: 14000,
    abilityCooldown: 14000,
    color: '#fca311',
  },
  [HeroType.SHADOW]: {
    id: HeroType.SHADOW,
    name: 'Shadow',
    role: 'mobility',
    maxHealth: 85,
    speedMultiplier: 1.18,
    armor: 0,
    moveSpeed: 1.18,
    armorRating: 0,
    primaryWeapon: WeaponType.PISTOL,
    passive: 'Faster strafe acceleration.',
    abilityName: 'Blink Dash',
    abilityCooldownMs: 9000,
    abilityCooldown: 9000,
    color: '#6f1d1b',
  },
  [HeroType.BLAZE]: {
    id: HeroType.BLAZE,
    name: 'Blaze',
    role: 'assault',
    maxHealth: 100,
    speedMultiplier: 1,
    armor: 0.06,
    moveSpeed: 1,
    armorRating: 0.06,
    primaryWeapon: WeaponType.RIFLE,
    passive: 'Deals bonus damage at close range.',
    abilityName: 'Overheat Burst',
    abilityCooldownMs: 12000,
    abilityCooldown: 12000,
    color: '#ff5400',
  },
  [HeroType.AEGIS]: {
    id: HeroType.AEGIS,
    name: 'Aegis',
    role: 'support',
    maxHealth: 115,
    speedMultiplier: 0.96,
    armor: 0.12,
    moveSpeed: 0.96,
    armorRating: 0.12,
    primaryWeapon: WeaponType.RIFLE,
    passive: 'Allied respawn timer reduced nearby.',
    abilityName: 'Barrier Pulse',
    abilityCooldownMs: 16000,
    abilityCooldown: 16000,
    color: '#2a9d8f',
  },
  [HeroType.PHANTOM]: {
    id: HeroType.PHANTOM,
    name: 'Phantom',
    role: 'assault',
    maxHealth: 95,
    speedMultiplier: 1.06,
    armor: 0.04,
    moveSpeed: 1.06,
    armorRating: 0.04,
    primaryWeapon: WeaponType.SNIPER,
    passive: 'Scoped shots recover faster.',
    abilityName: 'Ghost Mark',
    abilityCooldownMs: 15000,
    abilityCooldown: 15000,
    color: '#3a0ca3',
  },
  [HeroType.VOLT]: {
    id: HeroType.VOLT,
    name: 'Volt',
    role: 'mobility',
    maxHealth: 90,
    speedMultiplier: 1.14,
    armor: 0,
    moveSpeed: 1.14,
    armorRating: 0,
    primaryWeapon: WeaponType.PISTOL,
    passive: 'Jetpack fuel regen increased.',
    abilityName: 'Arc Surge',
    abilityCooldownMs: 10000,
    abilityCooldown: 10000,
    color: '#4cc9f0',
  },
  [HeroType.RIFT]: {
    id: HeroType.RIFT,
    name: 'Rift',
    role: 'support',
    maxHealth: 105,
    speedMultiplier: 0.98,
    armor: 0.1,
    moveSpeed: 0.98,
    armorRating: 0.1,
    primaryWeapon: WeaponType.SHOTGUN,
    passive: 'Enemy bullet spread increased on hit.',
    abilityName: 'Gravity Well',
    abilityCooldownMs: 14000,
    abilityCooldown: 14000,
    color: '#9d4edd',
  },
  [HeroType.ORACLE]: {
    id: HeroType.ORACLE,
    name: 'Oracle',
    role: 'support',
    maxHealth: 98,
    speedMultiplier: 1,
    armor: 0.08,
    moveSpeed: 1,
    armorRating: 0.08,
    primaryWeapon: WeaponType.RIFLE,
    passive: 'Highlights damaged enemies briefly.',
    abilityName: 'Recon Pulse',
    abilityCooldownMs: 11000,
    abilityCooldown: 11000,
    color: '#577590',
  },
};

export interface GameSettings {
  mode: GameMode;
  map: MapType;
  maxPlayers: number;
  timeLimit: number;
  killLimit: number;
  respawnTime: number;
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
  armor: number;
  speedMultiplier: number;
  heroId: HeroType;
  ammo: Record<WeaponType, number>;
  currentWeapon: WeaponType;
  kills: number;
  deaths: number;
  isAlive: boolean;
  isInvincible: boolean;
  abilityCooldownUntil: number;
  jetpackFuel: number;
  isGrounded?: boolean;
  hero?: HeroType;
  isDualWielding?: boolean;
  secondaryWeapon?: WeaponType;
  abilityLastUsed?: number;
  isAbilityActive?: boolean;
  abilityEffect?: 'stunned' | 'rooted' | 'dashing';
  abilityEffectUntil?: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  vx: number;
  vy: number;
  damage: number;
  playerId: string;
  weapon: WeaponType;
  createdAt: number;
  isWebShot?: boolean;
}

export interface FlagState {
  id: string;
  team: PlayerTeam;
  x: number;
  y: number;
  carriedBy?: string;
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

export interface InputPayload {
  joystickX: number;
  joystickY: number;
  aimAngle: number;
  firing: boolean;
  abilityActive: boolean;
  heroId: HeroType;
}

export interface StatePayload {
  players: Record<string, PlayerState>;
  bullets: Bullet[];
  flags?: FlagState[];
  timestamp: number;
}

export interface EventPayload {
  event: 'kill' | 'respawn' | 'ability' | 'join' | 'leave';
  data: Record<string, string | number | boolean | null>;
}

export type NetMessage =
  | { type: 'INPUT'; payload: InputPayload; playerId: string }
  | { type: 'STATE'; payload: StatePayload }
  | { type: 'EVENT'; payload: EventPayload }
  | { type: 'CREATE'; payload: { name: string; heroId: HeroType } }
  | { type: 'JOIN'; payload: { roomId: string; name: string; heroId: HeroType } }
  | { type: 'READY'; payload: { ready: boolean } }
  | { type: 'START'; payload: { roomId: string } };

export const MAP_CONFIGS: Record<MapType, MapConfig> = {
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
    platforms: [
      { x: 300, y: 600, width: 200, height: 30 },
      { x: 700, y: 500, width: 200, height: 30 },
      { x: 1100, y: 600, width: 200, height: 30 },
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
    platforms: [
      { x: 180, y: 470, width: 220, height: 24 },
      { x: 1180, y: 470, width: 220, height: 24 },
      { x: 650, y: 360, width: 300, height: 24 },
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
    platforms: [
      { x: 260, y: 560, width: 180, height: 20 },
      { x: 680, y: 470, width: 240, height: 20 },
      { x: 1160, y: 560, width: 180, height: 20 },
    ],
  },
  [MapType.SURVIVAL_TEST]: {
    width: 1600,
    height: 900,
    groundY: 750,
    spawnPoints: [{ x: 800, y: 680 }],
    platforms: [
      { x: 200, y: 580, width: 220, height: 20 },
      { x: 680, y: 480, width: 240, height: 20 },
      { x: 1180, y: 580, width: 220, height: 20 },
      { x: 400, y: 660, width: 160, height: 20 },
      { x: 1040, y: 660, width: 160, height: 20 },
    ],
    bounds: {
      left: 40,
      right: 1560,
      top: 20,
      bottom: 750,
    },
  },
};

export const DEFAULT_AMMO: Record<WeaponType, number> = {
  [WeaponType.PISTOL]: WEAPON_CONFIGS[WeaponType.PISTOL].ammoPerMag,
  [WeaponType.RIFLE]: WEAPON_CONFIGS[WeaponType.RIFLE].ammoPerMag,
  [WeaponType.SHOTGUN]: WEAPON_CONFIGS[WeaponType.SHOTGUN].ammoPerMag,
  [WeaponType.SNIPER]: WEAPON_CONFIGS[WeaponType.SNIPER].ammoPerMag,
  [WeaponType.WEB]: 1,
};
