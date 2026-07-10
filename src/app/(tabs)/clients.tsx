import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';

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
import { parseISODate } from '@/lib/format';
import { mockClients } from '@/mocks';
import { colors, spacing } from '@/theme';
import type { Client } from '@/types';

const INACTIVE_AFTER_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(iso?: string): number | undefined {
  if (!iso) {
    return undefined;
  }
  return Math.floor((Date.now() - parseISODate(iso).getTime()) / DAY_MS);
}

interface ClientRowProps {
  client: Client;
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
  const [query, setQuery] = useState('');

  const clients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? mockClients.filter((client) => client.name.toLowerCase().includes(normalized))
      : mockClients;
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [query]);

  const openClient = useCallback(
    (id: string) => router.push(`/clients/${id}`),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Client }) => <ClientRow client={item} onPress={openClient} />,
    [openClient],
  );

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <AppText variant="title">Clientes</AppText>
            <AppText variant="caption" color={colors.sub}>
              {mockClients.length} cadastrados
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

      <FlashList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Nenhum cliente encontrado"
            message="Ajuste a busca ou cadastre um novo cliente."
            actionLabel="Cadastrar cliente"
            onAction={() => router.push('/clients/new')}
          />
        }
      />
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
