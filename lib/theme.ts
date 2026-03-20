/**
 * Light parchment-inspired theme with dark bold red accents.
 */
export const lightTheme = {
  // Backgrounds - paper parchment tones
  background: '#f5f0e8',
  surface: '#faf8f4',
  surfaceElevated: '#fffdf9',
  border: '#e8e2d8',

  // Text
  text: '#2c2419',
  textSecondary: '#5c5349',
  textMuted: '#8a8278',
  /** Unread checkmark on article cards — light grey, lower contrast than textMuted */
  readIndicatorMuted: '#c5c0b6',

  // Accent - dark bold red
  accent: '#8B1A1A',
  accentPressed: '#6B1212',

  // Semantic
  error: '#991b1b',

  // Alternating accent for list items
  cardTitleAlt: '#1a1a1a',

  // Etched section (parchment recess)
  etchedBg: '#ebe5dc',
  etchedBorderLight: '#f0ebe2',
  etchedBorderDark: '#ddd6cc',

  // Highlights (sentence/word selection)
  highlightOverlay: 'rgba(139, 26, 26, 0.06)',
  highlightBg: 'rgba(139, 26, 26, 0.12)',
} as const;

/**
 * Dark cyberpunk/matrix-inspired theme.
 */
export const darkTheme = {
  // Backgrounds - deep dark with green tint
  background: '#0a0e0a',
  surface: '#0d140d',
  surfaceElevated: '#131d13',
  border: '#1a2a1a',

  // Text - matrix green tones
  text: '#c8ffc8',
  textSecondary: '#88cc88',
  textMuted: '#5a8a5a',
  /** Unread checkmark — subtle vs accent, still visible on dark cards */
  readIndicatorMuted: '#3d5240',

  // Accent - neon green
  accent: '#00ff88',
  accentPressed: '#00cc6a',

  // Semantic
  error: '#ff4444',

  // Alternating accent
  cardTitleAlt: '#a0ffa0',

  // Etched section (dark recess)
  etchedBg: '#080c08',
  etchedBorderLight: '#0f1a0f',
  etchedBorderDark: '#051005',

  // Highlights (sentence/word selection)
  highlightOverlay: 'rgba(0, 255, 136, 0.08)',
  highlightBg: 'rgba(0, 255, 136, 0.15)',
} as const;

export type Theme = typeof lightTheme | typeof darkTheme;

/** @deprecated Use useTheme() from ThemeContext. Kept for backwards compatibility. */
export const theme = lightTheme;
