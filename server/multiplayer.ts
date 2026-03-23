import { WebSocketServer, WebSocket } from "ws";
import { nanoid } from "nanoid";
import {
  GameState,
  GameMode,
  MapType,
  PlayerState,
  PlayerTeam,
  WeaponType,
  GameSettings,
  MAP_CONFIGS,
  WEAPON_CONFIGS,
} from "../shared/gameTypes";

interface GameRoom {
  id: string;
  hostId: string;
  settings: GameSettings;
  players: Map<string, PlayerState>;
  isRunning: boolean;
  startTime: number;
  ws: Map<string, WebSocket>;
}

export class MultiplayerServer {
  private wss: WebSocketServer;
  private rooms: Map<string, GameRoom> = new Map();
  private playerToRoom: Map<string, string> = new Map();
  private gameUpdateInterval: NodeJS.Timeout | null = null;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.setupWebSocketServer();
    this.startGameLoop();
  }

  private setupWebSocketServer() {
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("New WebSocket connection");

      ws.on("message", (data: string) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      });

      ws.on("close", () => {
        this.handleDisconnect(ws);
      });

      ws.on("error", (error: Error) => {
        console.error("WebSocket error:", error);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: any) {
    const { type, payload } = message;

    switch (type) {
      case "create_game":
        this.createGame(ws, payload);
        break;
      case "join_game":
        this.joinGame(ws, payload);
        break;
      case "list_games":
        this.listGames(ws);
        break;
      case "start_game":
        this.startGame(ws);
        break;
      case "player_action":
        this.handlePlayerAction(ws, payload);
        break;
      case "leave_game":
        this.leaveGame(ws);
        break;
      default:
        console.warn("Unknown message type:", type);
    }
  }

  private createGame(ws: WebSocket, payload: any) {
    const gameId = nanoid();
    const playerId = nanoid();

    const settings: GameSettings = {
      mode: payload.settings.mode || GameMode.DEATHMATCH,
      map: payload.settings.map || MapType.BASE,
      maxPlayers: payload.settings.maxPlayers || 6,
      timeLimit: payload.settings.timeLimit || 600,
      killLimit: payload.settings.killLimit || 20,
      respawnTime: payload.settings.respawnTime || 3000,
      friendlyFire: payload.settings.friendlyFire || false,
    };

    const mapConfig = MAP_CONFIGS[settings.map];
    const spawnPoint = mapConfig.spawnPoints[0];

    const player: PlayerState = {
      id: playerId,
      name: payload.playerName,
      team: PlayerTeam.NONE,
      x: spawnPoint.x,
      y: spawnPoint.y,
      vx: 0,
      vy: 0,
      angle: 0,
      health: 100,
      maxHealth: 100,
      ammo: {
        [WeaponType.PISTOL]: 30,
        [WeaponType.RIFLE]: 60,
        [WeaponType.SHOTGUN]: 16,
        [WeaponType.SNIPER]: 10,
      },
      currentWeapon: WeaponType.PISTOL,
      kills: 0,
      deaths: 0,
      isAlive: true,
      isInvincible: true,
    };

    const gameState: GameState = {
      gameId,
      settings,
      players: { [playerId]: player },
      bullets: [],
      startTime: Date.now(),
      isRunning: false,
      flags: [],
    };

    const room: GameRoom = {
      id: gameId,
      hostId: playerId,
      settings,
      players: new Map([[playerId, player]]),
      isRunning: false,
      startTime: Date.now(),
      ws: new Map([[playerId, ws]]),
    };

    this.rooms.set(gameId, room);
    this.playerToRoom.set(playerId, gameId);

    ws.send(
      JSON.stringify({
        type: "game_created",
        payload: {
          gameId,
          playerId,
          gameState,
        },
      })
    );

    console.log(`Game created: ${gameId} by player ${playerId}`);
  }

  private joinGame(ws: WebSocket, payload: any) {
    const { gameId, playerName, team } = payload;
    const room = this.rooms.get(gameId);

    if (!room) {
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Game not found" },
        })
      );
      return;
    }

    if (room.players.size >= room.settings.maxPlayers) {
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Game is full" },
        })
      );
      return;
    }

    const playerId = nanoid();
    const mapConfig = MAP_CONFIGS[room.settings.map];
    const spawnPoint = mapConfig.spawnPoints[room.players.size % mapConfig.spawnPoints.length];

    const player: PlayerState = {
      id: playerId,
      name: playerName,
      team: team || PlayerTeam.NONE,
      x: spawnPoint.x,
      y: spawnPoint.y,
      vx: 0,
      vy: 0,
      angle: 0,
      health: 100,
      maxHealth: 100,
      ammo: {
        [WeaponType.PISTOL]: 30,
        [WeaponType.RIFLE]: 60,
        [WeaponType.SHOTGUN]: 16,
        [WeaponType.SNIPER]: 10,
      },
      currentWeapon: WeaponType.PISTOL,
      kills: 0,
      deaths: 0,
      isAlive: true,
      isInvincible: true,
    };

    room.players.set(playerId, player);
    room.ws.set(playerId, ws);
    this.playerToRoom.set(playerId, gameId);

    // Send game state to new player
    ws.send(
      JSON.stringify({
        type: "game_joined",
        payload: {
          gameId,
          playerId,
          gameState: this.getGameState(room),
        },
      })
    );

    // Notify other players
    this.broadcastToRoom(gameId, {
      type: "player_joined",
      payload: player,
    });

    console.log(`Player ${playerId} joined game ${gameId}`);
  }

  private listGames(ws: WebSocket) {
    const games = Array.from(this.rooms.values()).map((room) => ({
      gameId: room.id,
      hostId: room.hostId,
      settings: room.settings,
      playerCount: room.players.size,
      isRunning: room.isRunning,
    }));

    ws.send(
      JSON.stringify({
        type: "games_list",
        payload: { games },
      })
    );
  }

  private startGame(ws: WebSocket) {
    // Find room by WebSocket
    let room: GameRoom | null = null;
    for (const r of Array.from(this.rooms.values())) {
      if (r.ws.has(r.hostId) && r.ws.get(r.hostId) === ws) {
        room = r;
        break;
      }
    }

    if (!room) {
      ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Not in a game" },
        })
      );
      return;
    }

    room.isRunning = true;
    room.startTime = Date.now();

    this.broadcastToRoom(room.id, {
      type: "game_started",
      payload: this.getGameState(room),
    });

    console.log(`Game ${room.id} started`);
  }

  private handlePlayerAction(ws: WebSocket, payload: any) {
    const { action, data } = payload;

    // Find player by WebSocket
    let playerId: string | null = null;
    let room: GameRoom | null = null;

    for (const pid of Array.from(this.playerToRoom.keys())) {
      const roomId = this.playerToRoom.get(pid);
      if (roomId) {
        const r = this.rooms.get(roomId);
        if (r && r.ws.get(pid) === ws) {
          playerId = pid;
          room = r;
          break;
        }
      }
    }

    if (!playerId || !room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    switch (action) {
      case "move":
        player.vx = data.vx || 0;
        player.vy = data.vy || 0;
        break;
      case "aim":
        player.angle = data.angle || 0;
        break;
      case "shoot":
        // Handled by game loop
        break;
      case "switch_weapon":
        player.currentWeapon = data.weapon;
        break;
    }
  }

  private leaveGame(ws: WebSocket) {
    // Find and remove player
    let playerId: string | null = null;
    let roomId: string | null = null;

    for (const pid of Array.from(this.playerToRoom.keys())) {
      const rid = this.playerToRoom.get(pid);
      if (rid) {
        const room = this.rooms.get(rid);
        if (room && room.ws.get(pid) === ws) {
          playerId = pid;
          roomId = rid;
          break;
        }
      }
    }

    if (!playerId || !roomId) return;

    const room = this.rooms.get(roomId);
    if (room) {
      room.players.delete(playerId);
      room.ws.delete(playerId);

      this.broadcastToRoom(roomId, {
        type: "player_left",
        payload: { playerId },
      });

      if (room.players.size === 0) {
        this.rooms.delete(roomId);
        console.log(`Game ${roomId} ended (no players)`);
      }
    }

    this.playerToRoom.delete(playerId);
  }

  private handleDisconnect(ws: WebSocket) {
    // Find and remove player
    let playerId: string | null = null;
    let roomId: string | null = null;

    for (const pid of Array.from(this.playerToRoom.keys())) {
      const rid = this.playerToRoom.get(pid);
      if (rid) {
        const room = this.rooms.get(rid);
        if (room && room.ws.get(pid) === ws) {
          playerId = pid;
          roomId = rid;
          break;
        }
      }
    }

    if (playerId && roomId) {
      this.leaveGame(ws);
    }
  }

  private startGameLoop() {
    this.gameUpdateInterval = setInterval(() => {
      for (const room of Array.from(this.rooms.values())) {
        if (room.isRunning) {
          this.updateGameState(room);
          this.broadcastGameState(room);
        }
      }
    }, 1000 / 60); // 60 FPS
  }

  private updateGameState(room: GameRoom) {
    // Update player positions and check collisions
    // This is simplified - full implementation would include physics
  }

  private broadcastGameState(room: GameRoom) {
    const gameState = this.getGameState(room);

    this.broadcastToRoom(room.id, {
      type: "game_state_update",
      payload: gameState,
    });
  }

  private broadcastToRoom(roomId: string, message: any) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const data = JSON.stringify(message);
    const wsArray = Array.from(room.ws.values());
    for (const ws of wsArray) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }

  private getGameState(room: GameRoom): GameState {
    return {
      gameId: room.id,
      settings: room.settings,
      players: Object.fromEntries(room.players),
      bullets: [],
      startTime: room.startTime,
      isRunning: room.isRunning,
    };
  }

  stop() {
    if (this.gameUpdateInterval) {
      clearInterval(this.gameUpdateInterval);
    }
    this.wss.close();
  }
}
