import { Buffer } from 'buffer';
import UdpSocket from 'react-native-udp';
import Zeroconf from 'react-native-zeroconf';
import { WeaponType, PlayerTeam } from '../shared/gameTypes';

export interface InputPacket {
  t: 'INPUT';
  pid: string;
  lx: number;
  ly: number;
  ax: number;
  ay: number;
  f: 0 | 1;
  j: 0 | 1;
  ab: 0 | 1;
  ts: number;
}

export interface EventPacket {
  t: 'EVENT';
  seq: number;
  evt: 'KILL' | 'RESPAWN' | 'ABILITY' | 'GAME_START' | 'GAME_END';
  data: Record<string, string | number | boolean | null>;
}

export interface AckPacket {
  t: 'ACK';
  seq: number;
}

export interface StatePacket {
  t: 'STATE';
  ts: number;
  players: Record<string, Partial<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    health: number;
    team: PlayerTeam;
    isAlive: boolean;
  }>>;
  bullets: Array<{ id: string; x: number; y: number; vx: number; vy: number; w: WeaponType }>;
  flags?: Array<{ team: PlayerTeam; x: number; y: number; cb?: string }>;
}

export type NetworkPacket = InputPacket | EventPacket | AckPacket | StatePacket;

export interface DiscoveredGame {
  id: string;
  name: string;
  host: string;
  port: number;
}

interface PendingAck {
  packet: EventPacket;
  retries: number;
  timer: ReturnType<typeof setTimeout> | null;
}

export class NetworkClient {
  private socket = UdpSocket.createSocket({ type: 'udp4', debug: false });
  private hostIp = '';
  private hostPort = 41234;
  private inputInterval: ReturnType<typeof setInterval> | null = null;
  private pendingAcks = new Map<number, PendingAck>();
  private messageHandler?: (msg: NetworkPacket) => void;
  private zeroconf = new Zeroconf();

  connect(hostIp: string, port = 41234): void {
    this.hostIp = hostIp;
    this.hostPort = port;

    this.socket.bind(0);
    this.socket.on('message', (data: Uint8Array) => {
      const msg = JSON.parse(Buffer.from(data).toString()) as NetworkPacket;

      if (msg.t === 'ACK') {
        this.handleAck(msg.seq);
        return;
      }

      if (msg.t === 'EVENT') {
        this.rawSend({ t: 'ACK', seq: msg.seq });
      }

      this.messageHandler?.(msg);
    });
  }

  startInputLoop(getInput: () => InputPacket): void {
    this.stopInputLoop();
    this.inputInterval = setInterval(() => {
      this.rawSend(getInput());
    }, 16);
  }

  stopInputLoop(): void {
    if (this.inputInterval) {
      clearInterval(this.inputInterval);
      this.inputInterval = null;
    }
  }

  sendReliable(packet: EventPacket): void {
    const send = () => {
      this.rawSend(packet);
      const entry = this.pendingAcks.get(packet.seq);
      if (!entry) return;

      entry.retries -= 1;
      if (entry.retries > 0) {
        entry.timer = setTimeout(send, 100);
      } else {
        this.pendingAcks.delete(packet.seq);
      }
    };

    this.pendingAcks.set(packet.seq, {
      packet,
      retries: 5,
      timer: null,
    });

    send();
  }

  onMessage(handler: (msg: NetworkPacket) => void): void {
    this.messageHandler = handler;
  }

  scanGames(onResolved: (game: DiscoveredGame) => void): void {
    this.zeroconf.on('resolved', (service) => {
      onResolved({
        id: service.name + '-' + service.host,
        name: service.name,
        host: service.host,
        port: service.port,
      });
    });

    this.zeroconf.scan('ahemia', 'tcp', 'local.');
  }

  stopScan(): void {
    this.zeroconf.stop();
    this.zeroconf.removeDeviceListeners();
  }

  disconnect(): void {
    this.stopInputLoop();
    this.pendingAcks.forEach((entry) => {
      if (entry.timer) {
        clearTimeout(entry.timer);
      }
    });
    this.pendingAcks.clear();
    this.socket.close();
  }

  private rawSend(obj: NetworkPacket | AckPacket): void {
    if (!this.hostIp) return;

    const payload = Buffer.from(JSON.stringify(obj));
    this.socket.send(payload, 0, payload.length, this.hostPort, this.hostIp, () => {
      return;
    });
  }

  private handleAck(seq: number): void {
    const entry = this.pendingAcks.get(seq);
    if (!entry) return;

    if (entry.timer) {
      clearTimeout(entry.timer);
    }

    this.pendingAcks.delete(seq);
  }
}

export const networkClient = new NetworkClient();

export function compressAxis(val: number, decimals = 1): number {
  const p = 10 ** decimals;
  return Math.round(val * p) / p;
}
