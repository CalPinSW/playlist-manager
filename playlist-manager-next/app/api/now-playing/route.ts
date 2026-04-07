/**
 * GET /api/now-playing
 *
 * Lightweight "what is playing right now?" endpoint for the mobile app.
 * Polls Spotify's /me/player, resolves the album/track from our DB, and
 * returns enough data to update the Now tab in real time.
 *
 * Returns { isPlaying: false } when:
 *   - Nothing is currently playing
 *   - Currently playing a podcast episode (not a track)
 *   - The current track's album is not in any of the user's playlists
 *
 * Uses DB track list to compute the zero-based track index — avoids a
 * second round-trip to the Spotify albums API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import { access_token } from '../../../generated/prisma';
import { withAuth } from '../withAuth';
import { withSpotifyAccessToken } from '../spotify/utilities/getAccessTokensFromRequest';
import { getUserFromRequest } from '../user/handler';
import prisma from '../../../lib/prisma';

const NEW_ALBUMS_PATTERN = /new albums/i;

const handler = async (accessToken: access_token, req: NextRequest) => {
  try {
    const user = await getUserFromRequest(req);
    const sdk = SpotifyApi.withAccessToken(
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
      accessToken
    );

    const playback = await sdk.player.getPlaybackState();

    if (!playback || playback.currently_playing_type === 'episode') {
      return NextResponse.json({ isPlaying: false }, { status: 200 });
    }

    const track = playback.item as Track;
    if (!track?.album?.id) {
      return NextResponse.json({ isPlaying: false }, { status: 200 });
    }

    // Resolve from DB — check the album is in one of the user's playlists.
    const album = await prisma.album.findFirst({
      where: {
        id: track.album.id,
        playlistalbumrelationship: {
          some: { playlist: { user_id: user.id } }
        }
      },
      include: {
        tracks: {
          orderBy: [{ disc_number: 'asc' }, { track_number: 'asc' }]
        },
        playlistalbumrelationship: {
          include: { playlist: true },
          where: { playlist: { user_id: user.id } }
        }
      }
    });

    if (!album) {
      // Track is playing but not from a tracked album — nothing to show.
      return NextResponse.json({ isPlaying: false }, { status: 200 });
    }

    // Track index within album (0-based), ordered by disc/track number.
    const trackIndex = album.tracks.findIndex(t => t.id === track.id);

    // Prefer "New Albums" playlist; fall back to first playlist found.
    const playlistRel =
      album.playlistalbumrelationship.find(r => NEW_ALBUMS_PATTERN.test(r.playlist.name)) ??
      album.playlistalbumrelationship[0];

    return NextResponse.json({
      isPlaying: playback.is_playing,
      albumId: album.id,
      albumName: album.name,
      albumImageUrl: album.image_url ?? '',
      albumUri: album.uri,
      playlistId: playlistRel?.playlist.id ?? null,
      playlistName: playlistRel?.playlist.name ?? null,
      trackIndex: trackIndex >= 0 ? trackIndex : 0,
      trackName: track.name,
      totalTracks: album.tracks.length,
      progressMs: playback.progress_ms ?? 0,
      durationMs: track.duration_ms
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
};

export const GET = withAuth(withSpotifyAccessToken(handler));
