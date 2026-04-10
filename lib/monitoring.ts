import { Sentry, glitchTipEnabled } from './glitchtipInit';

/**
 * Sends errors to GlitchTip when `EXPO_PUBLIC_GLITCHTIP_DSN` is set.
 */
export function captureTrackedException(
  exception: unknown,
  captureContext?: Parameters<typeof Sentry.captureException>[1],
): void {
  if (!glitchTipEnabled) return;
  Sentry.captureException(exception, captureContext);
}

/**
 * Adds the anonymous installation identifier to the global GlitchTip scope so
 * captured events can be filtered by install in the dashboard.
 */
export function setMonitoringInstallationId(installationId: string): void {
  if (!glitchTipEnabled) return;
  Sentry.setTag('installation_id', installationId);
  Sentry.setContext('installation', {
    installation_id: installationId,
  });
}
