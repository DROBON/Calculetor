# Calculator App - PRD

## Overview
A premium mobile calculator app built with React Native + Expo (SDK 54). Frontend-only application — no backend or external integrations required.

## Features
1. **Dual Calculator Modes** — Toggle between Basic and Scientific keypads.
2. **Theme Toggle** — Dark and Light themes with persisted preference (defaults to system).
3. **Language Toggle** — English (0-9) ↔ Bengali (০-৯) numerals for display and buttons.
4. **Live Preview** — Result computed on every keystroke; final result locked on `=`.
5. **History Panel** — Slide-down overlay shows past 50 calculations; tap to reuse a result; clear-all action available.
6. **Persistence** — Preferences and history stored via `@/src/utils/storage` (AsyncStorage on native, localStorage on web).
7. **Haptic Feedback** — Light haptic on digit/op presses, medium on AC/=.

## Calculator Operations
- Basic: + − × ÷ % ± . AC ⌫ =
- Scientific: sin cos tan ln log √ x² x^y ( ) n! |x| exp π e

## Tech Stack
- Expo Router (file-based routing on `app/`)
- React Native + react-native-reanimated
- `expo-haptics`, `@expo/vector-icons` (Ionicons)
- `react-native-safe-area-context`

## Files
- `/app/frontend/app/index.tsx` — Calculator screen (single screen app)
- `/app/frontend/src/calculator/evaluator.ts` — Safe expression evaluator + Bengali numeral mapper

## Smart Business Enhancement
- Premium glance UX (haptics + premium typography + custom theming) increases retention.
