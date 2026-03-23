import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HeroConfig } from '../shared/gameTypes';

interface HeroCardProps {
  hero: HeroConfig;
  selected: boolean;
  onPress: () => void;
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { width: `${Math.max(8, Math.min(100, value))}%` }]} />
      </View>
    </View>
  );
}

export const HeroCard = React.memo(function HeroCard({ hero, selected, onPress }: HeroCardProps) {
  const hpPercent = Math.round((hero.maxHealth / 150) * 100);
  const speedPercent = Math.round(hero.speedMultiplier * 80);
  const armorPercent = Math.round(hero.armor * 300);

  return (
    <Pressable
      style={[
        styles.card,
        {
          borderColor: selected ? hero.color : '#2f3440',
          shadowColor: hero.color,
          shadowOpacity: selected ? 0.45 : 0.1,
        },
      ]}
      onPress={onPress}
    >
      <Text style={styles.heroName}>{hero.name}</Text>
      <Text style={styles.role}>{hero.role.toUpperCase()}</Text>

      <StatBar label="HP" value={hpPercent} />
      <StatBar label="SPD" value={speedPercent} />
      <StatBar label="ARM" value={armorPercent} />

      <Text style={styles.weapon}>Weapon: {hero.primaryWeapon}</Text>
      <Text numberOfLines={1} style={styles.passive}>
        Passive: {hero.passive}
      </Text>
      <Text style={styles.ability}>{hero.abilityName}</Text>
      <Text style={styles.cooldown}>{Math.round(hero.abilityCooldownMs / 1000)}s CD</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 2,
    padding: 10,
    backgroundColor: '#151a24',
    shadowRadius: 12,
    elevation: 5,
  },
  heroName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  role: {
    color: '#8fa1b8',
    fontSize: 11,
    marginBottom: 6,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  statLabel: {
    color: '#9db0c7',
    width: 30,
    fontSize: 11,
  },
  statTrack: {
    flex: 1,
    height: 6,
    borderRadius: 8,
    backgroundColor: '#263245',
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#50fa7b',
  },
  weapon: {
    color: '#e0e6ee',
    fontSize: 11,
    marginTop: 4,
  },
  passive: {
    color: '#9fb1c3',
    fontSize: 10,
    marginTop: 2,
  },
  ability: {
    color: '#eaf2ff',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  cooldown: {
    color: '#7ea0cf',
    fontSize: 10,
  },
});
