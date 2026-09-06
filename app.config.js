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

// Local/IDE `expo run:android` does not set APP_VARIANT and will reuse
// an existing android/ project. Default to a side-by-side .dev package
// unless this is an EAS production or preview build.
const easProfile = process.env.EAS_BUILD_PROFILE;
const variant = process.env.APP_VARIANT;
const IS_DEV =
  variant === 'development' ||
  (variant !== 'production' &&
    easProfile !== 'production' &&
    easProfile !== 'preview');
const appId = IS_DEV
  ? 'com.wuweilabs.levelchinesenews.dev'
  : 'com.wuweilabs.levelchinesenews';

module.exports = ({ config }) => ({
  ...config,
  name: IS_DEV ? 'LCN Dev' : config.name,
  ios: {
    ...config.ios,
    bundleIdentifier: appId,
  },
  android: {
    ...config.android,
    package: appId,
    // Dev package is not in assetlinks.json; keep autoVerify on production only.
    intentFilters: (config.android?.intentFilters ?? []).map((filter) => ({
      ...filter,
      autoVerify: IS_DEV ? false : filter.autoVerify,
    })),
  },
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
