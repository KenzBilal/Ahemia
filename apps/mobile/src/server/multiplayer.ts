import { Buffer } from 'buffer';
import { nanoid } from 'nanoid/non-secure';
import UdpSocket from 'react-native-udp';
import Zeroconf from 'react-native-zeroconf';
import {
  DEFAULT_AMMO,
  GameMode,
  GameSettings,
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

const HOST_PORT = 41234;
const GRAVITY = 0.6;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 40;
const GROUND_Y = 750;
const JETPACK_THRUST = 1.2;

interface InputPacket {
  t: 'INPUT';
  pid: string;
  lx: number;
  ly: number;
  ax: number;
  ay: number;
  f: 0 | 1;
  j: 0 | 1;
  ab: 0 | 1;
  ts: number;
}

interface StatePacket {
  t: 'STATE';
  ts: number;
  players: Record<string, Partial<NetworkPlayerState>>;
  bullets: Array<{ id: string; x: number; y: number; vx: number; vy: number; w: WeaponType }>;
  flags?: Array<{ team: PlayerTeam; x: number; y: number; cb?: string }>;
}

interface EventPacket {
  t: 'EVENT';
  seq: number;
  evt: 'KILL' | 'RESPAWN' | 'ABILITY' | 'GAME_START' | 'GAME_END';
  data: Record<string, string | number | boolean | null>;
}

interface AckPacket {
  t: 'ACK';
  seq: number;
}

type Packet = InputPacket | StatePacket | EventPacket | AckPacket;

interface NetworkPlayerState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  maxHealth: number;
  team: PlayerTeam;
  weapon: WeaponType;
  isAlive: boolean;
}

interface ClientInfo {
  id: string;
  address: string;
  port: number;
  playerId: string;
}

interface PendingReliable {
  packet: EventPacket;
  retriesLeft: number;
  timer: ReturnType<typeof setTimeout> | null;
  pendingByClient: Set<string>;
}

interface Room {
  id: string;
  hostId: string;
  settings: GameSettings;
  players: Record<string, PlayerState>;
  clients: Map<string, ClientInfo>;
  bullets: GameState['bullets'];
  pendingInputs: Record<string, InputPacket>;
  lastBroadcastState: Record<string, NetworkPlayerState>;
  isRunning: boolean;
  startTime: number;
  reliableEvents: Map<number, PendingReliable>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class MultiplayerServer {
  private socket = UdpSocket.createSocket({ type: 'udp4', debug: false });
  private zeroconf = new Zeroconf();
  private rooms = new Map<string, Room>();
  private addressToClientId = new Map<string, string>();
  private physicsLoop: ReturnType<typeof setInterval> | null = null;
  private stateLoop: ReturnType<typeof setInterval> | null = null;
  private seq = 1;

  start(): void {
    this.socket.bind(HOST_PORT);

    this.socket.on('message', (raw: Uint8Array, remote) => {
      const text = Buffer.from(raw).toString();
      const packet = JSON.parse(text) as Packet;
      const key = `${remote.address}:${remote.port}`;

      if (packet.t === 'ACK') {
        this.handleAck(key, packet.seq);
        return;
      }

      if (packet.t === 'INPUT') {
        this.handleInputPacket(key, remote.address, remote.port, packet);
      }
    });

    this.physicsLoop = setInterval(() => {
      this.rooms.forEach((room) => {
        if (!room.isRunning) return;
        this.updateGameState(room);
      });
    }, 16);

    this.stateLoop = setInterval(() => {
      this.rooms.forEach((room) => {
        if (!room.isRunning) return;
        this.broadcastState(room);
      });
    }, 50);
  }

  createRoom(hostName: string, hero: HeroType): { roomId: string; playerId: string } {
    const roomId = nanoid(8);
    const playerId = nanoid(10);

    const settings: GameSettings = {
      mode: GameMode.DEATHMATCH,
      map: MapType.BASE,
      maxPlayers: 6,
      timeLimit: 600,
      killLimit: 20,
      respawnTime: 3000,
      friendlyFire: false,
    };

    const spawn = MAP_CONFIGS[settings.map].spawnPoints[0];
    const heroCfg = HERO_CONFIGS[hero];

    const hostPlayer: PlayerState = {
      id: playerId,
      name: hostName,
      team: PlayerTeam.RED,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      angle: 0,
      health: heroCfg.maxHealth,
      maxHealth: heroCfg.maxHealth,
      armor: heroCfg.armor,
      speedMultiplier: heroCfg.moveSpeed,
      heroId: hero,
      hero,
      ammo: { ...DEFAULT_AMMO },
      currentWeapon: heroCfg.primaryWeapon,
      kills: 0,
      deaths: 0,
      isAlive: true,
      isInvincible: false,
      abilityCooldownUntil: 0,
      jetpackFuel: 100,
      isGrounded: false,
    };

    this.rooms.set(roomId, {
      id: roomId,
      hostId: playerId,
      settings,
      players: { [playerId]: hostPlayer },
      clients: new Map(),
      bullets: [],
      pendingInputs: {},
      lastBroadcastState: {},
      isRunning: true,
      startTime: Date.now(),
      reliableEvents: new Map(),
    });

    this.zeroconf.publishService('ahemia', 'tcp', 'local.', roomId, HOST_PORT, {
      version: '1',
      roomId,
    });

    return { roomId, playerId };
  }

  joinRoom(roomId: string, playerName: string, hero: HeroType, address: string, port: number): string | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const playerId = nanoid(10);
    const spawn = MAP_CONFIGS[room.settings.map].spawnPoints[Object.keys(room.players).length % MAP_CONFIGS[room.settings.map].spawnPoints.length];
    const heroCfg = HERO_CONFIGS[hero];

    room.players[playerId] = {
      id: playerId,
      name: playerName,
      team: PlayerTeam.BLUE,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      angle: 0,
      health: heroCfg.maxHealth,
      maxHealth: heroCfg.maxHealth,
      armor: heroCfg.armor,
      speedMultiplier: heroCfg.moveSpeed,
      heroId: hero,
      hero,
      ammo: { ...DEFAULT_AMMO },
      currentWeapon: heroCfg.primaryWeapon,
      kills: 0,
      deaths: 0,
      isAlive: true,
      isInvincible: false,
      abilityCooldownUntil: 0,
      jetpackFuel: 100,
      isGrounded: false,
    };

    const clientId = `${address}:${port}`;
    room.clients.set(clientId, { id: clientId, address, port, playerId });
    this.addressToClientId.set(clientId, clientId);

    return playerId;
  }

  private handleInputPacket(key: string, address: string, port: number, packet: InputPacket): void {
    const room = this.findRoomByPlayer(packet.pid);
    if (!room) return;

    if (!room.clients.has(key) && room.players[packet.pid]) {
      room.clients.set(key, { id: key, address, port, playerId: packet.pid });
      this.addressToClientId.set(key, key);
    }

    room.pendingInputs[packet.pid] = packet;
  }

  private updateGameState(room: Room): void {
    const mapCfg = MAP_CONFIGS[room.settings.map];

    Object.values(room.players).forEach((player) => {
      if (!player.isAlive) return;

      const input = room.pendingInputs[player.id];
      if (input) {
        player.vx = input.lx * 10 * player.speedMultiplier;
        if (input.j === 1) {
          player.vy -= JETPACK_THRUST;
        }
        player.angle = Math.atan2(input.ay, input.ax);
      }

      player.vy += GRAVITY;
      player.vx = clamp(player.vx, -12, 12);
      player.vy = clamp(player.vy, -20, 15);

      player.x += player.vx;
      player.y += player.vy;
      player.vx *= 0.85;

      if (player.y + PLAYER_HEIGHT / 2 >= GROUND_Y) {
        player.y = GROUND_Y - PLAYER_HEIGHT / 2;
        player.vy = 0;
        player.isGrounded = true;
      }

      for (const platform of mapCfg.platforms) {
        const bottom = player.y + PLAYER_HEIGHT / 2;
        const left = player.x - PLAYER_WIDTH / 2;
        const right = player.x + PLAYER_WIDTH / 2;
        const onPlatformX = right > platform.x && left < platform.x + platform.width;
        const fallingOnto = bottom >= platform.y && bottom <= platform.y + 12 && player.vy >= 0;
        if (onPlatformX && fallingOnto) {
          player.y = platform.y - PLAYER_HEIGHT / 2;
          player.vy = 0;
          player.isGrounded = true;
        }
      }

      player.x = clamp(player.x, PLAYER_WIDTH / 2, mapCfg.width - PLAYER_WIDTH / 2);
      player.y = clamp(player.y, PLAYER_HEIGHT / 2, mapCfg.height);
    });

    room.bullets = room.bullets.filter((bullet) => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      if (bullet.x < 0 || bullet.x > mapCfg.width || bullet.y < 0 || bullet.y > mapCfg.height) return false;

      const dx = bullet.x - bullet.startX;
      const dy = bullet.y - bullet.startY;
      return Math.sqrt(dx * dx + dy * dy) <= WEAPON_CONFIGS[bullet.weapon].range;
    });

    this.resolveBulletHits(room);
  }

  private resolveBulletHits(room: Room): void {
    const remove = new Set<string>();

    room.bullets.forEach((bullet) => {
      Object.values(room.players).forEach((player) => {
        if (player.id === bullet.playerId || !player.isAlive) return;

        const closestX = clamp(bullet.x, player.x - 15, player.x + 15);
        const closestY = clamp(bullet.y, player.y - 20, player.y + 20);
        const dx = bullet.x - closestX;
        const dy = bullet.y - closestY;
        if (Math.sqrt(dx * dx + dy * dy) >= 6) return;

        const armorMult = 1 - HERO_CONFIGS[player.hero ?? player.heroId].armorRating;
        player.health -= bullet.damage * armorMult;

        if (player.health <= 0) {
          player.health = 0;
          player.isAlive = false;
          player.deaths += 1;

          const killer = room.players[bullet.playerId];
          if (killer) killer.kills += 1;

          this.sendReliableEvent(room, {
            t: 'EVENT',
            seq: this.seq++,
            evt: 'KILL',
            data: {
              killerName: killer?.name ?? 'Environment',
              victimName: player.name,
              weapon: bullet.weapon,
            },
          });
        }

        remove.add(bullet.id);
      });
    });

    room.bullets = room.bullets.filter((bullet) => !remove.has(bullet.id));
  }

  private broadcastState(room: Room): void {
    const changed: StatePacket['players'] = {};

    Object.values(room.players).forEach((player) => {
      const prev = room.lastBroadcastState[player.id];
      const next: NetworkPlayerState = {
        id: player.id,
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        angle: player.angle,
        health: player.health,
        maxHealth: player.maxHealth,
        team: player.team,
        weapon: player.currentWeapon,
        isAlive: player.isAlive,
      };

      if (!prev || this.hasPlayerDelta(prev, next)) {
        changed[player.id] = {
          x: next.x,
          y: next.y,
          vx: next.vx,
          vy: next.vy,
          angle: next.angle,
          health: next.health,
          team: next.team,
          isAlive: next.isAlive,
        };
      }

      room.lastBroadcastState[player.id] = next;
    });

    const packet: StatePacket = {
      t: 'STATE',
      ts: Date.now(),
      players: changed,
      bullets: room.bullets.map((bullet) => ({
        id: bullet.id,
        x: bullet.x,
        y: bullet.y,
        vx: bullet.vx,
        vy: bullet.vy,
        w: bullet.weapon,
      })),
      flags: [],
    };

    this.broadcast(room, packet);
  }

  private sendReliableEvent(room: Room, packet: EventPacket): void {
    const pendingByClient = new Set(Array.from(room.clients.keys()));

    const pending: PendingReliable = {
      packet,
      retriesLeft: 5,
      timer: null,
      pendingByClient,
    };

    const send = () => {
      this.broadcast(room, packet, pending.pendingByClient);
      pending.retriesLeft -= 1;

      if (pending.pendingByClient.size === 0 || pending.retriesLeft <= 0) {
        room.reliableEvents.delete(packet.seq);
        return;
      }

      pending.timer = setTimeout(send, 100);
    };

    room.reliableEvents.set(packet.seq, pending);
    send();
  }

  private handleAck(clientKey: string, seq: number): void {
    this.rooms.forEach((room) => {
      const pending = room.reliableEvents.get(seq);
      if (!pending) return;

      pending.pendingByClient.delete(clientKey);
      if (pending.pendingByClient.size === 0) {
        if (pending.timer) clearTimeout(pending.timer);
        room.reliableEvents.delete(seq);
      }
    });
  }

  private broadcast(room: Room, packet: Packet, onlyClients?: Set<string>): void {
    const buf = Buffer.from(JSON.stringify(packet));

    room.clients.forEach((client, key) => {
      if (onlyClients && !onlyClients.has(key)) return;
      this.socket.send(buf, 0, buf.length, client.port, client.address, () => {
        return;
      });
    });
  }

  private findRoomByPlayer(playerId: string): Room | null {
    for (const room of this.rooms.values()) {
      if (room.players[playerId]) return room;
    }
    return null;
  }

  private hasPlayerDelta(prev: NetworkPlayerState, next: NetworkPlayerState): boolean {
    return (
      Math.abs(prev.x - next.x) > 0.1
      || Math.abs(prev.y - next.y) > 0.1
      || Math.abs(prev.vx - next.vx) > 0.1
      || Math.abs(prev.vy - next.vy) > 0.1
      || Math.abs(prev.angle - next.angle) > 0.01
      || Math.abs(prev.health - next.health) > 0.1
      || prev.isAlive !== next.isAlive
    );
  }

  stop(): void {
    if (this.physicsLoop) clearInterval(this.physicsLoop);
    if (this.stateLoop) clearInterval(this.stateLoop);

    this.rooms.forEach((room) => {
      room.reliableEvents.forEach((pending) => {
        if (pending.timer) clearTimeout(pending.timer);
      });
    });

    this.rooms.clear();
    this.addressToClientId.clear();

    this.zeroconf.stop();
    this.socket.close();
  }
}

export const defaultSettings: GameSettings = {
  mode: GameMode.DEATHMATCH,
  map: MapType.BASE,
  maxPlayers: 6,
  timeLimit: 600,
  killLimit: 20,
  respawnTime: 3000,
  friendlyFire: false,
};
