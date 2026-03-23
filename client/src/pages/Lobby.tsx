import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGameStore } from "@/lib/gameStore";
import { MultiplayerClient } from "@/lib/multiplayerClient";
import { GameMode, MapType, PlayerTeam, GameSettings } from "@shared/gameTypes";

export default function Lobby() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState("create"); // create or join
  const [playerName, setPlayerName] = useState("");
  const [selectedMap, setSelectedMap] = useState<MapType>(MapType.BASE);
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.DEATHMATCH);
  const [selectedTeam, setSelectedTeam] = useState<PlayerTeam>(PlayerTeam.NONE);
  const [gameList, setGameList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    setPlayerName: storeSetPlayerName,
    setSelectedMap: storeSetSelectedMap,
    setSelectedMode: storeSetSelectedMode,
    setSelectedTeam: storeSetSelectedTeam,
    setInLobby,
  } = useGameStore();

  const multiplayerRef = new MultiplayerClient(
    `ws://${window.location.hostname}:${window.location.port || 3000}/ws`,
    {
      onError: (error) => console.error(error),
    }
  );

  useEffect(() => {
    // Connect to multiplayer server
    multiplayerRef.connect().catch((error) => {
      console.error("Failed to connect:", error);
    });

    return () => {
      multiplayerRef.disconnect();
    };
  }, []);

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      storeSetPlayerName(playerName);
      storeSetSelectedMap(selectedMap);
      storeSetSelectedMode(selectedMode);

      const settings: GameSettings = {
        mode: selectedMode,
        map: selectedMap,
        maxPlayers: 6,
        timeLimit: 600,
        killLimit: 20,
        respawnTime: 3000,
        friendlyFire: false,
      };

      multiplayerRef.createGame(settings, playerName);
      setInLobby(true);
      setLocation("/game");
    } catch (error) {
      console.error("Failed to create game:", error);
      alert("Failed to create game");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (gameId: string) => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      storeSetPlayerName(playerName);
      storeSetSelectedTeam(selectedTeam);

      multiplayerRef.joinGame(gameId, playerName, selectedTeam);
      setInLobby(true);
      setLocation("/game");
    } catch (error) {
      console.error("Failed to join game:", error);
      alert("Failed to join game");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshGames = () => {
    multiplayerRef.listGames();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-center text-yellow-400">
          Mini Militia
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Game */}
          <Card className="bg-gray-800 border-gray-700 p-6">
            <h2 className="text-2xl font-bold mb-6 text-green-400">Create Game</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Player Name</label>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Game Mode</label>
                <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as GameMode)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GameMode.DEATHMATCH}>Deathmatch</SelectItem>
                    <SelectItem value={GameMode.TEAM_DEATHMATCH}>Team Deathmatch</SelectItem>
                    <SelectItem value={GameMode.CAPTURE_THE_FLAG}>Capture the Flag</SelectItem>
                    <SelectItem value={GameMode.SURVIVAL}>Survival</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Map</label>
                <Select value={selectedMap} onValueChange={(v) => setSelectedMap(v as MapType)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MapType.BASE}>Base</SelectItem>
                    <SelectItem value={MapType.LAVA}>Lava</SelectItem>
                    <SelectItem value={MapType.SPACE}>Space</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreateGame}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2"
              >
                {loading ? "Creating..." : "Create Game"}
              </Button>
            </div>
          </Card>

          {/* Join Game */}
          <Card className="bg-gray-800 border-gray-700 p-6">
            <h2 className="text-2xl font-bold mb-6 text-blue-400">Join Game</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Player Name</label>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Team</label>
                <Select value={selectedTeam} onValueChange={(v) => setSelectedTeam(v as PlayerTeam)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PlayerTeam.RED}>Red</SelectItem>
                    <SelectItem value={PlayerTeam.BLUE}>Blue</SelectItem>
                    <SelectItem value={PlayerTeam.NONE}>Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleRefreshGames}
                variant="outline"
                className="w-full"
              >
                Refresh Games
              </Button>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {gameList.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No games available</p>
                ) : (
                  gameList.map((game) => (
                    <div
                      key={game.gameId}
                      className="bg-gray-700 p-3 rounded flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold">{game.settings.mode}</p>
                        <p className="text-sm text-gray-400">
                          {game.playerCount}/{game.settings.maxPlayers} players
                        </p>
                      </div>
                      <Button
                        onClick={() => handleJoinGame(game.gameId)}
                        disabled={loading}
                        size="sm"
                      >
                        Join
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
