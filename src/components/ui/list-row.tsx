import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '@/theme';
import { AppText } from './app-text';

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}

/** Linha de lista genérica: ícone/avatar à esquerda, textos, conteúdo à direita. */
export function ListRow({
  title,
  subtitle,
  icon,
  iconColor = colors.primary,
  left,
  right,
  onPress,
  chevron = Boolean(onPress),
}: ListRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      {left ??
        (icon ? (
          <View style={[styles.iconBox, { backgroundColor: `${iconColor}1A` }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
        ) : null)}
      <View style={styles.texts}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.sub} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ?? null}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: { opacity: 0.7 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
});
