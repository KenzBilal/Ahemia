import { PlayerTeam, WeaponType } from "@shared/gameTypes";

export enum KillType {
  NORMAL = "normal",
  HEADSHOT = "headshot",
  EXPLOSION = "explosion",
  MELEE = "melee",
  FALL = "fall",
  LAVA = "lava",
  TEAM_KILL = "team_kill",
  FLAG_CAPTURE = "flag_capture",
  FLAG_RETURN = "flag_return",
  FLAG_DROP = "flag_drop",
}

export interface KillFeedEntry {
  id: string;
  timestamp: number;
  killType: KillType;
  killerName: string;
  killerTeam: PlayerTeam;
  victimName: string;
  victimTeam: PlayerTeam;
  weapon?: WeaponType;
  isLocalPlayer: boolean; // true if local player is killer or victim
  fadeOutTime: number; // timestamp when entry should fade out
}

export class KillFeed {
  private entries: KillFeedEntry[] = [];
  private maxEntries = 5;
  private entryLifetime = 5000; // 5 seconds
  private nextId = 0;

  addKill(
    killerName: string,
    killerTeam: PlayerTeam,
    victimName: string,
    victimTeam: PlayerTeam,
    killType: KillType,
    weapon?: WeaponType,
    isLocalPlayer: boolean = false
  ) {
    const entry: KillFeedEntry = {
      id: `kill-${this.nextId++}`,
      timestamp: Date.now(),
      killType,
      killerName,
      killerTeam,
      victimName,
      victimTeam,
      weapon,
      isLocalPlayer,
      fadeOutTime: Date.now() + this.entryLifetime,
    };

    this.entries.unshift(entry);

    // Remove oldest entries if we exceed max
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
  }

  addFlagEvent(
    playerName: string,
    playerTeam: PlayerTeam,
    eventType: "capture" | "return" | "drop",
    isLocalPlayer: boolean = false
  ) {
    const killTypeMap = {
      capture: KillType.FLAG_CAPTURE,
      return: KillType.FLAG_RETURN,
      drop: KillType.FLAG_DROP,
    };

    const entry: KillFeedEntry = {
      id: `flag-${this.nextId++}`,
      timestamp: Date.now(),
      killType: killTypeMap[eventType],
      killerName: playerName,
      killerTeam: playerTeam,
      victimName: "",
      victimTeam: PlayerTeam.NONE,
      isLocalPlayer,
      fadeOutTime: Date.now() + this.entryLifetime,
    };

    this.entries.unshift(entry);

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
  }

  update() {
    const now = Date.now();
    this.entries = this.entries.filter((entry) => entry.fadeOutTime > now);
  }

  getEntries(): KillFeedEntry[] {
    return this.entries;
  }

  getOpacity(entry: KillFeedEntry): number {
    const now = Date.now();
    const timeRemaining = entry.fadeOutTime - now;
    const fadeStartTime = 1000; // Start fading 1 second before removal

    if (timeRemaining < fadeStartTime) {
      return timeRemaining / fadeStartTime;
    }
    return 1;
  }

  getKillIcon(killType: KillType): string {
    const iconMap: Record<KillType, string> = {
      [KillType.NORMAL]: "🔫",
      [KillType.HEADSHOT]: "🎯",
      [KillType.EXPLOSION]: "💥",
      [KillType.MELEE]: "🥊",
      [KillType.FALL]: "⬇️",
      [KillType.LAVA]: "🔥",
      [KillType.TEAM_KILL]: "⚠️",
      [KillType.FLAG_CAPTURE]: "🚩",
      [KillType.FLAG_RETURN]: "🔄",
      [KillType.FLAG_DROP]: "❗",
    };
    return iconMap[killType] || "💀";
  }

  getWeaponIcon(weapon?: WeaponType): string {
    if (!weapon) return "";
    const iconMap: Record<WeaponType, string> = {
      [WeaponType.PISTOL]: "🔫",
      [WeaponType.RIFLE]: "🔫",
      [WeaponType.SHOTGUN]: "🔫",
      [WeaponType.SNIPER]: "🎯",
    };
    return iconMap[weapon] || "🔫";
  }

  clear() {
    this.entries = [];
  }
}
