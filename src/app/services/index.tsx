import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppText,
  Badge,
  Card,
  IconButton,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { formatCurrency, formatDuration } from '@/lib/format';
import { mockServices } from '@/mocks';
import { colors, radius, spacing } from '@/theme';

export default function ServicesScreen() {
  const router = useRouter();
  const sorted = [...mockServices].sort((a, b) => Number(b.active) - Number(a.active));

  return (
    <Screen>
      <ScreenHeader
        title="Serviços"
        subtitle="A duração define os horários da agenda"
        right={
          <IconButton
            icon="add"
            label="Novo serviço"
            tone="primary"
            onPress={() => router.push('/services/form')}
          />
        }
      />

      {sorted.map((service) => (
        <Card
          key={service.id}
          onPress={() => router.push('/services/form')}
          style={[styles.card, service.active ? null : styles.inactive]}
        >
          <View style={[styles.colorBar, { backgroundColor: service.color }]} />
          <View style={styles.info}>
            <AppText variant="bodyStrong">{service.name}</AppText>
            <AppText variant="caption" color={colors.sub}>
              {formatDuration(service.durationMinutes)}
            </AppText>
          </View>
          <View style={styles.right}>
            <AppText variant="subheading" color={colors.primary}>
              {formatCurrency(service.price)}
            </AppText>
            {service.active ? null : <Badge label="Inativo" tone="neutral" />}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  inactive: { opacity: 0.6 },
  colorBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: radius.full,
  },
  info: { flex: 1, gap: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
});
