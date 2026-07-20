/**
 * Identidade do CRM: terracota acolhedor, neutros slate e fundos claros.
 * Cores vibrantes ficam reservadas para ações e estados do sistema.
 */
export const colors = {
  // Marca
  primary: '#D49A89',
  primaryDark: '#A96555',
  primarySoft: '#F8EDEA',
  primaryHighlight: '#E5B7A9',
  onPrimary: '#1E293B',
  onPrimaryMuted: 'rgba(30, 41, 59, 0.78)',
  accent: '#B77986',
  accentSoft: '#F7ECEF',

  // Semânticas
  success: '#10B981',
  successSoft: '#ECFDF5',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  info: '#64748B',
  infoSoft: '#F1F5F9',

  // Neutros
  ink: '#1E293B',
  sub: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceTranslucent: 'rgba(255, 255, 255, 0.2)',
  overlay: 'rgba(30, 41, 59, 0.45)',
} as const;

export const servicePalette = [
  colors.primary,
  colors.primaryDark,
  colors.accent,
  colors.success,
  colors.warning,
  colors.info,
] as const;

export type AppColor = keyof typeof colors;
