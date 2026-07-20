import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppointmentCard } from '@/components/appointment-card';
import { QueryBoundary } from '@/components/query-boundary';
import { AppText, EmptyState, Screen } from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { listAppointmentsBetween } from '@/data/appointments';
import { listTeam } from '@/data/team';
import { useQuery } from '@/data/use-query';
import { formatCurrency, parseISODate, toISODate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme';

type ViewMode = 'dia' | 'semana' | 'mes';

const DAYS_AHEAD = 14;
const weekdayShort = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });

function addDays(iso: string, amount: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

/** Segunda-feira da semana que contém a data. */
function weekStart(iso: string): string {
  const date = parseISODate(iso);
  const shift = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - shift);
  return toISODate(date);
}

function monthRange(iso: string): { from: string; to: string } {
  const date = parseISODate(iso);
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { from: toISODate(from), to: toISODate(to) };
}

export default function AgendaScreen() {
  const router = useRouter();
  const business = useBusiness();
  const [mode, setMode] = useState<ViewMode>('dia');
  const [selectedDay, setSelectedDay] = useState(toISODate(new Date()));
  const [professionalId, setProfessionalId] = useState<string>('todos');

  const dayStrip = useMemo(
    () =>
      Array.from({ length: DAYS_AHEAD }, (_, offset) => {
        const date = new Date();
        date.setDate(date.getDate() + offset);
        return {
          iso: toISODate(date),
          weekday: weekdayShort.format(date).replace('.', ''),
          day: date.getDate(),
        };
      }),
    [],
  );

  const range = useMemo(() => {
    if (mode === 'dia') {
      return { from: selectedDay, to: selectedDay };
    }
    if (mode === 'semana') {
      const from = weekStart(selectedDay);
      return { from, to: addDays(from, 6) };
    }
    return monthRange(selectedDay);
  }, [mode, selectedDay]);

  const team = useQuery(() => listTeam(business.id), [business.id]);
  const { data, loading, error, refetch } = useQuery(
    () => listAppointmentsBetween(business.id, range.from, range.to),
    [business.id, range.from, range.to],
  );

  // Realtime: outro aparelho criou/alterou um agendamento → recarrega.
  useEffect(() => {
    const channel = supabase
      .channel(`appointments-${business.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${business.id}`,
        },
        () => {
          refetch();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id, refetch]);

  const activeTeam = (team.data ?? []).filter((member) => member.active);
  const appointments = (data ?? []).filter(
    (item) => professionalId === 'todos' || item.professionalId === professionalId,
  );
  const activeAppointments = appointments.filter(
    (item) => item.status !== 'cancelado' && item.status !== 'faltou',
  );
  const rangeTotal = activeAppointments.reduce((sum, item) => sum + item.price, 0);

  // Semana: agrupado por dia.
  const byDay = useMemo(() => {
    const groups = new Map<string, typeof appointments>();
    for (const appointment of appointments) {
      const list = groups.get(appointment.date) ?? [];
      list.push(appointment);
      groups.set(appointment.date, list);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [appointments]);

  // Mês: contagem por dia para o calendário.
  const countByDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const appointment of activeAppointments) {
      counts.set(appointment.date, (counts.get(appointment.date) ?? 0) + 1);
    }
    return counts;
  }, [activeAppointments]);

  const monthGrid = useMemo(() => {
    if (mode !== 'mes') {
      return [];
    }
    const first = parseISODate(range.from);
    const leading = (first.getDay() + 6) % 7;
    const daysInMonth = parseISODate(range.to).getDate();
    const cells: (string | null)[] = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(toISODate(new Date(first.getFullYear(), first.getMonth(), day)));
    }
    return cells;
  }, [mode, range]);

  function shiftRange(direction: 1 | -1) {
    if (mode === 'semana') {
      setSelectedDay(addDays(selectedDay, 7 * direction));
      return;
    }
    const date = parseISODate(selectedDay);
    date.setMonth(date.getMonth() + direction, 1);
    setSelectedDay(toISODate(date));
  }

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <AppText variant="title">Agenda</AppText>
        <AppText variant="caption" color={colors.sub}>
          {activeAppointments.length} atendimentos · {formatCurrency(rangeTotal)} previstos
        </AppText>
      </View>

      <View style={styles.modeRow}>
        {(['dia', 'semana', 'mes'] as const).map((option) => {
          const selected = mode === option;
          const label = option === 'dia' ? 'Dia' : option === 'semana' ? 'Semana' : 'Mês';
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setMode(option)}
              style={[styles.modeChip, selected ? styles.modeChipSelected : null]}
            >
              <AppText variant="caption" color={selected ? colors.onPrimary : colors.sub}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {mode === 'dia' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysStrip}
          style={styles.daysScroll}
        >
          {dayStrip.map((day) => {
            const selected = day.iso === selectedDay;
            return (
              <Pressable
                key={day.iso}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSelectedDay(day.iso)}
                style={[styles.dayChip, selected ? styles.dayChipSelected : null]}
              >
                <AppText variant="micro" color={selected ? colors.onPrimaryMuted : colors.muted}>
                  {day.weekday}
                </AppText>
                <AppText variant="heading" color={selected ? colors.onPrimary : colors.ink}>
                  {day.day}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.rangeNav}>
          <Pressable accessibilityRole="button" accessibilityLabel="Período anterior" onPress={() => shiftRange(-1)} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <AppText variant="subheading">
            {mode === 'semana'
              ? `${parseISODate(range.from).getDate()}–${parseISODate(range.to).getDate()} ${monthLabel.format(parseISODate(range.to))}`
              : monthLabel.format(parseISODate(range.from))}
          </AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Próximo período" onPress={() => shiftRange(1)} hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={colors.ink} />
          </Pressable>
        </View>
      )}

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
          {mode === 'mes' ? (
            <View style={styles.calendar}>
              {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((letter, index) => (
                <View key={`head-${index}`} style={styles.calendarCell}>
                  <AppText variant="micro" color={colors.muted}>
                    {letter}
                  </AppText>
                </View>
              ))}
              {monthGrid.map((iso, index) => {
                if (!iso) {
                  return <View key={`empty-${index}`} style={styles.calendarCell} />;
                }
                const count = countByDay.get(iso) ?? 0;
                const isToday = iso === toISODate(new Date());
                return (
                  <Pressable
                    key={iso}
                    accessibilityRole="button"
                    accessibilityLabel={`Dia ${parseISODate(iso).getDate()}, ${count} atendimentos`}
                    onPress={() => {
                      setSelectedDay(iso);
                      setMode('dia');
                    }}
                    style={[styles.calendarCell, isToday ? styles.calendarToday : null]}
                  >
                    <AppText variant="caption" color={count > 0 ? colors.ink : colors.muted}>
                      {parseISODate(iso).getDate()}
                    </AppText>
                    {count > 0 ? (
                      <View style={styles.calendarBadge}>
                        <AppText variant="micro" color={colors.surface}>
                          {count}
                        </AppText>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : appointments.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="Nada por aqui"
              message="Nenhum atendimento neste período. Aproveite para divulgar seus horários livres."
              actionLabel="Novo agendamento"
              onAction={() => router.push('/appointments/new')}
            />
          ) : mode === 'dia' ? (
            appointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            byDay.map(([iso, list]) => (
              <View key={iso}>
                <AppText variant="caption" color={colors.sub} style={styles.weekDayLabel}>
                  {dayLabel.format(parseISODate(iso)).toUpperCase()}
                </AppText>
                {list.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </View>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: 2,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  modeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
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
  rangeNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
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
  weekDayLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  calendarToday: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  calendarBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
