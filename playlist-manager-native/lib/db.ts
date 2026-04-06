/**
 * SQLite cache layer using expo-sqlite.
 *
 * Stores playlists and listening progress locally so the UI can render
 * immediately on load and survive offline. The server is always the source of
 * truth — this cache is write-through on every successful API fetch.
 *
 * Tables:
 *   playlists      — mirrors PlaylistSummary
 *   progress       — mirrors ProgressEntry (one row per album per playlist)
 *
 * Conflict resolution: last-write-wins using the listened_at timestamp that
 * comes from the server. We only cache what the server returns — no local
 * writes to progress (those go via syncHistory → server → back down on next
 * read).
 */

import * as SQLite from 'expo-sqlite';
import { ProgressEntry, PlaylistSummary } from './api';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('playlist_manager.db');
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS playlists (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      image_url   TEXT,
      created_at  TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS progress (
      album_id        TEXT NOT NULL,
      playlist_id     TEXT NOT NULL,
      album_name      TEXT NOT NULL,
      album_image_url TEXT NOT NULL DEFAULT '',
      playlist_name   TEXT NOT NULL DEFAULT '',
      last_track_index INTEGER NOT NULL,
      total_tracks    INTEGER NOT NULL,
      listened_at     TEXT NOT NULL,
      progress_percent INTEGER NOT NULL,
      PRIMARY KEY (album_id, playlist_id)
    );
  `);
  return db;
}

// ── Playlists ──────────────────────────────────────────────────────────────────

export async function cachePlaylists(playlists: PlaylistSummary[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const p of playlists) {
      await db.runAsync(
        `INSERT INTO playlists (id, name, description, image_url, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name        = excluded.name,
           description = excluded.description,
           image_url   = excluded.image_url,
           created_at  = excluded.created_at`,
        [p.id, p.name, p.description ?? '', p.image_url ?? '', p.created_at ?? '']
      );
    }
  });
}

export async function getCachedPlaylists(): Promise<PlaylistSummary[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string; name: string; description: string;
    image_url: string | null; created_at: string;
  }>(`SELECT * FROM playlists ORDER BY created_at DESC`);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    image_url: r.image_url,
    created_at: r.created_at
  }));
}

// ── Progress ───────────────────────────────────────────────────────────────────

export async function cacheProgress(entries: ProgressEntry[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const e of entries) {
      await db.runAsync(
        `INSERT INTO progress
           (album_id, playlist_id, album_name, album_image_url, playlist_name,
            last_track_index, total_tracks, listened_at, progress_percent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(album_id, playlist_id) DO UPDATE SET
           album_name       = excluded.album_name,
           album_image_url  = excluded.album_image_url,
           playlist_name    = excluded.playlist_name,
           last_track_index = excluded.last_track_index,
           total_tracks     = excluded.total_tracks,
           listened_at      = excluded.listened_at,
           progress_percent = excluded.progress_percent
         WHERE excluded.listened_at >= progress.listened_at`,
        [
          e.albumId, e.playlistId, e.albumName, e.albumImageUrl ?? '',
          e.playlistName, e.lastTrackIndex, e.totalTracks,
          e.listenedAt, e.progressPercent
        ]
      );
    }
  });
}

export async function getCachedProgress(): Promise<ProgressEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    album_id: string; playlist_id: string; album_name: string;
    album_image_url: string; playlist_name: string;
    last_track_index: number; total_tracks: number;
    listened_at: string; progress_percent: number;
  }>(`SELECT * FROM progress ORDER BY listened_at DESC`);
  return rows.map(r => ({
    albumId: r.album_id,
    playlistId: r.playlist_id,
    albumName: r.album_name,
    albumImageUrl: r.album_image_url,
    playlistName: r.playlist_name,
    lastTrackIndex: r.last_track_index,
    totalTracks: r.total_tracks,
    listenedAt: r.listened_at,
    progressPercent: r.progress_percent
  }));
}
