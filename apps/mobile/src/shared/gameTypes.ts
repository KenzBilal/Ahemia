// Game constants and types shared between native client and LAN host.

export enum GameMode {
  DEATHMATCH = 'deathmatch',
  TEAM_DEATHMATCH = 'team_deathmatch',
  CAPTURE_THE_FLAG = 'ctf',
  SURVIVAL = 'survival',
}

export enum MapType {
  TEST_ZONE = 'test_zone',
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

export interface SkinConfig {
  id: string;
  displayName: string;
  bodyColor: string;      // main body color for Skia rect rendering
  accentColor: string;    // accent color (gun arm, helmet stripe etc)
  isLocked: boolean;      // false = available now, true = coming soon
}

export const PLAYER_SKINS: SkinConfig[] = [
  { id: 'default', displayName: 'Soldier',  bodyColor: '#4A90D9', accentColor: '#2C5F8A', isLocked: false },
  { id: 'red',     displayName: 'Crimson',  bodyColor: '#D94A4A', accentColor: '#8A2C2C', isLocked: false },
  { id: 'green',   displayName: 'Ranger',   bodyColor: '#4AD94A', accentColor: '#2C8A2C', isLocked: false },
  { id: 'gold',    displayName: 'Elite',    bodyColor: '#D9A84A', accentColor: '#8A6A2C', isLocked: false },
  { id: 'ghost',   displayName: 'Ghost',    bodyColor: '#C0C0C0', accentColor: '#808080', isLocked: false },
  { id: 'dark',    displayName: 'Shadow',   bodyColor: '#2C2C3A', accentColor: '#4A4A6A', isLocked: false },
  { id: 'neon',    displayName: 'Neon',     bodyColor: '#4AFFD4', accentColor: '#00A884', isLocked: true  },
  { id: 'titan',   displayName: 'Titan',    bodyColor: '#8B4513', accentColor: '#5C2D0E', isLocked: true  },
];

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

export interface MapMeta {
  type: MapType;
  displayName: string;
  description: string;
  size: 'small' | 'medium' | 'large';
  recommendedPlayers: string;
  accentColor: string;
  backgroundColor: string;
  platformColor: string;
  groundColor: string;
  tags: string[];
  isLocked: boolean;
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
  isThrusting: boolean;
  isMeleeing: boolean;
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
  [MapType.TEST_ZONE]: {
    width: 4000,
    height: 2000,
    groundY: 1500,
    spawnPoints: [
      { x: 1800, y: 1400 },
      { x: 2000, y: 1400 },
      { x: 2200, y: 1400 },
    ],
    platforms: [],
  },
};

/**
 * MAP REGISTRY - Add new maps here only.
 * Steps to add a new map:
 * 1. Add MapType enum value above
 * 2. Add MAP_CONFIGS entry above
 * 3. Add MapMeta entry to this array below
 * 4. Add rendering case in GameScreen MapLayer
 * That's it - MapSelectScreen picks it up automatically.
 */
export const MAP_META_LIST: MapMeta[] = [
  {
    type: MapType.TEST_ZONE,
    displayName: 'PROVING GROUNDS',
    description: 'FLAT TOPOGRAPHY. ZERO OBSTACLES. PURE COMBAT TESTING.',
    size: 'large',
    recommendedPlayers: '2-6',
    accentColor: '#00E5FF',
    backgroundColor: '#09090B',
    platformColor: '#27272A',
    groundColor: '#18181B',
    tags: ['Flat', 'Test', 'Arena'],
    isLocked: false,
  },
];

export const DEFAULT_AMMO: Record<WeaponType, number> = {
  [WeaponType.PISTOL]: WEAPON_CONFIGS[WeaponType.PISTOL].ammoPerMag,
  [WeaponType.RIFLE]: WEAPON_CONFIGS[WeaponType.RIFLE].ammoPerMag,
  [WeaponType.SHOTGUN]: WEAPON_CONFIGS[WeaponType.SHOTGUN].ammoPerMag,
  [WeaponType.SNIPER]: WEAPON_CONFIGS[WeaponType.SNIPER].ammoPerMag,
  [WeaponType.WEB]: 1,
};
