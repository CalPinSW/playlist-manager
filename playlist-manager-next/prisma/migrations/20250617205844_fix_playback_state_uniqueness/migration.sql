/*
  Warnings:

  - A unique constraint covering the columns `[album_id,user_id]` on the table `playbackstatealbumrelationship` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[playlist_id,user_id]` on the table `playbackstateplaylistrelationship` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "playbackstatealbumrelationship_playback_state_id_album_i_d70e1f";

-- DropIndex
DROP INDEX "playbackstateplaylistrelationship_playback_state_id_play_7a32ab";

-- CreateIndex
CREATE UNIQUE INDEX "playbackstatealbumrelationship_album_id_user_id" ON "playbackstatealbumrelationship"("album_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "playbackstateplaylistrelationship_playlist_id_user_id" ON "playbackstateplaylistrelationship"("playlist_id", "user_id");
