import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  ListRow,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const business = useBusiness();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/welcome');
  }

  return (
    <Screen>
      <ScreenHeader title="Perfil e ajustes" />

      <Card style={styles.profileCard}>
        <Avatar name={business.name} size={56} />
        <View style={styles.profileInfo}>
          <AppText variant="heading">{business.name}</AppText>
          <AppText variant="caption" color={colors.sub}>
            {business.segments.length > 0 ? business.segments.join(' · ') : 'Seu negócio de beleza'}
          </AppText>
        </View>
        <Badge label="Plano grátis" tone="accent" />
      </Card>

      <AppText variant="caption" color={colors.sub} style={styles.groupLabel}>
        NEGÓCIO
      </AppText>
      <Card style={styles.group}>
        <ListRow
          title="Horário de funcionamento"
          subtitle="Define os horários livres da agenda"
          icon="time-outline"
          onPress={() => router.push('/profile/business-hours')}
        />
        <ListRow
          title="Equipe"
          subtitle="Profissionais e permissões"
          icon="people-outline"
          onPress={() => router.push('/profile/team')}
        />
        <ListRow
          title="Serviços e preços"
          subtitle="Catálogo completo"
          icon="cut-outline"
          onPress={() => router.push('/services')}
        />
        <ListRow
          title="Metas"
          subtitle="Objetivos do mês e do ano"
          icon="flag-outline"
          onPress={() => router.push('/goals')}
        />
      </Card>

      <AppText variant="caption" color={colors.sub} style={styles.groupLabel}>
        CONTA
      </AppText>
      <Card style={styles.group}>
        <ListRow
          title="Assinatura"
          subtitle="Plano atual e upgrade"
          icon="diamond-outline"
          iconColor={colors.accent}
          onPress={() => router.push('/profile/subscription')}
        />
        <ListRow
          title="Notificações"
          subtitle="Lembretes e alertas"
          icon="notifications-outline"
          onPress={() => router.push('/notifications')}
        />
      </Card>

      <Button label="Sair da conta" variant="danger" onPress={handleLogout} style={styles.logout} />
      <AppText variant="micro" color={colors.muted} align="center" style={styles.version}>
        VERSÃO 1.0.0
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: { flex: 1, gap: 2 },
  groupLabel: { marginTop: spacing.xxl, marginBottom: spacing.sm },
  group: { paddingVertical: spacing.xs },
  logout: { marginTop: spacing.xxxl },
  version: { marginTop: spacing.lg },
});
