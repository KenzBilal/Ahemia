import { GameState, PlayerState, WeaponType } from "@shared/gameTypes";

interface GameHUDProps {
  player: PlayerState;
  gameState: GameState;
  onShoot: () => void;
  onReload: () => void;
  onSwitchWeapon: (weapon: WeaponType) => void;
}

export default function GameHUD({
  player,
  gameState,
  onShoot,
  onReload,
  onSwitchWeapon,
}: GameHUDProps) {
  const healthPercent = (player.health / player.maxHealth) * 100;
  const ammo = player.ammo[player.currentWeapon] || 0;

  // Calculate game time
  const elapsedSeconds = Math.floor(
    (Date.now() - gameState.startTime) / 1000
  );
  const timeRemaining = gameState.settings.timeLimit - elapsedSeconds;
  const timeDisplay = `${Math.floor(timeRemaining / 60)}:${String(
    timeRemaining % 60
  ).padStart(2, "0")}`;

  // Get player scores
  const scores = Object.values(gameState.players)
    .sort((a, b) => b.kills - a.kills)
    .slice(0, 5);

  return (
    <div className="absolute inset-0 pointer-events-none text-white font-bold">
      {/* Health Bar - Top Left */}
      <div className="absolute top-4 left-4 w-48">
        <div className="text-sm mb-1">Health: {player.health}/{player.maxHealth}</div>
        <div className="w-full h-6 bg-gray-800 border-2 border-gray-600 rounded">
          <div
            className={`h-full transition-all ${
              healthPercent > 50
                ? "bg-green-500"
                : healthPercent > 25
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>

      {/* Ammo Counter - Top Right */}
      <div className="absolute top-4 right-4 text-right">
        <div className="text-2xl font-mono">{ammo}</div>
        <div className="text-xs text-gray-400">Ammo</div>
      </div>

      {/* Current Weapon - Top Right Below Ammo */}
      <div className="absolute top-20 right-4 text-right">
        <div className="text-sm bg-gray-800 px-3 py-1 rounded">
          {player.currentWeapon.toUpperCase()}
        </div>
      </div>

      {/* Kill/Death Counter - Top Center */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-2xl font-mono">{player.kills}/{player.deaths}</div>
        <div className="text-xs text-gray-400">Kills/Deaths</div>
      </div>

      {/* Timer - Top Center Below K/D */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-xl font-mono bg-gray-800 px-4 py-1 rounded">
          {timeDisplay}
        </div>
      </div>

      {/* Leaderboard - Top Right */}
      <div className="absolute top-4 right-40 bg-gray-900 bg-opacity-80 p-3 rounded text-sm">
        <div className="font-bold mb-2 text-yellow-400">Leaderboard</div>
        {scores.map((p, idx) => (
          <div key={p.id} className={idx === 0 ? "text-yellow-400" : ""}>
            {idx + 1}. {p.name}: {p.kills}
          </div>
        ))}
      </div>

      {/* Minimap - Bottom Left */}
      <div className="absolute bottom-4 left-4">
        <canvas
          id="minimap"
          width={150}
          height={150}
          className="border-2 border-gray-600 bg-gray-900"
        />
      </div>

      {/* Weapon Selection - Bottom Center */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {[WeaponType.PISTOL, WeaponType.RIFLE, WeaponType.SHOTGUN, WeaponType.SNIPER].map(
          (weapon) => (
            <button
              key={weapon}
              onClick={() => onSwitchWeapon(weapon)}
              className={`px-3 py-2 rounded text-xs font-bold pointer-events-auto ${
                player.currentWeapon === weapon
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {weapon.toUpperCase().charAt(0)}
            </button>
          )
        )}
      </div>

      {/* Kill Feed - Top Right Corner */}
      <div className="absolute top-40 right-4 text-sm text-right max-w-xs">
        <div className="text-yellow-400 font-bold mb-2">Recent Kills</div>
        {/* Kill feed items would be rendered here */}
      </div>
    </div>
  );
}
