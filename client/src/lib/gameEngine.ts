import { Bullet, GameState, MapType, PlayerState, PlayerTeam, WeaponType, MAP_CONFIGS, WEAPON_CONFIGS } from "@shared/gameTypes";

const GRAVITY = 0.6;
const GROUND_LEVEL = 750;
const MAX_VELOCITY = 15;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 40;
const JETPACK_FUEL_MAX = 100;
const JETPACK_FUEL_DRAIN = 0.5;
const JETPACK_FUEL_REGEN = 0.2;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private localPlayerId: string;
  private mapConfig: (typeof MAP_CONFIGS)[MapType];
  private jetpackFuel: Record<string, number> = {};
  private lastShotTime: Record<string, number> = {};
  private reloadingUntil: Record<string, number> = {};

  constructor(canvas: HTMLCanvasElement, gameState: GameState, localPlayerId: string) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.gameState = gameState;
    this.localPlayerId = localPlayerId;
    this.mapConfig = MAP_CONFIGS[gameState.settings.map];

    // Initialize jetpack fuel for all players
    Object.keys(gameState.players).forEach((id) => {
      this.jetpackFuel[id] = JETPACK_FUEL_MAX;
    });
  }

  updateGameState(newState: GameState) {
    this.gameState = newState;
  }

  updatePlayerMovement(playerId: string, moveX: number, moveY: number) {
    const player = this.gameState.players[playerId];
    if (!player) return;

    // Apply movement
    player.vx += moveX * 0.5;
    player.vy += moveY * 0.5;

    // Limit velocity
    const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
    if (speed > MAX_VELOCITY) {
      player.vx = (player.vx / speed) * MAX_VELOCITY;
      player.vy = (player.vy / speed) * MAX_VELOCITY;
    }
  }

  updatePlayerAim(playerId: string, aimX: number, aimY: number) {
    const player = this.gameState.players[playerId];
    if (!player) return;

    player.angle = Math.atan2(aimY - player.y, aimX - player.x);
  }

  shoot(playerId: string): Bullet | null {
    const player = this.gameState.players[playerId];
    if (!player || !player.isAlive) return null;

    const weaponConfig = WEAPON_CONFIGS[player.currentWeapon];
    const now = Date.now();

    // Check if can shoot
    if (now - (this.lastShotTime[playerId] || 0) < weaponConfig.fireRate) {
      return null;
    }

    // Check ammo
    if (player.ammo[player.currentWeapon] <= 0) {
      return null;
    }

    this.lastShotTime[playerId] = now;
    player.ammo[player.currentWeapon]--;

    // Create bullet
    const spread = (Math.random() - 0.5) * (weaponConfig.spread * (Math.PI / 180));
    const angle = player.angle + spread;
    const bulletVx = Math.cos(angle) * weaponConfig.bulletSpeed;
    const bulletVy = Math.sin(angle) * weaponConfig.bulletSpeed;

    const bullet: Bullet = {
      id: `${playerId}-${now}`,
      x: player.x + Math.cos(player.angle) * 20,
      y: player.y + Math.sin(player.angle) * 20,
      vx: bulletVx,
      vy: bulletVy,
      damage: weaponConfig.damage,
      playerId,
      weapon: player.currentWeapon,
      createdAt: now,
    };

    return bullet;
  }

  reload(playerId: string) {
    const player = this.gameState.players[playerId];
    if (!player) return;

    const weaponConfig = WEAPON_CONFIGS[player.currentWeapon];
    this.reloadingUntil[playerId] = Date.now() + weaponConfig.reloadTime;
    player.ammo[player.currentWeapon] = weaponConfig.ammoPerMag;
  }

  switchWeapon(playerId: string, weapon: WeaponType) {
    const player = this.gameState.players[playerId];
    if (!player) return;

    player.currentWeapon = weapon;
  }

  update(deltaTime: number) {
    // Update physics for all players
    Object.values(this.gameState.players).forEach((player) => {
      if (!player.isAlive) return;

      // Apply gravity
      player.vy += GRAVITY;

      // Limit fall speed
      if (player.vy > 15) {
        player.vy = 15;
      }

      // Update position
      player.x += player.vx;
      player.y += player.vy;

      // Ground collision
      if (player.y + PLAYER_HEIGHT / 2 >= GROUND_LEVEL) {
        player.y = GROUND_LEVEL - PLAYER_HEIGHT / 2;
        player.vy = 0;

        // Regenerate jetpack fuel when on ground
        if (this.jetpackFuel[player.id] < JETPACK_FUEL_MAX) {
          this.jetpackFuel[player.id] = Math.min(this.jetpackFuel[player.id] + JETPACK_FUEL_REGEN, JETPACK_FUEL_MAX);
        }
      }

      // Map boundaries
      if (player.x - PLAYER_WIDTH / 2 < 0) player.x = PLAYER_WIDTH / 2;
      if (player.x + PLAYER_WIDTH / 2 > this.mapConfig.width) player.x = this.mapConfig.width - PLAYER_WIDTH / 2;
      if (player.y - PLAYER_HEIGHT / 2 < 0) player.y = PLAYER_HEIGHT / 2;

      // Friction
      player.vx *= 0.95;

      // Update invincibility
      if (player.isInvincible) {
        // Invincibility timeout handled by game logic
      }
    });

    // Update bullets
    this.gameState.bullets = this.gameState.bullets.filter((bullet) => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      // Check if bullet is out of bounds
      if (bullet.x < 0 || bullet.x > this.mapConfig.width || bullet.y < 0 || bullet.y > this.mapConfig.height) {
        return false;
      }

      // Check if bullet has exceeded range
      const distance = Math.sqrt((bullet.x - bullet.x) ** 2 + (bullet.y - bullet.y) ** 2);
      if (distance > WEAPON_CONFIGS[bullet.weapon].range) {
        return false;
      }

      return true;
    });

    // Check bullet collisions
    this.gameState.bullets.forEach((bullet) => {
      Object.values(this.gameState.players).forEach((player) => {
        if (player.id === bullet.playerId || !player.isAlive || player.isInvincible) return;

        // Simple circle collision
        const dx = player.x - bullet.x;
        const dy = player.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < PLAYER_WIDTH / 2 + 5) {
          // Hit!
          player.health -= bullet.damage;

          if (player.health <= 0) {
            player.isAlive = false;
            const shooter = this.gameState.players[bullet.playerId];
            if (shooter) {
              shooter.kills++;
            }
            player.deaths++;
          }

          // Remove bullet
          const bulletIndex = this.gameState.bullets.indexOf(bullet);
          if (bulletIndex > -1) {
            this.gameState.bullets.splice(bulletIndex, 1);
          }
        }
      });
    });
  }

  render() {
    const width = this.mapConfig.width;
    const height = this.mapConfig.height;

    // Clear canvas
    this.ctx.fillStyle = this.getMapBackgroundColor();
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw map
    this.drawMap();

    // Draw players
    Object.values(this.gameState.players).forEach((player) => {
      this.drawPlayer(player);
    });

    // Draw bullets
    this.gameState.bullets.forEach((bullet) => {
      this.drawBullet(bullet);
    });

    // Draw flags if CTF mode
    if (this.gameState.settings.mode === "ctf" && this.gameState.flags) {
      this.gameState.flags.forEach((flag) => {
        this.drawFlag(flag);
      });
    }
  }

  private drawMap() {
    const mapType = this.gameState.settings.map;

    if (mapType === "lava") {
      // Draw lava floor
      this.ctx.fillStyle = "#FF6B00";
      this.ctx.fillRect(0, GROUND_LEVEL, this.mapConfig.width, 150);

      // Draw lava waves
      this.ctx.strokeStyle = "#FF8C00";
      this.ctx.lineWidth = 2;
      for (let x = 0; x < this.mapConfig.width; x += 40) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, GROUND_LEVEL);
        this.ctx.quadraticCurveTo(x + 20, GROUND_LEVEL - 10, x + 40, GROUND_LEVEL);
        this.ctx.stroke();
      }
    } else if (mapType === "space") {
      // Draw stars
      this.ctx.fillStyle = "#FFFFFF";
      for (let i = 0; i < 100; i++) {
        const x = (i * 73) % this.mapConfig.width;
        const y = (i * 137) % (GROUND_LEVEL - 100);
        this.ctx.fillRect(x, y, 2, 2);
      }

      // Draw ground
      this.ctx.fillStyle = "#1a1a2e";
      this.ctx.fillRect(0, GROUND_LEVEL, this.mapConfig.width, 150);
    } else {
      // Base map - grass
      this.ctx.fillStyle = "#2d5016";
      this.ctx.fillRect(0, GROUND_LEVEL, this.mapConfig.width, 150);

      // Draw some platforms
      this.ctx.fillStyle = "#3a6b1f";
      this.ctx.fillRect(300, 600, 200, 30);
      this.ctx.fillRect(1100, 600, 200, 30);
      this.ctx.fillRect(700, 500, 200, 30);
    }
  }

  private drawPlayer(player: PlayerState) {
    this.ctx.save();
    this.ctx.translate(player.x, player.y);

    // Draw body
    this.ctx.fillStyle = player.team === PlayerTeam.RED ? "#FF4444" : player.team === PlayerTeam.BLUE ? "#4444FF" : "#888888";
    this.ctx.fillRect(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT / 2, PLAYER_WIDTH, PLAYER_HEIGHT);

    // Draw invincibility effect
    if (player.isInvincible) {
      this.ctx.strokeStyle = "#FFFF00";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(-PLAYER_WIDTH / 2 - 2, -PLAYER_HEIGHT / 2 - 2, PLAYER_WIDTH + 4, PLAYER_HEIGHT + 4);
    }

    // Draw weapon direction
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(Math.cos(player.angle) * 20, Math.sin(player.angle) * 20);
    this.ctx.stroke();

    // Draw health bar
    this.ctx.fillStyle = "#FF0000";
    this.ctx.fillRect(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT / 2 - 10, PLAYER_WIDTH, 5);
    this.ctx.fillStyle = "#00FF00";
    this.ctx.fillRect(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT / 2 - 10, (PLAYER_WIDTH * player.health) / player.maxHealth, 5);

    this.ctx.restore();
  }

  private drawBullet(bullet: Bullet) {
    this.ctx.fillStyle = "#FFFF00";
    this.ctx.beginPath();
    this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawFlag(flag: any) {
    this.ctx.fillStyle = flag.team === PlayerTeam.RED ? "#FF0000" : "#0000FF";
    this.ctx.fillRect(flag.x - 10, flag.y - 20, 20, 20);
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fillRect(flag.x - 8, flag.y - 18, 16, 16);
  }

  private getMapBackgroundColor(): string {
    const mapType = this.gameState.settings.map;
    if (mapType === "lava") return "#4a0e0e";
    if (mapType === "space") return "#000000";
    return "#87CEEB";
  }

  getCanvasWidth(): number {
    return this.mapConfig.width;
  }

  getCanvasHeight(): number {
    return this.mapConfig.height;
  }
}
