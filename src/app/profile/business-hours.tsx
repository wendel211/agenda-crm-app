import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { useAuth, useBusiness } from '@/context/auth-context';
import { updateSchedule } from '@/data/business';
import { colors, radius, spacing } from '@/theme';

export default function BusinessHoursScreen() {
  const router = useRouter();
  const business = useBusiness();
  const { refreshBusiness } = useAuth();
  const [schedule, setSchedule] = useState(business.schedule);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  function toggleDay(day: string) {
    setSchedule((current) =>
      current.map((item) => (item.day === day ? { ...item, open: !item.open } : item)),
    );
  }

  async function handleSave() {
    setError(undefined);
    setSaving(true);
    try {
      await updateSchedule(business.id, schedule);
      await refreshBusiness();
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title="Horário de funcionamento"
        subtitle="A agenda só oferece horários dentro desses intervalos"
      />

      <Card style={styles.card}>
        {schedule.map((item) => (
          <View key={item.day} style={styles.row}>
            <Switch
              value={item.open}
              onValueChange={() => toggleDay(item.day)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
            <AppText variant="bodyStrong" style={styles.day}>
              {item.day}
            </AppText>
            {item.open ? (
              <View style={styles.hours}>
                <View style={styles.hourChip}>
                  <AppText variant="caption" color={colors.primary}>
                    {item.from}
                  </AppText>
                </View>
                <AppText variant="caption" color={colors.muted}>
                  —
                </AppText>
                <View style={styles.hourChip}>
                  <AppText variant="caption" color={colors.primary}>
                    {item.to}
                  </AppText>
                </View>
              </View>
            ) : (
              <AppText variant="caption" color={colors.muted}>
                Fechado
              </AppText>
            )}
          </View>
        ))}
      </Card>

      {error ? (
        <AppText variant="caption" color={colors.danger} align="center" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <Button label="Salvar horários" onPress={handleSave} loading={saving} style={styles.save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  day: { flex: 1 },
  hours: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  hourChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  error: { marginTop: spacing.lg },
  save: { marginTop: spacing.xxl },
});
