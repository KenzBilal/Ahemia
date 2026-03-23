export type RootStackParamList = {
  Splash: undefined;
  ModeSelect: undefined;
  Multiplayer: undefined;
  Home: undefined;
  HeroSelect: { mode: 'host' | 'join' };
  Lobby: { mode: 'host' | 'join' };
  Game: undefined;
  SurvivalGame: undefined;
};
