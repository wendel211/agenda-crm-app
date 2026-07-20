import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText, Button, Screen, ScreenHeader, TextField } from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { getService, saveService } from '@/data/services';
import { formatDuration } from '@/lib/format';
import { maskCurrency, parseCurrency } from '@/lib/masks';
import { colors, radius, servicePalette, spacing } from '@/theme';

const durations = [30, 40, 45, 60, 90, 120, 150];
const palette = servicePalette;

export default function ServiceFormScreen() {
  const router = useRouter();
  const business = useBusiness();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState(60);
  const [color, setColor] = useState<string>(palette[0]);
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    getService(id).then((service) => {
      if (service) {
        setName(service.name);
        setPrice(maskCurrency(String(Math.round(service.price * 100))));
        setDuration(service.durationMinutes);
        setColor(service.color);
        setActive(service.active);
      }
    });
  }, [id]);

  async function handleSave() {
    if (!name.trim()) {
      setError('Dê um nome ao serviço.');
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await saveService({
        id,
        businessId: business.id,
        name: name.trim(),
        durationMinutes: duration,
        price: parseCurrency(price),
        color,
        active,
      });
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title={id ? 'Editar serviço' : 'Novo serviço'}
        subtitle="Nome, preço, duração e cor na agenda"
      />

      <View style={styles.form}>
        <TextField
          label="Nome do serviço"
          icon="cut-outline"
          placeholder="Ex.: Corte feminino"
          value={name}
          onChangeText={setName}
          error={error}
        />
        <TextField
          label="Preço"
          icon="cash-outline"
          placeholder="R$ 0,00"
          keyboardType="number-pad"
          value={price}
          onChangeText={(value) => setPrice(maskCurrency(value))}
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
                <AppText variant="caption" color={selected ? colors.onPrimary : colors.sub}>
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

        {id ? (
          <View style={styles.activeRow}>
            <View style={styles.activeTexts}>
              <AppText variant="bodyStrong">Serviço ativo</AppText>
              <AppText variant="caption" color={colors.sub}>
                Serviços inativos não aparecem no agendamento
              </AppText>
            </View>
            <Switch
              value={active}
              onValueChange={setActive}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        ) : null}

        <Button label="Salvar serviço" onPress={handleSave} loading={saving} />
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
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activeTexts: { flex: 1, gap: 2 },
});
