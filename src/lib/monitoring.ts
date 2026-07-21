import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const environment = process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? 'development' : 'production');

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment,
  sendDefaultPii: false,
  tracesSampleRate: environment === 'production' ? 0.1 : 1,
});

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  const exception = error instanceof Error ? error : new Error(String(error));

  if (__DEV__) {
    console.error(exception, context);
  }

  if (!dsn) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('operation', context);
    }
    Sentry.captureException(exception);
  });
}

export function identifyMonitoringUser(userId?: string, businessId?: string): void {
  Sentry.setUser(userId ? { id: userId } : null);
  Sentry.setTag('business_id', businessId ?? 'none');
}

export { Sentry };
