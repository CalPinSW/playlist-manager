import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockStartResumePlayback } = vi.hoisted(() => {
  const mockStartResumePlayback = vi.fn().mockResolvedValue(undefined);
  const mockPrisma = {
    track: { findFirst: vi.fn() }
  };
  return { mockPrisma, mockStartResumePlayback };
});

vi.mock('../../../../../lib/prisma', () => ({ default: mockPrisma }));

vi.mock('@spotify/web-api-ts-sdk', () => ({
  SpotifyApi: {
    withAccessToken: vi.fn(() => ({
      player: { startResumePlayback: mockStartResumePlayback }
    }))
  }
}));

import { resumePlaybackHandler } from '../../../../../app/api/playback/resume/handler';

const makeRequest = (body: unknown) => ({ json: () => Promise.resolve(body) }) as never;

describe('resumePlaybackHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID = 'client-id';
  });

  it('starts playback in the playlist context, offset to the resolved track URI', async () => {
    mockPrisma.track.findFirst.mockResolvedValue({ uri: 'spotify:track:t5' });

    const res = await resumePlaybackHandler(
      {} as never,
      makeRequest({ albumId: 'album-1', trackIndex: 4, playlistId: 'playlist-1' })
    );

    expect(mockPrisma.track.findFirst).toHaveBeenCalledWith({
      where: { album_id: 'album-1', track_number: 5 },
      select: { uri: true }
    });
    expect(mockStartResumePlayback).toHaveBeenCalledWith(
      '',
      'spotify:playlist:playlist-1',
      undefined,
      { uri: 'spotify:track:t5' },
      0
    );
    expect(res.status).toBe(200);
  });

  it('returns 400 when playlistId is missing', async () => {
    const res = await resumePlaybackHandler({} as never, makeRequest({ albumId: 'album-1', trackIndex: 4 }));

    expect(res.status).toBe(400);
    expect(mockStartResumePlayback).not.toHaveBeenCalled();
  });

  it('returns 400 when the track cannot be resolved', async () => {
    mockPrisma.track.findFirst.mockResolvedValue(null);

    const res = await resumePlaybackHandler(
      {} as never,
      makeRequest({ albumId: 'album-1', trackIndex: 99, playlistId: 'playlist-1' })
    );

    expect(res.status).toBe(400);
    expect(mockStartResumePlayback).not.toHaveBeenCalled();
  });

  it('maps a 404 from Spotify to a no_active_device error', async () => {
    mockPrisma.track.findFirst.mockResolvedValue({ uri: 'spotify:track:t5' });
    mockStartResumePlayback.mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 }));

    const res = await resumePlaybackHandler(
      {} as never,
      makeRequest({ albumId: 'album-1', trackIndex: 4, playlistId: 'playlist-1' })
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('no_active_device');
  });
});
