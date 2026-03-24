import React from 'react';
import { Circle, Group, Path, RoundedRect } from '@shopify/react-native-skia';

type Facing = 1 | -1;

export interface PlayerAvatarProps {
  aimAngle?: number;
  facing?: Facing;
  primaryColor: string;
  skinColor: string;
  isThrusting?: boolean;
}

const INK = '#09090B';
const GUN = '#71717A';
const FLAME_OUTER = '#FF2A55';
const FLAME_INNER = '#FDBA74';

function OutlinedCircle({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  return (
    <>
      <Circle cx={cx} cy={cy} r={r} color={color} />
      <Circle cx={cx} cy={cy} r={r} color={INK} style="stroke" strokeWidth={2} />
    </>
  );
}

function OutlinedRoundedRect(
  { x, y, width, height, r, color }: { x: number; y: number; width: number; height: number; r: number; color: string },
) {
  return (
    <>
      <RoundedRect x={x} y={y} width={width} height={height} r={r} color={color} />
      <RoundedRect x={x} y={y} width={width} height={height} r={r} color={INK} style="stroke" strokeWidth={2} />
    </>
  );
}

function OutlinedPath({ path, color }: { path: string; color: string }) {
  return (
    <>
      <Path path={path} color={color} />
      <Path path={path} color={INK} style="stroke" strokeWidth={2} />
    </>
  );
}

export function PlayerAvatar({
  aimAngle = 0,
  facing = 1,
  primaryColor,
  skinColor,
  isThrusting = false,
}: PlayerAvatarProps) {
  return (
    <Group transform={[{ scaleX: facing }]}>
      <OutlinedCircle cx={-7} cy={-2} r={3.5} color={skinColor} />

      <OutlinedRoundedRect x={-7} y={11} width={5.5} height={12} r={1.5} color={INK} />
      <OutlinedRoundedRect x={1.5} y={11} width={5.5} height={12} r={1.5} color={INK} />

      <OutlinedRoundedRect x={-14} y={-3} width={9} height={15} r={2} color="#3F3F46" />

      {isThrusting && (
        <>
          <OutlinedPath
            path="M -12 12 C -16 16 -15 23 -10 25 C -5 23 -4 16 -8 12 Z"
            color={FLAME_OUTER}
          />
          <OutlinedPath
            path="M -10 14 C -12 17 -11 22 -8.5 23 C -6 22 -5 17 -7 14 Z"
            color={FLAME_INNER}
          />
        </>
      )}

      <OutlinedRoundedRect x={-10} y={-6} width={21} height={20} r={5} color={primaryColor} />

      <Group transform={[{ translateX: 5 }, { translateY: -3 }, { rotate: aimAngle }]}>
        <OutlinedRoundedRect x={1} y={-3.5} width={18} height={7} r={1.5} color={GUN} />
        <OutlinedRoundedRect x={14} y={-4.5} width={6} height={3} r={1} color="#52525B" />
        <OutlinedCircle cx={4} cy={0} r={4} color={skinColor} />
      </Group>

      <Group transform={[{ translateY: -10 }, { rotate: aimAngle }, { translateY: 10 }]}>
        <OutlinedCircle cx={0} cy={-14} r={9} color={skinColor} />
        <OutlinedRoundedRect x={1} y={-17} width={10} height={5} r={2.5} color={INK} />
      </Group>
    </Group>
  );
}

export default React.memo(PlayerAvatar);
