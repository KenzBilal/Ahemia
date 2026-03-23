export interface JoystickState {
  x: number;
  y: number;
  angle: number;
  magnitude: number;
  isActive: boolean;
}

export interface JoystickVector {
  dx: number;
  dy: number;
}

export function createIdleJoystickState(): JoystickState {
  return {
    x: 0,
    y: 0,
    angle: 0,
    magnitude: 0,
    isActive: false,
  };
}

export function clampJoystick(vector: JoystickVector, radius: number): JoystickState {
  const distance = Math.sqrt(vector.dx * vector.dx + vector.dy * vector.dy);
  if (distance === 0) {
    return createIdleJoystickState();
  }

  const clampedMagnitude = Math.min(distance / radius, 1);
  const normalizedX = vector.dx / distance;
  const normalizedY = vector.dy / distance;

  return {
    x: normalizedX * clampedMagnitude,
    y: normalizedY * clampedMagnitude,
    angle: Math.atan2(normalizedY, normalizedX),
    magnitude: clampedMagnitude,
    isActive: true,
  };
}

export function stateToKnobOffset(state: JoystickState, radius: number): JoystickVector {
  return {
    dx: state.x * radius,
    dy: state.y * radius,
  };
}
