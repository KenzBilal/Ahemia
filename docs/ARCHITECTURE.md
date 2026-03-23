# Architecture

## Scope

This repository contains one production app:
- `apps/mobile`: Expo React Native game for Android.

The app is fully client-side and supports offline LAN multiplayer.

## Mobile App Structure (`apps/mobile/src`)

- `components/` - Reusable UI controls (HUD, joystick, ability button, kill feed)
- `screens/` - Navigation screens and game flows
- `lib/` - Core systems (engine, joystick math, networking, audio, stores)
- `shared/` - Shared game domain types and configs
- `server/` - Local game-mode/multiplayer coordination logic used in-app
- `types/` - TypeScript declarations and navigation types

## Native Android

- `apps/mobile/android` includes gradle and app modules.
- Source/config files are versioned.
- Generated outputs (`build` folders) are ignored.

## Scaling Conventions

1. Add new gameplay systems under `src/lib` and keep rendering in screen/component layers.
2. Keep cross-feature types in `src/shared`.
3. Keep networking transport UDP/LAN oriented and isolated in `src/lib/networkClient.ts`.
4. Keep platform tooling scripts in `apps/mobile/package.json`; expose root aliases in root `package.json`.
