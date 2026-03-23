import { KillFeed, KillFeedEntry, KillType } from "@/lib/killFeed";
import { PlayerTeam } from "@shared/gameTypes";

interface KillFeedUIProps {
  killFeed: KillFeed;
}

export default function KillFeedUI({ killFeed }: KillFeedUIProps) {
  const entries = killFeed.getEntries();

  const getTeamColor = (team: PlayerTeam): string => {
    switch (team) {
      case PlayerTeam.RED:
        return "#FF4444";
      case PlayerTeam.BLUE:
        return "#4444FF";
      default:
        return "#CCCCCC";
    }
  };

  const getEntryText = (entry: KillFeedEntry): string => {
    switch (entry.killType) {
      case KillType.FLAG_CAPTURE:
        return `${entry.killerName} captured the flag!`;
      case KillType.FLAG_RETURN:
        return `${entry.killerName} returned the flag`;
      case KillType.FLAG_DROP:
        return `${entry.killerName} dropped the flag`;
      case KillType.FALL:
        return `${entry.victimName} fell to their death`;
      case KillType.LAVA:
        return `${entry.victimName} burned in lava`;
      default:
        return `${entry.killerName} ${killFeed.getKillIcon(entry.killType)} ${entry.victimName}`;
    }
  };

  return (
    <div className="absolute top-32 right-4 space-y-1 text-sm font-mono">
      {entries.map((entry) => {
        const opacity = killFeed.getOpacity(entry);
        const killerColor = getTeamColor(entry.killerTeam);
        const victimColor = getTeamColor(entry.victimTeam);

        return (
          <div
            key={entry.id}
            style={{
              opacity,
              transition: "opacity 0.3s ease-out",
              color: entry.isLocalPlayer ? "#FFFF00" : "#FFFFFF",
            }}
            className="bg-gray-900 bg-opacity-70 px-3 py-1 rounded whitespace-nowrap"
          >
            {entry.killType === KillType.FLAG_CAPTURE ||
            entry.killType === KillType.FLAG_RETURN ||
            entry.killType === KillType.FLAG_DROP ? (
              <span style={{ color: killerColor }}>
                {getEntryText(entry)} {killFeed.getKillIcon(entry.killType)}
              </span>
            ) : entry.killType === KillType.FALL || entry.killType === KillType.LAVA ? (
              <span style={{ color: victimColor }}>{getEntryText(entry)}</span>
            ) : (
              <span>
                <span style={{ color: killerColor }}>{entry.killerName}</span>
                <span className="text-gray-400"> {killFeed.getKillIcon(entry.killType)} </span>
                <span style={{ color: victimColor }}>{entry.victimName}</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
