import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { colors, spacing } from '@/theme';
import { AppText } from './app-text';
import { IconButton } from './icon-button';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  /** Usar 'institutionalHeading' apenas em cabeçalhos institucionais (ex.: perfil do negócio). */
  titleVariant?: 'heading' | 'institutionalHeading';
}

/** Cabeçalho de telas empilhadas: voltar + título + ação opcional. */
export function ScreenHeader({ title, subtitle, right, titleVariant = 'heading' }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <IconButton icon="chevron-back" onPress={() => router.back()} label="Voltar" />
      <View style={styles.titles}>
        <AppText variant={titleVariant}>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.sub}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  titles: { flex: 1 },
  spacer: { width: 40 },
});
