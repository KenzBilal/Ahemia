import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

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

interface MeleeButtonProps {
  onPress: () => void;
}

export const MeleeButton = React.memo(function MeleeButton({ onPress }: MeleeButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      {({ pressed }) => <Text style={[styles.label, pressed && styles.labelPressed]}>// STRIKE</Text>}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 30,
    bottom: 164,
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  buttonPressed: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
    fontFamily: 'monospace',
    transform: [{ rotate: '-90deg' }],
  },
  labelPressed: {
    color: COLORS.bg,
  },
});
