import { describe, it, expect, beforeEach } from "vitest";
import { GameEngineV2 } from "./gameEngineV2";
import { GameState, GameMode, MapType, PlayerState, PlayerTeam, WeaponType, GameSettings } from "@shared/gameTypes";

describe("GameEngine", () => {
  let canvas: HTMLCanvasElement;
  let gameState: GameState;
  let engine: GameEngineV2;

  beforeEach(() => {
    // Create a mock canvas
    canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 900;

    // Create initial game state
    const settings: GameSettings = {
      mode: GameMode.DEATHMATCH,
      map: MapType.BASE,
      maxPlayers: 6,
      timeLimit: 600,
      killLimit: 20,
      respawnTime: 3000,
      friendlyFire: false,
    };

    const player1: PlayerState = {
      id: "player1",
      name: "Player 1",
      team: PlayerTeam.NONE,
      x: 200,
      y: 450,
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
      isInvincible: false,
    };

    gameState = {
      gameId: "test-game",
      settings,
      players: { player1: player1 },
      bullets: [],
      startTime: Date.now(),
      isRunning: true,
    };

    engine = new GameEngineV2(canvas, gameState, "player1");
  });

  it("should initialize with correct game state", () => {
    expect(gameState.players["player1"]).toBeDefined();
    expect(gameState.players["player1"].health).toBe(100);
  });

  it("should update player movement", () => {
    const player = gameState.players["player1"];
    const initialVx = player.vx;

    engine.updatePlayerMovement("player1", 5, 0);

    expect(player.vx).toBeGreaterThan(initialVx);
  });

  it("should update player aim angle", () => {
    const player = gameState.players["player1"];

    engine.updatePlayerAim("player1", 300, 300);

    expect(player.angle).toBeDefined();
    expect(typeof player.angle).toBe("number");
  });

  it("should create bullet when shooting", () => {
    const initialBulletCount = gameState.bullets.length;

    const bullet = engine.shoot("player1");

    expect(bullet).toBeDefined();
    expect(bullet?.playerId).toBe("player1");
    expect(bullet?.weapon).toBe(WeaponType.PISTOL);
  });

  it("should not shoot without ammo", () => {
    const player = gameState.players["player1"];
    player.ammo[WeaponType.PISTOL] = 0;

    const bullet = engine.shoot("player1");

    expect(bullet).toBeNull();
  });

  it("should reload weapon", () => {
    const player = gameState.players["player1"];
    player.ammo[WeaponType.PISTOL] = 0;

    engine.reload("player1");

    expect(player.ammo[WeaponType.PISTOL]).toBe(30);
  });

  it("should switch weapon", () => {
    const player = gameState.players["player1"];

    engine.switchWeapon("player1", WeaponType.RIFLE);

    expect(player.currentWeapon).toBe(WeaponType.RIFLE);
  });

  it("should apply gravity during update", () => {
    const player = gameState.players["player1"];
    const initialVy = player.vy;

    engine.update(1 / 60);

    expect(player.vy).toBeGreaterThan(initialVy);
  });

  it("should handle ground collision", () => {
    const player = gameState.players["player1"];
    player.y = 760; // Below ground level
    player.vy = 10;

    engine.update(1 / 60);

    expect(player.y).toBeLessThanOrEqual(755); // Ground level - player height/2
    expect(player.vy).toBe(0);
  });

  it("should handle map boundaries", () => {
    const player = gameState.players["player1"];
    player.x = -100; // Outside left boundary

    engine.update(1 / 60);

    expect(player.x).toBeGreaterThanOrEqual(15); // Player width/2
  });

  it("should track kills and deaths", () => {
    const player2: PlayerState = {
      id: "player2",
      name: "Player 2",
      team: PlayerTeam.NONE,
      x: 400,
      y: 450,
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
      isInvincible: false,
    };

    gameState.players["player2"] = player2;

    // Simulate a bullet hit
    gameState.bullets.push({
      id: "bullet1",
      x: 400,
      y: 450,
      vx: 0,
      vy: 0,
      damage: 50,
      playerId: "player1",
      weapon: WeaponType.PISTOL,
      createdAt: Date.now(),
    });

    engine.update(1 / 60);

    expect(gameState.players["player2"].health).toBeLessThan(100);
  });
});
