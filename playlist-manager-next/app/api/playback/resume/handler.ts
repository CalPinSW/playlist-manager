import { NextRequest, NextResponse } from 'next/server';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { access_token } from '../../../../generated/prisma';

/**
 * POST /api/playback/resume
 *
 * Starts Spotify playback from a specific album and track on the user's
 * currently active device.
 *
 * Body: { albumId: string; trackIndex: number }
 *
 * Errors:
 *  404 – no active Spotify device (user needs to open Spotify first)
 *  403 – Premium required
 *  400 – missing/invalid body
 */
export const resumePlaybackHandler = async (accessToken: access_token, req: NextRequest): Promise<NextResponse> => {
  const body = await req.json().catch(() => null);
  const { albumId, trackIndex } = body ?? {};

  if (!albumId || typeof trackIndex !== 'number') {
    return NextResponse.json({ error: 'albumId (string) and trackIndex (number) are required' }, { status: 400 });
  }

  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  if (!clientId) throw new Error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not set');

  const sdk = SpotifyApi.withAccessToken(clientId, accessToken);

  try {
    // '' for device_id → paramsFor omits the param → Spotify uses the active device.
    await sdk.player.startResumePlayback('', `spotify:album:${albumId}`, undefined, { position: trackIndex }, 0);
    return NextResponse.json({ started: true }, { status: 200 });
  } catch (err: unknown) {
    const status = err instanceof Error && 'status' in err ? (err as { status: number }).status : 500;

    if (status === 404) {
      return NextResponse.json(
        { error: 'no_active_device', message: 'No active Spotify device found. Open Spotify on any device first.' },
        { status: 404 }
      );
    }
    if (status === 403) {
      return NextResponse.json(
        { error: 'premium_required', message: 'Spotify Premium is required for playback control.' },
        { status: 403 }
      );
    }

    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[playback/resume] Spotify error', { status, message });
    return NextResponse.json({ error: message }, { status });
  }
};
