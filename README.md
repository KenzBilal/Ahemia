# Ahemia

Ahemia is a pure React Native + Expo mobile game for Android.

## Repository Layout

- `apps/mobile` - Main HeroClash Expo app (game source, Android native project, assets)
- `docs` - Architecture and operational documentation
- `archive/legacy` - Historical files retained for traceability

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
- `npm run mobile:typecheck`

## Android Output

Debug APK path:
- `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`
