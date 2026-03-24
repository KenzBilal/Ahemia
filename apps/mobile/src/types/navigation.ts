import { MapType } from '../shared/gameTypes';

export type RootStackParamList = {
  Splash: undefined;
  AvatarSetup: undefined;
  Settings: undefined;
  ModeSelect: undefined;
  MapSelect: { mode: 'survival' | 'multiplayer' };
  Multiplayer: undefined;
  Home: undefined;
  Lobby: { mode: 'host' | 'join', map?: MapType };
  Game: { localPlayerId?: string; roomId?: string; mode?: 'host' | 'join' } | undefined;
  SurvivalGame: { mapType: MapType };
};
