import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KillFeedEntry } from '../lib/killFeed';
import { PlayerTeam } from '../shared/gameTypes';

interface Props {
  entries: KillFeedEntry[];
}

export function KillFeedUI({ entries }: Props) {
  return (
    <View style={styles.container} pointerEvents="none">
      {entries.map((entry) => (
        <View key={entry.id} style={[styles.entry, { opacity: Math.max(0, Math.min(1, (entry.fadeOutTime - Date.now()) / 1000)) }]}> 
          <Text style={[styles.name, teamColor(entry.killerTeam)]}>{entry.killerName}</Text>
          <Text style={styles.icon}>{iconFor(entry.killType)}</Text>
          {entry.victimName ? <Text style={[styles.name, teamColor(entry.victimTeam)]}>{entry.victimName}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function iconFor(type: KillFeedEntry['killType']): string {
  if (type === 'headshot') return '🎯';
  if (type === 'explosion') return '💥';
  if (type === 'flag_capture') return '🚩';
  return '🔫';
}

function teamColor(team: PlayerTeam): { color: string } {
  if (team === PlayerTeam.RED) return { color: '#FF6B6B' };
  if (team === PlayerTeam.BLUE) return { color: '#74B9FF' };
  return { color: '#FFFFFF' };
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  icon: {
    fontSize: 14,
  },
});
