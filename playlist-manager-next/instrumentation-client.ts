import * as Sentry from '@sentry/nextjs';
import { sentrySharedOptions } from './sentry.shared';

Sentry.init({
  ...sentrySharedOptions,
  // NEXT_PUBLIC_VERCEL_ENV distinguishes preview deploys from production;
  // it's only populated if "Automatically expose System Environment
  // Variables" is enabled in the Vercel project settings. Falls back to
  // NODE_ENV (always "production" for any `next build` output) otherwise.
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
