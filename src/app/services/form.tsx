import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, ScreenHeader, TextField } from '@/components/ui';
import { formatDuration } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

const durations = [30, 40, 45, 60, 90, 120, 150];
const palette = ['#6C5CE7', '#FF5C8A', '#00C39A', '#FFAA2B', '#3E8BFF', '#FF5A5F'];

export default function ServiceFormScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState(60);
  const [color, setColor] = useState(palette[0]);

  return (
    <Screen>
      <ScreenHeader title="Serviço" subtitle="Nome, preço, duração e cor na agenda" />

      <View style={styles.form}>
        <TextField
          label="Nome do serviço"
          icon="cut-outline"
          placeholder="Ex.: Corte feminino"
          value={name}
          onChangeText={setName}
        />
        <TextField
          label="Preço"
          icon="cash-outline"
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
        />

        <AppText variant="caption" color={colors.sub}>
          DURAÇÃO
        </AppText>
        <View style={styles.chips}>
          {durations.map((option) => {
            const selected = duration === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setDuration(option)}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <AppText variant="caption" color={selected ? colors.surface : colors.sub}>
                  {formatDuration(option)}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="caption" color={colors.sub}>
          COR NA AGENDA
        </AppText>
        <View style={styles.chips}>
          {palette.map((option) => {
            const selected = color === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={`Cor ${option}`}
                accessibilityState={{ selected }}
                onPress={() => setColor(option)}
                style={[
                  styles.swatch,
                  { backgroundColor: option },
                  selected ? styles.swatchSelected : null,
                ]}
              />
            );
          })}
        </View>

        <Button label="Salvar serviço" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: colors.ink,
  },
});
