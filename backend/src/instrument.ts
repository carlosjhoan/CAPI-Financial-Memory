import * as Sentry from "@sentry/nestjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const dsn = process.env.SENTRY_DSN;
if (!dsn) {
  process.env.SENTRY_INITIALIZED = "false";
} else {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0,
    integrations: [nodeProfilingIntegration()],
  });

  process.on("unhandledRejection", (reason) => {
    Sentry.captureException(reason);
  });
}
