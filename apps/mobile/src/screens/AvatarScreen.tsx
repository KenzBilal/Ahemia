import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Animated, useWindowDimensions } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useGameStore } from '../lib/gameStore';
import { PLAYER_SKINS } from '../shared/gameTypes';
import { PlayerAvatar } from '../components/PlayerAvatar';

type Props = NativeStackScreenProps<RootStackParamList, 'AvatarSetup'>;

const COLORS = {
  bg: '#09090B',
  surface: '#18181B',
  border: '#27272A',
  text: '#FAFAFA',
  textMuted: '#A1A1AA',
  primary: '#00E5FF',
  disabled: '#3F3F46',
};

export default function AvatarScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const [name, setName] = useState('');
  const [selectedSkinId, setSelectedSkinId] = useState(PLAYER_SKINS[0].id);
  const [avatarPhase, setAvatarPhase] = useState(0);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const setPlayerSkin = useGameStore((state) => state.setPlayerSkin);

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

  const isValid = name.trim().length > 0;
  const selectedSkin = PLAYER_SKINS.find((skin) => skin.id === selectedSkinId) || PLAYER_SKINS[0];
  const previewFrame = useMemo(() => {
    const frameWidth = Math.max(108, Math.min(148, Math.floor(width * 0.24)));
    const frameHeight = Math.round(frameWidth * 1.2);
    return {
      width: frameWidth,
      height: frameHeight,
      scale: (frameWidth / 124) * 2.4,
      centerX: frameWidth / 2,
      centerY: frameHeight / 2,
    };
  }, [width]);
  const previewAimAngle = Math.sin(avatarPhase * 0.9) * 0.1;
  const previewFloatY = Math.sin(avatarPhase) * 2.5;

  const handleComplete = () => {
    if (!isValid) return;
    setPlayerName(name.trim().toUpperCase());
    setPlayerSkin(selectedSkinId);
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{'< SYSTEM.RETURN'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainBody}>
        <View style={styles.leftCol}>
          <Text style={styles.title}>PLAYER</Text>
          <Text style={styles.title}>PROFILE</Text>
          <Text style={styles.subtitle}>SET UP YOUR PROFILE.</Text>
        </View>

        <Animated.View style={[styles.rightCol, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.formSection}>
            <Text style={styles.label}>01 // CALLSIGN</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="ENTER NAME"
              placeholderTextColor={COLORS.disabled}
              maxLength={12}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>02 // SKIN</Text>
            <View style={[styles.previewFrame, { width: previewFrame.width, height: previewFrame.height }]}>
              <Canvas style={styles.previewCanvas}>
                <Group transform={[{ translateX: previewFrame.centerX }, { translateY: previewFrame.centerY + previewFloatY }, { scale: previewFrame.scale }]}> 
                  <PlayerAvatar
                    aimAngle={previewAimAngle}
                    facing={1}
                    primaryColor={selectedSkin.bodyColor}
                    skinColor="#FCDCB4"
                    isThrusting={false}
                  />
                </Group>
              </Canvas>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skinListContainer}>
              {PLAYER_SKINS.map((skin) => {
                const isSelected = selectedSkinId === skin.id;
                return (
                  <TouchableOpacity
                    key={skin.id}
                    style={[styles.skinWrapper, isSelected && styles.skinWrapperSelected]}
                    onPress={() => setSelectedSkinId(skin.id)}
                  >
                    <View style={[styles.skinSwatch, { backgroundColor: skin.bodyColor }]} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
            onPress={handleComplete}
            disabled={!isValid}
          >
            <Text style={[styles.submitButtonText, !isValid && styles.submitButtonTextDisabled]}>
              SAVE PROFILE
            </Text>
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
  topBar: {
    position: 'absolute',
    top: 24,
    left: 48,
    zIndex: 10,
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
    paddingTop: 20,
  },
  leftCol: {
    flex: 1,
    paddingRight: 40,
    justifyContent: 'center',
  },
  title: {
    textTransform: 'uppercase',
    fontSize: 56,
    fontWeight: '300',
    color: COLORS.text,
    letterSpacing: 16,
    marginLeft: 8,
  },
  subtitle: {
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 6,
    marginTop: 16,
    marginLeft: 8,
  },
  rightCol: {
    width: 400,
    gap: 32,
    alignSelf: 'center',
  },
  formSection: {
    gap: 12,
  },
  label: {
    textTransform: 'uppercase',
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    color: COLORS.text,
    fontSize: 16,
    letterSpacing: 8,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  skinListContainer: {
    gap: 12,
  },
  previewFrame: {
    width: 124,
    height: 148,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#0C0C0F',
    overflow: 'hidden',
    marginBottom: 12,
  },
  previewCanvas: {
    width: '100%',
    height: '100%',
  },
  skinWrapper: {
    width: 48,
    height: 48,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  skinWrapperSelected: {
    borderColor: COLORS.text,
  },
  skinSwatch: {
    width: 30,
    height: 30,
    borderRadius: 4,
  },
  submitButton: {
    backgroundColor: COLORS.text,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  submitButtonText: {
    textTransform: 'uppercase',
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 5,
  },
  submitButtonTextDisabled: {
    textTransform: 'uppercase',
    color: COLORS.disabled,
  },
});
