-- CreateTable
CREATE TABLE "access_token" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "access_token" VARCHAR(400),
    "refresh_token" VARCHAR(200),

    CONSTRAINT "access_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album" (
    "id" VARCHAR(255) NOT NULL,
    "album_type" VARCHAR(255) NOT NULL,
    "total_tracks" INTEGER NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "release_date" DATE NOT NULL,
    "release_date_precision" VARCHAR(255) NOT NULL,
    "label" VARCHAR(255),
    "uri" VARCHAR(255) NOT NULL,

    CONSTRAINT "album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_notes" (
    "id" VARCHAR(255) NOT NULL,
    "text" VARCHAR(255) NOT NULL,
    "album_id" VARCHAR(255) NOT NULL,

    CONSTRAINT "album_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albumartistrelationship" (
    "id" SERIAL NOT NULL,
    "album_id" VARCHAR(255) NOT NULL,
    "artist_id" VARCHAR(255) NOT NULL,

    CONSTRAINT "albumartistrelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albumgenrerelationship" (
    "id" SERIAL NOT NULL,
    "album_id" VARCHAR(255) NOT NULL,
    "genre_id" INTEGER NOT NULL,

    CONSTRAINT "albumgenrerelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist" (
    "id" VARCHAR(255) NOT NULL,
    "image_url" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "uri" VARCHAR(255) NOT NULL,

    CONSTRAINT "artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genre" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playback_state" (
    "id" SERIAL NOT NULL,
    "item_id" VARCHAR(255),
    "progress_ms" BIGINT,
    "timestamp" DATE NOT NULL,
    "type" VARCHAR(255) NOT NULL,

    CONSTRAINT "playback_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playbackstatealbumrelationship" (
    "id" SERIAL NOT NULL,
    "playback_state_id" INTEGER NOT NULL,
    "album_id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,

    CONSTRAINT "playbackstatealbumrelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playbackstateplaylistrelationship" (
    "id" SERIAL NOT NULL,
    "playback_state_id" INTEGER NOT NULL,
    "playlist_id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,

    CONSTRAINT "playbackstateplaylistrelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist" (
    "id" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "image_url" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "snapshot_id" VARCHAR(255) NOT NULL,
    "uri" VARCHAR(255) NOT NULL,

    CONSTRAINT "playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlistalbumrelationship" (
    "id" SERIAL NOT NULL,
    "playlist_id" VARCHAR(255) NOT NULL,
    "album_id" VARCHAR(255) NOT NULL,
    "album_index" INTEGER,

    CONSTRAINT "playlistalbumrelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "album_id" VARCHAR(255) NOT NULL,
    "disc_number" INTEGER NOT NULL,
    "track_number" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "uri" VARCHAR(255) NOT NULL,

    CONSTRAINT "track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trackartistrelationship" (
    "id" SERIAL NOT NULL,
    "track_id" VARCHAR(255) NOT NULL,
    "artist_id" VARCHAR(255) NOT NULL,

    CONSTRAINT "trackartistrelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "image_url" VARCHAR(400) NOT NULL,
    "uri" VARCHAR(255) NOT NULL,
    "auth0_id" VARCHAR,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dbaccesstoken_user_id" ON "access_token"("user_id");

-- CreateIndex
CREATE INDEX "dbalbumnote_album_id" ON "album_notes"("album_id");

-- CreateIndex
CREATE INDEX "albumartistrelationship_album_id" ON "albumartistrelationship"("album_id");

-- CreateIndex
CREATE INDEX "albumartistrelationship_artist_id" ON "albumartistrelationship"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "albumartistrelationship_album_id_artist_id" ON "albumartistrelationship"("album_id", "artist_id");

-- CreateIndex
CREATE INDEX "albumgenrerelationship_album_id" ON "albumgenrerelationship"("album_id");

-- CreateIndex
CREATE INDEX "albumgenrerelationship_genre_id" ON "albumgenrerelationship"("genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "albumgenrerelationship_album_id_genre_id" ON "albumgenrerelationship"("album_id", "genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "dbgenre_name" ON "genre"("name");

-- CreateIndex
CREATE INDEX "dbplaybackstate_item_id" ON "playback_state"("item_id");

-- CreateIndex
CREATE INDEX "playbackstatealbumrelationship_album_id" ON "playbackstatealbumrelationship"("album_id");

-- CreateIndex
CREATE INDEX "playbackstatealbumrelationship_playback_state_id" ON "playbackstatealbumrelationship"("playback_state_id");

-- CreateIndex
CREATE INDEX "playbackstatealbumrelationship_user_id" ON "playbackstatealbumrelationship"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "playbackstatealbumrelationship_playback_state_id_album_i_d70e1f" ON "playbackstatealbumrelationship"("playback_state_id", "album_id", "user_id");

-- CreateIndex
CREATE INDEX "playbackstateplaylistrelationship_playback_state_id" ON "playbackstateplaylistrelationship"("playback_state_id");

-- CreateIndex
CREATE INDEX "playbackstateplaylistrelationship_playlist_id" ON "playbackstateplaylistrelationship"("playlist_id");

-- CreateIndex
CREATE INDEX "playbackstateplaylistrelationship_user_id" ON "playbackstateplaylistrelationship"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "playbackstateplaylistrelationship_playback_state_id_play_7a32ab" ON "playbackstateplaylistrelationship"("playback_state_id", "playlist_id", "user_id");

-- CreateIndex
CREATE INDEX "dbplaylist_user_id" ON "playlist"("user_id");

-- CreateIndex
CREATE INDEX "playlistalbumrelationship_album_id" ON "playlistalbumrelationship"("album_id");

-- CreateIndex
CREATE INDEX "playlistalbumrelationship_playlist_id" ON "playlistalbumrelationship"("playlist_id");

-- CreateIndex
CREATE UNIQUE INDEX "playlistalbumrelationship_playlist_id_album_id" ON "playlistalbumrelationship"("playlist_id", "album_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_playlist_albumindex" ON "playlistalbumrelationship"("playlist_id", "album_index");

-- CreateIndex
CREATE INDEX "dbtrack_album_id" ON "track"("album_id");

-- CreateIndex
CREATE INDEX "trackartistrelationship_artist_id" ON "trackartistrelationship"("artist_id");

-- CreateIndex
CREATE INDEX "trackartistrelationship_track_id" ON "trackartistrelationship"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "trackartistrelationship_track_id_artist_id" ON "trackartistrelationship"("track_id", "artist_id");

-- AddForeignKey
ALTER TABLE "access_token" ADD CONSTRAINT "access_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "album_notes" ADD CONSTRAINT "album_notes_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "album"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "albumartistrelationship" ADD CONSTRAINT "albumartistrelationship_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "album"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "albumartistrelationship" ADD CONSTRAINT "albumartistrelationship_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "albumgenrerelationship" ADD CONSTRAINT "albumgenrerelationship_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "album"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "albumgenrerelationship" ADD CONSTRAINT "albumgenrerelationship_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genre"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "playback_state" ADD CONSTRAINT "playback_state_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "track"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "playbackstatealbumrelationship" ADD CONSTRAINT "playbackstatealbumrelationship_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "album"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "playbackstatealbumrelationship" ADD CONSTRAINT "playbackstatealbumrelationship_playback_state_id_fkey" FOREIGN KEY ("playback_state_id") REFERENCES "playback_state"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "playbackstatealbumrelationship" ADD CONSTRAINT "playbackstatealbumrelationship_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "playbackstateplaylistrelationship" ADD CONSTRAINT "playbackstateplaylistrelationship_playback_state_id_fkey" FOREIGN KEY ("playback_state_id") REFERENCES "playback_state"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "playbackstateplaylistrelationship" ADD CONSTRAINT "playbackstateplaylistrelationship_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlist"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "playbackstateplaylistrelationship" ADD CONSTRAINT "playbackstateplaylistrelationship_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "playlistalbumrelationship" ADD CONSTRAINT "playlistalbumrelationship_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "album"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "playlistalbumrelationship" ADD CONSTRAINT "playlistalbumrelationship_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "track" ADD CONSTRAINT "track_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "album"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trackartistrelationship" ADD CONSTRAINT "trackartistrelationship_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trackartistrelationship" ADD CONSTRAINT "trackartistrelationship_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "track"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

