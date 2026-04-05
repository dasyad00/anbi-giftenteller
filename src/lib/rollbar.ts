import Rollbar from 'rollbar';

const rollbar = new Rollbar({
  accessToken: import.meta.env.VITE_ROLLBAR_ACCESS_TOKEN,
  environment: import.meta.env.MODE,
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    client: {
      javascript: {
        code_version: import.meta.env.COMMIT_REF,
        source_map_enabled: true,
      },
    },
  },
});

/**
 * Cleanly reports an error to Rollbar and logs it to the console.
 * @param error The error object or message to report.
 * @param context Additional metadata or a descriptive message for context.
 */
export function reportError(
  error: unknown,
  context?: string | Record<string, any>,
) {
  console.error(context || 'Error caught:', error);

  if (typeof context === 'string') {
    rollbar.error(context, error as any);
  } else {
    rollbar.error(error as any, context);
  }
}

export default rollbar;
