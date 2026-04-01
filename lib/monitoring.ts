import { Sentry, sentryEnabled } from './sentryInit';

/**
 * Calls `Sentry.captureException` only when the SDK is enabled (DSN set).
 * Reuse this instead of branching on `sentryEnabled` at each call site.
 */
export function sentryCaptureException(
  exception: unknown,
  captureContext?: Parameters<typeof Sentry.captureException>[1],
): void {
  if (!sentryEnabled) return;
  Sentry.captureException(exception, captureContext);
}
