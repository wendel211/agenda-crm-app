import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';

import { QueryBoundary } from '@/components/query-boundary';
import {
  AppText,
  Avatar,
  Badge,
  EmptyState,
  IconButton,
  ListRow,
  Screen,
  TextField,
} from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { listClientsWithStats } from '@/data/clients';
import { useQuery } from '@/data/use-query';
import { parseISODate } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { ClientWithStats } from '@/types';

const INACTIVE_AFTER_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(iso?: string): number | undefined {
  if (!iso) {
    return undefined;
  }
  return Math.floor((Date.now() - parseISODate(iso).getTime()) / DAY_MS);
}

interface ClientRowProps {
  client: ClientWithStats;
  onPress: (id: string) => void;
}

function ClientRow({ client, onPress }: ClientRowProps) {
  const away = daysSince(client.lastVisit);
  const inactive = away !== undefined && away > INACTIVE_AFTER_DAYS;
  const handlePress = useCallback(() => onPress(client.id), [client.id, onPress]);

  return (
    <ListRow
      title={client.name}
      subtitle={`${client.visits} visitas · ${client.phone}`}
      left={<Avatar name={client.name} />}
      right={inactive ? <Badge label={`${away}d sem vir`} tone="warning" /> : undefined}
      onPress={handlePress}
    />
  );
}

export default function ClientsScreen() {
  const router = useRouter();
  const business = useBusiness();
  const [query, setQuery] = useState('');

  const { data, loading, error, refetch } = useQuery(
    () => listClientsWithStats(business.id),
    [business.id],
  );

  const clients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const all = data ?? [];
    return normalized
      ? all.filter((client) => client.name.toLowerCase().includes(normalized))
      : all;
  }, [data, query]);

  const openClient = useCallback(
    (id: string) => router.push(`/clients/${id}`),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: ClientWithStats }) => <ClientRow client={item} onPress={openClient} />,
    [openClient],
  );

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <AppText variant="title">Clientes</AppText>
            <AppText variant="caption" color={colors.sub}>
              {data?.length ?? 0} cadastrados
            </AppText>
          </View>
          <IconButton
            icon="person-add-outline"
            label="Novo cliente"
            tone="primary"
            onPress={() => router.push('/clients/new')}
          />
        </View>
        <TextField
          icon="search-outline"
          placeholder="Buscar por nome"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      <QueryBoundary loading={loading} error={error} onRetry={refetch}>
        <FlashList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={query ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
              message={
                query
                  ? 'Ajuste a busca ou cadastre um novo cliente.'
                  : 'Cadastre sua primeira cliente para começar a agendar.'
              }
              actionLabel="Cadastrar cliente"
              onAction={() => router.push('/clients/new')}
            />
          }
        />
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
});
