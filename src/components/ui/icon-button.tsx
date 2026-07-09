import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius } from '@/theme';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  tone?: 'neutral' | 'primary';
  size?: number;
}

export function IconButton({ icon, onPress, label, tone = 'neutral', size = 40 }: IconButtonProps) {
  const isPrimary = tone === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          backgroundColor: isPrimary ? colors.primarySoft : colors.surface,
        },
        pressed ? styles.pressed : null,
      ]}
    >
      <Ionicons name={icon} size={size * 0.5} color={isPrimary ? colors.primary : colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
});
