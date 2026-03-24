import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useGameStore } from '../lib/gameStore';
import Slider from '@react-native-community/slider';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

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

export default function SettingsScreen({ navigation }: Props) {
  const {
    bgmVolume,
    sfxVolume,
    joystickSize,
    joystickSensitivity,
    setBgmVolume,
    setSfxVolume,
    setJoystickSize,
    setJoystickSensitivity,
    playerName,
  } = useGameStore();

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
          <Text style={styles.title}>SYSTEM</Text>
          <Text style={styles.title}>SETTINGS</Text>
          <Text style={styles.subtitle}>ADJUST GAME SETTINGS.</Text>

          <View style={styles.metaBlock}>
            <Text style={styles.label}>01 // ACTIVE CALLSIGN</Text>
            <Text style={styles.metaValue}>{(playerName || 'UNASSIGNED').toUpperCase()}</Text>
          </View>
        </View>

        <Animated.View style={[styles.rightCol, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sectionCard}>
            <Text style={styles.label}>02 // AUDIO MATRIX</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>BGM</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={bgmVolume}
                onValueChange={setBgmVolume}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.border}
                thumbTintColor={COLORS.text}
              />
              <Text style={styles.settingVal}>{Math.round(bgmVolume * 100)}%</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>SFX</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={sfxVolume}
                onValueChange={setSfxVolume}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.border}
                thumbTintColor={COLORS.text}
              />
              <Text style={styles.settingVal}>{Math.round(sfxVolume * 100)}%</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.label}>03 // CONTROL MATRIX</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>SIZE</Text>
              <View style={styles.segmentRow}>
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.segmentBtn, joystickSize === size && styles.segmentBtnActive]}
                    onPress={() => setJoystickSize(size)}
                  >
                    <Text style={[styles.segmentText, joystickSize === size && styles.segmentTextActive]}>
                      {size.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>SENS</Text>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={3.0}
                value={joystickSensitivity}
                onValueChange={setJoystickSensitivity}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.border}
                thumbTintColor={COLORS.text}
              />
              <Text style={styles.settingVal}>{joystickSensitivity.toFixed(1)}X</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.replace('AvatarSetup')}>
            <Text style={styles.secondaryActionText}>EDIT PROFILE</Text>
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
    marginBottom: 20,
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 36,
    marginLeft: 8,
  },
  metaBlock: {
    marginLeft: 8,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    marginBottom: 10,
  },
  metaValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 6,
    fontFamily: 'monospace',
  },
  rightCol: {
    width: 440,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 16,
    gap: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    width: 48,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
    height: 36,
  },
  settingVal: {
    minWidth: 54,
    textAlign: 'right',
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  segmentRow: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    backgroundColor: COLORS.bg,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.text,
  },
  segmentText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  segmentTextActive: {
    color: COLORS.bg,
  },
  secondaryAction: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryActionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
  },
});
