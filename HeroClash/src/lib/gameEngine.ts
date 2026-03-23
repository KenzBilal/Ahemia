import {
  Bullet,
  GameState,
  HERO_CONFIGS,
  HeroType,
  MAP_CONFIGS,
  MapType,
  PlayerState,
  PlayerTeam,
  WeaponType,
  WEAPON_CONFIGS,
} from '../shared/gameTypes';
import { KillType } from './killFeed';

const GRAVITY = 0.6;
const GROUND_Y = 750;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 40;
const MAX_VX = 12;
const JETPACK_FUEL_MAX = 100;
const JETPACK_FUEL_DRAIN = 0.8;
const JETPACK_FUEL_REGEN = 0.3;
const JETPACK_THRUST = 1.2;
const PARTICLE_CAP = 300;

type AbilityEffect = 'stunned' | 'rooted' | 'dashing';

interface RuntimeInput {
  vx: number;
  jetpack: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  radius: number;
}

export interface KillEvent {
  killerName: string;
  killerTeam: PlayerTeam;
  victimName: string;
  victimTeam: PlayerTeam;
  weapon?: WeaponType;
  killType: KillType;
}

export interface RenderData {
  map: {
    type: MapType;
    platforms: Array<{ x: number; y: number; width: number; height: number }>;
    groundY: number;
  };
  players: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    angle: number;
    health: number;
    maxHealth: number;
    team: PlayerTeam;
    hero: HeroType;
    isAlive: boolean;
    isInvincible: boolean;
    isDualWielding: boolean;
    isLocal: boolean;
  }>;
  bullets: Array<{
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    weapon: WeaponType;
  }>;
  particles: Array<{
    x: number;
    y: number;
    color: string;
    life: number;
    radius: number;
  }>;
  flags: Array<{
    team: PlayerTeam;
    x: number;
    y: number;
    carriedBy?: string;
  }>;
  jetpackFuel: number;
  abilityCooldownPct: number;
}

export class GameEngine {
  private gameState: GameState;
  private localPlayerId: string;
  private readonly lastShotTime: Record<string, number> = {};
  private readonly invincibilityEnd: Record<string, number> = {};
  private readonly runtimeInput: Record<string, RuntimeInput> = {};
  private readonly jetpackFuel: Record<string, number> = {};
  private particles: Particle[] = [];
  private particleHead = 0;
  private respawnQueue: Array<{ playerId: string; respawnAt: number }> = [];
  private killEvents: KillEvent[] = [];
  private cachedRenderData: RenderData;

  constructor(gameState: GameState, localPlayerId: string) {
    this.gameState = gameState;
    this.localPlayerId = localPlayerId;

    Object.values(this.gameState.players).forEach((player) => {
      this.ensurePlayerRuntime(player);
      this.invincibilityEnd[player.id] = Date.now() + 3000;
      player.isInvincible = true;
    });

    this.cachedRenderData = this.buildRenderData();
  }

  updateGameState(newState: GameState): void {
    this.gameState = newState;
    Object.values(this.gameState.players).forEach((player) => {
      this.ensurePlayerRuntime(player);
    });
    this.cachedRenderData = this.buildRenderData();
  }

  getState(): GameState {
    return this.gameState;
  }

  getLocalPlayer(): PlayerState | null {
    return this.gameState.players[this.localPlayerId] ?? null;
  }

  updatePlayerMovement(playerId: string, moveX: number, moveY: number, jetpackActive = false): void {
    const player = this.gameState.players[playerId];
    if (!player) {
      return;
    }

    this.ensurePlayerRuntime(player);
    this.runtimeInput[playerId] = {
      vx: moveX * 10,
      jetpack: jetpackActive || moveY < -0.45,
    };
  }

  updatePlayerAim(playerId: string, aimX: number, aimY: number): void {
    const player = this.gameState.players[playerId];
    if (!player) {
      return;
    }

    player.angle = Math.atan2(aimY - player.y, aimX - player.x);
  }

  shoot(playerId: string): Bullet[] | null {
    const player = this.gameState.players[playerId];
    if (!player?.isAlive) {
      return null;
    }

    this.ensurePlayerRuntime(player);
    const now = Date.now();
    const weaponCfg = WEAPON_CONFIGS[player.currentWeapon];

    if (now - (this.lastShotTime[playerId] ?? 0) < weaponCfg.fireRate) {
      return null;
    }

    const hasLimitedAmmo = this.gameState.settings.maxPlayers > 1;
    if (hasLimitedAmmo && player.ammo[player.currentWeapon] <= 0) {
      return null;
    }

    this.lastShotTime[playerId] = now;
    if (hasLimitedAmmo) {
      player.ammo[player.currentWeapon] -= 1;
    }

    const makeBullet = (angleOffset = 0): Bullet => {
      const spread = (Math.random() - 0.5) * weaponCfg.spread * (Math.PI / 180);
      const angle = player.angle + spread + angleOffset;
      const startX = player.x + Math.cos(player.angle) * 22;
      const startY = player.y + Math.sin(player.angle) * 22;

      return {
        id: `${playerId}-${now}-${angleOffset}`,
        x: startX,
        y: startY,
        startX,
        startY,
        vx: Math.cos(angle) * weaponCfg.bulletSpeed,
        vy: Math.sin(angle) * weaponCfg.bulletSpeed,
        damage: weaponCfg.damage,
        playerId,
        weapon: player.currentWeapon,
        createdAt: now,
      };
    };

    let created: Bullet[];
    if (player.currentWeapon === WeaponType.SHOTGUN) {
      created = Array.from({ length: 6 }, (_, idx) => makeBullet((idx - 2.5) * 0.1));
    } else if (player.isDualWielding && player.secondaryWeapon) {
      const primary = makeBullet(-0.05);
      const secondaryCfg = WEAPON_CONFIGS[player.secondaryWeapon];
      if (hasLimitedAmmo && player.ammo[player.secondaryWeapon] > 0) {
        player.ammo[player.secondaryWeapon] -= 1;
      }

      const secondary = {
        ...makeBullet(+0.05),
        damage: secondaryCfg.damage,
        weapon: player.secondaryWeapon,
      };

      if (hasLimitedAmmo && player.ammo[player.secondaryWeapon] <= 0) {
        player.isDualWielding = false;
        player.secondaryWeapon = undefined;
      }

      created = [primary, secondary];
    } else {
      created = [makeBullet()];
    }

    this.gameState.bullets.push(...created);
    return created;
  }

  useAbility(playerId: string): void {
    const player = this.gameState.players[playerId];
    if (!player?.isAlive) {
      return;
    }

    this.ensurePlayerRuntime(player);
    const cfg = HERO_CONFIGS[player.hero ?? player.heroId];
    const now = Date.now();
    if (now - (player.abilityLastUsed ?? 0) < cfg.abilityCooldown) {
      return;
    }

    player.abilityLastUsed = now;
    player.isAbilityActive = true;

    const archetype = this.getArchetype(player.hero ?? player.heroId);

    if (archetype === 'thor') {
      const radius = 150;
      Object.values(this.gameState.players).forEach((other) => {
        if (other.id === playerId || !other.isAlive) {
          return;
        }

        const dx = other.x - player.x;
        const dy = other.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) <= radius) {
          other.abilityEffect = 'stunned';
          other.abilityEffectUntil = now + 1500;
          other.health -= 15;
        }
      });

      for (let i = 0; i < 20; i += 1) {
        const angle = (i / 20) * Math.PI * 2;
        this.addParticle({
          x: player.x + Math.cos(angle) * Math.random() * radius,
          y: player.y + Math.sin(angle) * Math.random() * radius * 0.5,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          color: Math.random() > 0.5 ? '#FFD700' : '#4488FF',
          life: 1,
          radius: Math.random() * 3 + 1,
        });
      }
    }

    if (archetype === 'ironman') {
      for (let i = 0; i < 5; i += 1) {
        const spread = ((i - 2) / 2) * (30 * Math.PI / 180);
        const angle = player.angle + spread;
        this.gameState.bullets.push({
          id: `ability-${playerId}-${now}-${i}`,
          x: player.x + Math.cos(player.angle) * 22,
          y: player.y + Math.sin(player.angle) * 22,
          startX: player.x,
          startY: player.y,
          vx: Math.cos(angle) * 12,
          vy: Math.sin(angle) * 12,
          damage: 30,
          playerId,
          weapon: WeaponType.PISTOL,
          createdAt: now,
        });
      }

      for (let i = 0; i < 15; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        this.addParticle({
          x: player.x,
          y: player.y,
          vx: Math.cos(angle) * 5,
          vy: Math.sin(angle) * 5,
          color: Math.random() > 0.5 ? '#C0392B' : '#FFD700',
          life: 1,
          radius: 3,
        });
      }
    }

    if (archetype === 'captain') {
      player.vx = Math.cos(player.angle) * 22;
      player.vy = Math.sin(player.angle) * 20;
      player.isAbilityActive = true;
      player.abilityEffectUntil = now + 400;
      player.abilityEffect = 'dashing';

      for (let i = 0; i < 16; i += 1) {
        const angle = (i / 16) * Math.PI * 2;
        this.addParticle({
          x: player.x + Math.cos(angle) * 20,
          y: player.y + Math.sin(angle) * 20,
          vx: Math.cos(angle) * 4,
          vy: Math.sin(angle) * 4,
          color: Math.random() > 0.5 ? '#2980B9' : '#BDC3C7',
          life: 1,
          radius: 3,
        });
      }
    }

    if (archetype === 'spider') {
      this.gameState.bullets.push({
        id: `web-${playerId}-${now}`,
        x: player.x + Math.cos(player.angle) * 22,
        y: player.y + Math.sin(player.angle) * 22,
        startX: player.x,
        startY: player.y,
        vx: Math.cos(player.angle) * 14,
        vy: Math.sin(player.angle) * 14,
        damage: 0,
        playerId,
        weapon: WeaponType.WEB,
        createdAt: now,
        isWebShot: true,
      });

      for (let i = 0; i < 12; i += 1) {
        this.addParticle({
          x: player.x,
          y: player.y,
          vx: Math.cos(player.angle + (Math.random() - 0.5) * 0.5) * (5 + Math.random() * 4),
          vy: Math.sin(player.angle + (Math.random() - 0.5) * 0.5) * (5 + Math.random() * 4),
          color: '#FFFFFF',
          life: 1,
          radius: 1.5,
        });
      }
    }

    setTimeout(() => {
      const current = this.gameState.players[playerId];
      if (current) {
        current.isAbilityActive = false;
      }
    }, 300);
  }

  update(dt: number): void {
    const now = Date.now();
    const mapCfg = MAP_CONFIGS[this.gameState.settings.map];
    const groundY = mapCfg.groundY ?? GROUND_Y;

    Object.values(this.gameState.players).forEach((player) => {
      this.ensurePlayerRuntime(player);
      if (!player.isAlive) {
        return;
      }

      const effect = player.abilityEffect;
      if (effect === 'stunned' || effect === 'rooted') {
        if (now < (player.abilityEffectUntil ?? 0)) {
          player.vx = 0;
          if (effect === 'rooted') {
            player.vy = Math.max(0, player.vy);
          }
          return;
        }

        player.abilityEffect = undefined;
        player.abilityEffectUntil = undefined;
      }

      if (player.abilityEffect === 'dashing' && now < (player.abilityEffectUntil ?? 0)) {
        Object.values(this.gameState.players).forEach((other) => {
          if (other.id === player.id || !other.isAlive) {
            return;
          }

          const dx = other.x - player.x;
          const dy = other.y - player.y;
          if (Math.sqrt(dx * dx + dy * dy) < 40) {
            other.vx += dx > 0 ? 15 : -15;
            other.vy -= 8;
            other.health -= 20;
          }
        });
      } else if (player.abilityEffect === 'dashing') {
        player.abilityEffect = undefined;
      }

      const input = this.runtimeInput[player.id] ?? { vx: 0, jetpack: false };
      const heroCfg = HERO_CONFIGS[player.hero ?? player.heroId];
      const speedMult = heroCfg.moveSpeed;

      player.vx = input.vx * speedMult;
      player.vy += GRAVITY;

      if (input.jetpack && this.jetpackFuel[player.id] > 0) {
        const drain = this.getArchetype(player.hero ?? player.heroId) === 'ironman'
          ? JETPACK_FUEL_DRAIN * 0.5
          : JETPACK_FUEL_DRAIN;
        player.vy -= JETPACK_THRUST;
        this.jetpackFuel[player.id] = Math.max(0, this.jetpackFuel[player.id] - drain);
        this.spawnJetpackParticles(player);
      }

      player.vx = this.clamp(player.vx, -MAX_VX, MAX_VX);
      player.vy = this.clamp(player.vy, -20, 15);

      player.x += player.vx;
      player.y += player.vy;
      player.vx *= 0.85;
      player.isGrounded = false;

      if (player.y + PLAYER_HEIGHT / 2 >= groundY) {
        player.y = groundY - PLAYER_HEIGHT / 2;
        player.vy = 0;
        player.isGrounded = true;
        this.jetpackFuel[player.id] = Math.min(this.jetpackFuel[player.id] + JETPACK_FUEL_REGEN, JETPACK_FUEL_MAX);
      }

      for (const platform of mapCfg.platforms) {
        const playerBottom = player.y + PLAYER_HEIGHT / 2;
        const playerLeft = player.x - PLAYER_WIDTH / 2;
        const playerRight = player.x + PLAYER_WIDTH / 2;

        const onPlatformX = playerRight > platform.x && playerLeft < platform.x + platform.width;
        const fallingOnto = playerBottom >= platform.y && playerBottom <= platform.y + 12 && player.vy >= 0;

        if (onPlatformX && fallingOnto) {
          player.y = platform.y - PLAYER_HEIGHT / 2;
          player.vy = 0;
          player.isGrounded = true;
          this.jetpackFuel[player.id] = Math.min(this.jetpackFuel[player.id] + JETPACK_FUEL_REGEN, JETPACK_FUEL_MAX);
        }
      }

      player.x = this.clamp(player.x, PLAYER_WIDTH / 2, mapCfg.width - PLAYER_WIDTH / 2);
      player.y = this.clamp(player.y, PLAYER_HEIGHT / 2, mapCfg.height);

      const bounds = mapCfg.bounds;
      if (bounds) {
        if (player.x - PLAYER_WIDTH / 2 < bounds.left) {
          player.x = bounds.left + PLAYER_WIDTH / 2;
          player.vx = 0;
        }

        if (player.x + PLAYER_WIDTH / 2 > bounds.right) {
          player.x = bounds.right - PLAYER_WIDTH / 2;
          player.vx = 0;
        }
      }

      if (this.gameState.settings.map === MapType.LAVA && player.y + PLAYER_HEIGHT / 2 >= groundY) {
        player.isAlive = false;
        player.deaths += 1;
        for (let i = 0; i < 20; i += 1) {
          this.addParticle({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 6,
            vy: -Math.random() * 6,
            color: Math.random() > 0.5 ? '#FF4500' : '#FF8C00',
            life: 1,
            radius: Math.random() * 3 + 1,
          });
        }
        this.respawnQueue.push({
          playerId: player.id,
          respawnAt: now + this.gameState.settings.respawnTime,
        });
      }

      if (now > (this.invincibilityEnd[player.id] ?? 0)) {
        player.isInvincible = false;
      }
    });

    this.updateBullets(mapCfg);
    this.processRespawns();
    this.updateParticles();
    this.cachedRenderData = this.buildRenderData();

    if (dt > 0) {
      return;
    }
  }

  getRenderData(): RenderData {
    return this.cachedRenderData;
  }

  drainKillEvents(): KillEvent[] {
    const events = [...this.killEvents];
    this.killEvents.length = 0;
    return events;
  }

  getJetpackFuel(playerId: string): number {
    return this.jetpackFuel[playerId] ?? 0;
  }

  private updateBullets(mapCfg: (typeof MAP_CONFIGS)[MapType]): void {
    this.gameState.bullets = this.gameState.bullets.filter((bullet) => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (bullet.x < 0 || bullet.x > mapCfg.width || bullet.y < 0 || bullet.y > mapCfg.height) {
        return false;
      }

      const dx = bullet.x - bullet.startX;
      const dy = bullet.y - bullet.startY;
      if (Math.sqrt(dx * dx + dy * dy) > WEAPON_CONFIGS[bullet.weapon].range) {
        return false;
      }

      return true;
    });

    const bulletsToRemove = new Set<string>();

    for (const bullet of this.gameState.bullets) {
      for (const player of Object.values(this.gameState.players)) {
        this.ensurePlayerRuntime(player);

        if (player.id === bullet.playerId) {
          continue;
        }

        if (!player.isAlive || player.isInvincible) {
          continue;
        }

        const shooter = this.gameState.players[bullet.playerId];
        if (
          !this.gameState.settings.friendlyFire
          && shooter?.team !== PlayerTeam.NONE
          && shooter?.team === player.team
        ) {
          continue;
        }

        const closestX = this.clamp(bullet.x, player.x - PLAYER_WIDTH / 2, player.x + PLAYER_WIDTH / 2);
        const closestY = this.clamp(bullet.y, player.y - PLAYER_HEIGHT / 2, player.y + PLAYER_HEIGHT / 2);
        const dx = bullet.x - closestX;
        const dy = bullet.y - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= 6) {
          continue;
        }

        if (bullet.isWebShot || bullet.weapon === WeaponType.WEB) {
          player.abilityEffect = 'rooted';
          player.abilityEffectUntil = Date.now() + 2000;
          bulletsToRemove.add(bullet.id);
          continue;
        }

        const armorMult = 1 - HERO_CONFIGS[player.hero ?? player.heroId].armorRating;
        const finalDamage = bullet.damage * armorMult;
        player.health -= finalDamage;
        this.spawnHitParticles(bullet.x, bullet.y, false);

        if (player.health <= 0) {
          player.health = 0;
          player.isAlive = false;
          player.deaths += 1;

          const killer = this.gameState.players[bullet.playerId];
          if (killer) {
            killer.kills += 1;
          }

          this.killEvents.push({
            killerName: killer?.name ?? 'Environment',
            killerTeam: killer?.team ?? PlayerTeam.NONE,
            victimName: player.name,
            victimTeam: player.team,
            weapon: bullet.weapon,
            killType: KillType.NORMAL,
          });

          this.spawnDeathParticles(player.x, player.y);
          this.respawnQueue.push({
            playerId: player.id,
            respawnAt: Date.now() + this.gameState.settings.respawnTime,
          });
        }

        bulletsToRemove.add(bullet.id);
        break;
      }
    }

    this.gameState.bullets = this.gameState.bullets.filter((bullet) => !bulletsToRemove.has(bullet.id));
  }

  private processRespawns(): void {
    this.respawnQueue = this.respawnQueue.filter((entry) => {
      if (Date.now() < entry.respawnAt) {
        return true;
      }

      const player = this.gameState.players[entry.playerId];
      if (!player) {
        return false;
      }

      const spawnPts = MAP_CONFIGS[this.gameState.settings.map].spawnPoints;
      const pt = spawnPts[Math.floor(Math.random() * spawnPts.length)];

      player.x = pt.x;
      player.y = pt.y;
      player.vx = 0;
      player.vy = 0;
      player.health = player.maxHealth;
      player.isAlive = true;
      player.isInvincible = true;
      player.abilityEffect = undefined;
      player.abilityEffectUntil = undefined;
      this.invincibilityEnd[player.id] = Date.now() + 3000;
      this.jetpackFuel[player.id] = JETPACK_FUEL_MAX;

      return false;
    });
  }

  private updateParticles(): void {
    this.particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += GRAVITY * 0.4;
      particle.vx *= 0.98;
      particle.life -= 0.025;
    });

    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  private buildRenderData(): RenderData {
    const mapCfg = MAP_CONFIGS[this.gameState.settings.map];
    const groundY = mapCfg.groundY ?? GROUND_Y;
    const localPlayer = this.gameState.players[this.localPlayerId];

    const cooldownMs = localPlayer ? HERO_CONFIGS[localPlayer.hero ?? localPlayer.heroId].abilityCooldown : 1;
    const elapsed = localPlayer ? Date.now() - (localPlayer.abilityLastUsed ?? 0) : cooldownMs;
    const remaining = Math.max(0, cooldownMs - elapsed);

    return {
      map: {
        type: this.gameState.settings.map,
        platforms: mapCfg.platforms,
        groundY,
      },
      players: Object.values(this.gameState.players).map((player) => ({
        id: player.id,
        name: player.name,
        x: player.x,
        y: player.y,
        angle: player.angle,
        health: player.health,
        maxHealth: player.maxHealth,
        team: player.team,
        hero: player.hero ?? player.heroId,
        isAlive: player.isAlive,
        isInvincible: player.isInvincible,
        isDualWielding: Boolean(player.isDualWielding && player.secondaryWeapon),
        isLocal: player.id === this.localPlayerId,
      })),
      bullets: this.gameState.bullets.map((bullet) => ({
        id: bullet.id,
        x: bullet.x,
        y: bullet.y,
        vx: bullet.vx,
        vy: bullet.vy,
        weapon: bullet.weapon,
      })),
      particles: this.particles.map((particle) => ({
        x: particle.x,
        y: particle.y,
        color: particle.color,
        life: particle.life,
        radius: particle.radius,
      })),
      flags: (this.gameState.flags ?? []).map((flag) => ({
        team: flag.team,
        x: flag.x,
        y: flag.y,
        carriedBy: flag.carriedBy,
      })),
      jetpackFuel: localPlayer ? this.jetpackFuel[localPlayer.id] ?? JETPACK_FUEL_MAX : JETPACK_FUEL_MAX,
      abilityCooldownPct: cooldownMs <= 0 ? 0 : remaining / cooldownMs,
    };
  }

  private ensurePlayerRuntime(player: PlayerState): void {
    if (!player.hero) {
      player.hero = player.heroId;
    }

    if (this.runtimeInput[player.id] === undefined) {
      this.runtimeInput[player.id] = { vx: 0, jetpack: false };
    }

    if (this.jetpackFuel[player.id] === undefined) {
      this.jetpackFuel[player.id] = player.jetpackFuel ?? JETPACK_FUEL_MAX;
    }

    if (player.isGrounded === undefined) {
      player.isGrounded = false;
    }
  }

  private addParticle(particle: Particle): void {
    if (this.particles.length < PARTICLE_CAP) {
      this.particles.push(particle);
      return;
    }

    this.particles[this.particleHead] = particle;
    this.particleHead = (this.particleHead + 1) % PARTICLE_CAP;
  }

  private spawnJetpackParticles(player: PlayerState): void {
    for (let i = 0; i < 3; i += 1) {
      this.addParticle({
        x: player.x + (Math.random() - 0.5) * 8,
        y: player.y + PLAYER_HEIGHT / 2,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? '#FF6600' : '#FFFFFF',
        life: 1,
        radius: Math.random() * 3 + 1,
      });
    }
  }

  private spawnHitParticles(x: number, y: number, headshot: boolean): void {
    const count = headshot ? 12 : 6;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * (Math.random() * 3 + 1),
        vy: Math.sin(angle) * (Math.random() * 3 + 1),
        color: headshot ? '#FF0000' : '#FFD700',
        life: 1,
        radius: 2,
      });
    }
  }

  private spawnDeathParticles(x: number, y: number): void {
    const colors = ['#FF4500', '#FF8C00', '#FFD700', '#FF6347'];
    for (let i = 0; i < 28; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 3;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        radius: Math.random() * 4 + 2,
      });
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private getArchetype(hero: HeroType): 'thor' | 'ironman' | 'captain' | 'spider' {
    if (hero === HeroType.TITAN || hero === HeroType.RIFT) {
      return 'thor';
    }
    if (hero === HeroType.BLAZE || hero === HeroType.VOLT) {
      return 'ironman';
    }
    if (hero === HeroType.AEGIS || hero === HeroType.ORACLE) {
      return 'captain';
    }
    return 'spider';
  }
}
