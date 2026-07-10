import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';

interface QueryBoundaryProps {
  loading: boolean;
  error?: string;
  onRetry: () => void;
  children: React.ReactNode;
}

/** Estados padrão de carregamento e erro para telas que buscam dados. */
export function QueryBoundary({ loading, error, onRetry, children }: QueryBoundaryProps) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <AppText variant="heading" align="center">
          Algo deu errado
        </AppText>
        <AppText variant="body" color={colors.sub} align="center">
          Verifique sua conexão e tente novamente.
        </AppText>
        <Button label="Tentar de novo" variant="soft" size="md" onPress={onRetry} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
});
