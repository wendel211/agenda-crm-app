/**
 * Escala tipográfica — Manrope em quatro pesos para a UI geral.
 * Títulos apertados (letterSpacing negativo) para o visual minimalista.
 *
 * Playfair Display é a fonte editorial reservada aos títulos institucionais
 * (boas-vindas/onboarding, autenticação e perfil do negócio) — não usar fora
 * desses contextos.
 */
export const fonts = {
  regular: 'Manrope_400Regular',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
  editorial: 'PlayfairDisplay_600SemiBold',
  editorialBold: 'PlayfairDisplay_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38, letterSpacing: -0.8 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, letterSpacing: -0.3 },
  subheading: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.4, textTransform: 'uppercase' as const },
  institutionalDisplay: { fontFamily: fonts.editorialBold, fontSize: 38, lineHeight: 46, letterSpacing: -0.4 },
  institutionalTitle: { fontFamily: fonts.editorialBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.2 },
  institutionalHeading: { fontFamily: fonts.editorial, fontSize: 18, lineHeight: 24 },
} as const;
