import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockEnrich, mockAddTags, mockLogger } = vi.hoisted(() => ({
  mockEnrich: vi.fn(),
  mockAddTags: vi.fn(),
  mockLogger: { log: vi.fn(), warn: vi.fn() }
}));

vi.mock('@trigger.dev/sdk', () => ({
  // Expose the task's config so the test can call run() directly.
  task: (config: unknown) => config,
  logger: mockLogger,
  tags: { add: mockAddTags }
}));
vi.mock('../../../app/api/albums/utilities/enrichAlbumInfo', () => ({ enrichAlbumInfo: mockEnrich }));

import { enrichAlbumInfoTask, enrichmentTags } from '../../../app/trigger/enrichAlbumInfo';

const report = (overrides: Record<string, unknown> = {}) => ({
  albumId: 'album-1',
  album: 'Dead Company — Royal Blood',
  status: 'incomplete',
  missing: ['reviews'],
  found: { musicBrainz: true, summary: 'wikipedia', reception: false, reviewLinks: 0, lastFmStats: true, artistBios: [] },
  errors: [],
  attempts: 1,
  nextRefreshAt: '2026-11-20T00:00:00.000Z',
  ...overrides
});

const run = (payload: { albumId: string; force?: boolean }) =>
  (enrichAlbumInfoTask as unknown as { run: (p: typeof payload) => Promise<unknown> }).run(payload);

describe('enrichmentTags', () => {
  it('tags the status and each missing piece', () => {
    expect(enrichmentTags(report() as never)).toEqual(['status:incomplete', 'missing:reviews']);
    expect(enrichmentTags(report({ status: 'complete', missing: [] }) as never)).toEqual(['status:complete']);
  });

  it('adds an errors tag when a lookup failed', () => {
    expect(enrichmentTags(report({ errors: ['Last.fm lookup'] }) as never)).toEqual([
      'status:incomplete',
      'missing:reviews',
      'errors'
    ]);
  });

  it('does not list missing pieces for a skipped album', () => {
    expect(
      enrichmentTags(report({ status: 'skipped', missing: ['summary', 'reviews', 'artist-bio'] }) as never)
    ).toEqual(['status:skipped']);
  });

  it('stays within the 10-tags-per-run limit even in the worst case', () => {
    const worst = report({ missing: ['summary', 'reviews', 'artist-bio'], errors: ['a', 'b'] });
    expect(enrichmentTags(worst as never).length).toBeLessThanOrEqual(10);
  });
});

describe('enrich-album-info task', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnrich.mockResolvedValue(report());
    mockAddTags.mockResolvedValue(undefined);
  });

  it('returns the report as the run output and tags the run', async () => {
    const output = await run({ albumId: 'album-1', force: true });

    expect(mockEnrich).toHaveBeenCalledWith('album-1', { force: true });
    expect(output).toEqual(report());
    expect(mockAddTags).toHaveBeenCalledWith(['status:incomplete', 'missing:reviews']);
  });

  it('still succeeds if tagging fails, since the enrichment is already saved', async () => {
    mockAddTags.mockRejectedValue(new Error('Trigger.dev API down'));

    await expect(run({ albumId: 'album-1' })).resolves.toEqual(report());
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
