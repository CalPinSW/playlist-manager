-- Migration: add Last.fm listener/playcount stats to album_info
--
-- Populated by the enrich-album-info Trigger.dev task alongside the existing
-- MusicBrainz/Wikipedia fields. Last.fm's bio also fills summary/summary_html as a
-- fallback when Wikipedia has no linked page for the release (summary_source: 'lastfm').

ALTER TABLE "album_info"
    ADD COLUMN "lastfm_listeners" INTEGER,
    ADD COLUMN "lastfm_playcount" INTEGER;
