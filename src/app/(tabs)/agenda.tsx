import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppointmentCard } from '@/components/appointment-card';
import { QueryBoundary } from '@/components/query-boundary';
import { AppText, EmptyState, Screen } from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { listAppointmentsByDate } from '@/data/appointments';
import { listTeam } from '@/data/team';
import { useQuery } from '@/data/use-query';
import { formatCurrency, toISODate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

const DAYS_AHEAD = 14;
const weekdayShort = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });

interface DayOption {
  iso: string;
  weekday: string;
  day: number;
}

function buildDays(): DayOption[] {
  return Array.from({ length: DAYS_AHEAD }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return {
      iso: toISODate(date),
      weekday: weekdayShort.format(date).replace('.', ''),
      day: date.getDate(),
    };
  });
}

export default function AgendaScreen() {
  const router = useRouter();
  const business = useBusiness();
  const days = useMemo(buildDays, []);
  const [selectedDay, setSelectedDay] = useState(days[0].iso);
  const [professionalId, setProfessionalId] = useState<string>('todos');

  const team = useQuery(() => listTeam(business.id), [business.id]);
  const { data, loading, error, refetch } = useQuery(
    () => listAppointmentsByDate(business.id, selectedDay),
    [business.id, selectedDay],
  );

  const activeTeam = (team.data ?? []).filter((member) => member.active);
  const dayAppointments = (data ?? []).filter(
    (item) => professionalId === 'todos' || item.professionalId === professionalId,
  );
  const dayTotal = dayAppointments
    .filter((item) => item.status !== 'cancelado' && item.status !== 'faltou')
    .reduce((sum, item) => sum + item.price, 0);

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <AppText variant="title">Agenda</AppText>
        <AppText variant="caption" color={colors.sub}>
          {dayAppointments.length} atendimentos · {formatCurrency(dayTotal)} previstos
        </AppText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysStrip}
        style={styles.daysScroll}
      >
        {days.map((day) => {
          const selected = day.iso === selectedDay;
          return (
            <Pressable
              key={day.iso}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSelectedDay(day.iso)}
              style={[styles.dayChip, selected ? styles.dayChipSelected : null]}
            >
              <AppText variant="micro" color={selected ? 'rgba(255,255,255,0.8)' : colors.muted}>
                {day.weekday}
              </AppText>
              <AppText variant="heading" color={selected ? colors.surface : colors.ink}>
                {day.day}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {activeTeam.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterStrip}
          style={styles.filterScroll}
        >
          {[{ id: 'todos', name: 'Todos' }, ...activeTeam].map((option) => {
            const selected = professionalId === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setProfessionalId(option.id)}
                style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
              >
                <AppText variant="caption" color={selected ? colors.primary : colors.sub}>
                  {option.name}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <QueryBoundary loading={loading} error={error} onRetry={refetch}>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {dayAppointments.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="Nada por aqui"
              message="Nenhum atendimento para este dia. Aproveite para divulgar seus horários livres."
              actionLabel="Novo agendamento"
              onAction={() => router.push('/appointments/new')}
            />
          ) : (
            dayAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </ScrollView>
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: 2,
  },
  daysScroll: { flexGrow: 0 },
  daysStrip: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  dayChip: {
    width: 56,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 2,
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterScroll: { flexGrow: 0, marginTop: spacing.lg },
  filterStrip: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  list: {
    padding: spacing.xl,
    paddingBottom: 120,
  },
});
