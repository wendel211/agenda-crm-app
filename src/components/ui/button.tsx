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
}

const background: Record<Variant, string> = {
  primary: colors.primary,
  soft: colors.primarySoft,
  ghost: 'transparent',
  danger: colors.dangerSoft,
};

const foreground: Record<Variant, string> = {
  primary: colors.surface,
  soft: colors.primary,
  ghost: colors.primary,
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
}: ButtonProps) {
  const dimmed = disabled || loading;

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
        <ActivityIndicator color={foreground[variant]} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={foreground[variant]} /> : null}
          <AppText style={typography.bodyStrong} color={foreground[variant]}>
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
