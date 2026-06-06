// Dynamic Expo config: extends app.json and adds @sentry/react-native for GlitchTip
// (Sentry-compatible). When app.config.js exists, Expo uses this export as the source of truth.
const base = require('./app.json');

function withTrailingSlash(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

const glitchTipUrl = withTrailingSlash(
  process.env.GLITCHTIP_URL ?? 'https://app.glitchtip.com/',
);

/** Must match READER_WEB_BASE_URL in lib/constants.ts and android.intentFilters host. */
const readerWebOrigin = 'https://reader.levelchinese.app';

module.exports = {
  expo: {
    ...base.expo,
    plugins: [
      [
        'expo-router',
        {
          origin: readerWebOrigin,
        },
      ],
      ...(base.expo.plugins ?? []),
      [
        '@sentry/react-native/expo',
        {
          url: glitchTipUrl,
          organization:
            process.env.GLITCHTIP_ORG ?? process.env.SENTRY_ORG ?? undefined,
          project:
            process.env.GLITCHTIP_PROJECT ?? process.env.SENTRY_PROJECT ?? undefined,
        },
      ],
    ],
  },
};
