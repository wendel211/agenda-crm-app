import { Linking, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { QueryBoundary } from '@/components/query-boundary';
import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  IconButton,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { getClient, setClientArchived } from '@/data/clients';
import { listAppointmentsByClient } from '@/data/appointments';
import { useQuery } from '@/data/use-query';
import { formatCurrency, formatShortDate, parseISODate } from '@/lib/format';
import { statusMeta } from '@/lib/appointment-status';
import { colors, spacing } from '@/theme';

export default function ClientProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, loading, error, refetch } = useQuery(
    async () => {
      const [client, history] = await Promise.all([getClient(id), listAppointmentsByClient(id)]);
      return { client, history };
    },
    [id],
  );

  const client = data?.client;
  const history = data?.history ?? [];
  const ticket = client && client.visits > 0 ? client.totalSpent / client.visits : 0;

  function openWhatsApp() {
    if (!client) {
      return;
    }
    const phone = client.phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/55${phone}`);
  }

  return (
    <Screen>
      <ScreenHeader
        title="Perfil do cliente"
        right={
          client ? (
            <IconButton
              icon="create-outline"
              label="Editar"
              onPress={() => router.push(`/clients/new?id=${client.id}`)}
            />
          ) : undefined
        }
      />

      <QueryBoundary loading={loading} error={error} onRetry={refetch}>
        {!client ? (
          <AppText variant="body" color={colors.sub}>
            Cliente não encontrado.
          </AppText>
        ) : (
          <>
            <View style={styles.hero}>
              <Avatar name={client.name} size={72} uri={client.avatarUrl} />
              <AppText variant="title">{client.name}</AppText>
              <AppText variant="caption" color={colors.sub}>
                {client.phone}
                {client.email ? ` · ${client.email}` : ''}
              </AppText>
              <View style={styles.heroActions}>
                <IconButton icon="logo-whatsapp" label="WhatsApp" tone="primary" onPress={openWhatsApp} />
                <IconButton
                  icon="calendar-outline"
                  label="Agendar"
                  tone="primary"
                  onPress={() => router.push('/appointments/new')}
                />
              </View>
            </View>

            <View style={styles.stats}>
              <Card style={styles.statCard}>
                <AppText variant="heading" color={colors.primaryDark}>
                  {client.visits}
                </AppText>
                <AppText variant="caption" color={colors.sub}>
                  Visitas
                </AppText>
              </Card>
              <Card style={styles.statCard}>
                <AppText variant="heading" color={colors.success}>
                  {formatCurrency(client.totalSpent)}
                </AppText>
                <AppText variant="caption" color={colors.sub}>
                  Total gasto
                </AppText>
              </Card>
              <Card style={styles.statCard}>
                <AppText variant="heading" color={colors.accent}>
                  {formatCurrency(ticket)}
                </AppText>
                <AppText variant="caption" color={colors.sub}>
                  Ticket médio
                </AppText>
              </Card>
            </View>

            {client.notes ? (
              <Card style={styles.notes}>
                <View style={styles.notesHeader}>
                  <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                  <AppText variant="caption" color={colors.primaryDark}>
                    FICHA DA CLIENTE
                  </AppText>
                </View>
                <AppText variant="body" color={colors.sub}>
                  {client.notes}
                </AppText>
              </Card>
            ) : null}

            <Button
              label={client.archived ? 'Reativar cliente' : 'Arquivar cliente'}
              variant={client.archived ? 'soft' : 'danger'}
              size="md"
              onPress={async () => {
                await setClientArchived(client.id, !client.archived);
                await refetch();
              }}
              style={styles.archiveButton}
            />

            <AppText variant="heading" style={styles.historyTitle}>
              Histórico
            </AppText>
            {history.length === 0 ? (
              <AppText variant="body" color={colors.sub}>
                Nenhum atendimento registrado ainda.
              </AppText>
            ) : (
              history.map((appointment) => {
                const meta = statusMeta[appointment.status];
                return (
                  <Card
                    key={appointment.id}
                    onPress={() => router.push(`/appointments/${appointment.id}`)}
                    style={styles.historyCard}
                  >
                    <View style={styles.historyInfo}>
                      <AppText variant="bodyStrong" numberOfLines={1}>
                        {appointment.serviceNames.join(' + ')}
                      </AppText>
                      <AppText variant="caption" color={colors.sub}>
                        {formatShortDate(parseISODate(appointment.date))} · {appointment.startTime}
                      </AppText>
                    </View>
                    <View style={styles.historyRight}>
                      <AppText variant="subheading">{formatCurrency(appointment.price)}</AppText>
                      <Badge label={meta.label} tone={meta.tone} />
                    </View>
                  </Card>
                );
              })
            )}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  heroActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxl },
  statCard: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: spacing.sm },
  notes: { marginTop: spacing.lg, gap: spacing.sm },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  archiveButton: { marginTop: spacing.xl },
  historyTitle: { marginTop: spacing.xxl, marginBottom: spacing.md },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  historyInfo: { flex: 1, gap: 2 },
  historyRight: { alignItems: 'flex-end', gap: spacing.xs },
});
