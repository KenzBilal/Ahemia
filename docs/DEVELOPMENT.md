# Development Guide

## Environment

- Node.js >= 20
- Android SDK + adb
- Java 17

## Install

1. `cd apps/mobile`
2. `npm install`

## Local Development

From repository root:

1. Start Metro for device debugging:
   - `npm run mobile:android:metro`
2. Reverse Metro port over USB:
   - `npm run mobile:android:reverse`
3. Build + install + launch debug app:
   - `npm run mobile:android:usb`

## Useful Commands

- `npm run mobile:start`
- `npm run mobile:android`
- `npm run mobile:android:build:debug`
- `npm run mobile:android:install:debug`
- `npm run mobile:android:launch`
- `npm run mobile:typecheck`

## Troubleshooting

1. If app shows unable to load script:
   - Ensure Metro is running.
   - Re-run `npm run mobile:android:reverse`.
2. If native Android build fails after dependency updates:
   - Clean app build: `cd apps/mobile/android && ./gradlew clean`.
3. If LAN room discovery fails:
   - Ensure devices are on same Wi-Fi.
   - Ensure multicast is not blocked by router/AP isolation.
