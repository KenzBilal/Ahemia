import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

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

const MAX_RADIUS = 60;
const FIRE_THRESHOLD = 0.6;
const JOYSTICK_SIZE = MAX_RADIUS * 2;
const CENTER = JOYSTICK_SIZE / 2;
const KNOB_SIZE = 20;
const JS_EMIT_DELTA = 0.02;

interface JoystickControlProps {
  side: 'left' | 'right';
  onStateChange: (state: { angle: number; magnitude: number; isFiring: boolean }) => void;
}

export interface JoystickOutputState {
  angle: number;
  magnitude: number;
  isFiring: boolean;
}

export const JoystickControl = React.memo(function JoystickControl({ side, onStateChange }: JoystickControlProps) {
  const knobX = useSharedValue(0);
  const knobY = useSharedValue(0);
  const isFiringSV = useSharedValue(false);
  const lastSentAngle = useSharedValue(0);
  const lastSentMagnitude = useSharedValue(0);
  const lastSentFire = useSharedValue(false);

  const emitState = (angle: number, magnitude: number, isFiring: boolean, force = false) => {
    'worklet';

    const da = Math.abs(angle - lastSentAngle.value);
    const dm = Math.abs(magnitude - lastSentMagnitude.value);
    const df = isFiring !== lastSentFire.value;
    if (force || da > JS_EMIT_DELTA || dm > JS_EMIT_DELTA || df) {
      lastSentAngle.value = angle;
      lastSentMagnitude.value = magnitude;
      lastSentFire.value = isFiring;
      runOnJS(onStateChange)({ angle, magnitude, isFiring });
    }
  };

  const applyTouchAt = (touchX: number, touchY: number, force = false) => {
    'worklet';

    const rawDx = touchX - CENTER;
    const rawDy = touchY - CENTER;
    const rawDist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

    const clampedDist = Math.min(rawDist, MAX_RADIUS);
    const angle = rawDist > 0 ? Math.atan2(rawDy, rawDx) : 0;
    const magnitude = rawDist > 0 ? clampedDist / MAX_RADIUS : 0;
    const clampedX = Math.cos(angle) * clampedDist;
    const clampedY = Math.sin(angle) * clampedDist;
    const isFiring = side === 'right' && magnitude >= FIRE_THRESHOLD;

    knobX.value = clampedX;
    knobY.value = clampedY;
    isFiringSV.value = isFiring;
    emitState(angle, magnitude, isFiring, force);
  };

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(({ x, y }) => {
          applyTouchAt(x, y, true);
        })
        .onUpdate(({ x, y }) => {
          applyTouchAt(x, y);
        })
        .onEnd(() => {
          knobX.value = 0;
          knobY.value = 0;
          isFiringSV.value = false;
          emitState(0, 0, false, true);
        })
        .onFinalize(() => {
          knobX.value = 0;
          knobY.value = 0;
          isFiringSV.value = false;
          emitState(0, 0, false, true);
        }),
    [onStateChange, side],
  );

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knobX.value }, { translateY: knobY.value }],
    backgroundColor:
      side === 'left'
        ? COLORS.textMuted
        : isFiringSV.value
          ? COLORS.danger
          : Math.abs(knobX.value) > 0 || Math.abs(knobY.value) > 0
            ? COLORS.primary
            : COLORS.textMuted,
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          left: side === 'left' ? 24 : undefined,
          right: side === 'right' ? 24 : undefined,
        },
      ]}
    >
      <GestureDetector gesture={gesture}>
        <View style={styles.outerRing}>
          <View style={styles.thresholdRing} />
          <Animated.View style={[styles.innerKnob, knobStyle]} />
        </View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
  },
  outerRing: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(9, 9, 11, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thresholdRing: {
    position: 'absolute',
    width: JOYSTICK_SIZE * FIRE_THRESHOLD,
    height: JOYSTICK_SIZE * FIRE_THRESHOLD,
    borderRadius: (JOYSTICK_SIZE * FIRE_THRESHOLD) / 2,
    borderWidth: 1,
    borderColor: 'rgba(161, 161, 170, 0.35)',
    backgroundColor: 'transparent',
  },
  innerKnob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
