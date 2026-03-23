import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Legacy Home Disabled</Text>
      <Text style={styles.subtitle}>Use Splash to Mode Select to Multiplayer</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b13',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#f6fbff',
    fontSize: 24,
    fontWeight: '500',
  },
  subtitle: {
    color: '#89a8c6',
    fontSize: 14,
    fontWeight: '400',
    marginTop: 6,
  },
});
