/**
 * Design system color tokens.
 * These mirror the Tailwind config — use for StyleSheet where className isn't available.
 */
export const Colors = {
  primary: '#843dff',
  secondary: '#78a63c',
  surface: '#1a1030',
  surfaceDark: '#0f0a1e',
  text: '#f0ecff',
  textMuted: '#9d8ec4',
  border: '#2d1f5e',

  // Tab bar
  tabActive: '#843dff',
  tabInactive: '#9d8ec4',
  tabBackground: '#0f0a1e',

  // Progress bar
  progressFill: '#843dff',
  progressTrack: '#2d1f5e',
} as const;
