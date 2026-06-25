import { Platform } from 'react-native';

/** Lumina Health — 2026 Premium Design System */

// ─── Color palette type ────────────────────────────────────────────────────────

export type LuminaColorPalette = {
  // Surfaces
  background: string;
  surface: string;
  surfaceElevated: string;
  neutral100: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  /** Alias: body text (~textSecondary) */
  textBody: string;
  /** Alias: placeholder/hint text (~textMuted) */
  textHint: string;

  // Borders
  border: string;
  borderSubtle: string;
  borderDark: string;

  // Role-aware primary (coral for patient, teal for doctor)
  primary: string;
  primarySoft: string;

  // Brand colors (always available for direct use)
  coral: string;
  coralSoft: string;
  teal: string;
  tealSoft: string;

  // Secondary / accents
  secondary: string;
  secondarySoft: string;
  accent: string;
  accentSoft: string;

  // Semantic
  success: string;
  successSoft: string;
  successText: string;
  warning: string;
  warningSoft: string;
  warningText: string;
  error: string;
  errorSoft: string;
  errorText: string;

  // Appointment status tokens
  statusPending: string;
  statusPendingBg: string;
  statusConfirmed: string;
  statusConfirmedBg: string;
  statusCompleted: string;
  statusCompletedBg: string;
  statusCancelled: string;
  statusCancelledBg: string;

  // Legacy aliases (kept for backward compatibility)
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

// ─── Light palette ─────────────────────────────────────────────────────────────

export const LuminaColors: LuminaColorPalette = {
  // Surfaces — Sukhya warm off-white
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  neutral100: '#F1F3F5',

  // Text — Sukhya neutral scale
  text: '#212529',
  textSecondary: '#495057',
  textMuted: '#ADB5BD',
  textBody: '#495057',
  textHint: '#ADB5BD',

  // Borders
  border: '#E9ECEF',
  borderSubtle: '#F1F3F5',
  borderDark: '#212529',

  // Role-aware primary (patient default = coral)
  primary: '#F05A2A',
  primarySoft: '#FEF0EB',

  // Brand
  coral: '#F05A2A',
  coralSoft: '#FEF0EB',
  teal: '#0D9B76',
  tealSoft: '#E6F7F2',

  // Secondary
  secondary: '#0D9B76',
  secondarySoft: '#E6F7F2',
  accent: '#12B76A',
  accentSoft: '#DCFCE7',

  // Semantic
  success: '#12B76A',
  successSoft: '#DCFCE7',
  successText: '#065F46',
  warning: '#F79009',
  warningSoft: '#FEF3C7',
  warningText: '#B45309',
  error: '#F04438',
  errorSoft: '#FEE2E2',
  errorText: '#B91C1C',

  // Appointment status
  statusPending: '#F79009',
  statusPendingBg: '#FEF3C7',
  statusConfirmed: '#0BA5EC',
  statusConfirmedBg: '#E0F2FE',
  statusCompleted: '#12B76A',
  statusCompletedBg: '#DCFCE7',
  statusCancelled: '#F04438',
  statusCancelledBg: '#FEE2E2',

  // Legacy aliases
  accentBlue: '#E0F2FE',
  accentBlueDark: '#0BA5EC',
  accentTeal: '#0D9B76',
  accentTealLight: '#E6F7F2',
  accentMint: '#DCFCE7',
  accentMintText: '#065F46',
  accentRed: '#FEE2E2',
  accentRedText: '#B91C1C',
  accentPink: '#FCE7F3',
  navy: '#F05A2A',      // legacy alias → coral (patient primary)
  navyLight: '#E84014',
  homeActive: '#0D9B76',
  inProgress: '#868E96',
  pending: '#F79009',
  chartBar: '#E9ECEF',
  chartBarActive: '#0D9B76',
  wellnessGradientStart: '#0D9B76',
  wellnessGradientEnd: '#076B52',
  tabActive: '#F05A2A', // coral for patient tab
  onPrimary: '#FFFFFF',
  overlay: 'rgba(33, 37, 41, 0.45)',
};

// ─── Dark palette ──────────────────────────────────────────────────────────────

export const LuminaColorsDark: LuminaColorPalette = {
  background: '#0F1117',
  surface: '#1A1D27',
  surfaceElevated: '#1F2535',
  neutral100: '#252836',

  text: '#F1F3F5',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textBody: '#CBD5E1',
  textHint: '#94A3B8',

  border: '#2A2D3A',
  borderSubtle: '#1F2535',
  borderDark: '#F1F3F5',

  primary: '#FF7043',
  primarySoft: '#3D1A0F',

  coral: '#FF7043',
  coralSoft: '#3D1A0F',
  teal: '#2DD4BF',
  tealSoft: '#0D3D30',

  secondary: '#2DD4BF',
  secondarySoft: '#0D3D30',
  accent: '#34D399',
  accentSoft: '#064E3B',

  success: '#34D399',
  successSoft: '#0A3320',
  successText: '#6EE7B7',
  warning: '#FBBF24',
  warningSoft: '#451A03',
  warningText: '#FCD34D',
  error: '#FB7185',
  errorSoft: '#3D0A0A',
  errorText: '#FCA5A5',

  statusPending: '#FBBF24',
  statusPendingBg: '#451A03',
  statusConfirmed: '#38BDF8',
  statusConfirmedBg: '#0C2B40',
  statusCompleted: '#34D399',
  statusCompletedBg: '#0A3320',
  statusCancelled: '#FB7185',
  statusCancelledBg: '#3D0A0A',

  accentBlue: '#0C2B40',
  accentBlueDark: '#38BDF8',
  accentTeal: '#2DD4BF',
  accentTealLight: '#0D3D30',
  accentMint: '#064E3B',
  accentMintText: '#6EE7B7',
  accentRed: '#3D0A0A',
  accentRedText: '#FCA5A5',
  accentPink: '#500724',
  navy: '#FF7043',
  navyLight: '#FF8A65',
  homeActive: '#34D399',
  inProgress: '#94A3B8',
  pending: '#FBBF24',
  chartBar: '#2A2D3A',
  chartBarActive: '#2DD4BF',
  wellnessGradientStart: '#0F1117',
  wellnessGradientEnd: '#0D3D30',
  tabActive: '#FF7043',
  onPrimary: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

// ─── Doctor-specific palette overrides ────────────────────────────────────────

export const LuminaColorsDoctorLight: Partial<LuminaColorPalette> = {
  primary: '#0D9B76',
  primarySoft: '#E6F7F2',
  tabActive: '#0D9B76',
  navy: '#0D9B76',
  navyLight: '#076B52',
  chartBarActive: '#0D9B76',
  wellnessGradientStart: '#0D9B76',
  wellnessGradientEnd: '#076B52',
};

export const LuminaColorsDoctorDark: Partial<LuminaColorPalette> = {
  primary: '#2DD4BF',
  primarySoft: '#0D3D30',
  tabActive: '#2DD4BF',
  navy: '#2DD4BF',
  navyLight: '#5EEAD4',
};

// ─── Spacing ───────────────────────────────────────────────────────────────────

export const LuminaSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Radius ────────────────────────────────────────────────────────────────────

export const LuminaRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 28,
  full: 9999,
} as const;

// ─── Typography ────────────────────────────────────────────────────────────────

export const LuminaFontFamily = {
  // Nunito — headings, wordmark
  nunitoRegular: 'Nunito_400Regular',
  nunitoMedium: 'Nunito_500Medium',
  nunitoSemiBold: 'Nunito_600SemiBold',
  nunitoBold: 'Nunito_700Bold',
  nunitoExtraBold: 'Nunito_800ExtraBold',
  // DM Sans — body, labels, buttons
  dmSansRegular: 'DMSans_400Regular',
  dmSansMedium: 'DMSans_500Medium',
  dmSansSemiBold: 'DMSans_600SemiBold',
  dmSansBold: 'DMSans_700Bold',
  // DM Mono — times, stats, tokens
  dmMonoRegular: 'DMMono_400Regular',
  dmMonoMedium: 'DMMono_500Medium',
} as const;

export const LuminaTypography = {
  hero: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -1, lineHeight: 40, fontFamily: LuminaFontFamily.nunitoBold },
  display: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.6, lineHeight: 34, fontFamily: LuminaFontFamily.nunitoBold },
  brand: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, fontFamily: LuminaFontFamily.nunitoBold },
  h1: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.4, lineHeight: 32, fontFamily: LuminaFontFamily.nunitoBold },
  h2: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 26, fontFamily: LuminaFontFamily.nunitoSemiBold },
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22, fontFamily: LuminaFontFamily.nunitoSemiBold },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24, fontFamily: LuminaFontFamily.dmSansRegular },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20, fontFamily: LuminaFontFamily.dmSansRegular },
  label: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18, fontFamily: LuminaFontFamily.dmSansMedium },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const, fontFamily: LuminaFontFamily.dmSansSemiBold },
  overline: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const, fontFamily: LuminaFontFamily.dmSansSemiBold },
  /** For times, stat values, numeric data */
  mono: { fontSize: 15, fontWeight: '400' as const, fontFamily: LuminaFontFamily.dmMonoRegular },
  monoMedium: { fontSize: 15, fontWeight: '500' as const, fontFamily: LuminaFontFamily.dmMonoMedium },
} as const;

// Height tokens
export const LuminaButtonHeight = 52;
export const LuminaInputHeight = 52;

// ─── Motion ────────────────────────────────────────────────────────────────────

export const LuminaMotion = {
  spring: { damping: 18, stiffness: 220 },
  springSnappy: { damping: 22, stiffness: 320 },
  springSheet: { tension: 65, friction: 11 },
  durationFast: 150,
  durationNormal: 250,
  durationSlow: 400,
} as const;

// ─── Shadows ───────────────────────────────────────────────────────────────────

export const LuminaShadow = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    android: { elevation: 2, alignSelf: 'stretch' as const },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
    android: { elevation: 4, alignSelf: 'stretch' as const },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24 },
    android: { elevation: 8, alignSelf: 'stretch' as const },
    default: {},
  }),
  /** For fixed-width / intrinsic-size cards (horizontal scroll tiles). No alignSelf:stretch — avoids rectangular elevation on Android. */
  card: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
    android: {},
    default: {},
  }),
  cardMd: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
    android: {},
    default: {},
  }),
  nav: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 12 },
    default: {},
  }),
} as const;

// ─── Layout (Android: shadow/elevation views must stretch explicitly) ───────

export const LuminaLayout = {
  /** Block-level children in a column (auth forms, full-width buttons). */
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  } as const,
  /** Cards in flex rows/columns without forcing 100% width. */
  stretch: {
    alignSelf: 'stretch',
  } as const,
};

// ─── Touch ─────────────────────────────────────────────────────────────────────

export const LuminaTouch = {
  minTarget: 44,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;

// ─── Utilities ─────────────────────────────────────────────────────────────────

export function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Get the appointment status style (color + bg) */
export function getStatusStyle(status: string, colors: LuminaColorPalette) {
  switch (status?.toLowerCase()) {
    case 'confirmed': return { color: colors.statusConfirmed, bg: colors.statusConfirmedBg };
    case 'completed': return { color: colors.statusCompleted, bg: colors.statusCompletedBg };
    case 'cancelled': return { color: colors.statusCancelled, bg: colors.statusCancelledBg };
    default: return { color: colors.statusPending, bg: colors.statusPendingBg };
  }
}
