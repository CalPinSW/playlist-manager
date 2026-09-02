-- Migration: add album_info
--
-- Cached MusicBrainz + Wikipedia enrichment data per album (summary text, MB
-- release-group id/type), populated by the enrich-album-info Trigger.dev task.
-- Genres discovered via these sources are linked into the existing
-- genre/albumgenrerelationship tables, not stored here, so the existing
-- genre-chip UI picks them up without changes.

CREATE TABLE "album_info" (
    "album_id"            VARCHAR(255) PRIMARY KEY,
    "mb_release_group_id" VARCHAR(255),
    "mb_type"             VARCHAR(255),
    "summary"             TEXT,
    "summary_html"        TEXT,
    "summary_source"      VARCHAR(50),
    "fetched_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "album_info"
    ADD CONSTRAINT "album_info_album_id_fkey"
        FOREIGN KEY ("album_id") REFERENCES "album"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
