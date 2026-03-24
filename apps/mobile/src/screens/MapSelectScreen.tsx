import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MAP_META_LIST, MapMeta } from '../shared/gameTypes';
import { RootStackParamList } from '../types/navigation';
import { useGameStore } from '../lib/gameStore';

type Props = NativeStackScreenProps<RootStackParamList, 'MapSelect'>;

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

const SIZE_LABELS: Record<MapMeta['size'], string> = {
  small: 'SMALL',
  medium: 'MEDIUM',
  large: 'LARGE',
};

export default function MapSelectScreen({ navigation, route }: Props) {
  const { mode } = route.params;
  const maps = MAP_META_LIST;
  const setLobbyState = useGameStore((s) => s.setLobbyState);

  const firstSelectableIndex = useMemo(() => maps.findIndex((m) => !m.isLocked), [maps]);
  const [selectedIndex, setSelectedIndex] = useState(firstSelectableIndex >= 0 ? firstSelectableIndex : 0);

  const selected = maps[selectedIndex];
  const selectedImage = (selected as unknown as { image?: any }).image;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleNext = () => setSelectedIndex((prev) => (prev + 1) % maps.length);
  const handlePrev = () => setSelectedIndex((prev) => (prev - 1 + maps.length) % maps.length);

  const handleConfirm = () => {
    if (!selected || selected.isLocked) return;

    if (mode === 'multiplayer') {
      setLobbyState({ map: selected.type });
      navigation.goBack();
      return;
    }

    navigation.navigate('SurvivalGame', { mapType: selected.type });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>{'< BACK'}</Text>
      </TouchableOpacity>

      <View style={styles.mainBody}>
        <View style={styles.leftCol}>
          <Text style={styles.title}>MAP</Text>
          <Text style={styles.title}>SELECTION</Text>
          <Text style={styles.subtitle}>CHOOSE DEPLOYMENT AREA.</Text>

          <View style={styles.metaBlock}>
            <Text style={styles.label}>01 // NAME</Text>
            <Text style={styles.mapName}>{selected.displayName.toUpperCase()}</Text>
          </View>

          <View style={styles.metaBlock}>
            <Text style={styles.label}>02 // DETAILS</Text>
            <Text style={styles.monoText}>SIZE: {SIZE_LABELS[selected.size]}</Text>
            <Text style={styles.monoText}>PLAYERS: {String(selected.recommendedPlayers).toUpperCase()}</Text>
          </View>

          <View style={styles.metaBlock}>
            <Text style={styles.label}>03 // INFO</Text>
            <Text style={styles.infoText}>{selected.description.toUpperCase()}</Text>
          </View>
        </View>

        <Animated.View style={[styles.rightCol, { opacity: fadeAnim }]}>
          <View style={styles.previewContainer}>
            {selectedImage ? (
              <Image source={selectedImage} style={styles.previewImage} resizeMode="cover" />
            ) : null}

            <View style={styles.blueprintOverlay}>
              <View style={styles.blueprintGridLineH} />
              <View style={styles.blueprintGridLineV} />
              <View style={styles.platformBarWide} />
              <View style={styles.platformBarMid} />
              <View style={styles.platformBarSmall} />
              <View style={styles.groundStrip} />
            </View>

            {selected.isLocked && (
              <View style={styles.lockedOverlay}>
                <Text style={styles.lockedText}>LOCKED</Text>
              </View>
            )}
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.cycleButton} onPress={handlePrev}>
              <Text style={styles.cycleButtonText}>{'<'}</Text>
            </TouchableOpacity>

            <Text style={styles.indexText}>
              {`0${selectedIndex + 1}`} <Text style={styles.indexTotal}>{`/ 0${maps.length}`}</Text>
            </Text>

            <TouchableOpacity style={styles.cycleButton} onPress={handleNext}>
              <Text style={styles.cycleButtonText}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, selected.isLocked && styles.disabledButton]}
            onPress={handleConfirm}
            disabled={selected.isLocked}
          >
            <Text style={[styles.primaryText, selected.isLocked && styles.disabledText]}>
              {selected.isLocked ? 'LOCKED' : 'CONFIRM MAP'}
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
    padding: 32,
  },
  backBtn: {
    position: 'absolute',
    top: 32,
    left: 32,
    paddingVertical: 8,
    zIndex: 20,
  },
  backBtnText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  mainBody: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
    paddingRight: 42,
    justifyContent: 'center',
  },
  title: {
    fontSize: 56,
    fontWeight: '300',
    color: COLORS.text,
    letterSpacing: 16,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 6,
    marginTop: 16,
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  metaBlock: {
    marginBottom: 26,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  mapName: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
  monoText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    marginBottom: 6,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
  },
  infoText: {
    color: COLORS.text,
    fontSize: 11,
    lineHeight: 20,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  rightCol: {
    width: 440,
    justifyContent: 'flex-end',
    gap: 16,
  },
  previewContainer: {
    height: 260,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    opacity: 0.12,
    tintColor: COLORS.disabled,
  },
  blueprintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 24, 27, 0.94)',
  },
  blueprintGridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '45%',
    height: 1,
    backgroundColor: '#27272A',
  },
  blueprintGridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '52%',
    width: 1,
    backgroundColor: '#27272A',
  },
  platformBarWide: {
    position: 'absolute',
    left: '16%',
    top: '26%',
    width: '38%',
    height: 6,
    borderRadius: 4,
    backgroundColor: '#3F3F46',
  },
  platformBarMid: {
    position: 'absolute',
    right: '14%',
    top: '48%',
    width: '32%',
    height: 6,
    borderRadius: 4,
    backgroundColor: '#3F3F46',
  },
  platformBarSmall: {
    position: 'absolute',
    left: '28%',
    top: '62%',
    width: '20%',
    height: 6,
    borderRadius: 4,
    backgroundColor: '#3F3F46',
  },
  groundStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 24,
    backgroundColor: '#27272A',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 9, 11, 0.82)',
    borderWidth: 1,
    borderColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedText: {
    color: COLORS.danger,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cycleButton: {
    width: 58,
    height: 58,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  indexText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 6,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  indexTotal: {
    color: COLORS.textMuted,
  },
  primaryButton: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.text,
    backgroundColor: COLORS.text,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  primaryText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  disabledText: {
    color: COLORS.disabled,
  },
});
