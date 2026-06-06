export const typography = {
  family: {
    regular:   'DMSans_400Regular',
    medium:    'DMSans_500Medium',
    semibold:  'DMSans_700Bold',      // package has no 600 — use 700
    bold:      'DMSans_700Bold',
    extrabold: 'DMSans_700Bold',      // package has no 800 — use 700
  },
  size: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    '2xl': 30,
    '3xl': 38,
    '4xl': 48,
  },
  lineHeight: {
    tight:  1.15,
    normal: 1.5,
    loose:  1.7,
  },
  tracking: {
    tight:  -0.5,
    normal: 0,
    wide:   0.8,
    wider:  1.4,
    widest: 2.2,
  },
} as const;

export const spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  7:  28,
  8:  32,
  9:  36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const;

export const radius = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   18,
  xl:   24,
  '2xl': 32,
  full: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  green: {
    shadowColor: '#00D68F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },
  gold: {
    shadowColor: '#F0C060',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 20,
    elevation: 10,
  },
  // legacy alias
  blue: {
    shadowColor: '#00D68F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;
