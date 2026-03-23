import React, { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { clampJoystick, createIdleJoystickState, JoystickState, stateToKnobOffset } from '../lib/joystick';

interface JoystickControlProps {
  side: 'left' | 'right';
  onStateChange: (state: JoystickState) => void;
}

const RADIUS = 56;

export const JoystickControl = React.memo(function JoystickControl({ side, onStateChange }: JoystickControlProps) {
  const [state, setState] = useState(createIdleJoystickState());
  const { width, height } = useWindowDimensions();

  const applyState = (next: JoystickState) => {
    setState(next);
    onStateChange(next);
  };

  const applyTouchAt = (x: number, y: number) => {
    const anchorX = side === 'left' ? 96 : width - 96;
    const anchorY = height - 96;
    const next = clampJoystick({ dx: x - anchorX, dy: y - anchorY }, RADIUS);
    applyState(next);
  };

  const applyIdle = () => {
    applyState(createIdleJoystickState());
  };

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(({ x, y }) => {
          runOnJS(applyTouchAt)(x, y);
        })
        .onUpdate(({ x, y }) => {
          runOnJS(applyTouchAt)(x, y);
        })
        .onEnd(() => {
          runOnJS(applyIdle)();
        }),
    [applyIdle, applyTouchAt],
  );

  const knob = stateToKnobOffset(state, RADIUS);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          left: side === 'left' ? 40 : undefined,
          right: side === 'right' ? 40 : undefined,
        },
      ]}
    >
      <GestureDetector gesture={gesture}>
        <View style={styles.outerRing}>
          <View style={[styles.innerKnob, { transform: [{ translateX: knob.dx }, { translateY: knob.dy }] }]} />
        </View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    width: RADIUS * 2,
    height: RADIUS * 2,
  },
  outerRing: {
    width: RADIUS * 2,
    height: RADIUS * 2,
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(4, 10, 20, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerKnob: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(140,190,255,0.8)',
    borderWidth: 2,
    borderColor: '#dceeff',
  },
});
