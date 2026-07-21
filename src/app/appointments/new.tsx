import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { QueryBoundary } from '@/components/query-boundary';
import {
  AppText,
  Avatar,
  Button,
  Card,
  EmptyState,
  Screen,
  ScreenHeader,
  TextField,
} from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import {
  createAppointment,
  getAppointment,
  listBusyRanges,
  updateAppointment,
} from '@/data/appointments';
import { listClientsWithStats } from '@/data/clients';
import { listServices } from '@/data/services';
import { listTeam } from '@/data/team';
import { useQuery } from '@/data/use-query';
import { formatCurrency, formatDuration, parseISODate, toISODate } from '@/lib/format';
import { scheduleAppointmentReminder } from '@/lib/reminders';
import { minutesToTime, overlapsAny, timeToMinutes, weekdayName } from '@/lib/time';
import { colors, radius, spacing } from '@/theme';

const SLOT_STEP_MINUTES = 30;
const weekdayShort = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });

export default function NewAppointmentScreen() {
  const router = useRouter();
  const business = useBusiness();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [clientId, setClientId] = useState<string>();
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState(toISODate(new Date()));
  const [time, setTime] = useState<string>();
  const [professionalId, setProfessionalId] = useState<string>();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const base = useQuery(
    async () => {
      const [clients, services, team] = await Promise.all([
        listClientsWithStats(business.id),
        listServices(business.id),
        listTeam(business.id),
      ]);
      return { clients, services, team: team.filter((member) => member.active) };
    },
    [business.id],
  );

  const selectedProfessionalId = professionalId ?? (!id ? base.data?.team[0]?.id : undefined);

  const busy = useQuery(
    () =>
      selectedProfessionalId
        ? listBusyRanges(selectedProfessionalId, date, id)
        : Promise.resolve([]),
    [selectedProfessionalId, date, id],
  );

  // Edição: pré-carrega o agendamento existente.
  useEffect(() => {
    if (!id) {
      return;
    }
    getAppointment(id).then((appointment) => {
      if (appointment) {
        setClientId(appointment.clientId);
        setServiceIds(appointment.serviceIds);
        setDate(appointment.date);
        setTime(appointment.startTime);
        setProfessionalId(appointment.professionalId);
        setNotes(appointment.notes ?? '');
      }
    });
  }, [id]);

  const days = useMemo(() => {
    const result = Array.from({ length: 10 }, (_, offset) => {
      const value = new Date();
      value.setDate(value.getDate() + offset);
      return {
        iso: toISODate(value),
        weekday: weekdayShort.format(value).replace('.', ''),
        day: value.getDate(),
      };
    });
    // Ao remarcar, garante que a data atual do agendamento apareça na faixa.
    if (!result.some((item) => item.iso === date)) {
      const parsed = parseISODate(date);
      result.push({
        iso: date,
        weekday: weekdayShort.format(parsed).replace('.', ''),
        day: parsed.getDate(),
      });
    }
    return result;
  }, [date]);

  const services = base.data?.services.filter((service) => service.active) ?? [];
  const selectedServices = services.filter((service) => serviceIds.includes(service.id));
  const total = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const totalMinutes = selectedServices.reduce((sum, service) => sum + service.durationMinutes, 0);

  // Slots dentro do expediente do dia, respeitando a duração total escolhida.
  const daySchedule = business.schedule.find((item) => item.day === weekdayName(date));
  const slots = (() => {
    if (!daySchedule?.open) {
      return [];
    }
    const opens = timeToMinutes(daySchedule.from);
    const closes = timeToMinutes(daySchedule.to);
    const duration = Math.max(totalMinutes, SLOT_STEP_MINUTES);
    const result: { time: string; available: boolean }[] = [];
    for (let minute = opens; minute + duration <= closes; minute += SLOT_STEP_MINUTES) {
      const slotTime = minutesToTime(minute);
      result.push({
        time: slotTime,
        available: !overlapsAny(slotTime, duration, busy.data ?? []),
      });
    }
    return result;
  })();

  const selectedTime =
    time && slots.some((slot) => slot.time === time && slot.available) ? time : undefined;

  const canSave =
    Boolean(clientId) &&
    serviceIds.length > 0 &&
    Boolean(selectedTime) &&
    Boolean(selectedProfessionalId);

  function toggleService(id: string) {
    setServiceIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function handleSave() {
    if (!clientId || !selectedProfessionalId || !selectedTime) {
      return;
    }
    setError(undefined);
    setSaving(true);
    const input = {
      businessId: business.id,
      clientId,
      professionalId: selectedProfessionalId,
      serviceIds,
      date,
      startTime: selectedTime,
      endTime: minutesToTime(timeToMinutes(selectedTime) + totalMinutes),
      price: total,
      notes: notes.trim() || undefined,
    };
    try {
      if (id) {
        await updateAppointment(id, input);
      } else {
        await createAppointment(input);
        const clientName =
          base.data?.clients.find((client) => client.id === clientId)?.name ?? 'Cliente';
        await scheduleAppointmentReminder({ clientName, date, startTime: selectedTime });
      }
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível agendar.');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title={id ? 'Remarcar / editar' : 'Novo agendamento'} />

      <QueryBoundary loading={base.loading} error={base.error} onRetry={base.refetch}>
        {base.data && base.data.services.length === 0 ? (
          <EmptyState
            icon="cut-outline"
            title="Cadastre um serviço primeiro"
            message="A agenda precisa de ao menos um serviço com duração e preço."
            actionLabel="Cadastrar serviço"
            onAction={() => router.push('/services/form')}
          />
        ) : (
          <>
            <AppText variant="caption" color={colors.sub} style={styles.label}>
              CLIENTE
            </AppText>
            {base.data && base.data.clients.length === 0 ? (
              <Button
                label="Cadastrar primeira cliente"
                variant="soft"
                size="md"
                onPress={() => router.push('/clients/new')}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.clientStrip}
              >
                {(base.data?.clients ?? []).map((client) => {
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
                    <AppText variant="heading" color={colors.primaryDark}>
                      +
                    </AppText>
                  </View>
                  <AppText variant="caption" color={colors.primaryDark}>
                    Novo
                  </AppText>
                </Pressable>
              </ScrollView>
            )}

            <AppText variant="caption" color={colors.sub} style={styles.label}>
              SERVIÇOS
            </AppText>
            <View style={styles.services}>
              {services.map((service) => {
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
              PROFISSIONAL
            </AppText>
            <View style={styles.professionals}>
              {(base.data?.team ?? []).map((member) => {
                const selected = selectedProfessionalId === member.id;
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

            <AppText variant="caption" color={colors.sub} style={styles.label}>
              DATA
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayStrip}
            >
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
                    <AppText variant="micro" color={selected ? colors.onPrimaryMuted : colors.muted}>
                      {day.weekday}
                    </AppText>
                    <AppText variant="subheading" color={selected ? colors.onPrimary : colors.ink}>
                      {day.day}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>

            <AppText variant="caption" color={colors.sub} style={styles.label}>
              HORÁRIO
            </AppText>
            {!daySchedule?.open ? (
              <AppText variant="body" color={colors.sub}>
                Você não atende neste dia. Ajuste o horário de funcionamento no perfil, se precisar.
              </AppText>
            ) : slots.length === 0 ? (
              <AppText variant="body" color={colors.sub}>
                Nenhum horário comporta essa duração neste dia.
              </AppText>
            ) : (
              <View style={styles.slots}>
                {slots.map((slot) => {
                  const selected = selectedTime === slot.time;
                  return (
                    <Pressable
                      key={slot.time}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: !slot.available }}
                      disabled={!slot.available}
                      onPress={() => setTime(slot.time)}
                      style={[
                        styles.slot,
                        selected ? styles.slotSelected : null,
                        slot.available ? null : styles.slotDisabled,
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color={selected ? colors.onPrimary : slot.available ? colors.sub : colors.muted}
                      >
                        {slot.time}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.notesField}>
              <TextField
                label="Observações"
                placeholder="Ex.: retocar raiz, cliente prefere café..."
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

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
                  <AppText variant="heading" color={colors.primaryDark}>
                    {formatCurrency(total)}
                  </AppText>
                </View>
              </Card>
            ) : null}

            {error ? (
              <AppText variant="caption" color={colors.danger} align="center" style={styles.error}>
                {error}
              </AppText>
            ) : null}

            <Button
              label={id ? 'Salvar alterações' : 'Confirmar agendamento'}
              onPress={handleSave}
              disabled={!canSave}
              loading={saving}
              style={styles.confirm}
            />
          </>
        )}
      </QueryBoundary>
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
  professionals: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  professionalChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  professionalSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
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
  slotDisabled: { opacity: 0.4 },
  notesField: { marginTop: spacing.xxl },
  summary: { marginTop: spacing.xl, gap: spacing.sm },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  error: { marginTop: spacing.md },
  confirm: { marginTop: spacing.xl },
});
