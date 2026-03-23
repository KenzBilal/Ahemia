import React, { useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DiscoveredGame, networkClient } from '../lib/networkClient';
import { useGameStore } from '../lib/gameStore';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Lobby'>;

export default function LobbyScreen({ navigation, route }: Props) {
  const selectedHero = useGameStore((s) => s.selectedHero);
  const discoveredGames = useGameStore((s) => s.discoveredGames);
  const setDiscoveredGames = useGameStore((s) => s.setDiscoveredGames);
  const [ready, setReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanDots, setScanDots] = useState(1);
  const [connectingGameId, setConnectingGameId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (route.params.mode !== 'join') {
      return;
    }

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

    networkClient.onMessage((msg) => {
      if (msg.t !== 'EVENT') {
        return;
      }

      if (msg.evt === 'GAME_START') {
        setConnectingGameId(null);
        navigation.replace('Game');
        return;
      }

      if (msg.evt === 'GAME_END') {
        const reason = String(msg.data?.reason ?? '').toLowerCase();
        if (reason === 'game_full') {
          setErrorMessage('Game full');
        } else if (reason === 'host_left') {
          setErrorMessage('Host left');
        }
        setConnectingGameId(null);
      }
    });

    return () => {
      clearInterval(dotsInterval);
      setIsScanning(false);
      networkClient.stopScan();
    };
  }, [navigation, route.params.mode, setDiscoveredGames]);

  const canStart = useMemo(() => route.params.mode === 'host', [route.params.mode]);

  const handleJoin = (game: DiscoveredGame) => {
    setErrorMessage(null);
    setConnectingGameId(game.id);
    networkClient.connect(game.host, game.port);
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
      <View style={styles.leftColumn}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.sectionTitle}>Players</Text>
        <View style={styles.playerCard}>
          <Text style={styles.playerName}>You</Text>
          <Text style={styles.playerMeta}>{selectedHero ?? 'No hero selected'}</Text>
          <Text style={styles.playerMeta}>{ready ? 'Ready' : 'Not Ready'}</Text>
        </View>
      </View>

      <View style={styles.rightColumn}>
        <Text style={styles.sectionTitle}>Match Settings</Text>
        <Text style={styles.setting}>Map: Base</Text>
        <Text style={styles.setting}>Mode: Deathmatch</Text>
        <Text style={styles.setting}>Kill Limit: 20</Text>
        <Text style={styles.setting}>Time Limit: 10m</Text>

        {route.params.mode === 'join' && (
          <View style={styles.discoveryBox}>
            <Text style={styles.sectionTitle}>LAN Games</Text>

            <View style={styles.scanRow}>
              <View style={styles.scanDot} />
              <Text style={styles.scanText}>
                {isScanning ? `Scanning${'.'.repeat(scanDots)}` : 'Scan stopped'}
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <ScrollView style={{ maxHeight: 150 }}>
              {discoveredGames.map((game) => (
                <Pressable
                  key={game.id}
                  style={styles.gameItem}
                  onPress={() => handleJoin(game)}
                >
                  <Text style={styles.gameName}>{game.name}</Text>
                  <Text style={styles.gameMeta}>{game.host}:{game.port}</Text>
                  {connectingGameId === game.id ? <Text style={styles.connectingText}>Connecting...</Text> : null}
                </Pressable>
              ))}
              {discoveredGames.length === 0 ? <Text style={styles.emptyText}>No lobbies found yet.</Text> : null}
            </ScrollView>
          </View>
        )}

        {canStart ? (
          <Pressable style={styles.startButton} onPress={() => navigation.replace('Game')}>
            <Text style={styles.buttonText}>Start Game</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.readyButton} onPress={() => setReady((prev) => !prev)}>
            <Text style={styles.buttonText}>{ready ? 'Unready' : 'Ready'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a111b',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  leftColumn: {
    flex: 1,
    backgroundColor: '#121b28',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2e4259',
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#111927',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2e4259',
  },
  sectionTitle: {
    color: '#f0f7ff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3f546b',
    backgroundColor: '#0f1a27',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  backButtonText: {
    color: '#d9e8f8',
    fontSize: 14,
    fontWeight: '700',
  },
  playerCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#35516d',
    backgroundColor: '#081019',
    padding: 10,
  },
  playerName: {
    color: '#e8f4ff',
    fontSize: 16,
    fontWeight: '700',
  },
  playerMeta: {
    color: '#94adc7',
    marginTop: 4,
    fontSize: 12,
  },
  setting: {
    color: '#c8d9ec',
    marginBottom: 4,
  },
  discoveryBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#35516d',
    backgroundColor: '#0a1420',
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  scanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00cf7d',
  },
  scanText: {
    color: '#9ec3e3',
    fontSize: 12,
    fontWeight: '600',
  },
  errorBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7b2f37',
    backgroundColor: '#2a1318',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  errorText: {
    color: '#ffb8c1',
    fontSize: 12,
    fontWeight: '700',
  },
  gameItem: {
    borderWidth: 1,
    borderColor: '#35516d',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  gameName: {
    color: '#eff7ff',
    fontWeight: '700',
  },
  gameMeta: {
    color: '#86a5c2',
    fontSize: 12,
    marginTop: 2,
  },
  connectingText: {
    color: '#6fe8bf',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyText: {
    color: '#7f9ab8',
    fontSize: 12,
    marginTop: 2,
  },
  startButton: {
    marginTop: 'auto',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#00cf7d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyButton: {
    marginTop: 'auto',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#008ad4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#f8fcff',
    fontSize: 17,
    fontWeight: '800',
  },
});
