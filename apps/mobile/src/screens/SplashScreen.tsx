import React, { useEffect, useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, Animated, ActivityIndicator } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { useGameStore } from '../lib/gameStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

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

export default function SplashScreen({ navigation }: Props) {
  const loadPersistedData = useGameStore((state) => state.loadPersistedData);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const initApp = async () => {
      await loadPersistedData();
      setTimeout(() => {
        const playerName = useGameStore.getState().playerName;
        if (!playerName || playerName.trim() === '') {
          navigation.replace('AvatarSetup');
        } else {
          navigation.replace('Home');
        }
      }, 1200);
    };

    initApp();
  }, [fadeAnim, translateYAnim, navigation, loadPersistedData]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
        ]}
      >
        <Text style={styles.title}>AHEMIA</Text>
        <Text style={styles.subtitle}>LOADING GAME</Text>
      </Animated.View>
      <ActivityIndicator size="small" color={COLORS.textMuted} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 40,
    fontWeight: '300',
    letterSpacing: 16,
    marginLeft: 16,
  },
  subtitle: {
    color: COLORS.textMuted,
    marginTop: 14,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  loader: {
    position: 'absolute',
    bottom: 56,
    opacity: 0.45,
  },
});
