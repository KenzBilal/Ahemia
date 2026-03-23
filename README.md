# Ahemia

Ahemia is a pure React Native + Expo mobile game for Android.

## Highlights

- Native mobile gameplay rendered with Skia.
- LAN multiplayer using UDP + Zeroconf.
- Fully offline-capable local Wi-Fi play.
- TypeScript-based game systems and navigation.

## Repository Layout

- `apps/mobile` - Main Ahemia Expo app (game source, Android native project, assets)
- `docs` - Architecture and operational documentation
- `archive/legacy` - Historical files retained for traceability

Full tracked-file tree is documented in `docs/PROJECT_STRUCTURE.md`.

## Tech Stack

- Expo SDK 55 + React Native
- @shopify/react-native-skia
- react-native-gesture-handler
- react-native-reanimated
- react-native-udp
- react-native-zeroconf
- expo-av
- expo-haptics
- expo-screen-orientation
- zustand
- TypeScript

## Quick Start

1. Install dependencies:
   - `cd apps/mobile && npm install`
2. Start Metro:
   - `npm run mobile:android:metro`
3. Connect Android device over USB and reverse port:
   - `npm run mobile:android:reverse`
4. Build/install/launch debug app:
   - `npm run mobile:android:usb`

## Common Commands (run from repo root)

- `npm run mobile:start`
- `npm run mobile:android`
- `npm run mobile:android:metro`
- `npm run mobile:android:reverse`
- `npm run mobile:android:usb`
- `npm run mobile:typecheck`

## Android Output

Debug APK path:
- `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

## Engineering Docs

- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`
- `docs/PROJECT_STRUCTURE.md`
- `CONTRIBUTING.md`
