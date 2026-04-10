import * as Sentry from '@sentry/react-native';

/**
 * GlitchTip uses the Sentry protocol. Set `EXPO_PUBLIC_GLITCHTIP_DSN` in `.env`
 * and restart Metro (`expo start -c`) so the DSN is inlined at bundle time.
 *
 * @see https://glitchtip.com/sdkdocs/react-native
 */
const dsn = process.env.EXPO_PUBLIC_GLITCHTIP_DSN?.trim();

export const glitchTipEnabled = Boolean(dsn);

export let navigationIntegration: ReturnType<
  typeof Sentry.reactNavigationIntegration
> | null = null;

if (glitchTipEnabled) {
  const nav = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: true,
  });
  navigationIntegration = nav;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.05,
    enableAutoSessionTracking: false,
    integrations: [nav],
  });
}

export { Sentry };
