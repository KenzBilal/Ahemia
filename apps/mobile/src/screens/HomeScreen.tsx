import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useGameStore } from '../lib/gameStore';
import { PLAYER_SKINS } from '../shared/gameTypes';
import { PlayerAvatar } from '../components/PlayerAvatar';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const COLORS = {
  bg: '#09090B',
  surface: '#18181B',
  border: '#27272A',
  text: '#FAFAFA',
  textMuted: '#A1A1AA',
  primary: '#00E5FF',
  disabled: '#3F3F46',
};

export default function HomeScreen({ navigation }: Props) {
  const { playerName, playerSkin } = useGameStore();
  const { width } = useWindowDimensions();
  const skinConfig = PLAYER_SKINS.find((s) => s.id === playerSkin) || PLAYER_SKINS[0];
  const [avatarPhase, setAvatarPhase] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const id = setInterval(() => {
      setAvatarPhase((prev) => prev + 0.08);
    }, 33);
    return () => clearInterval(id);
  }, []);

  const avatarFrame = useMemo(() => {
    const frameWidth = Math.max(110, Math.min(150, Math.floor(width * 0.24)));
    const frameHeight = Math.round(frameWidth * 1.2);
    return {
      width: frameWidth,
      height: frameHeight,
      scale: (frameWidth / 124) * 2.4,
      centerX: frameWidth / 2,
      centerY: frameHeight / 2,
    };
  }, [width]);

  const avatarAimAngle = Math.sin(avatarPhase * 0.8) * 0.1;
  const avatarFloatY = Math.sin(avatarPhase) * 2.5;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.systemBadge}>
          <View style={[styles.headIcon, { backgroundColor: skinConfig.bodyColor }]} />
          <Text style={styles.systemBadgeText}>AHEMIA OS // V1.0</Text>
        </View>

        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsBtnText}>[ ⚙ ]</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.mainBody, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.operatorPane}>
          <Text style={styles.operatorName}>PLAYER // {(playerName || 'UNKNOWN').toUpperCase()}</Text>

          <View style={styles.avatarPedestal}>
            <View style={[styles.avatarCore, { width: avatarFrame.width, height: avatarFrame.height }]}>
              <Canvas style={styles.avatarCanvas}>
                <Group transform={[{ translateX: avatarFrame.centerX }, { translateY: avatarFrame.centerY + avatarFloatY }, { scale: avatarFrame.scale }]}> 
                  <PlayerAvatar
                    aimAngle={avatarAimAngle}
                    facing={1}
                    primaryColor={skinConfig.bodyColor}
                    skinColor="#FCDCB4"
                    isThrusting={false}
                  />
                </Group>
              </Canvas>
            </View>
            <Text style={styles.avatarLabel}>PLAYER PROFILE</Text>
          </View>
        </View>

        <View style={styles.directivePane}>
          <TouchableOpacity style={styles.primaryCard} onPress={() => navigation.navigate('Multiplayer')}>
            <Text style={styles.primaryCardIndex}>01 // MULTIPLAYER</Text>
            <Text style={styles.primaryCardTitle}>MULTIPLAYER</Text>
            <Text style={styles.primaryCardMeta}>LOCAL WI-FI MATCH</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryCard} onPress={() => navigation.navigate('MapSelect', { mode: 'survival' })}>
            <Text style={styles.secondaryCardIndex}>02 // SURVIVAL</Text>
            <Text style={styles.secondaryCardTitle}>SURVIVAL</Text>
            <Text style={styles.secondaryCardMeta}>OFFLINE MODE</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 36,
    paddingVertical: 28,
  },
  topBar: {
    position: 'absolute',
    top: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headIcon: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  systemBadgeText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  settingsBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  settingsBtnText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  mainBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
  },
  operatorPane: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 32,
  },
  operatorName: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: 12,
    textAlign: 'center',
    marginBottom: 26,
  },
  avatarPedestal: {
    width: '86%',
    maxWidth: 540,
    height: 250,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCore: {
    width: 124,
    height: 148,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
    backgroundColor: '#0C0C0F',
    overflow: 'hidden',
  },
  avatarCanvas: {
    width: '100%',
    height: '100%',
  },
  avatarLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 4,
    fontWeight: '600',
  },
  directivePane: {
    width: 400,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: 16,
  },
  primaryCard: {
    backgroundColor: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.text,
    borderRadius: 4,
    paddingVertical: 20,
    paddingHorizontal: 22,
    minHeight: 142,
    justifyContent: 'space-between',
  },
  secondaryCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingVertical: 20,
    paddingHorizontal: 22,
    minHeight: 142,
    justifyContent: 'space-between',
  },
  primaryCardIndex: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  primaryCardTitle: {
    color: COLORS.bg,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
  },
  primaryCardMeta: {
    color: '#27272A',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  secondaryCardIndex: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  secondaryCardTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
  },
  secondaryCardMeta: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  unusedKeepLegacyStyle: {
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 6,
  },
});
