import React, { useEffect, useMemo, useState, useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View, Animated, useWindowDimensions } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';
import { DiscoveredGame, networkClient } from '../lib/networkClient';
import { useGameStore } from '../lib/gameStore';
import { HeroType, MapType, PLAYER_SKINS } from '../shared/gameTypes';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { multiplayerServer } from '../server/multiplayer';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Lobby'>;

// Premium Minimalist Dark Palette
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

const JOIN_BACKOFF_MS = [3000, 5000, 8000] as const;
const JOIN_MAX_RETRIES = JOIN_BACKOFF_MS.length;

export default function LobbyScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const selectedHero = useGameStore((s) => s.selectedHero);
  const playerSkin = useGameStore((s) => s.playerSkin);
  const playerName = useGameStore((s) => s.playerName) || 'Player';
  const roomId = useGameStore((s) => s.roomId);
  const setLocalPlayerId = useGameStore((s) => s.setLocalPlayerId);
  const setRoomId = useGameStore((s) => s.setRoomId);
  const setIsHost = useGameStore((s) => s.setIsHost);
  const lobbyState = useGameStore((s) => s.lobbyState);
  const setLobbyState = useGameStore((s) => s.setLobbyState);
  const discoveredGames = useGameStore((s) => s.discoveredGames);
  const setDiscoveredGames = useGameStore((s) => s.setDiscoveredGames);
  
  const [ready, setReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanDots, setScanDots] = useState(1);
  const [connectingGameId, setConnectingGameId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasJoinedLobby, setHasJoinedLobby] = useState(false);
  const [avatarPhase, setAvatarPhase] = useState(0);
  const joinRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinAttemptRef = useRef(0);
  const joinAssignedRef = useRef(false);
  const joinTargetRef = useRef<DiscoveredGame | null>(null);

  const canStart = useMemo(() => route.params.mode === 'host', [route.params.mode]);
  const skinConfig = useMemo(() => PLAYER_SKINS.find((s) => s.id === playerSkin) || PLAYER_SKINS[0], [playerSkin]);
  const playerPreview = useMemo(() => {
    const frameWidth = Math.max(52, Math.min(68, Math.floor(width * 0.11)));
    const frameHeight = Math.round(frameWidth * 1.2);
    return {
      width: frameWidth,
      height: frameHeight,
      scale: (frameWidth / 56) * 1.2,
      centerX: frameWidth / 2,
      centerY: frameHeight / 2,
    };
  }, [width]);
  const playerPreviewAim = Math.sin(avatarPhase * 0.85) * 0.08;
  const playerPreviewFloat = Math.sin(avatarPhase) * 1.4;

  // Smooth entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const id = setInterval(() => {
      setAvatarPhase((prev) => prev + 0.08);
    }, 33);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!canStart) {
      return;
    }

    if (route.params.map && route.params.map !== lobbyState.map) {
      setLobbyState({ map: route.params.map });
    }

    if (roomId) {
      return;
    }

    const hero = selectedHero ?? HeroType.TITAN;
    multiplayerServer.start();
    const created = multiplayerServer.createRoom(playerName, hero, (route.params.map ?? lobbyState.map) as MapType);

    setIsHost(true);
    setRoomId(created.roomId);
    setLocalPlayerId(created.playerId);
  }, [canStart, lobbyState.map, playerName, roomId, route.params.map, selectedHero, setIsHost, setLobbyState, setLocalPlayerId, setRoomId]);

  useEffect(() => {
    if (!canStart || !roomId) {
      return;
    }

    networkClient.broadcastLobbyState({
      map: lobbyState.map,
      timeLimit: lobbyState.timeLimit,
    });
  }, [canStart, roomId, lobbyState.map, lobbyState.timeLimit]);

  useEffect(() => {
    if (route.params.mode !== 'join') return;

    setIsScanning(true);
    setErrorMessage(null);

    const gamesMap = new Map<string, DiscoveredGame>();
    networkClient.scanGames((service) => {
      gamesMap.set(service.id, service);
      setDiscoveredGames(Array.from(gamesMap.values()));
    });

    const dotsInterval = setInterval(() => {
      setScanDots((prev) => (prev % 3) + 1);
    }, 420);

    const clearJoinRetryTimer = () => {
      if (joinRetryTimerRef.current) {
        clearTimeout(joinRetryTimerRef.current);
        joinRetryTimerRef.current = null;
      }
    };

    const failJoinHandshake = () => {
      clearJoinRetryTimer();
      joinAssignedRef.current = false;
      joinTargetRef.current = null;
      setConnectingGameId(null);
      setErrorMessage('Connection timed out. Try again.');
    };

    const scheduleJoinWatchdog = () => {
      clearJoinRetryTimer();
      const nextDelay = JOIN_BACKOFF_MS[Math.max(0, joinAttemptRef.current - 1)] ?? JOIN_BACKOFF_MS[JOIN_BACKOFF_MS.length - 1];
      joinRetryTimerRef.current = setTimeout(() => {
        if (joinAssignedRef.current || !joinTargetRef.current) {
          return;
        }

        if (joinAttemptRef.current >= JOIN_MAX_RETRIES) {
          failJoinHandshake();
          return;
        }

        joinAttemptRef.current += 1;
        networkClient.sendJoin(
          joinTargetRef.current.name,
          playerName,
          selectedHero ?? HeroType.TITAN,
        );
        scheduleJoinWatchdog();
      }, nextDelay);
    };

    networkClient.onMessage((msg) => {
      if (msg.t !== 'EVENT') return;

      if (msg.evt === 'PLAYER_ASSIGNED') {
        const assigned = String(msg.data?.playerId ?? '');
        const roomId = String(msg.data?.roomId ?? '');
        if (assigned) {
          clearJoinRetryTimer();
          joinAssignedRef.current = true;
          setHasJoinedLobby(true);
          console.log('Assigned local player id:', assigned);
          setLocalPlayerId(assigned);
          setRoomId(roomId || null);
          setIsHost(false);
        }
        return;
      }

      if (msg.evt === 'GAME_START') {
        if (!joinAssignedRef.current && route.params.mode === 'join') {
          scheduleJoinWatchdog();
          return;
        }

        clearJoinRetryTimer();
        setConnectingGameId(null);
        const roomId = String(msg.data?.roomId ?? '');
        navigation.replace('Game', {
          mode: 'join',
          roomId: roomId || undefined,
        });
        return;
      }

      if (msg.evt === 'GAME_END') {
        clearJoinRetryTimer();
        joinAssignedRef.current = false;
        joinTargetRef.current = null;
        const reason = String(msg.data?.reason ?? '').toLowerCase();
        if (reason === 'game_full') setErrorMessage('Room is full.');
        else if (reason === 'host_left') setErrorMessage('Host left the game.');
        setConnectingGameId(null);
      }
    });

    return () => {
      clearJoinRetryTimer();
      clearInterval(dotsInterval);
      setIsScanning(false);
      networkClient.stopScan();
    };
  }, [navigation, playerName, route.params.mode, selectedHero, setDiscoveredGames, setIsHost, setLocalPlayerId, setRoomId]);

  const handleJoin = (game: DiscoveredGame) => {
    if (connectingGameId) {
      return;
    }

    setErrorMessage(null);
    setConnectingGameId(game.id);
    setIsHost(false);
    joinAttemptRef.current = 1;
    joinAssignedRef.current = false;
    joinTargetRef.current = game;
    networkClient.connect(game.host, game.port);
    networkClient.sendJoin(game.name, playerName, selectedHero ?? HeroType.TITAN);

    const scheduleRetry = () => {
      if (joinRetryTimerRef.current) {
        clearTimeout(joinRetryTimerRef.current);
      }

      const nextDelay = JOIN_BACKOFF_MS[Math.max(0, joinAttemptRef.current - 1)] ?? JOIN_BACKOFF_MS[JOIN_BACKOFF_MS.length - 1];

      joinRetryTimerRef.current = setTimeout(() => {
        if (joinAssignedRef.current || !joinTargetRef.current) {
          return;
        }

        if (joinAttemptRef.current >= JOIN_MAX_RETRIES) {
          setConnectingGameId(null);
          setErrorMessage('Connection timed out. Try again.');
          joinTargetRef.current = null;
          return;
        }

        joinAttemptRef.current += 1;
        networkClient.sendJoin(
          joinTargetRef.current.name,
          playerName,
          selectedHero ?? HeroType.TITAN,
        );
        scheduleRetry();
      }, nextDelay);
    };

    scheduleRetry();
  };

  const handleHostStart = () => {
    if (!roomId) {
      return;
    }

    multiplayerServer.startGame(roomId);
    navigation.replace('Game', {
      roomId,
      mode: 'host',
    });
  };

  const handleTimeCycle = () => {
    const options = [5, 10, 15] as const;
    const currentIndex = options.indexOf(lobbyState.timeLimit as (typeof options)[number]);
    const next = currentIndex === -1 ? 10 : options[(currentIndex + 1) % options.length];
    setLobbyState({ timeLimit: next });
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.replace('ModeSelect');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>{'< BACK'}</Text>
        </Pressable>
      </View>

      <View style={styles.mainBody}>
        <View style={styles.leftCol}>
          <Text style={styles.title}>MULTIPLAYER</Text>
          <Text style={styles.title}>LOBBY</Text>
          <Text style={styles.subtitle}>WAITING FOR PLAYERS.</Text>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>01 // MATCH SETTINGS</Text>
            <View style={styles.parameterGrid}>
              {canStart ? (
                <Pressable style={styles.parameterButton} onPress={() => navigation.navigate('MapSelect', { mode: 'multiplayer' })}>
                  <Text style={styles.parameterButtonText}>MAP: {lobbyState.map.toUpperCase()} [CHANGE]</Text>
                </Pressable>
              ) : (
                <Text style={styles.parameterItem}>MAP: {lobbyState.map.toUpperCase()}</Text>
              )}
              <Text style={styles.parameterItem}>MODE: DEATHMATCH</Text>
              <Text style={styles.parameterItem}>KILLS: 20</Text>
              {canStart ? (
                <Pressable style={styles.parameterButton} onPress={handleTimeCycle}>
                  <Text style={styles.parameterButtonText}>TIME: {lobbyState.timeLimit} MIN [CHANGE]</Text>
                </Pressable>
              ) : (
                <Text style={styles.parameterItem}>TIME: {lobbyState.timeLimit} MIN</Text>
              )}
            </View>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>02 // PLAYER</Text>
            <View style={styles.playerCard}>
              <View>
                <Text style={styles.playerName}>YOU</Text>
                <Text style={styles.playerMeta}>{selectedHero ? String(selectedHero).toUpperCase() : 'UNASSIGNED'}</Text>
              </View>
              <View style={[styles.playerAvatarFrame, { width: playerPreview.width, height: playerPreview.height }]}>
                <Canvas style={styles.playerAvatarCanvas}>
                  <Group transform={[{ translateX: playerPreview.centerX }, { translateY: playerPreview.centerY + playerPreviewFloat }, { scale: playerPreview.scale }]}> 
                    <PlayerAvatar
                      aimAngle={playerPreviewAim}
                      facing={1}
                      primaryColor={skinConfig.bodyColor}
                      skinColor="#FCDCB4"
                      isThrusting={false}
                    />
                  </Group>
                </Canvas>
              </View>
              <View style={[styles.statusBadge, ready ? styles.statusReady : styles.statusNotReady]}>
                <Text style={[styles.statusText, ready && styles.statusTextReady]}>
                  {ready ? 'READY' : 'NOT READY'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Animated.View style={[styles.rightCol, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {route.params.mode === 'join' ? (
            <View style={styles.networkSection}>
              <View style={styles.scanHeader}>
                <Text style={styles.label}>03 // LOCAL NETWORK</Text>
                <Text style={styles.scanStatusText}>
                  {isScanning ? `SCANNING${'.'.repeat(scanDots)}` : 'OFFLINE'}
                </Text>
              </View>

              {errorMessage && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>ERROR: {String(errorMessage).toUpperCase()}</Text>
                </View>
              )}

              {!hasJoinedLobby ? (
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                  {discoveredGames.map((game) => {
                    const isConnecting = connectingGameId === game.id;
                    return (
                      <Pressable
                        key={game.id}
                        style={[styles.gameItem, isConnecting && styles.gameItemConnecting]}
                        onPress={() => handleJoin(game)}
                      >
                        <View>
                          <Text style={styles.gameName}>{String(game.name).toUpperCase()}</Text>
                          <Text style={styles.gameMeta}>{game.host}:{game.port}</Text>
                        </View>
                        <Text style={[styles.actionText, isConnecting && styles.actionTextConnecting]}>
                          {isConnecting ? 'JOINING...' : 'JOIN'}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {isScanning && discoveredGames.length === 0 && (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>NO ACTIVE HOST DETECTED.</Text>
                    </View>
                  )}
                </ScrollView>
              ) : (
                <View style={styles.waitingPanel}>
                  <Text style={styles.waitingPanelText}>CONNECTED TO HOST.</Text>
                  <Text style={styles.waitingPanelSubtext}>LOBBY SETTINGS ARE READ-ONLY.</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {canStart ? (
            <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={handleHostStart}>
              <Text style={[styles.actionBtnText, styles.textInverse]}>INITIALIZE DROP</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.actionBtn, styles.actionBtnDisabled]} disabled>
              <Text style={[styles.actionBtnText, styles.actionBtnTextDisabled]}>WAITING FOR HOST DEPLOYMENT...</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 48,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 24,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backBtnText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  mainBody: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
    paddingRight: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 56,
    fontWeight: '300',
    color: COLORS.text,
    letterSpacing: 16,
    lineHeight: 62,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 6,
    marginTop: 16,
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  infoBlock: {
    marginBottom: 32,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  parameterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    columnGap: 16,
  },
  parameterItem: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    width: '46%',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  parameterButton: {
    width: '46%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  parameterButtonText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 16,
  },
  playerAvatarFrame: {
    width: 56,
    height: 68,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#0C0C0F',
    overflow: 'hidden',
  },
  playerAvatarCanvas: {
    width: '100%',
    height: '100%',
  },
  playerName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  playerMeta: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusReady: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderColor: COLORS.primary,
  },
  statusNotReady: {
    backgroundColor: 'transparent',
    borderColor: COLORS.disabled,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  statusTextReady: {
    color: COLORS.primary,
  },
  rightCol: {
    width: 400,
    justifyContent: 'space-between',
  },
  networkSection: {
    flex: 1,
    marginBottom: 24,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanStatusText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  errorBox: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 42, 85, 0.1)',
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 12,
  },
  gameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  gameItemConnecting: {
    borderColor: COLORS.primary,
  },
  gameName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  gameMeta: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  actionText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  actionTextConnecting: {
    color: COLORS.primary,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 4,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  waitingPanel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    padding: 16,
    gap: 8,
  },
  waitingPanelText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  waitingPanelSubtext: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  actionBtn: {
    paddingVertical: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  actionBtnDisabled: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  actionBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 6,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  actionBtnTextDisabled: {
    color: COLORS.textMuted,
    letterSpacing: 3,
    fontSize: 11,
  },
  textInverse: {
    color: COLORS.bg,
  },
});