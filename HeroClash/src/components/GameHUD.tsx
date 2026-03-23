import React, { MutableRefObject, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RenderData } from '../lib/gameEngine';
import { HeroType } from '../shared/gameTypes';

interface HudSnapshot {
  health: number;
  maxHealth: number;
  jetpackFuel: number;
  abilityCooldownPct: number;
  hero: HeroType;
}

export function GameHUD({ renderDataRef }: { renderDataRef: MutableRefObject<RenderData | null> }) {
  const [hudData, setHudData] = useState<HudSnapshot | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const rd = renderDataRef.current;
      if (!rd) return;
      const local = rd.players.find((player) => player.isLocal);
      if (!local) return;

      setHudData({
        health: local.health,
        maxHealth: local.maxHealth,
        jetpackFuel: rd.jetpackFuel,
        abilityCooldownPct: rd.abilityCooldownPct,
        hero: local.hero,
      });
    }, 100);

    return () => clearInterval(interval);
  }, [renderDataRef]);

  if (!hudData) return null;

  return (
    <>
      <View style={styles.healthContainer} pointerEvents="none">
        <View style={[styles.healthBg, { width: 140 }]}>
          <View style={[styles.healthFg, { width: (hudData.health / Math.max(1, hudData.maxHealth)) * 140 }]} />
        </View>
        <Text style={styles.healthText}>{Math.ceil(hudData.health)} / {hudData.maxHealth}</Text>
      </View>

      <View style={styles.fuelContainer} pointerEvents="none">
        <View style={styles.fuelBg}>
          <View
            style={[
              styles.fuelFg,
              {
                height: (hudData.jetpackFuel / 100) * 80,
                backgroundColor: hudData.jetpackFuel > 40 ? '#3B82F6' : hudData.jetpackFuel > 15 ? '#F59E0B' : '#EF4444',
              },
            ]}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  healthContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    gap: 4,
  },
  healthBg: {
    height: 12,
    borderRadius: 8,
    backgroundColor: '#2B2020',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#581c1c',
  },
  healthFg: {
    height: '100%',
    backgroundColor: '#22C55E',
  },
  healthText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  fuelContainer: {
    position: 'absolute',
    right: 126,
    bottom: 122,
  },
  fuelBg: {
    width: 12,
    height: 80,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    backgroundColor: 'rgba(30,41,59,0.7)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fuelFg: {
    width: '100%',
  },
});
