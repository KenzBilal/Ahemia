import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
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

export function PlayerHudOverlay({ renderDataRef }: { renderDataRef: MutableRefObject<RenderData | null> }) {
  const [hudData, setHudData] = useState<HudSnapshot | null>(null);
  const frameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const lastSnapshotRef = useRef<HudSnapshot | null>(null);

  useEffect(() => {
    const tick = () => {
      const rd = renderDataRef.current;
      if (!rd) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const local = rd.players.find((player) => player.isLocal);
      if (!local) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const next: HudSnapshot = {
        health: local.health,
        maxHealth: local.maxHealth,
        jetpackFuel: rd.jetpackFuel,
        abilityCooldownPct: rd.abilityCooldownPct,
        hero: local.hero,
      };

      const prev = lastSnapshotRef.current;
      const changed = !prev
        || Math.abs(prev.health - next.health) > 0.05
        || Math.abs(prev.jetpackFuel - next.jetpackFuel) > 0.05
        || Math.abs(prev.abilityCooldownPct - next.abilityCooldownPct) > 0.001
        || prev.maxHealth !== next.maxHealth
        || prev.hero !== next.hero;

      if (changed) {
        lastSnapshotRef.current = next;
        setHudData(next);
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [renderDataRef]);

  if (!hudData) return null;

  const totalSegments = 10;
  const segmentGap = 3;
  const segmentWidth = 12;
  const segmentFillCount = Math.round((hudData.health / Math.max(1, hudData.maxHealth)) * totalSegments);
  const fuelPct = Math.max(0, Math.min(100, hudData.jetpackFuel));
  const fuelColor = fuelPct > 20 ? COLORS.primary : COLORS.danger;

  return (
    <View style={styles.hudRoot} pointerEvents="none">
      <View style={styles.armorBlock}>
        <Text style={styles.label}>ARMOR // {Math.ceil(hudData.health)}</Text>
        <View style={styles.segmentRow}>
          {Array.from({ length: totalSegments }, (_, idx) => (
            <View
              key={`armor-seg-${idx}`}
              style={[
                styles.segment,
                {
                  marginRight: idx === totalSegments - 1 ? 0 : segmentGap,
                  width: segmentWidth,
                },
                idx < segmentFillCount ? styles.segmentOn : styles.segmentOff,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.fuelBlock}>
        <Text style={styles.label}>FUEL</Text>
        <View style={styles.fuelTrack}>
          <View
            style={[
              styles.fuelFill,
              {
                height: `${fuelPct}%`,
                backgroundColor: fuelColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hudRoot: {
    position: 'absolute',
    top: 62,
    left: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  armorBlock: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  label: {
    color: COLORS.text,
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
    fontWeight: '700',
  },
  segmentRow: {
    flexDirection: 'row',
  },
  segment: {
    height: 9,
    borderRadius: 2,
  },
  segmentOn: {
    backgroundColor: COLORS.primary,
  },
  segmentOff: {
    backgroundColor: COLORS.disabled,
  },
  fuelBlock: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  fuelTrack: {
    width: 10,
    height: 56,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fuelFill: {
    width: '100%',
  },
});
