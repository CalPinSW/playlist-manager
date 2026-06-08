-- Migration: add last_synced_at to playlist
--
-- Supports the on-demand playlist sync feature: when a user starts listening
-- to an album in a playlist, syncPlaylistTask checks this timestamp to decide
-- whether a fresh Spotify sync is needed (throttle: once per 4 hours).

ALTER TABLE "playlist" ADD COLUMN "last_synced_at" TIMESTAMP(3);
