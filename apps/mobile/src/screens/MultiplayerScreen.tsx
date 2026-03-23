import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Multiplayer'>;

const COLORS = {
  bg: '#0a0a0a',
  card: '#111827',
  cardBorder: '#1f2937',
  textPrimary: '#ffffff',
  textMuted: '#6b7280',
  accent: '#3b82f6',
  accentAlt: '#10b981',
  danger: '#ef4444',
  btnText: '#ffffff',
};

export default function MultiplayerScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Multiplayer</Text>
      <Text style={styles.subtitle}>Host or join a local match</Text>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Lobby', { mode: 'host' })}>
          <Text style={styles.buttonText}>Host Game</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Lobby', { mode: 'join' })}>
          <Text style={styles.buttonText}>Join Game</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
  },
  backText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 44,
    fontWeight: '500',
    letterSpacing: 1,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '400',
    marginTop: 8,
    marginBottom: 26,
  },
  actions: {
    width: 420,
    gap: 14,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.btnText,
    fontSize: 18,
    fontWeight: '500',
  },
});
