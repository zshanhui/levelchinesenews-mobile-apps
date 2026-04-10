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
