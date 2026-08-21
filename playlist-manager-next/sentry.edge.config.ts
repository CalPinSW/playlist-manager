import * as Sentry from '@sentry/nextjs';
import { sentrySharedOptions } from './sentry.shared';

Sentry.init({
  ...sentrySharedOptions,
  // VERCEL_ENV ("production" | "preview" | "development") is always set on
  // Vercel; distinguishes preview deploys from production. Falls back to
  // NODE_ENV locally, where VERCEL_ENV isn't set.
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV
});
