/**
 * Design system tokens — "liner notes" palette: warm off-black, parchment
 * text, one vermilion accent. Screens should reference these semantic names
 * rather than hex/rgba literals so a reskin stays a one-file change.
 * Mirrored in tailwind.config.js for className usage.
 *
 * Status colours carry one meaning each: `accent` = playing / current /
 * primary action, `success` = finished / promoted, `rating` = stars only.
 */
export const Colors = {
  // Surfaces
  bg: '#14110f', // page background
  surface: '#1f1a16', // cards, headers, placeholders
  surfaceRaised: '#29231e', // things sitting on a card
  overlay: 'rgba(0,0,0,0.72)', // badges laid over album art

  // Text
  text: '#efe6d8',
  textMuted: '#a89b8a',
  textFaint: '#6e6357', // chevrons, empty stars, unstarted

  // Lines & fills
  border: '#332b25', // card outlines, opaque dividers
  hairline: 'rgba(239,230,216,0.10)', // borders on translucent controls
  divider: 'rgba(239,230,216,0.06)', // list row separators
  fill: 'rgba(239,230,216,0.06)', // inputs, chips, secondary buttons
  track: '#332b25', // progress bar track

  // Accent — playing / current / primary action
  accent: '#e8552d',
  accentSoft: 'rgba(232,85,45,0.12)',
  accentBorder: 'rgba(232,85,45,0.40)',
  onAccent: '#1a0f0a', // dark text — white on vermilion fails contrast

  // Success — finished / promoted / Best Albums
  success: '#8fa77a',
  successSoft: 'rgba(143,167,122,0.12)',
  successBorder: 'rgba(143,167,122,0.35)',
  successText: '#b9c9a8',
  successTextMuted: 'rgba(185,201,168,0.5)',
  onSuccess: '#14110f',

  // Ratings
  rating: '#d9a441',

  // Danger
  danger: '#ff7a6b',
  dangerBg: '#2a1310',
  dangerBorder: '#4d221c',

  // Playlist thumbnails (no cover art)
  thumbNew: '#7a2e18',
  thumbBest: '#4c5a3f',
} as const;

/**
 * Font families. `display` is loaded in app/_layout.tsx via useFonts; body
 * text stays on the system font.
 */
export const Fonts = {
  display: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
} as const;
