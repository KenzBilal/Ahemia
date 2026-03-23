import { GameState, GameMode, MapType, PlayerState, PlayerTeam, WeaponType, GameSettings } from "@shared/gameTypes";

export interface MultiplayerCallbacks {
  onGameStateUpdate?: (state: GameState) => void;
  onPlayerJoined?: (player: PlayerState) => void;
  onPlayerLeft?: (playerId: string) => void;
  onGameStarted?: (state: GameState) => void;
  onGameEnded?: (results: any) => void;
  onError?: (error: string) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private url: string;
  private callbacks: MultiplayerCallbacks;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(url: string, callbacks: MultiplayerCallbacks = {}) {
    this.url = url;
    this.callbacks = callbacks;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("Connected to multiplayer server");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.callbacks.onError?.("Connection error");
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("Disconnected from multiplayer server");
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect in ${delay}ms...`);

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error("Reconnection failed:", error);
        });
      }, delay);
    } else {
      this.callbacks.onError?.("Failed to reconnect to server");
    }
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case "game_state_update":
          this.callbacks.onGameStateUpdate?.(message.payload);
          break;
        case "player_joined":
          this.callbacks.onPlayerJoined?.(message.payload);
          break;
        case "player_left":
          this.callbacks.onPlayerLeft?.(message.payload);
          break;
        case "game_started":
          this.callbacks.onGameStarted?.(message.payload);
          break;
        case "game_ended":
          this.callbacks.onGameEnded?.(message.payload);
          break;
        default:
          console.warn("Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
    }
  }

  send(type: string, payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected");
      return;
    }

    this.ws.send(
      JSON.stringify({
        type,
        payload,
      })
    );
  }

  createGame(settings: GameSettings, playerName: string): void {
    this.send("create_game", {
      settings,
      playerName,
    });
  }

  joinGame(gameId: string, playerName: string, team?: PlayerTeam): void {
    this.send("join_game", {
      gameId,
      playerName,
      team,
    });
  }

  listGames(): void {
    this.send("list_games", {});
  }

  updatePlayerState(playerId: string, state: Partial<PlayerState>): void {
    this.send("update_player_state", {
      playerId,
      state,
    });
  }

  playerAction(action: string, data: any): void {
    this.send("player_action", {
      action,
      data,
    });
  }

  startGame(): void {
    this.send("start_game", {});
  }

  leaveGame(): void {
    this.send("leave_game", {});
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
