import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

interface DaySchedule {
  day: string;
  open: boolean;
  from: string;
  to: string;
}

const initialSchedule: DaySchedule[] = [
  { day: 'Segunda', open: true, from: '09:00', to: '19:00' },
  { day: 'Terça', open: true, from: '09:00', to: '19:00' },
  { day: 'Quarta', open: true, from: '09:00', to: '19:00' },
  { day: 'Quinta', open: true, from: '09:00', to: '20:00' },
  { day: 'Sexta', open: true, from: '09:00', to: '20:00' },
  { day: 'Sábado', open: true, from: '08:00', to: '17:00' },
  { day: 'Domingo', open: false, from: '09:00', to: '13:00' },
];

export default function BusinessHoursScreen() {
  const router = useRouter();
  const [schedule, setSchedule] = useState(initialSchedule);

  function toggleDay(day: string) {
    setSchedule((current) =>
      current.map((item) => (item.day === day ? { ...item, open: !item.open } : item)),
    );
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
                <Pressable accessibilityRole="button" style={styles.hourChip}>
                  <AppText variant="caption" color={colors.primary}>
                    {item.from}
                  </AppText>
                </Pressable>
                <AppText variant="caption" color={colors.muted}>
                  —
                </AppText>
                <Pressable accessibilityRole="button" style={styles.hourChip}>
                  <AppText variant="caption" color={colors.primary}>
                    {item.to}
                  </AppText>
                </Pressable>
              </View>
            ) : (
              <AppText variant="caption" color={colors.muted}>
                Fechado
              </AppText>
            )}
          </View>
        ))}
      </Card>

      <Button label="Salvar horários" onPress={() => router.back()} style={styles.save} />
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
  save: { marginTop: spacing.xxl },
});
