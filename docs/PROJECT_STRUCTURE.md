# Project Structure

```text
mini_militia_game/
├── apps/
│   └── mobile/
│       ├── android/
│       │   ├── app/
│       │   │   ├── src/
│       │   │   │   ├── debug/
│       │   │   │   │   └── AndroidManifest.xml
│       │   │   │   ├── debugOptimized/
│       │   │   │   │   └── AndroidManifest.xml
│       │   │   │   └── main/
│       │   │   │       ├── java/
│       │   │   │       │   └── com/
│       │   │   │       │       └── anonymous/
│       │   │   │       │           └── heroclash/
│       │   │   │       │               ├── MainActivity.kt
│       │   │   │       │               └── MainApplication.kt
│       │   │   │       ├── res/
│       │   │   │       │   ├── drawable/
│       │   │   │       │   │   ├── ic_launcher_background.xml
│       │   │   │       │   │   └── rn_edit_text_material.xml
│       │   │   │       │   ├── drawable-hdpi/
│       │   │   │       │   │   └── splashscreen_logo.png
│       │   │   │       │   ├── drawable-mdpi/
│       │   │   │       │   │   └── splashscreen_logo.png
│       │   │   │       │   ├── drawable-xhdpi/
│       │   │   │       │   │   └── splashscreen_logo.png
│       │   │   │       │   ├── drawable-xxhdpi/
│       │   │   │       │   │   └── splashscreen_logo.png
│       │   │   │       │   ├── drawable-xxxhdpi/
│       │   │   │       │   │   └── splashscreen_logo.png
│       │   │   │       │   ├── mipmap-anydpi-v26/
│       │   │   │       │   │   ├── ic_launcher_round.xml
│       │   │   │       │   │   └── ic_launcher.xml
│       │   │   │       │   ├── mipmap-hdpi/
│       │   │   │       │   │   ├── ic_launcher_background.webp
│       │   │   │       │   │   ├── ic_launcher_foreground.webp
│       │   │   │       │   │   ├── ic_launcher_monochrome.webp
│       │   │   │       │   │   ├── ic_launcher_round.webp
│       │   │   │       │   │   └── ic_launcher.webp
│       │   │   │       │   ├── mipmap-mdpi/
│       │   │   │       │   │   ├── ic_launcher_background.webp
│       │   │   │       │   │   ├── ic_launcher_foreground.webp
│       │   │   │       │   │   ├── ic_launcher_monochrome.webp
│       │   │   │       │   │   ├── ic_launcher_round.webp
│       │   │   │       │   │   └── ic_launcher.webp
│       │   │   │       │   ├── mipmap-xhdpi/
│       │   │   │       │   │   ├── ic_launcher_background.webp
│       │   │   │       │   │   ├── ic_launcher_foreground.webp
│       │   │   │       │   │   ├── ic_launcher_monochrome.webp
│       │   │   │       │   │   ├── ic_launcher_round.webp
│       │   │   │       │   │   └── ic_launcher.webp
│       │   │   │       │   ├── mipmap-xxhdpi/
│       │   │   │       │   │   ├── ic_launcher_background.webp
│       │   │   │       │   │   ├── ic_launcher_foreground.webp
│       │   │   │       │   │   ├── ic_launcher_monochrome.webp
│       │   │   │       │   │   ├── ic_launcher_round.webp
│       │   │   │       │   │   └── ic_launcher.webp
│       │   │   │       │   ├── mipmap-xxxhdpi/
│       │   │   │       │   │   ├── ic_launcher_background.webp
│       │   │   │       │   │   ├── ic_launcher_foreground.webp
│       │   │   │       │   │   ├── ic_launcher_monochrome.webp
│       │   │   │       │   │   ├── ic_launcher_round.webp
│       │   │   │       │   │   └── ic_launcher.webp
│       │   │   │       │   ├── values/
│       │   │   │       │   │   ├── colors.xml
│       │   │   │       │   │   ├── strings.xml
│       │   │   │       │   │   └── styles.xml
│       │   │   │       │   └── values-night/
│       │   │   │       │       └── colors.xml
│       │   │   │       └── AndroidManifest.xml
│       │   │   ├── build.gradle
│       │   │   ├── debug.keystore
│       │   │   └── proguard-rules.pro
│       │   ├── gradle/
│       │   │   └── wrapper/
│       │   │       ├── gradle-wrapper.jar
│       │   │       └── gradle-wrapper.properties
│       │   ├── .gitignore
│       │   ├── build.gradle
│       │   ├── gradle.properties
│       │   ├── gradlew
│       │   ├── gradlew.bat
│       │   └── settings.gradle
│       ├── assets/
│       │   ├── sounds/
│       │   │   ├── bgm_base.mp3
│       │   │   ├── bgm_lava.mp3
│       │   │   ├── bgm_space.mp3
│       │   │   ├── death.wav
│       │   │   ├── explosion.wav
│       │   │   ├── headshot.wav
│       │   │   ├── hit.wav
│       │   │   ├── jetpack.wav
│       │   │   ├── kill_confirm.wav
│       │   │   ├── pickup.wav
│       │   │   ├── pistol_fire.wav
│       │   │   ├── respawn.wav
│       │   │   ├── rifle_fire.wav
│       │   │   ├── shotgun_fire.wav
│       │   │   └── sniper_fire.wav
│       │   ├── android-icon-background.png
│       │   ├── android-icon-foreground.png
│       │   ├── android-icon-monochrome.png
│       │   ├── favicon.png
│       │   ├── icon.png
│       │   └── splash-icon.png
│       ├── src/
│       │   ├── components/
│       │   │   ├── AbilityButton.tsx
│       │   │   ├── GameHUD.tsx
│       │   │   ├── HeroCard.tsx
│       │   │   ├── JoystickControl.tsx
│       │   │   └── KillFeedUI.tsx
│       │   ├── lib/
│       │   │   ├── audioManager.ts
│       │   │   ├── gameEngine.ts
│       │   │   ├── gameStore.ts
│       │   │   ├── joystick.ts
│       │   │   ├── killFeed.ts
│       │   │   ├── networkClient.ts
│       │   │   └── survivalMode.ts
│       │   ├── screens/
│       │   │   ├── GameScreen.tsx
│       │   │   ├── HeroSelectScreen.tsx
│       │   │   ├── HomeScreen.tsx
│       │   │   ├── LobbyScreen.tsx
│       │   │   ├── ModeSelectScreen.tsx
│       │   │   ├── MultiplayerScreen.tsx
│       │   │   ├── SplashScreen.tsx
│       │   │   └── SurvivalGameScreen.tsx
│       │   ├── server/
│       │   │   ├── gameModes.ts
│       │   │   └── multiplayer.ts
│       │   ├── shared/
│       │   │   └── gameTypes.ts
│       │   └── types/
│       │       ├── navigation.ts
│       │       └── react-native-zeroconf.d.ts
│       ├── .gitignore
│       ├── app.json
│       ├── App.tsx
│       ├── babel.config.js
│       ├── index.ts
│       ├── package-lock.json
│       ├── package.json
│       └── tsconfig.json
├── archive/
│   └── legacy/
│       ├── root.gitkeep.legacy
│       ├── tmp_make_tree.js.legacy
│       └── vitest.config.ts.legacy
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md
│   └── PROJECT_STRUCTURE.md
├── .gitignore
├── CONTRIBUTING.md
├── package-lock.json
├── package.json
└── README.md

```
