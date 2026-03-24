import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KillFeedEntry } from '../lib/killFeed';
import { PlayerTeam } from '../shared/gameTypes';

interface KillFeedOverlayProps {
  entries: KillFeedEntry[];
}

const COLORS = {
  bg: '#09090B',
  surface: '#18181B',
  border: '#27272A',
  text: '#FAFAFA',
  textMuted: '#A1A1AA',
  primary: '#00E5FF',
  danger: '#FF2A55',
  disabled: '#3F3F46',
};

function KillFeedOverlayImpl({ entries }: KillFeedOverlayProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 50);

    return () => clearInterval(timer);
  }, []);

  const rows = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        opacity: Math.max(0, Math.min(1, (entry.fadeOutTime - now) / 1000)),
      })),
    [entries, now],
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {rows.map((entry) => (
        <View
          key={entry.id}
          style={[
            styles.entry,
            {
              opacity: entry.opacity,
              borderLeftColor: accentColor(entry.killerTeam),
            },
          ]}
        >
          <Text style={[styles.name, teamColor(entry.killerTeam)]}>{entry.killerName}</Text>
          <Text style={styles.icon}>[{iconFor(entry.killType)}]</Text>
          {entry.victimName ? <Text style={[styles.name, teamColor(entry.victimTeam)]}>{entry.victimName}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function areEqual(prev: KillFeedOverlayProps, next: KillFeedOverlayProps): boolean {
  if (prev.entries.length !== next.entries.length) {
    return false;
  }

  for (let i = 0; i < prev.entries.length; i += 1) {
    const a = prev.entries[i];
    const b = next.entries[i];
    if (
      a.id !== b.id
      || a.fadeOutTime !== b.fadeOutTime
      || a.killerName !== b.killerName
      || a.victimName !== b.victimName
      || a.killType !== b.killType
      || a.killerTeam !== b.killerTeam
      || a.victimTeam !== b.victimTeam
    ) {
      return false;
    }
  }

  return true;
}

export const KillFeedOverlay = React.memo(KillFeedOverlayImpl, areEqual);

function iconFor(type: KillFeedEntry['killType']): string {
  if (type === 'headshot') return 'HEADSHOT';
  if (type === 'explosion') return 'EXPLOSION';
  if (type === 'melee') return 'K.O.';
  if (type === 'flag_capture') return 'CAPTURED';
  return 'KIA';
}

function accentColor(team: PlayerTeam): string {
  if (team === PlayerTeam.RED) return COLORS.danger;
  if (team === PlayerTeam.BLUE) return COLORS.primary;
  return COLORS.textMuted;
}

function teamColor(team: PlayerTeam): { color: string } {
  if (team === PlayerTeam.RED) return { color: COLORS.danger };
  if (team === PlayerTeam.BLUE) return { color: COLORS.primary };
  return { color: COLORS.text };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    right: 12,
    alignItems: 'flex-end',
    gap: 4,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  name: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 1.5,
    color: COLORS.text,
  },
  icon: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: COLORS.primary,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
});
