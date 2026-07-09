import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppointmentCard } from '@/components/appointment-card';
import {
  AppText,
  Card,
  EmptyState,
  IconButton,
  ProgressBar,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { formatCurrency, formatWeekday, toISODate } from '@/lib/format';
import { mockAppointments, mockGoals, mockNotifications } from '@/mocks';
import { colors, radius, spacing } from '@/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const today = toISODate(new Date());
  const todayAppointments = mockAppointments
    .filter((item) => item.date === today && item.status !== 'cancelado')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const expectedToday = todayAppointments.reduce((sum, item) => sum + item.price, 0);
  const hasUnread = mockNotifications.some((item) => !item.read);
  const mainGoals = mockGoals.filter((goal) => goal.kind === 'profissional');

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.greeting}>
          <AppText variant="title">Olá! 👋</AppText>
          <AppText variant="caption" color={colors.sub}>
            {formatWeekday(new Date())}
          </AppText>
        </View>
        <View style={styles.bellWrapper}>
          <IconButton icon="notifications-outline" label="Notificações" onPress={() => router.push('/notifications')} />
          {hasUnread ? <View style={styles.unreadDot} /> : null}
        </View>
      </View>

      <LinearGradient
        colors={[colors.primary, '#8E7CFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.revenueCard}
      >
        <AppText variant="caption" color="rgba(255,255,255,0.8)">
          PREVISTO PARA HOJE
        </AppText>
        <AppText variant="display" color={colors.surface}>
          {formatCurrency(expectedToday)}
        </AppText>
        <View style={styles.revenueFooter}>
          <View style={styles.revenueStat}>
            <Ionicons name="calendar" size={14} color={colors.surface} />
            <AppText variant="caption" color={colors.surface}>
              {todayAppointments.length} atendimentos
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/finance/reports')}
            hitSlop={8}
            style={styles.revenueLink}
          >
            <AppText variant="caption" color={colors.surface}>
              Ver relatórios
            </AppText>
            <Ionicons name="arrow-forward" size={14} color={colors.surface} />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.quickActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/appointments/new')}
          style={({ pressed }) => [styles.quickAction, pressed ? styles.actionPressed : null]}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="add-circle" size={22} color={colors.primary} />
          </View>
          <AppText variant="caption">Agendar</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/clients/new')}
          style={({ pressed }) => [styles.quickAction, pressed ? styles.actionPressed : null]}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="person-add" size={20} color={colors.accent} />
          </View>
          <AppText variant="caption">Cliente</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/services')}
          style={({ pressed }) => [styles.quickAction, pressed ? styles.actionPressed : null]}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="cut" size={20} color={colors.success} />
          </View>
          <AppText variant="caption">Serviços</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [styles.quickAction, pressed ? styles.actionPressed : null]}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.infoSoft }]}>
            <Ionicons name="settings" size={20} color={colors.info} />
          </View>
          <AppText variant="caption">Ajustes</AppText>
        </Pressable>
      </View>

      <SectionHeader title="Hoje" actionLabel="Ver agenda" onAction={() => router.push('/agenda')} />
      {todayAppointments.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Dia livre"
          message="Nenhum atendimento marcado para hoje."
          actionLabel="Criar agendamento"
          onAction={() => router.push('/appointments/new')}
        />
      ) : (
        todayAppointments.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))
      )}

      <SectionHeader title="Metas do mês" actionLabel="Ver todas" onAction={() => router.push('/goals')} />
      {mainGoals.map((goal) => {
        const progress = goal.current / goal.target;
        const currentLabel =
          goal.unit === 'BRL' ? formatCurrency(goal.current) : `${goal.current}`;
        const targetLabel =
          goal.unit === 'BRL' ? formatCurrency(goal.target) : `${goal.target}`;
        return (
          <Card key={goal.id} onPress={() => router.push('/goals')} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <AppText variant="bodyStrong">{goal.title}</AppText>
              <AppText variant="caption" color={colors.primary}>
                {Math.round(progress * 100)}%
              </AppText>
            </View>
            <ProgressBar value={progress} />
            <AppText variant="caption" color={colors.sub}>
              {currentLabel} de {targetLabel}
            </AppText>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  greeting: { gap: 2 },
  bellWrapper: { position: 'relative' },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.background,
  },
  revenueCard: {
    borderRadius: radius.xl,
    padding: spacing.xxl,
    gap: spacing.xs,
  },
  revenueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  revenueStat: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  revenueLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  quickAction: { alignItems: 'center', gap: spacing.xs, width: 72 },
  actionPressed: { opacity: 0.7 },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCard: { gap: spacing.sm, marginBottom: spacing.md },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
