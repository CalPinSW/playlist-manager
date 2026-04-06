/**
 * Shared playlist name filter constants.
 *
 * NEW_ALBUMS_REGEX  — matches the strict "New Albums DD/MM/YY" format used for
 *                     weekly discovery playlists (zero-padded day/month required).
 *                     Used by syncRecentlyPlayed to scope progress tracking.
 *
 * ALL_ALBUMS_REGEX  — matches any playlist whose name contains "Albums".
 *                     Used by refreshSpotifyPlaylists to decide which playlists
 *                     to sync to the DB (New Albums + Best Albums).
 *
 * Both constants are the single source of truth — do not inline these patterns
 * elsewhere in the codebase.
 */
export const NEW_ALBUMS_REGEX = /^New Albums \d{2}\/\d{2}\/\d{2}$/;
export const ALL_ALBUMS_REGEX = /Albums/;
