import { useState } from 'react';
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
  ListRow,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { getAppointment, updateAppointmentStatus } from '@/data/appointments';
import { getClient } from '@/data/clients';
import { useQuery } from '@/data/use-query';
import { formatCurrency, formatWeekday, parseISODate } from '@/lib/format';
import { statusMeta } from '@/lib/appointment-status';
import { colors, spacing } from '@/theme';
import type { AppointmentStatus } from '@/types';

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [actionError, setActionError] = useState<string>();
  const [pending, setPending] = useState<AppointmentStatus>();

  const { data, loading, error, refetch } = useQuery(
    async () => {
      const appointment = await getAppointment(id);
      const client = appointment ? await getClient(appointment.clientId) : null;
      return { appointment, client };
    },
    [id],
  );

  const appointment = data?.appointment;
  const client = data?.client;

  async function changeStatus(status: AppointmentStatus) {
    setActionError(undefined);
    setPending(status);
    try {
      await updateAppointmentStatus(id, status);
      await refetch();
    } catch {
      setActionError('Não foi possível atualizar. Tente novamente.');
    } finally {
      setPending(undefined);
    }
  }

  function openWhatsApp() {
    if (!client || !appointment) {
      return;
    }
    const phone = client.phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá, ${client.name.split(' ')[0]}! Passando para confirmar seu horário de ${appointment.startTime}.`,
    );
    Linking.openURL(`https://wa.me/55${phone}?text=${message}`);
  }

  const meta = appointment ? statusMeta[appointment.status] : undefined;
  const isOpen = appointment?.status === 'agendado' || appointment?.status === 'confirmado';

  return (
    <Screen>
      <ScreenHeader title="Agendamento" />

      <QueryBoundary loading={loading} error={error} onRetry={refetch}>
        {!appointment || !meta ? (
          <AppText variant="body" color={colors.sub}>
            Agendamento não encontrado.
          </AppText>
        ) : (
          <>
            <Card style={styles.clientCard}>
              <Avatar name={appointment.clientName} size={56} />
              <View style={styles.clientInfo}>
                <AppText variant="heading">{appointment.clientName}</AppText>
                {client ? (
                  <AppText variant="caption" color={colors.sub}>
                    {client.phone} · {client.visits} visitas
                  </AppText>
                ) : null}
              </View>
              <IconButton icon="logo-whatsapp" label="Enviar WhatsApp" tone="primary" onPress={openWhatsApp} />
            </Card>

            <Card style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <AppText variant="bodyStrong" style={styles.detailText}>
                  {formatWeekday(parseISODate(appointment.date))}
                </AppText>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <AppText variant="bodyStrong" style={styles.detailText}>
                  {appointment.startTime} — {appointment.endTime}
                </AppText>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={18} color={colors.primary} />
                <AppText variant="bodyStrong" style={styles.detailText}>
                  {appointment.professionalName}
                </AppText>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
                <AppText variant="bodyStrong" style={styles.detailText}>
                  {formatCurrency(appointment.price)}
                </AppText>
                <Badge label={meta.label} tone={meta.tone} />
              </View>
            </Card>

            <AppText variant="caption" color={colors.sub} style={styles.sectionLabel}>
              SERVIÇOS
            </AppText>
            <Card style={styles.servicesCard}>
              {appointment.serviceNames.map((service) => (
                <ListRow key={service} title={service} icon="cut-outline" chevron={false} />
              ))}
            </Card>

            {appointment.notes ? (
              <>
                <AppText variant="caption" color={colors.sub} style={styles.sectionLabel}>
                  OBSERVAÇÕES
                </AppText>
                <Card>
                  <AppText variant="body" color={colors.sub}>
                    {appointment.notes}
                  </AppText>
                </Card>
              </>
            ) : null}

            {actionError ? (
              <AppText variant="caption" color={colors.danger} align="center" style={styles.actionError}>
                {actionError}
              </AppText>
            ) : null}

            {isOpen ? (
              <View style={styles.actions}>
                <Button
                  label="Concluir e cobrar"
                  icon="checkmark-circle"
                  onPress={() => changeStatus('concluido')}
                  loading={pending === 'concluido'}
                />
                {appointment.status === 'agendado' ? (
                  <Button
                    label="Marcar como confirmado"
                    variant="soft"
                    onPress={() => changeStatus('confirmado')}
                    loading={pending === 'confirmado'}
                  />
                ) : null}
                <View style={styles.dangerRow}>
                  <Button
                    label="Faltou"
                    variant="danger"
                    size="md"
                    onPress={() => changeStatus('faltou')}
                    loading={pending === 'faltou'}
                    style={styles.dangerButton}
                  />
                  <Button
                    label="Cancelar horário"
                    variant="ghost"
                    size="md"
                    onPress={() => changeStatus('cancelado')}
                    loading={pending === 'cancelado'}
                    style={styles.dangerButton}
                  />
                </View>
              </View>
            ) : null}

            {appointment.status === 'concluido' ? (
              <View style={styles.doneNote}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <AppText variant="caption" color={colors.success}>
                  Receita lançada automaticamente no financeiro.
                </AppText>
              </View>
            ) : null}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  clientInfo: { flex: 1, gap: 2 },
  detailCard: { marginTop: spacing.lg, gap: spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  detailText: { flex: 1 },
  sectionLabel: { marginTop: spacing.xxl, marginBottom: spacing.sm },
  servicesCard: { paddingVertical: spacing.xs },
  actionError: { marginTop: spacing.lg },
  actions: { gap: spacing.sm, marginTop: spacing.xxl },
  dangerRow: { flexDirection: 'row', gap: spacing.sm },
  dangerButton: { flex: 1 },
  doneNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxl,
  },
});
