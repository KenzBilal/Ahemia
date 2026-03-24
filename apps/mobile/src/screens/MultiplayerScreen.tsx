import React, { useEffect, useRef } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Multiplayer'>;

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

export default function MultiplayerScreen({ navigation }: Props) {
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
          <Text style={styles.title}>LAN</Text>
          <Text style={styles.title}>LOBBY</Text>
          <Text style={styles.subtitle}>HOST OR JOIN A LOCAL WI-FI MATCH.</Text>
        </View>

        <Animated.View style={[styles.rightCol, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Lobby', { mode: 'host' })}>
            <Text style={styles.primaryIndex}>01</Text>
            <View>
              <Text style={styles.primaryTitle}>HOST GAME</Text>
              <Text style={styles.primarySub}>CREATE LOCAL SERVER</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Lobby', { mode: 'join' })}>
            <Text style={styles.secondaryIndex}>02</Text>
            <View>
              <Text style={styles.secondaryTitle}>JOIN GAME</Text>
              <Text style={styles.secondarySub}>SCAN NETWORK</Text>
            </View>
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
    marginBottom: 24,
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
    paddingRight: 40,
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
    width: 420,
    gap: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.text,
    borderRadius: 4,
    paddingVertical: 20,
    paddingHorizontal: 22,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingVertical: 20,
    paddingHorizontal: 22,
  },
  primaryIndex: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 2,
    marginRight: 24,
    width: 24,
  },
  primaryTitle: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 6,
    marginBottom: 4,
  },
  primarySub: {
    color: 'rgba(9,9,11,0.65)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },
  secondaryIndex: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 2,
    marginRight: 24,
    width: 24,
  },
  secondaryTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 6,
    marginBottom: 4,
  },
  secondarySub: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
