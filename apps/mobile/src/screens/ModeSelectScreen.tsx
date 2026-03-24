import React, { useEffect, useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ModeSelect'>;

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

export default function ModeSelectScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{'< BACK'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainBody}>
        <View style={styles.leftCol}>
          <Text style={styles.title}>SELECT</Text>
          <Text style={styles.title}>MODE</Text>
          <Text style={styles.subtitle}>CHOOSE A GAME MODE.</Text>
        </View>

        <Animated.View style={[styles.rightCol, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.primaryCard} onPress={() => navigation.navigate('Multiplayer')}>
            <Text style={styles.primaryIndex}>01</Text>
            <Text style={styles.primaryTitle}>LAN LOBBY</Text>
            <Text style={styles.primarySub}>LOCAL WI-FI MULTIPLAYER.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryCard} onPress={() => navigation.navigate('MapSelect', { mode: 'survival' })}>
            <Text style={styles.secondaryIndex}>02</Text>
            <Text style={styles.secondaryTitle}>SURVIVAL MODE</Text>
            <Text style={styles.secondarySub}>OFFLINE PLAY.</Text>
          </TouchableOpacity>
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
    marginBottom: 28,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backBtnText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
  },
  mainBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
    paddingRight: 42,
  },
  title: {
    fontSize: 56,
    fontWeight: '300',
    color: COLORS.text,
    letterSpacing: 16,
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 6,
    marginTop: 16,
    marginLeft: 8,
  },
  rightCol: {
    width: 430,
    gap: 14,
  },
  primaryCard: {
    height: 140,
    padding: 22,
    backgroundColor: COLORS.text,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.text,
    justifyContent: 'space-between',
  },
  secondaryCard: {
    height: 140,
    padding: 22,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
  },
  primaryIndex: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 2,
  },
  primaryTitle: {
    color: COLORS.bg,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 6,
  },
  primarySub: {
    color: 'rgba(9,9,11,0.65)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  secondaryIndex: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 2,
  },
  secondaryTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 6,
  },
  secondarySub: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
