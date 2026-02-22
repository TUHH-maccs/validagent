/**
 * TUHH Corporate Design Color Palette
 * Use these constants for consistent colors across all components
 */

export const TUHH_COLORS = {
  // Primary Colors
  green: "#00AD70",         // Honesty, Erfolg, positive Werte
  red: "#FF4F4F",           // Dishonesty, Fehler, Warnungen
  turquoise: "#00C1D4",     // Standard Türkis (Akzente, Links)
  turquoise25: "#00919F",   // Türkis 25% dunkler
  turquoise50: "#00606A",   // Türkis 50% dunkler
  greenblue: "#265D71",     // Grünblau (Headers, wichtige Elemente)
  orange: "#FF7E15",        // Sekundäre Akzente, Agent-Farbe

  // Neutral Colors
  dark: "#333333",
  gray: "#666666",
  light: "#E5E5E5",
  offwhite: "#F5F5F5",
  white: "#FFFFFF",
} as const;

// Semantic color mappings for charts and visualizations
export const CHART_COLORS = {
  honest: TUHH_COLORS.green,        // Grün - für ehrliche Werte
  dishonest: TUHH_COLORS.red,       // Rot - für unehrliche Werte
  roll: TUHH_COLORS.gray,           // Grau - neutrale Würfelwürfe
  neutral: TUHH_COLORS.turquoise,   // Türkis - neutrale Akzente
  human: TUHH_COLORS.greenblue,     // Grünblau - Human-Daten
  agent: TUHH_COLORS.orange,        // Orange - Agent-Daten
  accent: TUHH_COLORS.turquoise,    // Türkis - Akzente
  grid: TUHH_COLORS.light,          // Hellgrau - Grid-Linien
  text: TUHH_COLORS.dark,           // Dunkel - Text
  textSecondary: TUHH_COLORS.gray,  // Grau - Sekundärer Text
} as const;

// For Recharts and other chart libraries
export const RECHARTS_COLORS = {
  honest: TUHH_COLORS.green,
  dishonest: TUHH_COLORS.red,
  roll: TUHH_COLORS.gray,
  human: TUHH_COLORS.greenblue,
  agent: TUHH_COLORS.orange,
} as const;

// Status colors for badges
export const STATUS_COLORS = {
  success: TUHH_COLORS.green,
  error: TUHH_COLORS.red,
  warning: TUHH_COLORS.orange,
  info: TUHH_COLORS.turquoise,
  neutral: TUHH_COLORS.gray,
} as const;

// Validation strength badge colors
export const VALIDATION_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  validated: {
    bg: `${TUHH_COLORS.green}20`,
    text: TUHH_COLORS.green,
    border: TUHH_COLORS.green,
  },
  pilot: {
    bg: `${TUHH_COLORS.orange}20`,
    text: TUHH_COLORS.orange,
    border: TUHH_COLORS.orange,
  },
  placeholder: {
    bg: TUHH_COLORS.light,
    text: TUHH_COLORS.gray,
    border: TUHH_COLORS.gray,
  },
};
