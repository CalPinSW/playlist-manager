import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockGetUserFromRequest, mockTriggerManual, mockCaptureException } = vi.hoisted(() => ({
  mockPrisma: { album: { findFirst: vi.fn() } },
  mockGetUserFromRequest: vi.fn(),
  mockTriggerManual: vi.fn(),
  mockCaptureException: vi.fn()
}));

vi.mock('../../../../lib/prisma', () => ({ default: mockPrisma }));
vi.mock('../../../../app/api/withAuth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('../../../../app/api/user/handler', () => ({ getUserFromRequest: mockGetUserFromRequest }));
vi.mock('../../../../app/api/albums/utilities/triggerAlbumEnrichment', () => ({
  triggerAlbumEnrichmentManual: mockTriggerManual
}));
vi.mock('@sentry/nextjs', () => ({ captureException: mockCaptureException }));

import { POST } from '../../../../app/api/albums/[albumId]/info/refresh/route';

const callRoute = async () => {
  const handler = POST as unknown as (req: unknown, ctx: unknown) => Promise<Response>;
  const res = await handler({}, { params: Promise.resolve({ albumId: 'album-1' }) });
  return { status: res.status, body: await res.json() };
};

describe('POST /api/albums/[albumId]/info/refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetUserFromRequest.mockResolvedValue({ id: 'user-1' });
    mockPrisma.album.findFirst.mockResolvedValue({ id: 'album-1' });
    mockTriggerManual.mockResolvedValue({ id: 'run_1' });
  });

  it('queues a forced run for an album in one of the user\'s playlists', async () => {
    const { status, body } = await callRoute();

    expect(status).toBe(202);
    expect(mockTriggerManual).toHaveBeenCalledWith('album-1');
    expect(body).toEqual({ albumId: 'album-1', enrichmentQueued: true });
    expect(mockPrisma.album.findFirst.mock.calls[0][0].where).toMatchObject({
      id: 'album-1',
      playlistalbumrelationship: { some: { playlist: { user_id: 'user-1' } } }
    });
  });

  it("404s without queuing for an album the user doesn't have", async () => {
    mockPrisma.album.findFirst.mockResolvedValue(null);

    const { status } = await callRoute();

    expect(status).toBe(404);
    expect(mockTriggerManual).not.toHaveBeenCalled();
  });

  it('reports a failure to queue instead of claiming success', async () => {
    const error = new Error('Trigger.dev unreachable');
    mockTriggerManual.mockRejectedValue(error);

    const { status } = await callRoute();

    expect(status).toBe(502);
    expect(mockCaptureException).toHaveBeenCalledWith(error, expect.anything());
  });
});
