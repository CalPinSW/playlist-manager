-- Migration: artist bios + album reception/reviews + enrichment retry scheduling
--
-- album_info gains the Wikipedia article URL, its "Critical reception" section, review
-- links from MusicBrainz, and next_refresh_at. Existing rows keep next_refresh_at NULL,
-- which the pipeline treats as "due now" — so every album enriched before this migration
-- is re-enriched (by the hourly sweep, the backfill task, or on first view).
--
-- artist_info caches one biography per artist, shared across their albums.

ALTER TABLE "album_info"
    ADD COLUMN "wikipedia_url" VARCHAR(500),
    ADD COLUMN "reception" TEXT,
    ADD COLUMN "review_links" JSONB,
    ADD COLUMN "next_refresh_at" TIMESTAMP(3);

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
