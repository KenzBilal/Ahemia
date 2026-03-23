import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ModeSelect'>;

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

export default function ModeSelectScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={styles.cardsRow}>
        <Pressable style={[styles.modeCard, styles.multiplayerCard]} onPress={() => navigation.navigate('Multiplayer')}>
          <Text style={[styles.icon, styles.multiplayerAccent]}>Wi-Fi</Text>
          <Text style={[styles.cardTitle, styles.multiplayerAccent]}>Multiplayer</Text>
          <Text style={styles.cardSubtitle}>Play with friends on local Wi-Fi</Text>
        </Pressable>

        <Pressable style={[styles.modeCard, styles.survivalCard]} onPress={() => navigation.navigate('SurvivalGame')}>
          <Text style={[styles.icon, styles.survivalAccent]}>Solo</Text>
          <Text style={[styles.cardTitle, styles.survivalAccent]}>Survival</Text>
          <Text style={styles.cardSubtitle}>Solo free roam - test your skills</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    zIndex: 10,
  },
  backText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  cardsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -12,
  },
  modeCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flex: 1,
    borderRadius: 16,
    padding: 28,
    marginHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiplayerCard: {},
  survivalCard: {},
  icon: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
  },
  multiplayerAccent: {
    color: COLORS.accent,
  },
  survivalAccent: {
    color: COLORS.accentAlt,
  },
});
