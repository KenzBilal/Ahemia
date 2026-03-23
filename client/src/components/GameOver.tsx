import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface GameOverProps {
  winner?: string | null;
}

export default function GameOver({ winner }: GameOverProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">GAME OVER</h1>
        {winner && (
          <p className="text-3xl text-yellow-400 mb-8">
            {winner} Wins!
          </p>
        )}
        <div className="space-y-4">
          <Button
            onClick={() => setLocation("/")}
            className="px-8 py-3 text-lg"
          >
            Back to Lobby
          </Button>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="px-8 py-3 text-lg"
          >
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
