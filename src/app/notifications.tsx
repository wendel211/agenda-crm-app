import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText, Card, Screen, ScreenHeader } from '@/components/ui';
import { formatShortDate, parseISODate } from '@/lib/format';
import { mockNotifications } from '@/mocks';
import { colors, radius, spacing } from '@/theme';
import type { AppNotification } from '@/types';

const kindMeta: Record<AppNotification['kind'], { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  agendamento: { icon: 'calendar', color: colors.primary },
  lembrete: { icon: 'alarm', color: colors.warning },
  financeiro: { icon: 'wallet', color: colors.success },
  sistema: { icon: 'sparkles', color: colors.accent },
};

export default function NotificationsScreen() {
  const sorted = [...mockNotifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen>
      <ScreenHeader title="Notificações" />

      {sorted.map((notification) => {
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
                {formatShortDate(parseISODate(notification.createdAt))}
              </AppText>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
