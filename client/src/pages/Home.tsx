import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-7xl font-bold mb-4 text-yellow-400">Mini Militia</h1>
        <p className="text-2xl text-gray-300 mb-12">Local Multiplayer Shooting Game</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card className="bg-gray-800 border-gray-700 p-8 hover:border-green-500 transition">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Create Game</h2>
            <p className="text-gray-400 mb-6">Host a new game and invite friends to play</p>
            <Button
              onClick={() => setLocation("/lobby")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
            >
              Create Game
            </Button>
          </Card>

          <Card className="bg-gray-800 border-gray-700 p-8 hover:border-blue-500 transition">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Join Game</h2>
            <p className="text-gray-400 mb-6">Find and join an existing game on your network</p>
            <Button
              onClick={() => setLocation("/lobby")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
            >
              Join Game
            </Button>
          </Card>
        </div>

        <div className="mt-12 text-gray-400 text-sm">
          <p>Play with up to 6 players on the same Wi-Fi network</p>
          <p>Dual joystick controls optimized for mobile</p>
        </div>
      </div>
    </div>
  );
}
