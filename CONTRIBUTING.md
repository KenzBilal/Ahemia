# Contributing

## Scope

This repository is focused on the Ahemia mobile game in `apps/mobile`.

## Branching and Commits

1. Create focused commits for each change set.
2. Use clear commit titles describing intent.
3. Keep refactors and behavior changes in separate commits when possible.

## Code Standards

1. Use TypeScript for all source changes.
2. Keep gameplay logic in `apps/mobile/src/lib`.
3. Keep rendering/UI concerns in `apps/mobile/src/components` and `apps/mobile/src/screens`.
4. Keep shared game/domain types in `apps/mobile/src/shared`.
5. Keep networking concerns isolated under `apps/mobile/src/lib/networkClient.ts` and `apps/mobile/src/server`.

## Validation Before Push

Run from repository root:

1. `npm run mobile:typecheck`
2. If Android changes were made, run:
   - `npm run mobile:android:build:debug`

## Pull Request Checklist

1. Typecheck passes.
2. New files are in the correct module folder.
3. No generated build outputs are added to source control.
4. Docs are updated when commands or structure change.
