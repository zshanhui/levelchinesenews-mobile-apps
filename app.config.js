// Dynamic Expo config: extends app.json (passed as `config`) and adds
// @sentry/react-native for GlitchTip (Sentry-compatible).
function withTrailingSlash(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

const glitchTipUrl = withTrailingSlash(
  process.env.GLITCHTIP_URL ?? 'https://app.glitchtip.com/',
);

/** Must match READER_WEB_BASE_URL in lib/constants.ts and android.intentFilters host. */
const readerWebOrigin = 'https://reader.levelchinese.app';

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    [
      'expo-router',
      {
        origin: readerWebOrigin,
      },
    ],
    'expo-audio',
    ...(config.plugins ?? []),
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
});
