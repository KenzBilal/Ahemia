import { useEffect, useRef, useState } from "react";
import { GameEngine } from "@/lib/gameEngine";
import { VirtualJoystick } from "@/lib/joystick";
import { MultiplayerClient } from "@/lib/multiplayerClient";
import { useGameStore } from "@/lib/gameStore";
import { GameState, PlayerState, WeaponType } from "@shared/gameTypes";
import GameHUD from "@/components/GameHUD";
import GameOver from "@/components/GameOver";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const multiplayerRef = useRef<MultiplayerClient | null>(null);
  const leftJoystickRef = useRef<VirtualJoystick | null>(null);
  const rightJoystickRef = useRef<VirtualJoystick | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const {
    gameState,
    localPlayerId,
    isGameRunning,
    setGameState,
    setGameRunning,
  } = useGameStore();

  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !gameState || !localPlayerId) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize game engine
    gameEngineRef.current = new GameEngine(canvas, gameState, localPlayerId);

    // Initialize joysticks
    const leftX = canvas.width * 0.15;
    const leftY = canvas.height * 0.85;
    const rightX = canvas.width * 0.85;
    const rightY = canvas.height * 0.85;

    leftJoystickRef.current = new VirtualJoystick(canvas, leftX, leftY, 50);
    rightJoystickRef.current = new VirtualJoystick(canvas, rightX, rightY, 50);

    // Game loop
    const gameLoop = () => {
      if (!gameEngineRef.current || !gameState) return;

      // Update from joysticks
      const leftState = leftJoystickRef.current?.getState();
      const rightState = rightJoystickRef.current?.getState();

      if (leftState && localPlayerId) {
        gameEngineRef.current.updatePlayerMovement(
          localPlayerId,
          leftState.x * 10,
          leftState.y * 10
        );
      }

      if (rightState && localPlayerId) {
        const player = gameState.players[localPlayerId];
        if (player) {
          const aimX = player.x + Math.cos(rightState.angle) * 100;
          const aimY = player.y + Math.sin(rightState.angle) * 100;
          gameEngineRef.current.updatePlayerAim(localPlayerId, aimX, aimY);
        }
      }

      // Update physics
      gameEngineRef.current.update(1 / 60);

      // Clear and render
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      gameEngineRef.current.render();

      // Render joysticks
      if (ctx) {
        leftJoystickRef.current?.render();
        rightJoystickRef.current?.render();
      }

      animationIdRef.current = requestAnimationFrame(gameLoop);
    };

    animationIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [gameState, localPlayerId]);

  const handleShoot = () => {
    if (!gameEngineRef.current || !localPlayerId) return;
    const bullet = gameEngineRef.current.shoot(localPlayerId);
    if (bullet && multiplayerRef.current) {
      multiplayerRef.current.playerAction("shoot", { bullet });
    }
  };

  const handleReload = () => {
    if (!gameEngineRef.current || !localPlayerId) return;
    gameEngineRef.current.reload(localPlayerId);
    if (multiplayerRef.current) {
      multiplayerRef.current.playerAction("reload", {});
    }
  };

  const handleSwitchWeapon = (weapon: WeaponType) => {
    if (!gameEngineRef.current || !localPlayerId) return;
    gameEngineRef.current.switchWeapon(localPlayerId, weapon);
    if (multiplayerRef.current) {
      multiplayerRef.current.playerAction("switch_weapon", { weapon });
    }
  };

  if (gameOver) {
    return <GameOver winner={winner} />;
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: "none" }}
      />

      {gameState && localPlayerId && (
        <>
          <GameHUD
            player={gameState.players[localPlayerId]}
            gameState={gameState}
            onShoot={handleShoot}
            onReload={handleReload}
            onSwitchWeapon={handleSwitchWeapon}
          />

          {/* Shoot button for mobile */}
          <button
            onClick={handleShoot}
            className="absolute bottom-20 right-20 w-16 h-16 bg-red-600 rounded-full text-white font-bold text-xl shadow-lg active:bg-red-700"
            style={{ touchAction: "manipulation" }}
          >
            FIRE
          </button>

          {/* Reload button */}
          <button
            onClick={handleReload}
            className="absolute bottom-20 right-40 w-16 h-16 bg-yellow-600 rounded-full text-white font-bold text-sm shadow-lg active:bg-yellow-700"
            style={{ touchAction: "manipulation" }}
          >
            RELOAD
          </button>
        </>
      )}
    </div>
  );
}
