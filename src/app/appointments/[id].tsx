import { Linking, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
import { formatCurrency, formatWeekday, parseISODate } from '@/lib/format';
import { statusMeta } from '@/lib/appointment-status';
import { mockAppointments, mockClients } from '@/mocks';
import { colors, spacing } from '@/theme';

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointment = mockAppointments.find((item) => item.id === id);
  const client = appointment
    ? mockClients.find((item) => item.id === appointment.clientId)
    : undefined;

  if (!appointment) {
    return (
      <Screen>
        <ScreenHeader title="Agendamento" />
        <AppText variant="body" color={colors.sub}>
          Agendamento não encontrado.
        </AppText>
      </Screen>
    );
  }

  const meta = statusMeta[appointment.status];
  const isOpen = appointment.status === 'agendado' || appointment.status === 'confirmado';

  function openWhatsApp() {
    if (!client) {
      return;
    }
    const phone = client.phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá, ${client.name.split(' ')[0]}! Passando para confirmar seu horário de ${appointment!.startTime}.`,
    );
    Linking.openURL(`https://wa.me/55${phone}?text=${message}`);
  }

  return (
    <Screen>
      <ScreenHeader
        title="Agendamento"
        right={<IconButton icon="create-outline" label="Editar" onPress={() => router.push('/appointments/new')} />}
      />

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
            {appointment.professional}
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

      {isOpen ? (
        <View style={styles.actions}>
          <Button label="Concluir e cobrar" icon="checkmark-circle" onPress={() => router.back()} />
          {appointment.status === 'agendado' ? (
            <Button label="Marcar como confirmado" variant="soft" onPress={() => router.back()} />
          ) : null}
          <View style={styles.dangerRow}>
            <Button
              label="Faltou"
              variant="danger"
              size="md"
              onPress={() => router.back()}
              style={styles.dangerButton}
            />
            <Button
              label="Cancelar horário"
              variant="ghost"
              size="md"
              onPress={() => router.back()}
              style={styles.dangerButton}
            />
          </View>
        </View>
      ) : null}
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
  actions: { gap: spacing.sm, marginTop: spacing.xxl },
  dangerRow: { flexDirection: 'row', gap: spacing.sm },
  dangerButton: { flex: 1 },
});
