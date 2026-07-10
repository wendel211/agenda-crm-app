import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';

import { TimePickerModal } from '@/components/time-picker-modal';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { useAuth, useBusiness } from '@/context/auth-context';
import { updateSchedule } from '@/data/business';
import { timeToMinutes } from '@/lib/time';
import { colors, radius, spacing } from '@/theme';

interface PickerTarget {
  day: string;
  field: 'from' | 'to';
}

export default function BusinessHoursScreen() {
  const router = useRouter();
  const business = useBusiness();
  const { refreshBusiness } = useAuth();
  const [schedule, setSchedule] = useState(business.schedule);
  const [picker, setPicker] = useState<PickerTarget>();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  function toggleDay(day: string) {
    setSchedule((current) =>
      current.map((item) => (item.day === day ? { ...item, open: !item.open } : item)),
    );
  }

  function setHour(target: PickerTarget, time: string) {
    setSchedule((current) =>
      current.map((item) => (item.day === target.day ? { ...item, [target.field]: time } : item)),
    );
  }

  async function handleSave() {
    const invalid = schedule.find(
      (item) => item.open && timeToMinutes(item.from) >= timeToMinutes(item.to),
    );
    if (invalid) {
      setError(`${invalid.day}: o horário de abertura precisa ser antes do fechamento.`);
      return;
    }
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

  const pickerDay = picker ? schedule.find((item) => item.day === picker.day) : undefined;

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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.day}: abre às ${item.from}`}
                  onPress={() => setPicker({ day: item.day, field: 'from' })}
                  style={styles.hourChip}
                >
                  <AppText variant="caption" color={colors.primary}>
                    {item.from}
                  </AppText>
                </Pressable>
                <AppText variant="caption" color={colors.muted}>
                  —
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.day}: fecha às ${item.to}`}
                  onPress={() => setPicker({ day: item.day, field: 'to' })}
                  style={styles.hourChip}
                >
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

      {error ? (
        <AppText variant="caption" color={colors.danger} align="center" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <Button label="Salvar horários" onPress={handleSave} loading={saving} style={styles.save} />

      <TimePickerModal
        visible={Boolean(picker)}
        title={
          picker && pickerDay
            ? `${picker.day} — ${picker.field === 'from' ? 'abre às' : 'fecha às'}`
            : ''
        }
        value={picker && pickerDay ? pickerDay[picker.field] : '09:00'}
        onSelect={(time) => picker && setHour(picker, time)}
        onClose={() => setPicker(undefined)}
      />
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
