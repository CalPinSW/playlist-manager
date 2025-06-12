import { access_token } from '../../../../generated/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../withAuth';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { withSpotifyAccessToken } from '../../utilities/getAccessTokensFromRequest';
import { AlbumIdOffset, PlaybackOffset, StartPlaybackRequest, UriOffset } from '../../../../utils/interfaces/PlaybackRequest';
import prisma from '../../../../../lib/prisma';

const postStartPlaybackHandler = async (access_tokens: access_token, request: Request) =>{
    try {
        const requestBody: StartPlaybackRequest = await request.json()
        const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
        const deviceId = await getDeviceIdForUser(spotifySdk);

        let playbackRequest = { ...requestBody };
        if (requestBody && requestBody.offset) {
            const offset = requestBody.offset as PlaybackOffset;
            if (offset.type === 'album_id') {
                // Fetch album's tracks, order by disc_number, track_number
                const album = await prisma.album.findUnique({
                    where: { id: (offset as AlbumIdOffset).album_id },
                    include: {
                        track: {
                            orderBy: [
                                { disc_number: 'asc' },
                                { track_number: 'asc' }
                            ]
                        }
                    }
                });
                if (!album || !album.track || album.track.length === 0) {
                    return NextResponse.json({ error: 'Album or tracks not found' }, { status: 400 });
                }
                const firstTrackUri = album.track[0].uri;
                playbackRequest.offset = { type: 'uri', uri: firstTrackUri } as UriOffset;
            }
            // If offset is uri or position, pass through (already correct)
        }
        // Remove undefined/null fields for Spotify SDK
        const cleanRequest: any = {};
        for (const key in playbackRequest) {
            if (playbackRequest[key] !== undefined && playbackRequest[key] !== null) {
                cleanRequest[key] = playbackRequest[key];
            }
        }
        const playback = await spotifySdk.player.startResumePlayback(deviceId, cleanRequest);
        return NextResponse.json({ playback }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
};


export const POST = withAuth(withSpotifyAccessToken(postStartPlaybackHandler));


const getDeviceIdForUser = async (spotifySdk: SpotifyApi): Promise<string | null> => {
    const { devices } = await spotifySdk.player.getAvailableDevices();
    if (!devices || devices.length === 0) {
        return null;
    }

    let device_id: string;
    const active_device = devices.find(device => device.is_active);
    if (active_device) {
        device_id = active_device.id;
    } else {
        const smartphone_device = devices.find(
            device => device.type && device.type.toLowerCase() === "smartphone"
        );
        device_id = smartphone_device ? smartphone_device.id : devices[0].id;
    }
    return device_id;
}