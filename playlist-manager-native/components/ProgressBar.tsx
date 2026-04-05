import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface ProgressBarProps {
  percent: number; // 0-100
  compact?: boolean;
}

/**
 * Horizontal progress bar component.
 * Used on both the Now tab card and the Albums tab list rows.
 */
export function ProgressBar({ percent, compact = false }: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <View
      style={[styles.track, compact && styles.trackCompact]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clampedPercent }}
      accessibilityLabel={`${clampedPercent}% complete`}
    >
      <View style={[styles.fill, { width: `${clampedPercent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.progressTrack,
    borderRadius: 3,
    overflow: 'hidden'
  },
  trackCompact: { height: 4 },
  fill: {
    height: '100%',
    backgroundColor: Colors.progressFill,
    borderRadius: 3
  }
});
