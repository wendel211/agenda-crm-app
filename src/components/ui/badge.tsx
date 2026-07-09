import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { AppText } from './app-text';

export type BadgeTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const tones: Record<BadgeTone, { background: string; foreground: string }> = {
  primary: { background: colors.primarySoft, foreground: colors.primary },
  accent: { background: colors.accentSoft, foreground: colors.accent },
  success: { background: colors.successSoft, foreground: colors.success },
  warning: { background: colors.warningSoft, foreground: colors.warning },
  danger: { background: colors.dangerSoft, foreground: colors.danger },
  info: { background: colors.infoSoft, foreground: colors.info },
  neutral: { background: colors.border, foreground: colors.sub },
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { background, foreground } = tones[tone];

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <AppText variant="caption" color={foreground}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
});
