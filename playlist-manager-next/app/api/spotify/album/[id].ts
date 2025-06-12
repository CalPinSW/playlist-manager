import { Album, MaxInt, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { NextResponse } from 'next/server';
import { access_token } from '../../../generated/prisma';
import { withAuth } from '../../withAuth';
import { withSpotifyAccessToken } from '../utilities/getAccessTokensFromRequest';
import { NextApiRequest } from 'next';

const getSpotifyAlbumHandler = async (access_tokens: access_token, request: NextApiRequest) =>{
    try {
        const { id } = request.query as {id: string}
        const spotifySdk = SpotifyApi.withAccessToken(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, access_tokens);
        const album = getSpotifyAlbum(spotifySdk, id)
        return NextResponse.json(undefined, {status: 204})
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
};

export const getSpotifyAlbum = async (spotifySdk: SpotifyApi, albumId: string): Promise<Album>  => {
    const album = await spotifySdk.albums.get(albumId)
    const limit: MaxInt<50> = album.tracks.limit as MaxInt<50>
    
    let offset = 0
    const tracks = album.tracks.items
    while (tracks.length != album.tracks.total) {
        offset += limit
        const extraTracks = await spotifySdk.albums.tracks(albumId, undefined, limit, offset)
        tracks.push(...extraTracks.items)
    }
    return {...album, tracks: {...album.tracks, items: tracks, next: null, previous: null, offset: 0, limit: tracks.length}}
}


export const GET = withAuth(withSpotifyAccessToken(getSpotifyAlbumHandler));
