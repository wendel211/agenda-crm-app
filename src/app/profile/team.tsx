import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Avatar,
  Badge,
  Button,
  Card,
  ListRow,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { mockTeam } from '@/mocks';
import { spacing } from '@/theme';

export default function TeamScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader title="Equipe" subtitle="Cada profissional tem a própria agenda" />

      <Card style={styles.card}>
        {mockTeam.map((member) => (
          <ListRow
            key={member.id}
            title={member.name}
            subtitle={member.role}
            left={<Avatar name={member.name} />}
            right={member.active ? undefined : <Badge label="Inativo" tone="neutral" />}
            onPress={() => {}}
          />
        ))}
      </Card>

      <Button label="Convidar profissional" variant="soft" onPress={() => {}} style={styles.action} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.xs },
  action: { marginTop: spacing.xl },
});
