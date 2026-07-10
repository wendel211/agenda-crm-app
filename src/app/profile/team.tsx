import { StyleSheet } from 'react-native';

import { QueryBoundary } from '@/components/query-boundary';
import {
  AppText,
  Avatar,
  Badge,
  Card,
  ListRow,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { listTeam } from '@/data/team';
import { useQuery } from '@/data/use-query';
import { colors, spacing } from '@/theme';

export default function TeamScreen() {
  const business = useBusiness();
  const { data, loading, error, refetch } = useQuery(() => listTeam(business.id), [business.id]);

  return (
    <Screen>
      <ScreenHeader title="Equipe" subtitle="Cada profissional tem a própria agenda" />

      <QueryBoundary loading={loading} error={error} onRetry={refetch}>
        <Card style={styles.card}>
          {(data ?? []).map((member) => (
            <ListRow
              key={member.id}
              title={member.name}
              subtitle={member.role}
              left={<Avatar name={member.name} />}
              right={member.active ? undefined : <Badge label="Inativo" tone="neutral" />}
              chevron={false}
            />
          ))}
        </Card>
        <AppText variant="caption" color={colors.muted} style={styles.note}>
          Convite de profissionais com login próprio chega na próxima versão.
        </AppText>
      </QueryBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.xs },
  note: { marginTop: spacing.lg, textAlign: 'center' },
});
