import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface SegmentedProgressProps {
  /** One entry per segment, each a fill fraction 0–1. */
  segments: number[];
  compact?: boolean;
  accessibilityLabel?: string;
}

/**
 * Progress bar broken into discrete segments — one per album for playlist
 * progress, one per track for album progress. Partially-complete segments
 * fill proportionally. Gaps tighten as the segment count grows so long
 * albums still read as segmented rather than collapsing into noise.
 */
export function SegmentedProgress({ segments, compact = false, accessibilityLabel }: SegmentedProgressProps) {
  const count = segments.length;
  if (count === 0) return null;

  const gap = count > 40 ? 1 : count > 20 ? 2 : 3;
  const overall = Math.round((segments.reduce((sum, s) => sum + clamp(s), 0) / count) * 100);

  return (
    <View
      style={[styles.row, { gap }, compact && styles.rowCompact]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: overall }}
      accessibilityLabel={accessibilityLabel ?? `${overall}% complete`}
    >
      {segments.map((s, i) => {
        const fill = clamp(s);
        return (
          <View key={i} style={styles.segment}>
            {fill > 0 && <View style={[styles.fill, { width: `${fill * 100}%` }]} />}
          </View>
        );
      })}
    </View>
  );
}

/** Track segments for an album: everything up to and including the current track is filled. */
export function trackSegments(listenedTracks: number, totalTracks: number): number[] {
  return Array.from({ length: Math.max(0, totalTracks) }, (_, i) => (i < listenedTracks ? 1 : 0));
}

/**
 * Album segments for a playlist: started albums (as 0–100 percents) first,
 * most complete leading, then empty segments for albums not yet started.
 */
export function albumSegments(progressPercents: number[], totalAlbums: number): number[] {
  const started = [...progressPercents].sort((a, b) => b - a).map(p => p / 100);
  const total = Math.max(totalAlbums, started.length);
  return [...started, ...Array(total - started.length).fill(0)];
}

function clamp(n: number) {
  return Math.min(1, Math.max(0, n));
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', height: 5, width: '100%' },
  rowCompact: { height: 3 },
  segment: {
    flex: 1,
    height: '100%',
    backgroundColor: Colors.track,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: Colors.accent },
});
