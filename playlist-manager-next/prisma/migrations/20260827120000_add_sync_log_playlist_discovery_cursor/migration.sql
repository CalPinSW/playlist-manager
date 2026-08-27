-- Migration: add last_playlist_discovery_at to sync_log
--
-- Throttle for on-open playlist discovery. /api/sync-history (hit by the native
-- app on every open) kicks a background playlist refresh at most once per
-- PLAYLIST_DISCOVERY_THROTTLE_HOURS per user, using this timestamp as the gate.
-- The weekly update-users-playlist-data-scheduled cron remains the backstop.

ALTER TABLE "sync_log" ADD COLUMN "last_playlist_discovery_at" TIMESTAMP(3);
