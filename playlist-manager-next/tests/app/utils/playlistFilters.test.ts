import { describe, it, expect } from 'vitest';
import { NEW_ALBUMS_REGEX, ALL_ALBUMS_REGEX } from '../../../app/utils/playlistFilters';

describe('NEW_ALBUMS_REGEX', () => {
  it('matches a valid New Albums playlist name', () => {
    expect(NEW_ALBUMS_REGEX.test('New Albums 04/04/26')).toBe(true);
    expect(NEW_ALBUMS_REGEX.test('New Albums 01/01/25')).toBe(true);
    expect(NEW_ALBUMS_REGEX.test('New Albums 31/12/24')).toBe(true);
  });

  it('rejects single-digit day or month (zero-padding required)', () => {
    expect(NEW_ALBUMS_REGEX.test('New Albums 4/4/26')).toBe(false);
    expect(NEW_ALBUMS_REGEX.test('New Albums 4/04/26')).toBe(false);
    expect(NEW_ALBUMS_REGEX.test('New Albums 04/4/26')).toBe(false);
  });

  it('rejects Best Albums playlists', () => {
    expect(NEW_ALBUMS_REGEX.test('Best Albums 04/04/26')).toBe(false);
  });

  it('rejects a bare "Albums" string', () => {
    expect(NEW_ALBUMS_REGEX.test('Albums')).toBe(false);
  });

  it('rejects partial matches (must match the full string)', () => {
    expect(NEW_ALBUMS_REGEX.test('My New Albums 04/04/26')).toBe(false);
    expect(NEW_ALBUMS_REGEX.test('New Albums 04/04/26 extra')).toBe(false);
  });

  it('rejects a four-digit year', () => {
    expect(NEW_ALBUMS_REGEX.test('New Albums 04/04/2026')).toBe(false);
  });
});

describe('ALL_ALBUMS_REGEX', () => {
  it('matches New Albums playlists', () => {
    expect(ALL_ALBUMS_REGEX.test('New Albums 04/04/26')).toBe(true);
  });

  it('matches Best Albums playlists', () => {
    expect(ALL_ALBUMS_REGEX.test('Best Albums 04/04/26')).toBe(true);
  });

  it('matches any name containing "Albums"', () => {
    expect(ALL_ALBUMS_REGEX.test('My Albums')).toBe(true);
    expect(ALL_ALBUMS_REGEX.test('Albums')).toBe(true);
  });

  it('does not match names without "Albums"', () => {
    expect(ALL_ALBUMS_REGEX.test('Favourites')).toBe(false);
    expect(ALL_ALBUMS_REGEX.test('New Tracks 04/04/26')).toBe(false);
  });
});
