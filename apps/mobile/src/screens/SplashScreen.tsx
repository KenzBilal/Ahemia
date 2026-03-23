import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

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

export default function SplashScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ahemia</Text>
      <Text style={styles.subtitle}>choose your hero. fight for glory.</Text>

      <Pressable style={styles.startButton} onPress={() => navigation.navigate('ModeSelect')}>
        <Text style={styles.startButtonText}>START</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 66,
    fontWeight: '500',
    letterSpacing: 1,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
    marginBottom: 30,
  },
  startButton: {
    height: 54,
    minWidth: 180,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: COLORS.btnText,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.8,
  },
});
