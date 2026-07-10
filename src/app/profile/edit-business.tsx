import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, ScreenHeader, TextField } from '@/components/ui';
import { useAuth, useBusiness } from '@/context/auth-context';
import { updateBusiness } from '@/data/business';
import { colors, radius, spacing } from '@/theme';

const segmentOptions = ['Cabelo', 'Unhas', 'Cílios & Sobrancelhas', 'Maquiagem', 'Estética', 'Barbearia'];

export default function EditBusinessScreen() {
  const router = useRouter();
  const business = useBusiness();
  const { refreshBusiness } = useAuth();
  const [name, setName] = useState(business.name);
  const [segments, setSegments] = useState<string[]>(business.segments);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  function toggleSegment(segment: string) {
    setSegments((current) =>
      current.includes(segment)
        ? current.filter((item) => item !== segment)
        : [...current, segment],
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('O nome do negócio não pode ficar vazio.');
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await updateBusiness(business.id, { name: name.trim(), segments });
      await refreshBusiness();
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Meu negócio" subtitle="Nome e áreas de atuação" />

      <View style={styles.form}>
        <TextField
          label="Nome do negócio"
          icon="storefront-outline"
          placeholder="Ex.: Estúdio Ana Beleza"
          value={name}
          onChangeText={setName}
          error={error}
        />

        <AppText variant="caption" color={colors.sub}>
          ÁREAS DE ATUAÇÃO
        </AppText>
        <View style={styles.chips}>
          {segmentOptions.map((segment) => {
            const selected = segments.includes(segment);
            return (
              <Pressable
                key={segment}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => toggleSegment(segment)}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <AppText variant="caption" color={selected ? colors.surface : colors.sub}>
                  {segment}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <Button label="Salvar" onPress={handleSave} loading={saving} />
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
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
