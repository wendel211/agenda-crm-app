import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@/theme';
import { AppText } from './app-text';

type Variant = 'primary' | 'soft' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  /** Sobrescreve a cor do texto/ícone (ex.: botão sobre fundo colorido). */
  labelColor?: string;
}

const background: Record<Variant, string> = {
  primary: colors.primary,
  soft: colors.primarySoft,
  ghost: 'transparent',
  danger: colors.dangerSoft,
};

const foreground: Record<Variant, string> = {
  primary: colors.onPrimary,
  soft: colors.primaryDark,
  ghost: colors.primaryDark,
  danger: colors.danger,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  loading = false,
  disabled = false,
  style,
  labelColor,
}: ButtonProps) {
  const dimmed = disabled || loading;
  const contentColor = labelColor ?? foreground[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: dimmed, busy: loading }}
      onPress={onPress}
      disabled={dimmed}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: background[variant] },
        pressed ? styles.pressed : null,
        dimmed ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={contentColor} /> : null}
          <AppText style={typography.bodyStrong} color={contentColor}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  lg: { height: 52, paddingHorizontal: spacing.xxl },
  md: { height: 42, paddingHorizontal: spacing.lg },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
});
