import { WebSocketServer } from "ws";
import { MultiplayerServer } from "../multiplayer";
import type { Server as HTTPServer } from "http";

export function setupWebSocket(httpServer: HTTPServer) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Initialize multiplayer server
  const multiplayerServer = new MultiplayerServer(wss);

  console.log("WebSocket server initialized");

  return { wss, multiplayerServer };
}
