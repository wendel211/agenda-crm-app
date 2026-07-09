import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, TextField } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const segments = ['Cabelo', 'Unhas', 'Cílios & Sobrancelhas', 'Maquiagem', 'Estética', 'Barbearia'];
const hours = ['08:00', '09:00', '10:00', '17:00', '18:00', '19:00', '20:00'];
const starterServices = ['Corte', 'Escova', 'Coloração', 'Manicure', 'Pedicure', 'Design de sobrancelha', 'Limpeza de pele'];

const TOTAL_STEPS = 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [opensAt, setOpensAt] = useState('09:00');
  const [closesAt, setClosesAt] = useState('19:00');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <View style={styles.progress}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index <= step ? styles.dotActive : null]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.stepBody}>
          <AppText variant="title">Sobre o seu negócio</AppText>
          <AppText variant="body" color={colors.sub}>
            Isso personaliza sua agenda e seus relatórios.
          </AppText>
          <TextField
            label="Nome do negócio"
            icon="storefront-outline"
            placeholder="Ex.: Estúdio Ana Beleza"
            value={businessName}
            onChangeText={setBusinessName}
          />
          <AppText variant="caption" color={colors.sub}>
            ÁREAS DE ATUAÇÃO
          </AppText>
          <View style={styles.chips}>
            {segments.map((segment) => {
              const selected = selectedSegments.includes(segment);
              return (
                <Pressable
                  key={segment}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => toggle(selectedSegments, segment, setSelectedSegments)}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                >
                  <AppText variant="caption" color={selected ? colors.surface : colors.sub}>
                    {segment}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.stepBody}>
          <AppText variant="title">Horário de atendimento</AppText>
          <AppText variant="body" color={colors.sub}>
            Sua agenda só mostrará horários dentro desse intervalo. Você pode refinar depois.
          </AppText>
          <AppText variant="caption" color={colors.sub}>
            ABRE ÀS
          </AppText>
          <View style={styles.chips}>
            {hours.slice(0, 3).map((hour) => (
              <Pressable
                key={hour}
                accessibilityRole="button"
                accessibilityState={{ selected: opensAt === hour }}
                onPress={() => setOpensAt(hour)}
                style={[styles.chip, opensAt === hour ? styles.chipSelected : null]}
              >
                <AppText variant="caption" color={opensAt === hour ? colors.surface : colors.sub}>
                  {hour}
                </AppText>
              </Pressable>
            ))}
          </View>
          <AppText variant="caption" color={colors.sub}>
            FECHA ÀS
          </AppText>
          <View style={styles.chips}>
            {hours.slice(3).map((hour) => (
              <Pressable
                key={hour}
                accessibilityRole="button"
                accessibilityState={{ selected: closesAt === hour }}
                onPress={() => setClosesAt(hour)}
                style={[styles.chip, closesAt === hour ? styles.chipSelected : null]}
              >
                <AppText variant="caption" color={closesAt === hour ? colors.surface : colors.sub}>
                  {hour}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.stepBody}>
          <AppText variant="title">Seus serviços</AppText>
          <AppText variant="body" color={colors.sub}>
            Selecione o que você oferece — preços e durações vêm depois.
          </AppText>
          <View style={styles.chips}>
            {starterServices.map((service) => {
              const selected = selectedServices.includes(service);
              return (
                <Pressable
                  key={service}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => toggle(selectedServices, service, setSelectedServices)}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                >
                  <AppText variant="caption" color={selected ? colors.surface : colors.sub}>
                    {service}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Button
          label={step === TOTAL_STEPS - 1 ? 'Concluir e abrir minha agenda' : 'Continuar'}
          onPress={handleNext}
        />
        {step > 0 ? (
          <Button label="Voltar" variant="ghost" onPress={() => setStep(step - 1)} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary },
  stepBody: { gap: spacing.lg },
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
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: { gap: spacing.sm, marginTop: spacing.xxxl },
});
