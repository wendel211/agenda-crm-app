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
import { useAuth, useBusiness } from '@/context/auth-context';
import { roleLabels } from '@/lib/permissions';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const business = useBusiness();
  const { membership, can } = useAuth();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/welcome');
  }

  return (
    <Screen>
      <ScreenHeader title="Perfil e ajustes" />

      <Card
        onPress={can('manageBusiness') ? () => router.push('/profile/edit-business') : undefined}
        style={styles.profileCard}
      >
        <Avatar name={business.name} size={56} />
        <View style={styles.profileInfo}>
          <AppText variant="institutionalHeading">{business.name}</AppText>
          <AppText variant="caption" color={colors.sub}>
            {business.segments.length > 0 ? business.segments.join(' · ') : 'Seu negócio de beleza'}
          </AppText>
        </View>
        <Badge label={roleLabels[membership?.role ?? 'professional']} tone="accent" />
      </Card>

      <AppText variant="caption" color={colors.sub} style={styles.groupLabel}>
        NEGÓCIO
      </AppText>
      <Card style={styles.group}>
        {can('manageBusiness') ? (
          <ListRow
            title="Horário de funcionamento"
            subtitle="Define os horários livres da agenda"
            icon="time-outline"
            onPress={() => router.push('/profile/business-hours')}
          />
        ) : null}
        <ListRow
          title="Equipe"
          subtitle="Profissionais e permissões"
          icon="people-outline"
          onPress={() => router.push('/profile/team')}
        />
        {can('manageServices') ? (
          <ListRow
            title="Serviços e preços"
            subtitle="Catálogo completo"
            icon="cut-outline"
            onPress={() => router.push('/services')}
          />
        ) : null}
        {can('manageGoals') ? (
          <ListRow
            title="Metas"
            subtitle="Objetivos do mês e do ano"
            icon="flag-outline"
            onPress={() => router.push('/goals')}
          />
        ) : null}
      </Card>

      <AppText variant="caption" color={colors.sub} style={styles.groupLabel}>
        CONTA
      </AppText>
      <Card style={styles.group}>
        {membership?.role === 'owner' ? (
          <ListRow
            title="Assinatura"
            subtitle="Plano atual e upgrade"
            icon="diamond-outline"
            iconColor={colors.accent}
            onPress={() => router.push('/profile/subscription')}
          />
        ) : null}
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
