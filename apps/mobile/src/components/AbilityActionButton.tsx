import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

interface AbilityActionButtonProps {
  onPress: () => void;
  cooldownPct: number;
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

export const AbilityActionButton = React.memo(function AbilityActionButton({ onPress, cooldownPct }: AbilityActionButtonProps) {
  const clamped = Math.max(0, Math.min(1, cooldownPct));
  const sweepAngle = clamped * 360;

  const arcPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(32, 32);
    p.addArc({ x: 4, y: 4, width: 56, height: 56 }, -90, sweepAngle);
    p.close();
    return p;
  }, [sweepAngle]);

  return (
    <Pressable style={styles.wrapper} onPress={onPress}>
      <View style={[styles.button, clamped > 0 ? styles.cooling : styles.ready]}>
        <Text style={[styles.label, clamped > 0 ? styles.labelCooling : styles.labelReady]}>A</Text>
      </View>
      <Canvas style={styles.arcCanvas}>
        <Path path={arcPath} color={clamped > 0 ? 'rgba(0,0,0,0.6)' : 'transparent'} style="fill" />
      </Canvas>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: 64,
    height: 64,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ready: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  cooling: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: 18,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    fontWeight: '800',
  },
  labelReady: {
    color: COLORS.bg,
  },
  labelCooling: {
    color: COLORS.primary,
  },
  arcCanvas: {
    position: 'absolute',
    width: 64,
    height: 64,
    top: 0,
    left: 0,
  },
});
