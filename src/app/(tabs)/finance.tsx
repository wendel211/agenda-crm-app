import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { QueryBoundary } from '@/components/query-boundary';
import {
  AppText,
  Card,
  EmptyState,
  IconButton,
  ListRow,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { listTransactions } from '@/data/transactions';
import { useQuery } from '@/data/use-query';
import { formatCurrency, formatShortDate, parseISODate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { TransactionKind } from '@/types';

type Filter = 'todas' | TransactionKind;

const filters: { value: Filter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'receita', label: 'Receitas' },
  { value: 'despesa', label: 'Despesas' },
];

export default function FinanceScreen() {
  const router = useRouter();
  const business = useBusiness();
  const [filter, setFilter] = useState<Filter>('todas');

  const { data, loading, error, refetch } = useQuery(
    () => listTransactions(business.id),
    [business.id],
  );

  const transactions = data ?? [];
  const income = transactions
    .filter((item) => item.kind === 'receita')
    .reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions
    .filter((item) => item.kind === 'despesa')
    .reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;
  const visible = transactions.filter((item) => filter === 'todas' || item.kind === filter);

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <AppText variant="title">Financeiro</AppText>
          <AppText variant="caption" color={colors.sub}>
            Últimos 30 dias
          </AppText>
        </View>
        <IconButton
          icon="bar-chart-outline"
          label="Relatórios"
          tone="primary"
          onPress={() => router.push('/finance/reports')}
        />
      </View>

      <QueryBoundary loading={loading} error={error} onRetry={refetch}>
        <Card style={styles.balanceCard}>
          <AppText variant="caption" color={colors.sub}>
            SALDO DO PERÍODO
          </AppText>
          <AppText variant="display" color={balance >= 0 ? colors.success : colors.danger}>
            {formatCurrency(balance)}
          </AppText>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <View style={[styles.balanceIcon, { backgroundColor: colors.successSoft }]}>
                <Ionicons name="arrow-up" size={16} color={colors.success} />
              </View>
              <View>
                <AppText variant="caption" color={colors.sub}>
                  Entradas
                </AppText>
                <AppText variant="bodyStrong">{formatCurrency(income)}</AppText>
              </View>
            </View>
            <View style={styles.balanceItem}>
              <View style={[styles.balanceIcon, { backgroundColor: colors.dangerSoft }]}>
                <Ionicons name="arrow-down" size={16} color={colors.danger} />
              </View>
              <View>
                <AppText variant="caption" color={colors.sub}>
                  Saídas
                </AppText>
                <AppText variant="bodyStrong">{formatCurrency(expenses)}</AppText>
              </View>
            </View>
          </View>
        </Card>

        <View style={styles.filters}>
          {filters.map((option) => {
            const selected = filter === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setFilter(option.value)}
                style={[styles.filterChip, selected ? styles.filterSelected : null]}
              >
                <AppText variant="caption" color={selected ? colors.surface : colors.sub}>
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <SectionHeader
          title="Lançamentos"
          actionLabel="Adicionar"
          onAction={() => router.push('/finance/new-transaction')}
        />
        {visible.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="Nenhum lançamento"
            message="Receitas de atendimentos concluídos aparecem aqui automaticamente."
            actionLabel="Adicionar lançamento"
            onAction={() => router.push('/finance/new-transaction')}
          />
        ) : (
          <Card style={styles.listCard}>
            {visible.map((transaction) => {
              const isIncome = transaction.kind === 'receita';
              return (
                <ListRow
                  key={transaction.id}
                  title={transaction.description}
                  subtitle={`${transaction.category} · ${formatShortDate(parseISODate(transaction.date))}`}
                  icon={isIncome ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
                  iconColor={isIncome ? colors.success : colors.danger}
                  chevron={false}
                  right={
                    <AppText variant="subheading" color={isIncome ? colors.success : colors.danger}>
                      {isIncome ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </AppText>
                  }
                />
              );
            })}
          </Card>
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  balanceCard: { gap: spacing.sm },
  balanceRow: {
    flexDirection: 'row',
    gap: spacing.xxl,
    marginTop: spacing.sm,
  },
  balanceItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  balanceIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  listCard: { paddingVertical: spacing.xs },
});
