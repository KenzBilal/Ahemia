import { GameState, PlayerState, PlayerTeam, MAP_CONFIGS } from "@shared/gameTypes";

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.scale = 1;
  }

  render(gameState: GameState, localPlayerId: string) {
    const mapConfig = MAP_CONFIGS[gameState.settings.map];
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    this.scale = Math.min(canvasWidth / mapConfig.width, canvasHeight / mapConfig.height);

    // Clear canvas
    this.ctx.fillStyle = "#1a1a1a";
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw map border
    this.ctx.strokeStyle = "#666666";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, mapConfig.width * this.scale, mapConfig.height * this.scale);

    // Draw players
    Object.values(gameState.players).forEach((player) => {
      if (!player.isAlive) return;

      const x = player.x * this.scale;
      const y = player.y * this.scale;

      if (player.id === localPlayerId) {
        // Local player - larger and highlighted
        this.ctx.fillStyle = "#00FF00";
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw direction
        this.ctx.strokeStyle = "#00FF00";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + Math.cos(player.angle) * 10, y + Math.sin(player.angle) * 10);
        this.ctx.stroke();
      } else {
        // Other players
        this.ctx.fillStyle =
          player.team === PlayerTeam.RED
            ? "#FF4444"
            : player.team === PlayerTeam.BLUE
            ? "#4444FF"
            : "#CCCCCC";
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Draw bullets
    this.ctx.fillStyle = "#FFFF00";
    gameState.bullets.forEach((bullet) => {
      const x = bullet.x * this.scale;
      const y = bullet.y * this.scale;
      this.ctx.fillRect(x - 1, y - 1, 2, 2);
    });

    // Draw spawn points
    this.ctx.fillStyle = "rgba(100, 100, 255, 0.3)";
    mapConfig.spawnPoints.forEach((point) => {
      const x = point.x * this.scale;
      const y = point.y * this.scale;
      this.ctx.fillRect(x - 5, y - 5, 10, 10);
    });
  }
}
