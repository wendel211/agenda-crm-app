import { StyleSheet, View } from 'react-native';

import { QueryBoundary } from '@/components/query-boundary';
import { AppText, Card, EmptyState, ProgressBar, Screen, ScreenHeader } from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { listRecentAppointments } from '@/data/appointments';
import { listServices } from '@/data/services';
import { listTransactions } from '@/data/transactions';
import { useQuery } from '@/data/use-query';
import { formatCurrency } from '@/lib/format';
import { colors, spacing } from '@/theme';

const PERIOD_DAYS = 30;

export default function ReportsScreen() {
  const business = useBusiness();

  const { data, loading, error, refetch } = useQuery(
    async () => {
      const [appointments, services, transactions] = await Promise.all([
        listRecentAppointments(business.id, PERIOD_DAYS),
        listServices(business.id),
        listTransactions(business.id),
      ]);
      return { appointments, services, transactions };
    },
    [business.id],
  );

  const appointments = data?.appointments ?? [];
  const done = appointments.filter((item) => item.status === 'concluido');
  const noShows = appointments.filter((item) => item.status === 'faltou');
  const closed = done.length + noShows.length;
  const noShowRate = closed > 0 ? noShows.length / closed : 0;

  const income = (data?.transactions ?? [])
    .filter((item) => item.kind === 'receita')
    .reduce((sum, item) => sum + item.amount, 0);
  const averageTicket = done.length > 0 ? income / done.length : 0;

  const revenueByService = (data?.services ?? [])
    .map((service) => {
      const revenue = appointments
        .filter(
          (item) =>
            item.serviceIds.includes(service.id) &&
            item.status !== 'cancelado' &&
            item.status !== 'faltou',
        )
        .reduce((sum, item) => sum + item.price / item.serviceIds.length, 0);
      return { service, revenue };
    })
    .filter((entry) => entry.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);
  const topRevenue = revenueByService[0]?.revenue ?? 1;

  return (
    <Screen>
      <ScreenHeader title="Relatórios" subtitle="Últimos 30 dias" />

      <QueryBoundary loading={loading} error={error} onRetry={refetch}>
        {appointments.length === 0 && (data?.transactions ?? []).length === 0 ? (
          <EmptyState
            icon="bar-chart-outline"
            title="Sem dados ainda"
            message="Conclua atendimentos e registre lançamentos para ver seus relatórios."
          />
        ) : (
          <>
            <View style={styles.grid}>
              <Card style={styles.gridCard}>
                <AppText variant="caption" color={colors.sub}>
                  Faturamento
                </AppText>
                <AppText variant="heading" color={colors.success}>
                  {formatCurrency(income)}
                </AppText>
              </Card>
              <Card style={styles.gridCard}>
                <AppText variant="caption" color={colors.sub}>
                  Ticket médio
                </AppText>
                <AppText variant="heading" color={colors.primary}>
                  {formatCurrency(averageTicket)}
                </AppText>
              </Card>
              <Card style={styles.gridCard}>
                <AppText variant="caption" color={colors.sub}>
                  Atendimentos
                </AppText>
                <AppText variant="heading">{done.length}</AppText>
              </Card>
              <Card style={styles.gridCard}>
                <AppText variant="caption" color={colors.sub}>
                  Taxa de faltas
                </AppText>
                <AppText variant="heading" color={noShowRate > 0.15 ? colors.danger : colors.ink}>
                  {Math.round(noShowRate * 100)}%
                </AppText>
              </Card>
            </View>

            {revenueByService.length > 0 ? (
              <>
                <AppText variant="heading" style={styles.sectionTitle}>
                  Receita por serviço
                </AppText>
                <Card style={styles.rankingCard}>
                  {revenueByService.map(({ service, revenue }) => (
                    <View key={service.id} style={styles.rankingRow}>
                      <View style={styles.rankingHeader}>
                        <AppText variant="bodyStrong">{service.name}</AppText>
                        <AppText variant="caption" color={colors.sub}>
                          {formatCurrency(revenue)}
                        </AppText>
                      </View>
                      <ProgressBar value={revenue / topRevenue} color={service.color} height={6} />
                    </View>
                  ))}
                </Card>
              </>
            ) : null}

            <AppText variant="caption" color={colors.muted} style={styles.note}>
              Os números consideram atendimentos concluídos e agendamentos ativos do período.
            </AppText>
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridCard: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xs,
  },
  sectionTitle: { marginTop: spacing.xxl, marginBottom: spacing.md },
  rankingCard: { gap: spacing.lg },
  rankingRow: { gap: spacing.sm },
  rankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  note: { marginTop: spacing.lg },
});
