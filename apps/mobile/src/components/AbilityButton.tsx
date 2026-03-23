import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

interface AbilityButtonProps {
  onPress: () => void;
  cooldownPct: number;
}

export const AbilityButton = React.memo(function AbilityButton({ onPress, cooldownPct }: AbilityButtonProps) {
  const clamped = Math.max(0, Math.min(1, cooldownPct));
  const sweepAngle = clamped * 360;

  const arcPath = Skia.Path.Make();
  arcPath.moveTo(32, 32);
  arcPath.addArc({ x: 4, y: 4, width: 56, height: 56 }, -90, sweepAngle);
  arcPath.close();

  return (
    <Pressable style={styles.wrapper} onPress={onPress}>
      <View style={[styles.button, clamped > 0 ? styles.cooling : styles.ready]}>
        <Text style={styles.label}>A</Text>
      </View>
      <Canvas style={styles.arcCanvas}>
        <Path path={arcPath} color={clamped > 0 ? 'rgba(0,0,0,0.6)' : 'transparent'} style="fill" />
      </Canvas>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 70,
    bottom: 148,
    width: 64,
    height: 64,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ready: {
    backgroundColor: '#31df87',
  },
  cooling: {
    backgroundColor: '#5c687a',
  },
  label: {
    color: '#08111d',
    fontSize: 24,
    fontWeight: '800',
  },
  arcCanvas: {
    position: 'absolute',
    width: 64,
    height: 64,
    top: 0,
    left: 0,
  },
});
