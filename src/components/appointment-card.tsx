import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Badge, Card } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { statusMeta } from '@/lib/appointment-status';
import { colors, radius, spacing } from '@/theme';
import type { Appointment } from '@/types';

interface AppointmentCardProps {
  appointment: Appointment;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const router = useRouter();
  const meta = statusMeta[appointment.status];

  return (
    <Card onPress={() => router.push(`/appointments/${appointment.id}`)} style={styles.card}>
      <View style={styles.time}>
        <AppText variant="subheading" color={colors.primary}>
          {appointment.startTime}
        </AppText>
        <AppText variant="caption" color={colors.muted}>
          {appointment.endTime}
        </AppText>
      </View>
      <View style={styles.divider} />
      <View style={styles.info}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {appointment.clientName}
        </AppText>
        <AppText variant="caption" color={colors.sub} numberOfLines={1}>
          {appointment.serviceNames.join(' + ')} · {appointment.professionalName}
        </AppText>
        <View style={styles.footer}>
          <Badge label={meta.label} tone={meta.tone} />
          <AppText variant="subheading" color={colors.ink}>
            {formatCurrency(appointment.price)}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  time: { alignItems: 'center', width: 52 },
  divider: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  info: { flex: 1, gap: spacing.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});
