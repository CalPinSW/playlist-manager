import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockGetUserFromRequest, mockTriggerNow, mockCaptureException } = vi.hoisted(() => ({
  mockPrisma: { album: { findFirst: vi.fn() } },
  mockGetUserFromRequest: vi.fn(),
  mockTriggerNow: vi.fn(),
  mockCaptureException: vi.fn()
}));

vi.mock('../../../../lib/prisma', () => ({ default: mockPrisma }));
vi.mock('../../../../app/api/withAuth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('../../../../app/api/user/handler', () => ({ getUserFromRequest: mockGetUserFromRequest }));
vi.mock('../../../../app/api/albums/utilities/triggerAlbumEnrichment', () => ({
  triggerAlbumEnrichmentNow: mockTriggerNow
}));
vi.mock('@sentry/nextjs', () => ({ captureException: mockCaptureException }));

import { GET } from '../../../../app/api/albums/[albumId]/info/route';

const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
const makeInfo = (nextRefreshAt: Date | null) => ({
  mb_type: 'Album',
  summary: 'A record.',
  summary_html: '<p>A record.</p>',
  lastfm_listeners: 10,
  lastfm_playcount: 20,
  summary_source: 'wikipedia',
  wikipedia_url: 'https://en.wikipedia.org/wiki/A_Record',
  reception: 'Critics liked it.',
  review_links: [{ url: 'https://pitchfork.com/reviews/a-record', source: 'pitchfork.com' }],
  fetched_at: new Date(),
  next_refresh_at: nextRefreshAt
});
const makeAlbum = (albumInfo: ReturnType<typeof makeInfo> | null, artistRels: unknown[] = []) => ({
  id: 'album-1',
  album_info: albumInfo,
  albumartistrelationship: artistRels
});

const callRoute = async () => {
  // withAuth is mocked to the identity function, so GET is the bare handler.
  const handler = GET as unknown as (req: unknown, ctx: unknown) => Promise<Response>;
  const res = await handler({}, { params: Promise.resolve({ albumId: 'album-1' }) });
  return { status: res.status, body: await res.json() };
};

describe('GET /api/albums/[albumId]/info', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserFromRequest.mockResolvedValue({ id: 'user-1' });
    mockTriggerNow.mockResolvedValue({ id: 'run_1' });
  });

  it('queues enrichment and reports pending + queued when nothing is cached', async () => {
    mockPrisma.album.findFirst.mockResolvedValue(makeAlbum(null));

    const { status, body } = await callRoute();

    expect(status).toBe(200);
    expect(mockTriggerNow).toHaveBeenCalledWith('album-1');
    expect(body).toMatchObject({ pending: true, enrichmentQueued: true, summary: null });
  });

  it('returns cached info without re-queuing when it is fresh', async () => {
    mockPrisma.album.findFirst.mockResolvedValue(makeAlbum(makeInfo(daysFromNow(30))));

    const { body } = await callRoute();

    expect(mockTriggerNow).not.toHaveBeenCalled();
    expect(body).toMatchObject({ pending: false, enrichmentQueued: false, summary: 'A record.', listeners: 10 });
  });

  it('re-queues info that is past its next_refresh_at but still returns the cached copy', async () => {
    mockPrisma.album.findFirst.mockResolvedValue(makeAlbum(makeInfo(daysFromNow(-1))));

    const { body } = await callRoute();

    expect(mockTriggerNow).toHaveBeenCalledWith('album-1');
    expect(body).toMatchObject({ pending: false, enrichmentQueued: true, summary: 'A record.' });
  });

  it('treats info from before refresh scheduling (no next_refresh_at) as due', async () => {
    mockPrisma.album.findFirst.mockResolvedValue(makeAlbum(makeInfo(null)));

    const { body } = await callRoute();

    expect(mockTriggerNow).toHaveBeenCalledWith('album-1');
    expect(body).toMatchObject({ pending: false, enrichmentQueued: true });
  });

  it('returns reception, review links and bios for artists that have one', async () => {
    mockPrisma.album.findFirst.mockResolvedValue(
      makeAlbum(makeInfo(daysFromNow(30)), [
        {
          artist: {
            id: 'artist-1',
            name: 'The Band',
            artist_info: {
              description: 'English rock band',
              bio: 'The Band are a band.',
              bio_source: 'wikipedia',
              url: 'https://en.wikipedia.org/wiki/The_Band'
            }
          }
        },
        { artist: { id: 'artist-2', name: 'No Bio', artist_info: { bio: null } } },
        { artist: { id: 'artist-3', name: 'Never Fetched', artist_info: null } }
      ])
    );

    const { body } = await callRoute();

    expect(body).toMatchObject({
      reception: 'Critics liked it.',
      wikipediaUrl: 'https://en.wikipedia.org/wiki/A_Record',
      summarySource: 'wikipedia',
      reviewLinks: [{ url: 'https://pitchfork.com/reviews/a-record', source: 'pitchfork.com' }]
    });
    expect(body.artists).toEqual([
      {
        id: 'artist-1',
        name: 'The Band',
        description: 'English rock band',
        bio: 'The Band are a band.',
        bioSource: 'wikipedia',
        url: 'https://en.wikipedia.org/wiki/The_Band'
      }
    ]);
  });

  it('reports the failure to Sentry and does not claim a run is queued when triggering fails', async () => {
    mockPrisma.album.findFirst.mockResolvedValue(makeAlbum(null));
    const error = new Error('Trigger.dev unreachable');
    mockTriggerNow.mockRejectedValue(error);

    const { status, body } = await callRoute();

    expect(status).toBe(200);
    expect(mockCaptureException).toHaveBeenCalledWith(error, expect.anything());
    expect(body).toMatchObject({ pending: true, enrichmentQueued: false });
  });

  it("404s for an album not in any of the user's playlists", async () => {
    mockPrisma.album.findFirst.mockResolvedValue(null);

    const { status } = await callRoute();

    expect(status).toBe(404);
    expect(mockTriggerNow).not.toHaveBeenCalled();
  });
});
