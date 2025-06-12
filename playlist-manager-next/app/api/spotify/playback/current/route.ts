import { access_token } from '../../../../generated/prisma';
import { NextResponse } from 'next/server';
import { withAuth } from '../../../withAuth';
import { Episode, PlaybackState, SpotifyApi, Track } from '@spotify/web-api-ts-sdk';
import { withSpotifyAccessToken } from '../../utilities/getAccessTokensFromRequest';
import prisma from '../../../../../lib/prisma';
import { buildPlaybackInfoWithPlaylist } from '../../../../utils/playlistPlayback';


const getPlaybackHandler = async (access_tokens: access_token) => {
    const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
    const playback = await spotifySdk.player.getPlaybackState();

    if (!playback) {
        return NextResponse.json(null, { status: 200 });
    }

    const context = playback.context;

    let playlist_id: string | null = null;

    if (context && context.type === 'playlist') {
        playlist_id = context.uri.replace('spotify:playlist:', '');
    }

    if (playback.currently_playing_type === 'episode') {
        return buildEpisodePlaybackResponse(playback)
    } else {
        const item = playback.item as Track;
        const album = await spotifySdk.albums.get(item.album.id);
        const album_duration = album?.tracks.items.reduce((acc, t) => acc + t.duration_ms, 0) ?? 0;
        // Find index of current track in album
        const trackIndex = album?.tracks?.items.findIndex(t => t.id === item.id) ?? -1;
        const album_progress = (trackIndex > 0
            ? album.tracks.items.slice(0, trackIndex).reduce((acc, t) => acc + t.duration_ms, 0)
            : 0
        ) + (playback.progress_ms ?? 0);
        const playbackInfo = {
            type: 'track',
            track_title: item.name,
            track_id: item.id,
            album_title: item.album.name,
            album_id: item.album.id,
            playlist_id: playlist_id,
            track_artists: item.artists?.map(a => a.name) ?? [],
            album_artists: album?.artists,
            artwork_url: item.album.images?.[0]?.url ?? '',
            track_progress: playback.progress_ms,
            track_duration: item.duration_ms,
            album_progress: album_progress,
            album_duration: album_duration,
            is_playing: playback.is_playing,
        }

        const playbackInfoWithPlaylist = await buildPlaybackInfoWithPlaylist(playbackInfo);
        return NextResponse.json(playbackInfoWithPlaylist
        , { status: 200 });
    }
   
};

export const GET = withAuth(withSpotifyAccessToken(getPlaybackHandler));


const buildEpisodePlaybackResponse = (playback: PlaybackState) => {
    const item = playback.item as Episode;
    return NextResponse.json({
        playback: {
            type: 'episode',
            track_title: item.name,
            track_id: item.id,
            album_title: item.show.name,
            album_id: item.show.id,
            track_artists: [item.show.publisher],
            album_artists: [item.show.publisher],
            artwork_url: item.images?.[0]?.url ?? '',
            track_progress: playback.progress_ms,
            track_duration: item.duration_ms,
            album_progress: 0,
            album_duration: item.show.total_episodes,
            is_playing: playback.is_playing,
        }
    }, { status: 200 });
}

const upsertPlaybackState = async (playback: PlaybackState, item: Track, playlist_id: string, access_tokens: access_token) => {
      // Upsert playback state for album
        await prisma.playback_state.upsert({
            where: { id: Number(item.id) },
            update: {
                item_id: item.id,
                progress_ms: playback.progress_ms,
                timestamp: new Date(playback.timestamp),
                type: playback.currently_playing_type,
            },
            create: {
                item_id: item.id,
                progress_ms: playback.progress_ms,
                timestamp: new Date(playback.timestamp),
                type: playback.currently_playing_type,
            }
        });
        // Upsert playback state for playlist if present
        if (playlist_id) {
            await prisma.playbackstateplaylistrelationship.upsert({
                where: {
                    playback_state_id_playlist_id_user_id: {
                        playback_state_id: Number(item.id),
                        playlist_id: playlist_id,
                        user_id: access_tokens.user_id,
                    }
                },
                update: {},
                create: {
                    playback_state_id: Number(item.id),
                    playlist_id: playlist_id,
                    user_id: access_tokens.user_id,
                }
            });
        }
}
