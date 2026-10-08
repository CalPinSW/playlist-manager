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
import { ALBUM_INFO_STALE_DAYS } from '../../../../app/api/albums/utilities/enrichAlbumInfo';

const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const makeInfo = (fetchedAt: Date) => ({
  mb_type: 'Album',
  summary: 'A record.',
  summary_html: '<p>A record.</p>',
  lastfm_listeners: 10,
  lastfm_playcount: 20,
  fetched_at: fetchedAt
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
    mockPrisma.album.findFirst.mockResolvedValue({ id: 'album-1', album_info: null });

    const { status, body } = await callRoute();

    expect(status).toBe(200);
    expect(mockTriggerNow).toHaveBeenCalledWith('album-1');
    expect(body).toMatchObject({ pending: true, enrichmentQueued: true, summary: null });
  });

  it('returns cached info without re-queuing when it is fresh', async () => {
    mockPrisma.album.findFirst.mockResolvedValue({ id: 'album-1', album_info: makeInfo(daysAgo(1)) });

    const { body } = await callRoute();

    expect(mockTriggerNow).not.toHaveBeenCalled();
    expect(body).toMatchObject({ pending: false, enrichmentQueued: false, summary: 'A record.', listeners: 10 });
  });

  it('re-queues stale info but still returns the cached copy', async () => {
    mockPrisma.album.findFirst.mockResolvedValue({
      id: 'album-1',
      album_info: makeInfo(daysAgo(ALBUM_INFO_STALE_DAYS + 1))
    });

    const { body } = await callRoute();

    expect(mockTriggerNow).toHaveBeenCalledWith('album-1');
    expect(body).toMatchObject({ pending: false, enrichmentQueued: true, summary: 'A record.' });
  });

  it('reports the failure to Sentry and does not claim a run is queued when triggering fails', async () => {
    mockPrisma.album.findFirst.mockResolvedValue({ id: 'album-1', album_info: null });
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
