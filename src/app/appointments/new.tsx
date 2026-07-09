import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppText,
  Avatar,
  Button,
  Card,
  Screen,
  ScreenHeader,
  TextField,
} from '@/components/ui';
import { formatCurrency, formatDuration, toISODate } from '@/lib/format';
import { mockClients, mockServices, mockTeam } from '@/mocks';
import { colors, radius, spacing } from '@/theme';

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
];

const weekdayShort = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });

export default function NewAppointmentScreen() {
  const router = useRouter();
  const [clientId, setClientId] = useState<string>();
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState(toISODate(new Date()));
  const [time, setTime] = useState<string>();
  const [professionalId, setProfessionalId] = useState(mockTeam[0].id);
  const [notes, setNotes] = useState('');

  const days = useMemo(
    () =>
      Array.from({ length: 10 }, (_, offset) => {
        const value = new Date();
        value.setDate(value.getDate() + offset);
        return {
          iso: toISODate(value),
          weekday: weekdayShort.format(value).replace('.', ''),
          day: value.getDate(),
        };
      }),
    [],
  );

  const selectedServices = mockServices.filter((service) => serviceIds.includes(service.id));
  const total = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const totalMinutes = selectedServices.reduce((sum, service) => sum + service.durationMinutes, 0);
  const canSave = Boolean(clientId) && serviceIds.length > 0 && Boolean(time);

  function toggleService(id: string) {
    setServiceIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Novo agendamento" />

      <AppText variant="caption" color={colors.sub} style={styles.label}>
        CLIENTE
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clientStrip}>
        {mockClients.map((client) => {
          const selected = clientId === client.id;
          return (
            <Pressable
              key={client.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setClientId(client.id)}
              style={[styles.clientChip, selected ? styles.clientChipSelected : null]}
            >
              <Avatar name={client.name} size={40} />
              <AppText variant="caption" numberOfLines={1} style={styles.clientName}>
                {client.name.split(' ')[0]}
              </AppText>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/clients/new')}
          style={styles.clientChip}
        >
          <View style={styles.addClientCircle}>
            <AppText variant="heading" color={colors.primary}>
              +
            </AppText>
          </View>
          <AppText variant="caption" color={colors.primary}>
            Novo
          </AppText>
        </Pressable>
      </ScrollView>

      <AppText variant="caption" color={colors.sub} style={styles.label}>
        SERVIÇOS
      </AppText>
      <View style={styles.services}>
        {mockServices
          .filter((service) => service.active)
          .map((service) => {
            const selected = serviceIds.includes(service.id);
            return (
              <Pressable
                key={service.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => toggleService(service.id)}
                style={[styles.serviceRow, selected ? styles.serviceRowSelected : null]}
              >
                <View style={[styles.serviceDot, { backgroundColor: service.color }]} />
                <View style={styles.serviceInfo}>
                  <AppText variant="bodyStrong">{service.name}</AppText>
                  <AppText variant="caption" color={colors.sub}>
                    {formatDuration(service.durationMinutes)}
                  </AppText>
                </View>
                <AppText variant="subheading">{formatCurrency(service.price)}</AppText>
              </Pressable>
            );
          })}
      </View>

      <AppText variant="caption" color={colors.sub} style={styles.label}>
        DATA
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
        {days.map((day) => {
          const selected = date === day.iso;
          return (
            <Pressable
              key={day.iso}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setDate(day.iso)}
              style={[styles.dayChip, selected ? styles.dayChipSelected : null]}
            >
              <AppText variant="micro" color={selected ? 'rgba(255,255,255,0.8)' : colors.muted}>
                {day.weekday}
              </AppText>
              <AppText variant="subheading" color={selected ? colors.surface : colors.ink}>
                {day.day}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <AppText variant="caption" color={colors.sub} style={styles.label}>
        HORÁRIO
      </AppText>
      <View style={styles.slots}>
        {timeSlots.map((slot) => {
          const selected = time === slot;
          return (
            <Pressable
              key={slot}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setTime(slot)}
              style={[styles.slot, selected ? styles.slotSelected : null]}
            >
              <AppText variant="caption" color={selected ? colors.surface : colors.sub}>
                {slot}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText variant="caption" color={colors.sub} style={styles.label}>
        PROFISSIONAL
      </AppText>
      <View style={styles.professionals}>
        {mockTeam
          .filter((member) => member.active)
          .map((member) => {
            const selected = professionalId === member.id;
            return (
              <Pressable
                key={member.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setProfessionalId(member.id)}
                style={[styles.professionalChip, selected ? styles.professionalSelected : null]}
              >
                <AppText variant="caption" color={selected ? colors.primary : colors.sub}>
                  {member.name}
                </AppText>
              </Pressable>
            );
          })}
      </View>

      <TextField
        label="Observações"
        placeholder="Ex.: retocar raiz, cliente prefere café..."
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      {selectedServices.length > 0 ? (
        <Card style={styles.summary}>
          <View style={styles.summaryRow}>
            <AppText variant="caption" color={colors.sub}>
              Duração total
            </AppText>
            <AppText variant="bodyStrong">{formatDuration(totalMinutes)}</AppText>
          </View>
          <View style={styles.summaryRow}>
            <AppText variant="caption" color={colors.sub}>
              Valor total
            </AppText>
            <AppText variant="heading" color={colors.primary}>
              {formatCurrency(total)}
            </AppText>
          </View>
        </Card>
      ) : null}

      <Button
        label="Confirmar agendamento"
        onPress={() => router.back()}
        disabled={!canSave}
        style={styles.confirm}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: spacing.xxl, marginBottom: spacing.sm },
  clientStrip: { gap: spacing.md },
  clientChip: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    width: 72,
  },
  clientChipSelected: { backgroundColor: colors.primarySoft },
  clientName: { maxWidth: 64 },
  addClientCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  services: { gap: spacing.sm },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  serviceRowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  serviceDot: { width: 10, height: 10, borderRadius: radius.full },
  serviceInfo: { flex: 1, gap: 2 },
  dayStrip: { gap: spacing.sm },
  dayChip: {
    width: 52,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 2,
  },
  dayChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slot: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  slotSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  professionals: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  professionalChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  professionalSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  summary: { marginTop: spacing.xl, gap: spacing.sm },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirm: { marginTop: spacing.xl },
});
