import React, { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Canvas,
  Circle,
  Group,
  Line,
  Rect,
  Text as SkiaText,
  matchFont,
} from '@shopify/react-native-skia';
import { useWindowDimensions, View, StyleSheet, Pressable, Text, Alert, BackHandler } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { AbilityActionButton } from '../components/AbilityActionButton';
import { PlayerHudOverlay } from '../components/PlayerHudOverlay';
import { JoystickControl, JoystickOutputState } from '../components/JoystickControl';
import { KillFeedOverlay } from '../components/KillFeedOverlay';
import { MeleeButton } from '../components/MeleeButton';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { audioManager } from '../lib/audioManager';
import { GameEngine, RenderData } from '../lib/gameEngine';
import { KillFeed } from '../lib/killFeed';
import { compressAxis, networkClient } from '../lib/networkClient';
import { useGameStore } from '../lib/gameStore';
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

const IDLE_JOYSTICK: JoystickOutputState = {
  angle: 0,
  magnitude: 0,
  isFiring: false,
};

function joystickVector(state: JoystickOutputState): { x: number; y: number } {
  return {
    x: Math.cos(state.angle) * state.magnitude,
    y: Math.sin(state.angle) * state.magnitude,
  };
}

function createInitialState(localPlayerId: string): GameState {
  const hero = HERO_CONFIGS[HeroType.TITAN];

  const local: PlayerState = {
    id: localPlayerId,
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
    isThrusting: false,
    isMeleeing: false,
  };

  return {
    gameId: 'local-match',
    settings: {
      mode: GameMode.DEATHMATCH,
      map: MapType.TEST_ZONE,
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

function weaponStyle(weapon: WeaponType): { radius: number; color: string } {
  if (weapon === WeaponType.PISTOL) return { radius: 3, color: '#FFD700' };
  if (weapon === WeaponType.RIFLE) return { radius: 3, color: '#FF8C00' };
  if (weapon === WeaponType.SHOTGUN) return { radius: 4, color: '#FF4500' };
  if (weapon === WeaponType.SNIPER) return { radius: 2, color: '#00FFFF' };
  return { radius: 5, color: '#FFFFFF' };
}

function MapLayer({ renderDataRef }: { renderDataRef: MutableRefObject<RenderData | null> }) {
  const rd = renderDataRef.current;
  if (!rd) return null;

  const mapCfg = MAP_CONFIGS[rd.map.type];

  return (
    <>
      <Rect
        x={0}
        y={rd.map.groundY}
        width={mapCfg.width}
        height={Math.max(0, mapCfg.height - rd.map.groundY)}
        color={COLORS.surface}
      />
      <Rect x={0} y={rd.map.groundY} width={mapCfg.width} height={2} color={COLORS.border} />
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

        const aimAngle = player.angle || 0;
        const lurchDistance = player.isMeleeing ? 12 : 0;
        const lurchX = Math.cos(aimAngle) * lurchDistance;
        const lurchY = Math.sin(aimAngle) * lurchDistance;

        const facing = Math.cos(aimAngle) >= 0 ? 1 : -1;
        const healthW = 30 * (player.health / Math.max(1, player.maxHealth));

        return (
          <Group key={player.id} transform={[{ translateX: player.x + lurchX }, { translateY: player.y + lurchY }]}> 
            <PlayerAvatar
              aimAngle={aimAngle}
              facing={facing}
              primaryColor={player.isLocal ? '#00E5FF' : '#FF2A55'}
              skinColor="#FCDCB4"
              isThrusting={player.isThrusting}
            />

            {player.isMeleeing && <Rect x={32} y={-12} width={3} height={24} color="#FFFFFF" opacity={0.8} />}

            <Rect x={-15} y={-28} width={30} height={4} color="#FF0000" />
            <Rect x={-15} y={-28} width={healthW} height={4} color="#00FF00" />

            <SkiaText
              x={-15}
              y={-36}
              text={player.name}
              font={playerFont}
              color={player.isLocal ? '#FFFF00' : '#FFFFFF'}
            />

            {player.isInvincible && <Rect x={-18} y={-23} width={36} height={46} color="rgba(255,255,0,0.25)" />}

            {player.isDualWielding && (
              <Line
                p1={{ x: 0, y: 0 }}
                p2={{
                  x: Math.cos(aimAngle + 10 * (Math.PI / 180)) * 22,
                  y: Math.sin(aimAngle + 10 * (Math.PI / 180)) * 22,
                }}
                color="#000000"
                strokeWidth={2}
              />
            )}
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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const storeLocalPlayerId = useGameStore((state) => state.localPlayerId);
  const setStoreLocalPlayerId = useGameStore((state) => state.setLocalPlayerId);
  const routeLocalPlayerId = route.name === 'Game' ? route.params?.localPlayerId : undefined;
  const resolvedLocalPlayerId = routeLocalPlayerId ?? storeLocalPlayerId ?? 'local';
  const engineRef = useRef<GameEngine | null>(new GameEngine(createInitialState(resolvedLocalPlayerId), resolvedLocalPlayerId));
  const renderDataRef = useRef<RenderData | null>(engineRef.current ? engineRef.current.getRenderData() : null);
  const killFeedRef = useRef(new KillFeed());

  const [killFeedEntries, setKillFeedEntries] = useState(killFeedRef.current.getEntries());
  const [leftStick, setLeftStick] = useState<JoystickOutputState>(IDLE_JOYSTICK);
  const [rightStick, setRightStick] = useState<JoystickOutputState>(IDLE_JOYSTICK);
  const [isMeleeing, setIsMeleeing] = useState(false);
  const [frameStamp, setFrameStamp] = useState(0);
  const setLocalAimAngle = useGameStore((state) => state.setLocalAimAngle);
  const leftStickRef = useRef(leftStick);
  const rightStickRef = useRef(rightStick);
  const meleeRef = useRef(isMeleeing);
  const meleeResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLeft = useCallback((state: JoystickOutputState) => {
    setLeftStick(state);
  }, []);

  const handleRight = useCallback((state: JoystickOutputState) => {
    setRightStick(state);
  }, []);

  const handleMeleePress = useCallback(() => {
    if (meleeResetTimerRef.current) {
      clearTimeout(meleeResetTimerRef.current);
    }
    setIsMeleeing(true);
    meleeResetTimerRef.current = setTimeout(() => {
      setIsMeleeing(false);
      meleeResetTimerRef.current = null;
    }, 140);
  }, []);

  const { cameraTransform, mapBgColor } = useMemo(() => {
    const rd = renderDataRef.current;
    if (!rd) {
      return {
        cameraTransform: [{ translateX: 0 }, { translateY: 0 }],
        mapBgColor: COLORS.bg,
      };
    }

    const local = rd.players.find((player) => player.isLocal);
    let cameraX = 0;
    let cameraY = 0;
    if (local) {
      cameraX = local.x - screenWidth / 2;
      cameraY = local.y - screenHeight / 2;
    }

    return {
      cameraTransform: [{ translateX: -cameraX }, { translateY: -cameraY }],
      mapBgColor: COLORS.bg,
    };
  }, [frameStamp, screenHeight, screenWidth]);

  useEffect(() => {
    leftStickRef.current = leftStick;
  }, [leftStick]);

  useEffect(() => {
    rightStickRef.current = rightStick;
  }, [rightStick]);

  useEffect(() => {
    meleeRef.current = isMeleeing;
  }, [isMeleeing]);

  useEffect(() => {
    return () => {
      if (meleeResetTimerRef.current) {
        clearTimeout(meleeResetTimerRef.current);
      }
    };
  }, []);

  const handleAbility = useCallback(() => {
    const localPlayer = engineRef.current?.getLocalPlayer();
    if (!engineRef.current || !localPlayer) return;
    engineRef.current.useAbility(localPlayer.id);
  }, []);

  const isSurvivalMode = route.name === 'SurvivalGame';

  useEffect(() => {
    if (!storeLocalPlayerId || storeLocalPlayerId !== resolvedLocalPlayerId) {
      setStoreLocalPlayerId(resolvedLocalPlayerId);
    }
  }, [resolvedLocalPlayerId, setStoreLocalPlayerId, storeLocalPlayerId]);

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
        if (!state.players[id]) {
          const fallbackHero = HeroType.TITAN;
          const cfg = HERO_CONFIGS[fallbackHero];
          state.players[id] = {
            id,
            name: `Player-${id.slice(0, 4)}`,
            team: (p.team as PlayerTeam) ?? PlayerTeam.BLUE,
            x: p.x ?? 0,
            y: p.y ?? 0,
            vx: p.vx ?? 0,
            vy: p.vy ?? 0,
            angle: p.angle ?? 0,
            health: p.health ?? cfg.maxHealth,
            maxHealth: cfg.maxHealth,
            armor: cfg.armor,
            speedMultiplier: cfg.moveSpeed,
            heroId: fallbackHero,
            hero: fallbackHero,
            ammo: { ...DEFAULT_AMMO },
            currentWeapon: WeaponType.RIFLE,
            kills: 0,
            deaths: 0,
            isAlive: p.isAlive ?? true,
            isInvincible: false,
            abilityCooldownUntil: 0,
            jetpackFuel: 100,
            isGrounded: false,
            isThrusting: false,
            isMeleeing: false,
          };
        }

        Object.assign(state.players[id], p as Partial<PlayerState>);
      });

      engineRef.current.updateGameState(state);
    });
  }, []);

  useEffect(() => {
    networkClient.startInputLoop(() => {
      const local = engineRef.current?.getLocalPlayer();
      const left = leftStickRef.current;
      const right = rightStickRef.current;
      const leftVec = joystickVector(left);
      const fuel = renderDataRef.current?.jetpackFuel ?? 0;
      const jumpHeld = leftVec.y < -0.35;
      const thrusting = jumpHeld && fuel > 0;

      return {
        t: 'INPUT',
        pid: local?.id ?? 'local',
        lx: compressAxis(leftVec.x, 2),
        ly: compressAxis(leftVec.y, 2),
        x: compressAxis(local?.x ?? 0, 2),
        y: compressAxis(local?.y ?? 0, 2),
        vx: compressAxis(local?.vx ?? 0, 2),
        vy: compressAxis(local?.vy ?? 0, 2),
        a: compressAxis(right.magnitude > 0 ? right.angle : (local?.angle ?? 0), 3),
        f: right.isFiring ? 1 : 0,
        j: jumpHeld ? 1 : 0,
        th: thrusting ? 1 : 0,
        me: meleeRef.current ? 1 : 0,
        ab: 0,
        ts: Date.now(),
      };
    });

    const interval = setInterval(() => {
      if (!engineRef.current) return;

      const localPlayer = engineRef.current.getLocalPlayer();
      const left = leftStickRef.current;
      const right = rightStickRef.current;
      const leftVec = joystickVector(left);
      const rightVec = joystickVector(right);

      if (localPlayer) {
        engineRef.current.updatePlayerMovement(localPlayer.id, leftVec.x, leftVec.y, leftVec.y < -0.35);
        engineRef.current.updatePlayerAim(localPlayer.id, localPlayer.x + rightVec.x * 100, localPlayer.y + rightVec.y * 100);
        engineRef.current.updatePlayerMelee(localPlayer.id, meleeRef.current);
        setLocalAimAngle(right.magnitude > 0 ? right.angle : localPlayer.angle);

        if (right.isFiring) {
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

      setFrameStamp((prev) => (prev + 1) % 1000000);
    }, 16);

    return () => {
      clearInterval(interval);
      networkClient.stopInputLoop();
    };
  }, []);
  const abilityCooldownPct = renderDataRef.current?.abilityCooldownPct ?? 0;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Canvas style={{ width: screenWidth, height: screenHeight }}>
        <Rect x={0} y={0} width={screenWidth} height={screenHeight} color={mapBgColor} />
        <Group transform={cameraTransform}>
          <MapLayer renderDataRef={renderDataRef} />
          <BulletLayer renderDataRef={renderDataRef} />
          <PlayerLayer renderDataRef={renderDataRef} />
          <ParticleLayer renderDataRef={renderDataRef} />
          <FlagLayer renderDataRef={renderDataRef} />
        </Group>
      </Canvas>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.topBar} pointerEvents="box-none">
          <Pressable style={styles.exitButton} onPress={handleExitMatch}>
            <Text style={styles.exitButtonText}>SYSTEM.ABORT</Text>
          </Pressable>
        </View>
        <PlayerHudOverlay renderDataRef={renderDataRef} />
        <KillFeedOverlay entries={killFeedEntries} />
        <JoystickControl side="left" onStateChange={handleLeft} />
        <JoystickControl side="right" onStateChange={handleRight} />
        <MeleeButton onPress={handleMeleePress} />
        <View style={styles.actionDock} pointerEvents="box-none">
          <AbilityActionButton cooldownPct={abilityCooldownPct} onPress={handleAbility} />
        </View>
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
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitButtonText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  actionDock: {
    position: 'absolute',
    right: 24,
    bottom: 102,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
});
