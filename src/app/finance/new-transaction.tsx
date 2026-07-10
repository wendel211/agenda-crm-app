import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, ScreenHeader, TextField } from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { createTransaction } from '@/data/transactions';
import { maskCurrency, parseCurrency } from '@/lib/masks';
import { colors, radius, spacing } from '@/theme';
import type { TransactionKind } from '@/types';

const categories: Record<TransactionKind, string[]> = {
  receita: ['Atendimento', 'Pacote', 'Produto', 'Outros'],
  despesa: ['Insumos', 'Fixas', 'Equipamentos', 'Marketing', 'Outros'],
};

export default function NewTransactionScreen() {
  const router = useRouter();
  const business = useBusiness();
  const [kind, setKind] = useState<TransactionKind>('receita');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Atendimento');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const isIncome = kind === 'receita';

  function selectKind(next: TransactionKind) {
    setKind(next);
    setCategory(categories[next][0]);
  }

  async function handleSave() {
    const value = parseCurrency(amount);
    if (value <= 0 || !description.trim()) {
      setError('Informe um valor maior que zero e uma descrição.');
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await createTransaction({
        businessId: business.id,
        kind,
        description: description.trim(),
        category,
        amount: value,
      });
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Novo lançamento" />

      <View style={styles.kindRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: isIncome }}
          onPress={() => selectKind('receita')}
          style={[styles.kindChip, isIncome ? styles.kindIncomeSelected : null]}
        >
          <AppText variant="bodyStrong" color={isIncome ? colors.surface : colors.sub}>
            Receita
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !isIncome }}
          onPress={() => selectKind('despesa')}
          style={[styles.kindChip, !isIncome ? styles.kindExpenseSelected : null]}
        >
          <AppText variant="bodyStrong" color={!isIncome ? colors.surface : colors.sub}>
            Despesa
          </AppText>
        </Pressable>
      </View>

      <View style={styles.form}>
        <TextField
          label="Valor"
          icon="cash-outline"
          placeholder="R$ 0,00"
          keyboardType="number-pad"
          value={amount}
          onChangeText={(value) => setAmount(maskCurrency(value))}
          error={error}
        />
        <TextField
          label="Descrição"
          icon="create-outline"
          placeholder={isIncome ? 'Ex.: Corte — Mariana' : 'Ex.: Compra de esmaltes'}
          value={description}
          onChangeText={setDescription}
        />

        <AppText variant="caption" color={colors.sub}>
          CATEGORIA
        </AppText>
        <View style={styles.categories}>
          {categories[kind].map((option) => {
            const selected = category === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCategory(option)}
                style={[styles.categoryChip, selected ? styles.categorySelected : null]}
              >
                <AppText variant="caption" color={selected ? colors.primary : colors.sub}>
                  {option}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <Button label="Salvar lançamento" onPress={handleSave} loading={saving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kindRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  kindChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  kindIncomeSelected: { backgroundColor: colors.success, borderColor: colors.success },
  kindExpenseSelected: { backgroundColor: colors.danger, borderColor: colors.danger },
  form: { gap: spacing.lg },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categorySelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});
