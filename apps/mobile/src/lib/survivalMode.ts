import { nanoid } from 'nanoid/non-secure';
import {
  GameMode,
  GameState,
  HERO_CONFIGS,
  HeroType,
  MAP_CONFIGS,
  MapType,
  PlayerTeam,
  WeaponType,
} from '../shared/gameTypes';

export function createSurvivalGameState(
  localPlayerId: string,
  hero: HeroType,
  mapType: MapType = MapType.TEST_ZONE,
): GameState {
  const heroCfg = HERO_CONFIGS[hero];
  const mapCfg = MAP_CONFIGS[mapType];
  const spawnPt = mapCfg.spawnPoints[0];

  return {
    gameId: nanoid(),
    settings: {
      mode: GameMode.SURVIVAL,
      map: mapType,
      maxPlayers: 1,
      timeLimit: 0,
      killLimit: 0,
      respawnTime: 2000,
      friendlyFire: false,
    },
    players: {
      [localPlayerId]: {
        id: localPlayerId,
        name: 'You',
        team: PlayerTeam.NONE,
        hero,
        heroId: hero,
        x: spawnPt.x,
        y: spawnPt.y,
        vx: 0,
        vy: 0,
        angle: 0,
        health: heroCfg.maxHealth,
        maxHealth: heroCfg.maxHealth,
        armor: heroCfg.armor,
        speedMultiplier: heroCfg.speedMultiplier,
        ammo: {
          [WeaponType.PISTOL]: 999,
          [WeaponType.RIFLE]: 999,
          [WeaponType.SHOTGUN]: 999,
          [WeaponType.SNIPER]: 999,
          [WeaponType.WEB]: 999,
        },
        currentWeapon: heroCfg.primaryWeapon,
        kills: 0,
        deaths: 0,
        isAlive: true,
        isInvincible: false,
        abilityCooldownUntil: 0,
        jetpackFuel: 100,
        isGrounded: false,
        isThrusting: false,
        isMeleeing: false,
        isDualWielding: false,
        abilityLastUsed: 0,
        isAbilityActive: false,
      },
    },
    bullets: [],
    flags: [],
    startTime: Date.now(),
    isRunning: true,
  };
}
