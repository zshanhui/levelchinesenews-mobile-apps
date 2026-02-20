# LevelChineseNews

A React Native app that makes native Chinese news and articles more approachable for Chinese learners. Currently support: pinyin, word segmentation, and English summaries.

Coming up next:

- Local app dictionary
- More sources (create an issue to add a article source)

## Tech Stack

- [Expo](https://expo.dev) with [expo-router](https://docs.expo.dev/router/introduction/)
- React Native (iOS, Android, Web)
- TypeScript

## Getting Started

```bash
pnpm install
pnpm start
```

Then choose iOS, Android, or Web from the Expo dev tools.

## API

The app expects a backend at `http://localhost:8000` in dev. Override with `EXPO_PUBLIC_API_URL` for other environments.
