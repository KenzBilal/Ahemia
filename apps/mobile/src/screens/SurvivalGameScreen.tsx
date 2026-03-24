import React, { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Canvas,
  Circle,
  Group,
  Rect,
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AbilityActionButton } from '../components/AbilityActionButton';
import { PlayerHudOverlay } from '../components/PlayerHudOverlay';
import { JoystickControl, JoystickOutputState } from '../components/JoystickControl';
import { KillFeedOverlay } from '../components/KillFeedOverlay';
import { MeleeButton } from '../components/MeleeButton';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { AudioManager } from '../lib/audioManager';
import { GameEngine, RenderData } from '../lib/gameEngine';
import { KillFeed, KillFeedEntry } from '../lib/killFeed';
import { createSurvivalGameState } from '../lib/survivalMode';
import { useGameStore } from '../lib/gameStore';
import { HERO_CONFIGS, HeroType, MAP_CONFIGS, WeaponType } from '../shared/gameTypes';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SurvivalGame'>;

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

            <SkiaText x={-15} y={-36} text={player.name} font={playerFont} color={player.isLocal ? '#FFFF00' : '#FFFFFF'} />

            {player.isInvincible && <Rect x={-18} y={-23} width={36} height={46} color="rgba(255,255,0,0.25)" />}
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
  const setLocalAimAngle = useGameStore((s) => s.setLocalAimAngle);

  const engineRef = useRef<GameEngine | null>(null);
  const renderDataRef = useRef<RenderData | null>(null);
  const killFeedRef = useRef(new KillFeed());
  const audioRef = useRef(new AudioManager());

  const [killFeedEntries, setKillFeedEntries] = useState<KillFeedEntry[]>([]);
  const [leftStick, setLeftStick] = useState<JoystickOutputState>(IDLE_JOYSTICK);
  const [rightStick, setRightStick] = useState<JoystickOutputState>(IDLE_JOYSTICK);
  const [isMeleeing, setIsMeleeing] = useState(false);
  const [exitDialogVisible, setExitDialogVisible] = useState(false);
  const leftStickRef = useRef(leftStick);
  const rightStickRef = useRef(rightStick);
  const meleeRef = useRef(isMeleeing);
  const meleeResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleExitConfirm = useCallback(() => {
    setExitDialogVisible(false);
    navigation.navigate('ModeSelect');
  }, [navigation]);

  useEffect(() => {
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
      }

      killFeedRef.current.update();
      setKillFeedEntries([...killFeedRef.current.getEntries()]);
    }, 16);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setExitDialogVisible(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  const abilityCooldownPct = renderDataRef.current?.abilityCooldownPct ?? 0;
  const cameraTransform = useMemo(() => {
    const rd = renderDataRef.current;
    const local = rd?.players.find((player) => player.isLocal);
    if (!local) {
      return [{ translateX: 0 }, { translateY: 0 }];
    }

    const cameraX = local.x - width / 2;
    const cameraY = local.y - height / 2;
    return [{ translateX: -cameraX }, { translateY: -cameraY }];
  }, [height, killFeedEntries, width]);

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
        <PlayerHudOverlay renderDataRef={renderDataRef} />
        <KillFeedOverlay entries={killFeedEntries} />
        <JoystickControl side="left" onStateChange={handleLeft} />
        <JoystickControl side="right" onStateChange={handleRight} />
        <MeleeButton onPress={handleMeleePress} />
        <View style={styles.actionDock} pointerEvents="box-none">
          <AbilityActionButton onPress={handleAbility} cooldownPct={abilityCooldownPct} />
        </View>

        <TouchableOpacity style={styles.exitBtn} onPress={() => setExitDialogVisible(true)}>
          <Text style={styles.exitText}>SYSTEM.ABORT</Text>
        </TouchableOpacity>

        {exitDialogVisible && (
          <View style={styles.dialogOverlay}>
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>EXIT SURVIVAL?</Text>
              <View style={styles.dialogRow}>
                <Pressable style={styles.dialogBtnCancel} onPress={() => setExitDialogVisible(false)}>
                  <Text style={styles.dialogBtnTextCancel}>KEEP PLAYING</Text>
                </Pressable>
                <Pressable style={styles.dialogBtnConfirm} onPress={handleExitConfirm}>
                  <Text style={styles.dialogBtnText}>EXIT</Text>
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
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  exitText: {
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
  dialogOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialog: {
    width: 320,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 14,
  },
  dialogTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 4,
    marginBottom: 12,
  },
  dialogRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogBtnCancel: {
    flex: 1,
    height: 42,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnConfirm: {
    flex: 1,
    height: 42,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.text,
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  dialogBtnTextCancel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
});
