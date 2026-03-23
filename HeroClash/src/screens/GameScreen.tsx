import React, { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Canvas,
  Circle,
  Fill,
  Group,
  Line,
  Path,
  Rect,
  Skia,
  Text as SkiaText,
  matchFont,
} from '@shopify/react-native-skia';
import { useWindowDimensions, View, StyleSheet, Pressable, Text, Alert, BackHandler } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { AbilityButton } from '../components/AbilityButton';
import { GameHUD } from '../components/GameHUD';
import { JoystickControl } from '../components/JoystickControl';
import { KillFeedUI } from '../components/KillFeedUI';
import { audioManager } from '../lib/audioManager';
import { GameEngine, RenderData } from '../lib/gameEngine';
import { KillFeed } from '../lib/killFeed';
import { JoystickState, createIdleJoystickState } from '../lib/joystick';
import { networkClient } from '../lib/networkClient';
import {
  DEFAULT_AMMO,
  GameMode,
  GameState,
  HERO_CONFIGS,
  HeroType,
  MAP_CONFIGS,
  MapType,
  PlayerState,
  PlayerTeam,
  WeaponType,
} from '../shared/gameTypes';
import { RootStackParamList } from '../types/navigation';

type Props =
  | NativeStackScreenProps<RootStackParamList, 'Game'>
  | NativeStackScreenProps<RootStackParamList, 'SurvivalGame'>;

const playerFont = matchFont({
  fontFamily: 'System',
  fontSize: 10,
  fontStyle: 'normal',
  fontWeight: '700',
});

function createInitialState(): GameState {
  const hero = HERO_CONFIGS[HeroType.TITAN];

  const local: PlayerState = {
    id: 'local',
    name: 'Player',
    team: PlayerTeam.RED,
    x: 420,
    y: 560,
    vx: 0,
    vy: 0,
    angle: 0,
    health: hero.maxHealth,
    maxHealth: hero.maxHealth,
    armor: hero.armor,
    speedMultiplier: hero.speedMultiplier,
    heroId: hero.id,
    hero: hero.id,
    ammo: { ...DEFAULT_AMMO },
    currentWeapon: hero.primaryWeapon,
    kills: 0,
    deaths: 0,
    isAlive: true,
    isInvincible: true,
    abilityCooldownUntil: 0,
    jetpackFuel: 100,
    isGrounded: false,
  };

  return {
    gameId: 'local-match',
    settings: {
      mode: GameMode.DEATHMATCH,
      map: MapType.BASE,
      maxPlayers: 6,
      timeLimit: 600,
      killLimit: 20,
      respawnTime: 3000,
      friendlyFire: false,
    },
    players: { local },
    bullets: [],
    flags: [],
    startTime: Date.now(),
    isRunning: true,
  };
}

function heroBadgeColor(hero: HeroType): string {
  if (hero === HeroType.TITAN || hero === HeroType.RIFT) return '#FFD700';
  if (hero === HeroType.BLAZE || hero === HeroType.VOLT) return '#C0392B';
  if (hero === HeroType.AEGIS || hero === HeroType.ORACLE) return '#2980B9';
  return '#C0392B';
}

function weaponStyle(weapon: WeaponType): { radius: number; color: string } {
  if (weapon === WeaponType.PISTOL) return { radius: 3, color: '#FFD700' };
  if (weapon === WeaponType.RIFLE) return { radius: 3, color: '#FF8C00' };
  if (weapon === WeaponType.SHOTGUN) return { radius: 4, color: '#FF4500' };
  if (weapon === WeaponType.SNIPER) return { radius: 2, color: '#00FFFF' };
  return { radius: 5, color: '#FFFFFF' };
}

function MapLayer({ renderDataRef, tick }: { renderDataRef: MutableRefObject<RenderData | null>; tick: { value: number } }) {
  const rd = renderDataRef.current;
  if (!rd) return null;

  const mapCfg = MAP_CONFIGS[rd.map.type];

  if (rd.map.type === MapType.SURVIVAL_TEST) {
    return (
      <>
        <Fill color="#0d1117" />
        <Rect x={0} y={rd.map.groundY} width={mapCfg.width} height={mapCfg.height - rd.map.groundY} color="#1e2530" />
        {rd.map.platforms.map((platform, idx) => (
          <Rect
            key={`platform-${idx}`}
            x={platform.x}
            y={platform.y}
            width={platform.width}
            height={platform.height}
            color="#2d3748"
          />
        ))}
        <Rect x={0} y={0} width={40} height={mapCfg.height} color="#1e2530" />
        <Rect x={1560} y={0} width={40} height={mapCfg.height} color="#1e2530" />
      </>
    );
  }

  const waveOffset = tick.value * 3;

  const lavaPath = Skia.Path.Make();
  if (rd.map.type === MapType.LAVA) {
    lavaPath.moveTo(0, rd.map.groundY);
    for (let x = 0; x <= mapCfg.width; x += 24) {
      const y = rd.map.groundY + Math.sin((x + waveOffset) / 40) * 8;
      lavaPath.lineTo(x, y);
    }
    lavaPath.lineTo(mapCfg.width, mapCfg.height);
    lavaPath.lineTo(0, mapCfg.height);
    lavaPath.close();
  }

  return (
    <>
      {rd.map.type === MapType.BASE && <Fill color="#87CEEB" />}
      {rd.map.type === MapType.LAVA && <Fill color="#4a0e0e" />}
      {rd.map.type === MapType.SPACE && <Fill color="#000000" />}

      {rd.map.type === MapType.SPACE &&
        Array.from({ length: 80 }, (_, i) => {
          const x = (i * 73) % mapCfg.width;
          const y = (i * 137) % rd.map.groundY;
          return <Rect key={`star-${i}`} x={x} y={y} width={2} height={2} color="#FFFFFF" />;
        })}

      {rd.map.type === MapType.LAVA && <Path path={lavaPath} color="#FF6B00" />}

      {rd.map.type !== MapType.LAVA && (
        <Rect
          x={0}
          y={rd.map.groundY}
          width={mapCfg.width}
          height={mapCfg.height - rd.map.groundY}
          color={rd.map.type === MapType.BASE ? '#2d5016' : '#555555'}
        />
      )}

      {rd.map.platforms.map((platform, idx) => (
        <Rect
          key={`platform-${idx}`}
          x={platform.x}
          y={platform.y}
          width={platform.width}
          height={platform.height}
          color={rd.map.type === MapType.BASE ? '#3a6b1f' : rd.map.type === MapType.LAVA ? '#8B0000' : '#555555'}
        />
      ))}
    </>
  );
}

function BulletLayer({ renderDataRef }: { renderDataRef: MutableRefObject<RenderData | null> }) {
  const rd = renderDataRef.current;
  if (!rd) return null;

  return (
    <>
      {rd.bullets.map((bullet) => {
        const style = weaponStyle(bullet.weapon);
        return <Circle key={bullet.id} cx={bullet.x} cy={bullet.y} r={style.radius} color={style.color} />;
      })}
    </>
  );
}

function PlayerLayer({ renderDataRef }: { renderDataRef: MutableRefObject<RenderData | null> }) {
  const rd = renderDataRef.current;
  if (!rd) return null;

  return (
    <>
      {rd.players.map((player) => {
        if (!player.isAlive) return null;

        const baseColor = player.team === PlayerTeam.RED ? '#FF4444' : player.team === PlayerTeam.BLUE ? '#4444FF' : '#888888';
        const healthW = 30 * (player.health / Math.max(1, player.maxHealth));

        return (
          <Group key={player.id} transform={[{ translateX: player.x }, { translateY: player.y }]}>
            <Rect x={-15} y={-20} width={30} height={40} color={baseColor} />

            {player.isInvincible && <Rect x={-18} y={-23} width={36} height={46} color="rgba(255,255,0,0.35)" />}

            <Line p1={{ x: 0, y: 0 }} p2={{ x: Math.cos(player.angle) * 22, y: Math.sin(player.angle) * 22 }} color="#000000" strokeWidth={2} />

            {player.isDualWielding && (
              <Line
                p1={{ x: 0, y: 0 }}
                p2={{
                  x: Math.cos(player.angle + 10 * (Math.PI / 180)) * 22,
                  y: Math.sin(player.angle + 10 * (Math.PI / 180)) * 22,
                }}
                color="#000000"
                strokeWidth={2}
              />
            )}

            <Rect x={-15} y={-28} width={30} height={4} color="#FF0000" />
            <Rect x={-15} y={-28} width={healthW} height={4} color="#00FF00" />

            <SkiaText
              x={-15}
              y={-36}
              text={player.name}
              font={playerFont}
              color={player.isLocal ? '#FFFF00' : '#FFFFFF'}
            />

            <Circle cx={11} cy={-14} r={6} color={heroBadgeColor(player.hero)} />
          </Group>
        );
      })}
    </>
  );
}

function ParticleLayer({ renderDataRef }: { renderDataRef: MutableRefObject<RenderData | null> }) {
  const rd = renderDataRef.current;
  if (!rd) return null;

  return (
    <>
      {rd.particles.map((particle, idx) => (
        <Circle
          key={`particle-${idx}`}
          cx={particle.x}
          cy={particle.y}
          r={particle.radius}
          color={particle.color}
          opacity={particle.life}
        />
      ))}
    </>
  );
}

function FlagLayer({ renderDataRef }: { renderDataRef: MutableRefObject<RenderData | null> }) {
  const rd = renderDataRef.current;
  if (!rd) return null;

  return (
    <>
      {rd.flags.map((flag, idx) => {
        let x = flag.x;
        let y = flag.y;

        if (flag.carriedBy) {
          const carrier = rd.players.find((p) => p.id === flag.carriedBy);
          if (carrier) {
            x = carrier.x;
            y = carrier.y - 32;
          }
        }

        return (
          <Group key={`flag-${idx}`}>
            <Rect x={x - 10} y={y - 20} width={20} height={20} color={flag.team === PlayerTeam.RED ? '#FF0000' : '#0000FF'} />
            <Rect x={x - 8} y={y - 18} width={16} height={16} color="#FFFFFF" />
          </Group>
        );
      })}
    </>
  );
}

export default function GameScreen({ navigation, route }: Props) {
  const { width, height } = useWindowDimensions();
  const engineRef = useRef<GameEngine | null>(new GameEngine(createInitialState(), 'local'));
  const renderDataRef = useRef<RenderData | null>(engineRef.current ? engineRef.current.getRenderData() : null);
  const killFeedRef = useRef(new KillFeed());

  const [killFeedEntries, setKillFeedEntries] = useState(killFeedRef.current.getEntries());
  const [leftStick, setLeftStick] = useState<JoystickState>(createIdleJoystickState());
  const [rightStick, setRightStick] = useState<JoystickState>(createIdleJoystickState());
  const [frameStamp, setFrameStamp] = useState(0);

  const tick = useSharedValue(0);

  const cameraX = useDerivedValue(() => {
    tick.value;
    const rd = renderDataRef.current;
    if (!rd) return 0;
    const local = rd.players.find((player) => player.isLocal);
    if (!local) return 0;
    const mapWidth = MAP_CONFIGS[rd.map.type].width;
    return Math.max(0, Math.min(local.x - width / 2, mapWidth - width));
  });

  const cameraY = useDerivedValue(() => {
    tick.value;
    const rd = renderDataRef.current;
    if (!rd) return 0;
    const local = rd.players.find((player) => player.isLocal);
    if (!local) return 0;
    const mapHeight = MAP_CONFIGS[rd.map.type].height;
    return Math.max(0, Math.min(local.y - height / 2, mapHeight - height));
  });

  const handleLeft = useCallback((state: JoystickState) => {
    setLeftStick(state);
  }, []);

  const handleRight = useCallback((state: JoystickState) => {
    setRightStick(state);
  }, []);

  const handleAbility = useCallback(() => {
    const localPlayer = engineRef.current?.getLocalPlayer();
    if (!engineRef.current || !localPlayer) return;
    engineRef.current.useAbility(localPlayer.id);
  }, []);

  const isSurvivalMode = route.name === 'SurvivalGame';

  const leaveToModeSelect = useCallback(() => {
    networkClient.disconnect();
    navigation.replace('ModeSelect');
  }, [navigation]);

  const handleExitMatch = useCallback(() => {
    if (isSurvivalMode) {
      Alert.alert('Exit Survival?', 'Return to mode selection?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: leaveToModeSelect },
      ]);
      return;
    }

    networkClient.disconnect();
    navigation.replace('Lobby', { mode: 'host' });
  }, [isSurvivalMode, leaveToModeSelect, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!isSurvivalMode) {
        return undefined;
      }

      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert('Exit Survival?', 'Return to mode selection?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: leaveToModeSelect },
        ]);
        return true;
      });

      return () => sub.remove();
    }, [isSurvivalMode, leaveToModeSelect]),
  );

  useEffect(() => {
    const localPlayer = engineRef.current?.getLocalPlayer();
    if (!localPlayer) return;

    networkClient.onMessage((msg) => {
      if (msg.t !== 'STATE' || !engineRef.current) return;

      const state = engineRef.current.getState();
      const serverPlayer = msg.players?.[localPlayer.id] as Partial<PlayerState> | undefined;
      const local = state.players[localPlayer.id];

      if (local && serverPlayer?.x !== undefined && serverPlayer?.y !== undefined) {
        const dx = Math.abs(local.x - serverPlayer.x);
        const dy = Math.abs(local.y - serverPlayer.y);
        if (dx > 20 || dy > 20) {
          local.x += (serverPlayer.x - local.x) * 0.3;
          local.y += (serverPlayer.y - local.y) * 0.3;
        }
      }

      Object.entries(msg.players ?? {}).forEach(([id, p]) => {
        if (id === localPlayer.id) return;
        const target = state.players[id];
        if (target) {
          Object.assign(target, p as Partial<PlayerState>);
        }
      });

      engineRef.current.updateGameState(state);
    });
  }, []);

  useFrameCallback(() => {
    if (!engineRef.current) return;

    const localPlayer = engineRef.current.getLocalPlayer();
    if (localPlayer) {
      engineRef.current.updatePlayerMovement(localPlayer.id, leftStick.x, leftStick.y, leftStick.y < -0.35);
      engineRef.current.updatePlayerAim(localPlayer.id, localPlayer.x + rightStick.x * 100, localPlayer.y + rightStick.y * 100);

      if (rightStick.magnitude > 0.3) {
        const bullets = engineRef.current.shoot(localPlayer.id);
        if (bullets && bullets.length > 0) {
          audioManager.playWeaponSound(localPlayer.currentWeapon).catch(() => {
            return;
          });
        }
      }
    }

    engineRef.current.update(1 / 60);
    renderDataRef.current = engineRef.current.getRenderData();

    const events = engineRef.current.drainKillEvents();
    if (events.length > 0) {
      const localName = localPlayer?.name ?? 'Player';
      events.forEach((event) => {
        killFeedRef.current.addKill(
          event.killerName,
          event.killerTeam,
          event.victimName,
          event.victimTeam,
          event.killType,
          event.weapon,
          event.killerName === localName || event.victimName === localName,
        );
      });
      setKillFeedEntries([...killFeedRef.current.getEntries()]);
    } else {
      killFeedRef.current.update();
      setKillFeedEntries([...killFeedRef.current.getEntries()]);
    }

    tick.value += 1;
    setFrameStamp((prev) => (prev + 1) % 1000000);
  });

  const cameraTransform = useMemo(
    () => [
      { translateX: -cameraX.value },
      { translateY: -cameraY.value },
    ],
    [cameraX.value, cameraY.value, frameStamp],
  );

  const abilityCooldownPct = renderDataRef.current?.abilityCooldownPct ?? 0;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Canvas style={{ width, height }}>
        <Group transform={cameraTransform}>
          <MapLayer renderDataRef={renderDataRef} tick={tick} />
          <BulletLayer renderDataRef={renderDataRef} />
          <PlayerLayer renderDataRef={renderDataRef} />
          <ParticleLayer renderDataRef={renderDataRef} />
          <FlagLayer renderDataRef={renderDataRef} />
        </Group>
      </Canvas>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.topBar} pointerEvents="box-none">
          <Pressable style={styles.exitButton} onPress={handleExitMatch}>
            <Text style={styles.exitButtonText}>Exit Match</Text>
          </Pressable>
        </View>
        <GameHUD renderDataRef={renderDataRef} />
        <KillFeedUI entries={killFeedEntries} />
        <JoystickControl side="left" onStateChange={handleLeft} />
        <JoystickControl side="right" onStateChange={handleRight} />
        <AbilityButton cooldownPct={abilityCooldownPct} onPress={handleAbility} />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 20,
  },
  exitButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4f5f70',
    backgroundColor: 'rgba(8,16,28,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitButtonText: {
    color: '#e9f3ff',
    fontSize: 13,
    fontWeight: '700',
  },
});
