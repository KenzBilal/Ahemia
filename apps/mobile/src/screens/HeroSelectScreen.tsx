import React, { useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useGameStore } from '../lib/gameStore';
import { HERO_CONFIGS, HeroType } from '../shared/gameTypes';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'HeroSelect'>;

const HEROES = Object.values(HERO_CONFIGS);

export default function HeroSelectScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const setSelectedHero = useGameStore((s) => s.setSelectedHero);
  const [selected, setSelected] = useState<HeroType>(HeroType.TITAN);

  const columns = useMemo(() => {
    if (width >= 1100) return 5;
    if (width >= 820) return 4;
    return 3;
  }, [width]);
  const gap = 10;
  const tileWidth = useMemo(() => Math.floor((width - 44 - gap * (columns - 1)) / columns), [columns, gap, width]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.replace('Home');
  };

  const confirm = async () => {
    setSelectedHero(selected);
    await AsyncStorage.setItem('selectedHero', selected);
    navigation.navigate('Lobby', { mode: route.params.mode });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.header}>Choose Avatar</Text>
      </View>

      <View style={styles.selectedHeroRow}>
        <View style={[styles.heroDot, { backgroundColor: HERO_CONFIGS[selected].color }]} />
        <Text style={styles.selectedHeroName}>{HERO_CONFIGS[selected].name}</Text>
        <Text style={styles.selectedHeroMeta}>{HERO_CONFIGS[selected].role.toUpperCase()}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {HEROES.map((hero) => {
            const isSelected = hero.id === selected;
            return (
              <Pressable
                key={hero.id}
                style={[
                  styles.tile,
                  {
                    width: tileWidth,
                    borderColor: isSelected ? hero.color : '#2a3446',
                    backgroundColor: isSelected ? '#132234' : '#101724',
                  },
                ]}
                onPress={() => setSelected(hero.id)}
              >
                <View style={styles.tileHeader}>
                  <View style={[styles.heroDot, { backgroundColor: hero.color }]} />
                  <Text numberOfLines={1} style={styles.tileName}>{hero.name}</Text>
                </View>
                <Text style={styles.tileRole}>{hero.role.toUpperCase()}</Text>
                <Text style={styles.tileWeapon}>{hero.primaryWeapon}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Pressable style={styles.confirmButton} onPress={confirm}>
        <Text style={styles.confirmText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a111b',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  backButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3d5268',
    backgroundColor: '#0f1b2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#dbe8f7',
    fontSize: 13,
    fontWeight: '700',
  },
  header: {
    color: '#f0f7ff',
    fontSize: 22,
    fontWeight: '800',
  },
  selectedHeroRow: {
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0f1a2a',
    borderWidth: 1,
    borderColor: '#2f4660',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  selectedHeroName: {
    color: '#eaf3fd',
    fontSize: 14,
    fontWeight: '700',
  },
  selectedHeroMeta: {
    color: '#88a4c2',
    fontSize: 11,
    marginLeft: 'auto',
  },
  scrollContent: {
    paddingBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 86,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  tileName: {
    color: '#f2f8ff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  tileRole: {
    color: '#7ea2c8',
    fontSize: 10,
    marginTop: 6,
  },
  tileWeapon: {
    color: '#d3e4f7',
    fontSize: 11,
    marginTop: 4,
  },
  confirmButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#00b6f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  confirmText: {
    color: '#f4fbff',
    fontSize: 16,
    fontWeight: '700',
  },
});
