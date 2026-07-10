import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { QueryBoundary } from '@/components/query-boundary';
import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  ProgressBar,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { listGoals } from '@/data/goals';
import { useQuery } from '@/data/use-query';
import { formatCurrency, formatShortDate, parseISODate } from '@/lib/format';
import { colors, spacing } from '@/theme';

export default function GoalsScreen() {
  const router = useRouter();
  const business = useBusiness();
  const { data, loading, error, refetch } = useQuery(() => listGoals(business.id), [business.id]);
  const goals = data ?? [];

  return (
    <Screen>
      <ScreenHeader title="Metas" subtitle="Objetivos do negócio e pessoais" />

      <QueryBoundary loading={loading} error={error} onRetry={refetch}>
        {goals.length === 0 ? (
          <EmptyState
            icon="flag-outline"
            title="Nenhuma meta ainda"
            message="Defina um objetivo — faturamento ou número de atendimentos — e acompanhe o progresso."
            actionLabel="Criar primeira meta"
            onAction={() => router.push('/goals/new')}
          />
        ) : (
          <>
            {goals.map((goal) => {
              const progress = goal.target > 0 ? goal.current / goal.target : 0;
              const currentLabel =
                goal.unit === 'BRL' ? formatCurrency(goal.current) : `${goal.current}`;
              const targetLabel = goal.unit === 'BRL' ? formatCurrency(goal.target) : `${goal.target}`;
              return (
                <Card key={goal.id} style={styles.card}>
                  <View style={styles.header}>
                    <AppText variant="bodyStrong" style={styles.title}>
                      {goal.title}
                    </AppText>
                    <Badge
                      label={goal.kind === 'profissional' ? 'Negócio' : 'Pessoal'}
                      tone={goal.kind === 'profissional' ? 'primary' : 'accent'}
                    />
                  </View>
                  <ProgressBar
                    value={progress}
                    color={goal.kind === 'profissional' ? colors.primary : colors.accent}
                  />
                  <View style={styles.footer}>
                    <AppText variant="caption" color={colors.sub}>
                      {currentLabel} de {targetLabel}
                    </AppText>
                    <AppText variant="caption" color={colors.muted}>
                      até {formatShortDate(parseISODate(goal.deadline))}
                    </AppText>
                  </View>
                </Card>
              );
            })}
            <Button
              label="Criar nova meta"
              variant="soft"
              onPress={() => router.push('/goals/new')}
              style={styles.action}
            />
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, marginBottom: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  action: { marginTop: spacing.sm },
});
