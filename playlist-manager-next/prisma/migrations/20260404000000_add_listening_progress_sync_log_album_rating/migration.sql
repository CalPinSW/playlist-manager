-- Migration: add listening_progress, sync_log, album_rating
-- Branch: claude/great-dijkstra
--
-- listening_progress replaces playback_state as the authoritative source of truth
-- for per-album listening progress. The legacy playback_state tables are kept for now;
-- they will be dropped in a follow-up migration after the web app reads are migrated.

-- ─────────────────────────────────────────────────────────────────────────────
-- listening_progress
-- One row per (user, album, playlist). last_track_index only ever advances.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "listening_progress" (
    "id"               SERIAL PRIMARY KEY,
    "user_id"          VARCHAR(255) NOT NULL,
    "album_id"         VARCHAR(255) NOT NULL,
    "playlist_id"      VARCHAR(255) NOT NULL,
    "last_track_index" INTEGER      NOT NULL,
    "total_tracks"     INTEGER      NOT NULL,
    "listened_at"      TIMESTAMP(3) NOT NULL,
    "source"           VARCHAR(50)  NOT NULL,
    CONSTRAINT "listening_progress_user_id_album_id_playlist_id_key"
        UNIQUE ("user_id", "album_id", "playlist_id")
);

ALTER TABLE "listening_progress"
    ADD CONSTRAINT "listening_progress_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "listening_progress"
    ADD CONSTRAINT "listening_progress_album_id_fkey"
        FOREIGN KEY ("album_id") REFERENCES "album"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "listening_progress"
    ADD CONSTRAINT "listening_progress_playlist_id_fkey"
        FOREIGN KEY ("playlist_id") REFERENCES "playlist"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE INDEX "listening_progress_user_id_idx"    ON "listening_progress"("user_id");
CREATE INDEX "listening_progress_album_id_idx"   ON "listening_progress"("album_id");
CREATE INDEX "listening_progress_playlist_id_idx" ON "listening_progress"("playlist_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- sync_log
-- One row per user. Stores the recently_played cursor for the Trigger.dev task.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "sync_log" (
    "id"             SERIAL PRIMARY KEY,
    "user_id"        VARCHAR(255) NOT NULL,
    "last_played_at" TIMESTAMP(3),
    "last_run_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_log_user_id_key" UNIQUE ("user_id")
);

ALTER TABLE "sync_log"
    ADD CONSTRAINT "sync_log_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ─────────────────────────────────────────────────────────────────────────────
-- album_rating
-- One row per (user, album). Rating stored as 1-10; displayed as 0.5-5.0 half stars.
-- rated_at used for last-write-wins conflict resolution.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "album_rating" (
    "id"       SERIAL PRIMARY KEY,
    "album_id" VARCHAR(255) NOT NULL,
    "user_id"  VARCHAR(255) NOT NULL,
    "rating"   INTEGER      NOT NULL,
    "rated_at" TIMESTAMP(3) NOT NULL,
    "notes"    VARCHAR(1000),
    CONSTRAINT "album_rating_album_id_user_id_key" UNIQUE ("album_id", "user_id")
);

ALTER TABLE "album_rating"
    ADD CONSTRAINT "album_rating_album_id_fkey"
        FOREIGN KEY ("album_id") REFERENCES "album"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "album_rating"
    ADD CONSTRAINT "album_rating_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE INDEX "album_rating_user_id_idx"  ON "album_rating"("user_id");
CREATE INDEX "album_rating_album_id_idx" ON "album_rating"("album_id");
