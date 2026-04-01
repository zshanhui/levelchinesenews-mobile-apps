import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

/** Set `EXPO_PUBLIC_SENTRY_DSN` in `.env` and restart Metro (`expo start -c`) so it is inlined at bundle time. */
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();

export const sentryEnabled = Boolean(dsn);

let navigationIntegration: ReturnType<
  typeof Sentry.reactNavigationIntegration
> | undefined;

if (dsn) {
  navigationIntegration = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: !isRunningInExpoGo(),
  });

  Sentry.init({
    dsn,
    sendDefaultPii: true,
    tracesSampleRate: __DEV__ ? 1.0 : 1.0,
    profilesSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: __DEV__ ? 1.0 : 0.05,
    enableLogs: true,
    integrations: [
      navigationIntegration,
      Sentry.mobileReplayIntegration(),
    ],
    enableNativeFramesTracking: !isRunningInExpoGo(),
    environment: __DEV__ ? 'development' : 'production',
    debug: __DEV__,
  });
}

export { Sentry, navigationIntegration };
