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

For production servers that require admin authentication (e.g. scrape), set `EXPO_PUBLIC_TEMP_ADMIN_ACCESS_WRITE_KEY` to match the backend’s `ADMIN_ACCESS_KEY`. When set, the app sends `X-Admin-Key` on protected requests.

## Backend Service

The backend is not ready to be opensourced yet. The security needs to be improved along with other things. If you would like to run this app, you can email me shanhui.dev@proton.me for url to a development server
