import { GameState, GameMode, PlayerState, PlayerTeam } from "../shared/gameTypes";

export interface GameModeHandler {
  checkGameEnd(gameState: GameState): boolean;
  getWinner(gameState: GameState): string | null;
  getScores(gameState: GameState): Array<{ playerId: string; score: number }>;
}

class DeathmatchMode implements GameModeHandler {
  checkGameEnd(gameState: GameState): boolean {
    const now = Date.now();
    const elapsedSeconds = (now - gameState.startTime) / 1000;

    // Check kill limit
    for (const player of Object.values(gameState.players)) {
      if (player.kills >= gameState.settings.killLimit) {
        return true;
      }
    }

    // Check time limit
    if (elapsedSeconds >= gameState.settings.timeLimit) {
      return true;
    }

    return false;
  }

  getWinner(gameState: GameState): string | null {
    const now = Date.now();
    const elapsedSeconds = (now - gameState.startTime) / 1000;

    // Check kill limit first
    let maxKills = 0;
    let winner: PlayerState | null = null;

    for (const player of Object.values(gameState.players)) {
      if (player.kills > maxKills) {
        maxKills = player.kills;
        winner = player;
      }
    }

    if (maxKills >= gameState.settings.killLimit && winner) {
      return winner.name;
    }

    // If time limit reached, highest kills wins
    if (elapsedSeconds >= gameState.settings.timeLimit && winner) {
      return winner.name;
    }

    return null;
  }

  getScores(gameState: GameState): Array<{ playerId: string; score: number }> {
    return Object.values(gameState.players)
      .map((p) => ({ playerId: p.id, score: p.kills }))
      .sort((a, b) => b.score - a.score);
  }
}

class TeamDeathmatchMode implements GameModeHandler {
  checkGameEnd(gameState: GameState): boolean {
    const now = Date.now();
    const elapsedSeconds = (now - gameState.startTime) / 1000;

    // Check time limit
    if (elapsedSeconds >= gameState.settings.timeLimit) {
      return true;
    }

    return false;
  }

  getWinner(gameState: GameState): string | null {
    const redKills = Object.values(gameState.players)
      .filter((p) => p.team === PlayerTeam.RED)
      .reduce((sum, p) => sum + p.kills, 0);

    const blueKills = Object.values(gameState.players)
      .filter((p) => p.team === PlayerTeam.BLUE)
      .reduce((sum, p) => sum + p.kills, 0);

    return redKills > blueKills ? "Red Team" : blueKills > redKills ? "Blue Team" : "Draw";
  }

  getScores(gameState: GameState): Array<{ playerId: string; score: number }> {
    const redKills = Object.values(gameState.players)
      .filter((p) => p.team === PlayerTeam.RED)
      .reduce((sum, p) => sum + p.kills, 0);

    const blueKills = Object.values(gameState.players)
      .filter((p) => p.team === PlayerTeam.BLUE)
      .reduce((sum, p) => sum + p.kills, 0);

    return [
      { playerId: "red", score: redKills },
      { playerId: "blue", score: blueKills },
    ];
  }
}

class CaptureTheFlagMode implements GameModeHandler {
  checkGameEnd(gameState: GameState): boolean {
    if (!gameState.flags) return false;

    const now = Date.now();
    const elapsedSeconds = (now - gameState.startTime) / 1000;

    // Check time limit
    if (elapsedSeconds >= gameState.settings.timeLimit) {
      return true;
    }

    // Check if either team has captured required flags
    // This would be tracked in a separate capture counter
    return false;
  }

  getWinner(gameState: GameState): string | null {
    // Would be determined by flag captures
    return null;
  }

  getScores(gameState: GameState): Array<{ playerId: string; score: number }> {
    return Object.values(gameState.players)
      .map((p) => ({ playerId: p.id, score: p.kills }))
      .sort((a, b) => b.score - a.score);
  }
}

class SurvivalMode implements GameModeHandler {
  checkGameEnd(gameState: GameState): boolean {
    const alivePlayers = Object.values(gameState.players).filter((p) => p.isAlive).length;
    return alivePlayers <= 1;
  }

  getWinner(gameState: GameState): string | null {
    const alivePlayers = Object.values(gameState.players).filter((p) => p.isAlive);
    if (alivePlayers.length === 1) {
      return alivePlayers[0].name;
    }
    return null;
  }

  getScores(gameState: GameState): Array<{ playerId: string; score: number }> {
    return Object.values(gameState.players)
      .map((p) => ({ playerId: p.id, score: p.kills }))
      .sort((a, b) => b.score - a.score);
  }
}

export function getGameModeHandler(mode: GameMode): GameModeHandler {
  switch (mode) {
    case GameMode.DEATHMATCH:
      return new DeathmatchMode();
    case GameMode.TEAM_DEATHMATCH:
      return new TeamDeathmatchMode();
    case GameMode.CAPTURE_THE_FLAG:
      return new CaptureTheFlagMode();
    case GameMode.SURVIVAL:
      return new SurvivalMode();
    default:
      return new DeathmatchMode();
  }
}
