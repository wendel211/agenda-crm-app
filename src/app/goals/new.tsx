import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, ScreenHeader, TextField } from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { createGoal } from '@/data/goals';
import { dateMaskToISO, maskCurrency, maskDate, parseCurrency } from '@/lib/masks';
import { colors, radius, spacing } from '@/theme';
import type { Goal } from '@/types';

export default function NewGoalScreen() {
  const router = useRouter();
  const business = useBusiness();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<Goal['kind']>('profissional');
  const [unit, setUnit] = useState<Goal['unit']>('BRL');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const targetValue = unit === 'BRL' ? parseCurrency(target) : Number(target.replace(/\D/g, ''));
    const deadlineISO = dateMaskToISO(deadline);
    if (!title.trim() || targetValue <= 0 || !deadlineISO) {
      setError('Preencha título, valor da meta e prazo (DD/MM/AAAA).');
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await createGoal({
        businessId: business.id,
        title: title.trim(),
        kind,
        target: targetValue,
        unit,
        deadline: deadlineISO,
      });
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Nova meta" />

      <View style={styles.form}>
        <TextField
          label="Título"
          icon="flag-outline"
          placeholder="Ex.: Faturar R$ 8.000 no mês"
          value={title}
          onChangeText={setTitle}
          error={error}
        />

        <AppText variant="caption" color={colors.sub}>
          TIPO
        </AppText>
        <View style={styles.chips}>
          {(
            [
              { value: 'profissional', label: 'Negócio' },
              { value: 'pessoal', label: 'Pessoal' },
            ] as const
          ).map((option) => {
            const selected = kind === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setKind(option.value)}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <AppText variant="caption" color={selected ? colors.onPrimary : colors.sub}>
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="caption" color={colors.sub}>
          MEDIDA
        </AppText>
        <View style={styles.chips}>
          {(
            [
              { value: 'BRL', label: 'Dinheiro (R$)' },
              { value: 'atendimentos', label: 'Atendimentos' },
            ] as const
          ).map((option) => {
            const selected = unit === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setUnit(option.value);
                  setTarget('');
                }}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <AppText variant="caption" color={selected ? colors.onPrimary : colors.sub}>
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <TextField
          label={unit === 'BRL' ? 'Valor da meta' : 'Quantidade de atendimentos'}
          icon={unit === 'BRL' ? 'cash-outline' : 'people-outline'}
          placeholder={unit === 'BRL' ? 'R$ 0,00' : 'Ex.: 90'}
          keyboardType="number-pad"
          value={target}
          onChangeText={(value) => setTarget(unit === 'BRL' ? maskCurrency(value) : value.replace(/\D/g, ''))}
        />
        <TextField
          label="Prazo"
          icon="calendar-outline"
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
          value={deadline}
          onChangeText={(value) => setDeadline(maskDate(value))}
        />

        <Button label="Salvar meta" onPress={handleSave} loading={saving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
