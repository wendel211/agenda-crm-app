import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { QueryBoundary } from '@/components/query-boundary';
import { AppText, Button, Card, EmptyState, Screen, ScreenHeader } from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import {
  listNotifications,
  markAllNotificationsRead,
  type AppNotification,
} from '@/data/notifications';
import { useQuery } from '@/data/use-query';
import { colors, radius, spacing } from '@/theme';

const dateLabel = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const kindMeta: Record<AppNotification['kind'], { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  agendamento: { icon: 'calendar', color: colors.primary },
  lembrete: { icon: 'alarm', color: colors.warning },
  financeiro: { icon: 'wallet', color: colors.success },
  sistema: { icon: 'sparkles', color: colors.accent },
};

export default function NotificationsScreen() {
  const business = useBusiness();
  const { data, loading, error, refetch } = useQuery(
    () => listNotifications(business.id),
    [business.id],
  );

  const notifications = data ?? [];
  const hasUnread = notifications.some((item) => !item.read);

  return (
    <Screen>
      <ScreenHeader title="Notificações" />

      <QueryBoundary loading={loading} error={error} onRetry={refetch}>
        {notifications.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            title="Nada por aqui"
            message="Novos agendamentos e receitas lançadas aparecem nesta tela."
          />
        ) : (
          <>
            {hasUnread ? (
              <Button
                label="Marcar todas como lidas"
                variant="soft"
                size="md"
                onPress={async () => {
                  await markAllNotificationsRead(business.id);
                  await refetch();
                }}
                style={styles.markRead}
              />
            ) : null}

            {notifications.map((notification) => {
              const meta = kindMeta[notification.kind];
              return (
                <Card
                  key={notification.id}
                  style={[styles.card, notification.read ? styles.read : null]}
                >
                  <View style={[styles.icon, { backgroundColor: `${meta.color}1A` }]}>
                    <Ionicons name={meta.icon} size={18} color={meta.color} />
                  </View>
                  <View style={styles.body}>
                    <View style={styles.titleRow}>
                      <AppText variant="bodyStrong" style={styles.title}>
                        {notification.title}
                      </AppText>
                      {notification.read ? null : <View style={styles.dot} />}
                    </View>
                    <AppText variant="caption" color={colors.sub}>
                      {notification.message}
                    </AppText>
                    <AppText variant="micro" color={colors.muted}>
                      {dateLabel.format(new Date(notification.createdAt))}
                    </AppText>
                  </View>
                </Card>
              );
            })}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  markRead: { marginBottom: spacing.lg },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  read: { opacity: 0.65 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: spacing.xs },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { flex: 1 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
});
