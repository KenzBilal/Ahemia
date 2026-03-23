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
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AbilityButton } from '../components/AbilityButton';
import { GameHUD } from '../components/GameHUD';
import { JoystickControl } from '../components/JoystickControl';
import { KillFeedUI } from '../components/KillFeedUI';
import { AudioManager } from '../lib/audioManager';
import { GameEngine, RenderData } from '../lib/gameEngine';
import { KillFeed, KillFeedEntry } from '../lib/killFeed';
import { JoystickState, createIdleJoystickState } from '../lib/joystick';
import { createSurvivalGameState } from '../lib/survivalMode';
import { useGameStore } from '../lib/gameStore';
import { HERO_CONFIGS, HeroType, MAP_CONFIGS, MapType, PlayerTeam, WeaponType } from '../shared/gameTypes';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SurvivalGame'>;

const playerFont = matchFont({
  fontFamily: 'System',
  fontSize: 10,
  fontStyle: 'normal',
  fontWeight: '700',
});

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

function MapLayer({ renderDataRef }: { renderDataRef: MutableRefObject<RenderData | null> }) {
  const rd = renderDataRef.current;
  if (!rd) return null;

  const mapCfg = MAP_CONFIGS[rd.map.type];

  if (rd.map.type === MapType.SURVIVAL_TEST) {
    return (
      <>
        <Fill color="#0d1117" />
        <Rect x={0} y={rd.map.groundY} width={mapCfg.width} height={mapCfg.height - rd.map.groundY} color="#1e2530" />
        {rd.map.platforms.map((platform, idx) => (
          <Rect key={`platform-${idx}`} x={platform.x} y={platform.y} width={platform.width} height={platform.height} color="#2d3748" />
        ))}
        <Rect x={0} y={0} width={40} height={mapCfg.height} color="#1e2530" />
        <Rect x={1560} y={0} width={40} height={mapCfg.height} color="#1e2530" />
      </>
    );
  }

  const waveOffset = 0;
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

            <Rect x={-15} y={-28} width={30} height={4} color="#FF0000" />
            <Rect x={-15} y={-28} width={healthW} height={4} color="#00FF00" />

            <SkiaText x={-15} y={-36} text={player.name} font={playerFont} color={player.isLocal ? '#FFFF00' : '#FFFFFF'} />

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
        <Circle key={`particle-${idx}`} cx={particle.x} cy={particle.y} r={particle.radius} color={particle.color} opacity={particle.life} />
      ))}
    </>
  );
}

export default function SurvivalGameScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const selectedHero = useGameStore((s) => s.selectedHero) ?? HeroType.TITAN;

  const engineRef = useRef<GameEngine | null>(null);
  const renderDataRef = useRef<RenderData | null>(null);
  const killFeedRef = useRef(new KillFeed());
  const audioRef = useRef(new AudioManager());

  const [killFeedEntries, setKillFeedEntries] = useState<KillFeedEntry[]>([]);
  const [leftStick, setLeftStick] = useState<JoystickState>(createIdleJoystickState());
  const [rightStick, setRightStick] = useState<JoystickState>(createIdleJoystickState());
  const [exitDialogVisible, setExitDialogVisible] = useState(false);

  const tick = useSharedValue(0);

  useEffect(() => {
    const localPlayerId = 'local-player';
    const gameState = createSurvivalGameState(localPlayerId, selectedHero);
    engineRef.current = new GameEngine(gameState, localPlayerId);
    renderDataRef.current = engineRef.current.getRenderData();

    const setupAudio = async () => {
      await audioRef.current.initializeAudioContext();
      await audioRef.current.playBackgroundMusic('base');
    };

    setupAudio().catch(() => {
      return;
    });

    return () => {
      audioRef.current.stopBackgroundMusic().catch(() => {
        return;
      });
      audioRef.current.dispose().catch(() => {
        return;
      });
    };
  }, [selectedHero]);

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

  const handleExitConfirm = useCallback(() => {
    setExitDialogVisible(false);
    navigation.navigate('ModeSelect');
  }, [navigation]);

  useFrameCallback(() => {
    if (!engineRef.current) return;

    const localPlayer = engineRef.current.getLocalPlayer();
    if (localPlayer) {
      engineRef.current.updatePlayerMovement(localPlayer.id, leftStick.x, leftStick.y, leftStick.y < -0.35);
      engineRef.current.updatePlayerAim(localPlayer.id, localPlayer.x + rightStick.x * 100, localPlayer.y + rightStick.y * 100);

      if (rightStick.magnitude > 0.3) {
        const bullets = engineRef.current.shoot(localPlayer.id);
        if (bullets && bullets.length > 0) {
          audioRef.current.playWeaponSound(localPlayer.currentWeapon).catch(() => {
            return;
          });
        }
      }
    }

    engineRef.current.update(1 / 60);
    renderDataRef.current = engineRef.current.getRenderData();

    const events = engineRef.current.drainKillEvents();
    if (events.length > 0) {
      events.forEach((event) => {
        killFeedRef.current.addKill(
          event.killerName,
          event.killerTeam,
          event.victimName,
          event.victimTeam,
          event.killType,
          event.weapon,
          true,
        );
      });
      setKillFeedEntries([...killFeedRef.current.getEntries()]);
    }

    killFeedRef.current.update();
    setKillFeedEntries([...killFeedRef.current.getEntries()]);
    tick.value += 1;
  });

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setExitDialogVisible(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  const abilityCooldownPct = renderDataRef.current?.abilityCooldownPct ?? 0;
  const cameraTransform = useMemo(() => [{ translateX: 0 }, { translateY: 0 }], []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Canvas style={{ width, height }}>
        <Group transform={cameraTransform}>
          <MapLayer renderDataRef={renderDataRef} />
          <BulletLayer renderDataRef={renderDataRef} />
          <PlayerLayer renderDataRef={renderDataRef} />
          <ParticleLayer renderDataRef={renderDataRef} />
        </Group>
      </Canvas>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <GameHUD renderDataRef={renderDataRef} />
        <KillFeedUI entries={killFeedEntries} />
        <JoystickControl side="left" onStateChange={handleLeft} />
        <JoystickControl side="right" onStateChange={handleRight} />
        <AbilityButton onPress={handleAbility} cooldownPct={abilityCooldownPct} />

        <TouchableOpacity style={styles.exitBtn} onPress={() => setExitDialogVisible(true)}>
          <Text style={styles.exitText}>X Exit</Text>
        </TouchableOpacity>

        {exitDialogVisible && (
          <View style={styles.dialogOverlay}>
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>Exit Survival?</Text>
              <View style={styles.dialogRow}>
                <Pressable style={styles.dialogBtnCancel} onPress={() => setExitDialogVisible(false)}>
                  <Text style={styles.dialogBtnText}>Keep Playing</Text>
                </Pressable>
                <Pressable style={styles.dialogBtnConfirm} onPress={handleExitConfirm}>
                  <Text style={styles.dialogBtnText}>Exit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  exitBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4f5f70',
    backgroundColor: 'rgba(8,16,28,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  exitText: {
    color: '#e9f3ff',
    fontSize: 13,
    fontWeight: '700',
  },
  dialogOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialog: {
    width: 320,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334b60',
    backgroundColor: '#101a28',
    padding: 14,
  },
  dialogTitle: {
    color: '#eef6ff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  dialogRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogBtnCancel: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3f556b',
    backgroundColor: '#1a2738',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnConfirm: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6a3d46',
    backgroundColor: '#452229',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnText: {
    color: '#f2f7ff',
    fontSize: 14,
    fontWeight: '700',
  },
});
