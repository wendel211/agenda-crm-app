import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { QueryBoundary } from '@/components/query-boundary';
import {
  AppText,
  Badge,
  Card,
  EmptyState,
  IconButton,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { listServices } from '@/data/services';
import { useQuery } from '@/data/use-query';
import { formatCurrency, formatDuration } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

export default function ServicesScreen() {
  const router = useRouter();
  const business = useBusiness();
  const { data, loading, error, refetch } = useQuery(
    () => listServices(business.id),
    [business.id],
  );

  const sorted = [...(data ?? [])].sort((a, b) => Number(b.active) - Number(a.active));

  return (
    <Screen>
      <ScreenHeader
        title="Serviços"
        subtitle="A duração define os horários da agenda"
        right={
          <IconButton
            icon="add"
            label="Novo serviço"
            tone="primary"
            onPress={() => router.push('/services/form')}
          />
        }
      />

      <QueryBoundary loading={loading} error={error} onRetry={refetch}>
        {sorted.length === 0 ? (
          <EmptyState
            icon="cut-outline"
            title="Nenhum serviço ainda"
            message="Cadastre seus serviços com preço e duração para liberar a agenda."
            actionLabel="Cadastrar serviço"
            onAction={() => router.push('/services/form')}
          />
        ) : (
          sorted.map((service) => (
            <Card
              key={service.id}
              onPress={() => router.push(`/services/form?id=${service.id}`)}
              style={[styles.card, service.active ? null : styles.inactive]}
            >
              <View style={[styles.colorBar, { backgroundColor: service.color }]} />
              <View style={styles.info}>
                <AppText variant="bodyStrong">{service.name}</AppText>
                <AppText variant="caption" color={colors.sub}>
                  {formatDuration(service.durationMinutes)}
                </AppText>
              </View>
              <View style={styles.right}>
                <AppText variant="subheading" color={colors.primaryDark}>
                  {formatCurrency(service.price)}
                </AppText>
                {service.active ? null : <Badge label="Inativo" tone="neutral" />}
              </View>
            </Card>
          ))
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  inactive: { opacity: 0.6 },
  colorBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: radius.full,
  },
  info: { flex: 1, gap: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
});
