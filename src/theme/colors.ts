export const colors = {
  // ── Core backgrounds ───────────────────────────────────────────────────────
  background:   '#060E07',   // near-black forest
  surface:      '#0C1A0E',   // card surface
  surfaceAlt:   '#111F13',   // elevated surface
  surfaceHigh:  '#172719',   // highest surface

  // ── Brand greens ──────────────────────────────────────────────────────────
  klakGreen:    '#00D68F',   // primary accent
  klakGreenDim: '#00A36E',   // muted variant
  klakGreenGlow:'rgba(0,214,143,0.18)',
  klakGold:     '#F0C060',   // premium accent
  klakGoldDim:  '#C9973D',
  klakGoldGlow: 'rgba(240,192,96,0.15)',

  // ── Status ────────────────────────────────────────────────────────────────
  alertRed:     '#FF5A5A',
  alertRedDim:  'rgba(255,90,90,0.15)',
  success:      '#00D68F',
  warning:      '#F0C060',

  // ── Legacy aliases (kept for component compat) ─────────────────────────────
  klakBlue:     '#00D68F',
  klakBlueDark: '#060E07',
  klakBlack:    '#E8F5EA',
  offWhite:     '#0C1A0E',
  white:        '#FFFFFF',

  // ── Text ──────────────────────────────────────────────────────────────────
  text:         '#F0F7F0',
  textSec:      '#7A9E82',
  textMuted:    '#4A6A52',
  border:       '#1A3020',
  borderBright: '#2A4530',

  // ── Glass / overlay ────────────────────────────────────────────────────────
  glass:        'rgba(255,255,255,0.04)',
  glassBorder:  'rgba(255,255,255,0.08)',
  glassMid:     'rgba(255,255,255,0.07)',
  glassHigh:    'rgba(255,255,255,0.11)',
  overlay:      'rgba(0,0,0,0.6)',

  // ── Category palette ──────────────────────────────────────────────────────
  catFood:         '#C99240',
  catTransport:    '#3A9E52',
  catEntertainment:'#5B9E72',
  catAirtime:      '#9B4AB0',
  catBills:        '#D08A45',
  catSavings:      '#46C495',
  catIncome:       '#00D68F',
  catOther:        '#7B9E82',

  // ── Insight tokens ────────────────────────────────────────────────────────
  insightWarningBg:     'rgba(240,192,96,0.08)',
  insightWarningBorder: '#C9973D',
  insightWarningTitle:  '#F0C060',
  insightInfoBg:        'rgba(0,214,143,0.07)',
  insightInfoBorder:    '#00A36E',
  insightInfoTitle:     '#00D68F',
  insightSuccessBg:     'rgba(0,214,143,0.09)',
  insightSuccessBorder: '#00D68F',
  insightSuccessTitle:  '#80EFC8',

  // ── Shadows ───────────────────────────────────────────────────────────────
  shadow: 'rgba(0,0,0,0.5)',
  shadowGreen: 'rgba(0,214,143,0.25)',
  shadowGold:  'rgba(240,192,96,0.20)',
} as const;

export type ColorKey = keyof typeof colors;
