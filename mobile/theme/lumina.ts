import { Platform } from 'react-native';

/** Lumina Health — 2026 Premium Design System */

export type LuminaColorPalette = {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderSubtle: string;
  borderDark: string;
  /** Semantic */
  primary: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  successText: string;
  warning: string;
  warningSoft: string;
  warningText: string;
  error: string;
  errorSoft: string;
  errorText: string;
  /** Legacy aliases (mapped to semantic tokens) */
  accentBlue: string;
  accentBlueDark: string;
  accentTeal: string;
  accentTealLight: string;
  accentMint: string;
  accentMintText: string;
  accentRed: string;
  accentRedText: string;
  accentPink: string;
  navy: string;
  navyLight: string;
  homeActive: string;
  inProgress: string;
  pending: string;
  chartBar: string;
  chartBarActive: string;
  wellnessGradientStart: string;
  wellnessGradientEnd: string;
  tabActive: string;
  onPrimary: string;
  overlay: string;
};

export const LuminaColors: LuminaColorPalette = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceElevated: '#FFFFFF',
  text: '#0B1220',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  borderDark: '#0B1220',
  primary: '#2563EB',
  primarySoft: '#EFF6FF',
  secondary: '#0D9488',
  secondarySoft: '#F0FDFA',
  accent: '#059669',
  accentSoft: '#ECFDF5',
  success: '#22C55E',
  successSoft: '#F0FDF4',
  successText: '#15803D',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  warningText: '#B45309',
  error: '#EF4444',
  errorSoft: '#FEF2F2',
  errorText: '#DC2626',
  accentBlue: '#DBEAFE',
  accentBlueDark: '#2563EB',
  accentTeal: '#0D9488',
  accentTealLight: '#CCFBF1',
  accentMint: '#BBF7D0',
  accentMintText: '#15803D',
  accentRed: '#FEE2E2',
  accentRedText: '#DC2626',
  accentPink: '#FCE7F3',
  navy: '#2563EB',
  navyLight: '#1D4ED8',
  homeActive: '#059669',
  inProgress: '#64748B',
  pending: '#93C5FD',
  chartBar: '#BFDBFE',
  chartBarActive: '#2563EB',
  wellnessGradientStart: '#1E3A8A',
  wellnessGradientEnd: '#0D9488',
  tabActive: '#2563EB',
  onPrimary: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',
};

export const LuminaColorsDark: LuminaColorPalette = {
  background: '#0B1220',
  surface: '#111827',
  surfaceElevated: '#1F2937',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#1F2937',
  borderSubtle: '#111827',
  borderDark: '#F8FAFC',
  primary: '#3B82F6',
  primarySoft: '#1E3A5F',
  secondary: '#2DD4BF',
  secondarySoft: '#134E4A',
  accent: '#34D399',
  accentSoft: '#064E3B',
  success: '#4ADE80',
  successSoft: '#14532D',
  successText: '#86EFAC',
  warning: '#FBBF24',
  warningSoft: '#451A03',
  warningText: '#FCD34D',
  error: '#F87171',
  errorSoft: '#450A0A',
  errorText: '#FCA5A5',
  accentBlue: '#1E3A5F',
  accentBlueDark: '#60A5FA',
  accentTeal: '#2DD4BF',
  accentTealLight: '#134E4A',
  accentMint: '#064E3B',
  accentMintText: '#6EE7B7',
  accentRed: '#450A0A',
  accentRedText: '#FCA5A5',
  accentPink: '#500724',
  navy: '#3B82F6',
  navyLight: '#60A5FA',
  homeActive: '#34D399',
  inProgress: '#94A3B8',
  pending: '#3B82F6',
  chartBar: '#334155',
  chartBarActive: '#3B82F6',
  wellnessGradientStart: '#0B1220',
  wellnessGradientEnd: '#134E4A',
  tabActive: '#3B82F6',
  onPrimary: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const LuminaSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const LuminaRadius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  full: 999,
} as const;

export const LuminaTypography = {
  hero: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -1, lineHeight: 40 },
  display: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.6, lineHeight: 34 },
  brand: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
  h1: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.4, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  label: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  overline: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
} as const;

export const LuminaMotion = {
  spring: { damping: 18, stiffness: 220 },
  springSnappy: { damping: 22, stiffness: 320 },
  durationFast: 150,
  durationNormal: 250,
  durationSlow: 400,
} as const;

export const LuminaShadow = {
  sm: Platform.select({
    ios: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
    android: { elevation: 4 },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24 },
    android: { elevation: 8 },
    default: {},
  }),
  nav: Platform.select({
    ios: { shadowColor: '#0B1220', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 12 },
    default: {},
  }),
} as const;

export const LuminaTouch = {
  minTarget: 44,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;

export function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
