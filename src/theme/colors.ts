/**
 * Paleta do app — minimalista com acentos vívidos.
 * Neutros quase monocromáticos + violeta/rosa saturados para ação e destaque.
 */
export const colors = {
  // Marca
  primary: '#6C5CE7',
  primaryDark: '#5747D6',
  primarySoft: '#EEEBFF',
  accent: '#FF5C8A',
  accentSoft: '#FFEBF1',

  // Semânticas
  success: '#00C39A',
  successSoft: '#E3FAF4',
  warning: '#FFAA2B',
  warningSoft: '#FFF4E0',
  danger: '#FF5A5F',
  dangerSoft: '#FFECED',
  info: '#3E8BFF',
  infoSoft: '#E8F1FF',

  // Neutros
  ink: '#16141F',
  sub: '#6F6B7D',
  muted: '#A6A2B5',
  border: '#ECEAF3',
  background: '#FAFAFD',
  surface: '#FFFFFF',
  overlay: 'rgba(22, 20, 31, 0.45)',
} as const;

export type AppColor = keyof typeof colors;
