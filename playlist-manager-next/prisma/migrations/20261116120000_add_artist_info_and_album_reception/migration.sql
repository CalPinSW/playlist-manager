-- Migration: artist bios + album reception/reviews + enrichment retry scheduling
--
-- album_info gains the Wikipedia article URL, its "Critical reception" section, review
-- links from MusicBrainz, and the retry schedule (next_refresh_at + refresh_attempts).
-- next_refresh_at NULL means "no further automatic checks", so existing rows are set due
-- now: every album enriched before this migration is re-enriched once (by the hourly
-- sweep, the backfill task, or on first view) and then follows the new schedule.
--
-- artist_info caches one biography per artist, shared across their albums.

ALTER TABLE "album_info"
    ADD COLUMN "wikipedia_url" VARCHAR(500),
    ADD COLUMN "reception" TEXT,
    ADD COLUMN "review_links" JSONB,
    ADD COLUMN "next_refresh_at" TIMESTAMP(3),
    ADD COLUMN "refresh_attempts" INTEGER NOT NULL DEFAULT 0;

UPDATE "album_info" SET "next_refresh_at" = CURRENT_TIMESTAMP;

CREATE INDEX "album_info_next_refresh_at_idx" ON "album_info"("next_refresh_at");

CREATE TABLE "artist_info" (
    "artist_id" VARCHAR(255) NOT NULL,
    "mb_artist_id" VARCHAR(255),
    "description" VARCHAR(500),
    "bio" TEXT,
    "bio_source" VARCHAR(50),
    "url" VARCHAR(500),
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_info_pkey" PRIMARY KEY ("artist_id")
);

ALTER TABLE "artist_info"
    ADD CONSTRAINT "artist_info_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
