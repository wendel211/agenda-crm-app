import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Badge,
  Button,
  Card,
  ProgressBar,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { formatCurrency, formatShortDate, parseISODate } from '@/lib/format';
import { mockGoals } from '@/mocks';
import { colors, spacing } from '@/theme';

export default function GoalsScreen() {
  return (
    <Screen>
      <ScreenHeader title="Metas" subtitle="Objetivos do negócio e pessoais" />

      {mockGoals.map((goal) => {
        const progress = goal.current / goal.target;
        const currentLabel = goal.unit === 'BRL' ? formatCurrency(goal.current) : `${goal.current}`;
        const targetLabel = goal.unit === 'BRL' ? formatCurrency(goal.target) : `${goal.target}`;
        return (
          <Card key={goal.id} style={styles.card}>
            <View style={styles.header}>
              <AppText variant="bodyStrong" style={styles.title}>
                {goal.title}
              </AppText>
              <Badge
                label={goal.kind === 'profissional' ? 'Negócio' : 'Pessoal'}
                tone={goal.kind === 'profissional' ? 'primary' : 'accent'}
              />
            </View>
            <ProgressBar
              value={progress}
              color={goal.kind === 'profissional' ? colors.primary : colors.accent}
            />
            <View style={styles.footer}>
              <AppText variant="caption" color={colors.sub}>
                {currentLabel} de {targetLabel}
              </AppText>
              <AppText variant="caption" color={colors.muted}>
                até {formatShortDate(parseISODate(goal.deadline))}
              </AppText>
            </View>
          </Card>
        );
      })}

      <Button label="Criar nova meta" variant="soft" onPress={() => {}} style={styles.action} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, marginBottom: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  action: { marginTop: spacing.sm },
});
