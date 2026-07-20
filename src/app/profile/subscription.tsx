import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const proFeatures = [
  'Agenda online para clientes marcarem sozinhos',
  'Lembretes automáticos por WhatsApp',
  'Equipe ilimitada com comissões',
  'Relatórios avançados e exportação',
];

export default function SubscriptionScreen() {
  return (
    <Screen>
      <ScreenHeader title="Assinatura" />

      <Card style={styles.currentPlan}>
        <View style={styles.planHeader}>
          <AppText variant="heading">Plano grátis</AppText>
          <AppText variant="caption" color={colors.success}>
            ATIVO
          </AppText>
        </View>
        <AppText variant="body" color={colors.sub}>
          Agenda, clientes e financeiro básico. Perfeito para começar.
        </AppText>
      </Card>

      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.2, y: 1.2 }}
        style={styles.proCard}
      >
        <View style={styles.proHeader}>
          <Ionicons name="diamond" size={22} color={colors.onPrimary} />
          <AppText variant="heading" color={colors.onPrimary}>
            Plano Pro
          </AppText>
        </View>
        <AppText variant="display" color={colors.onPrimary}>
          R$ 39,90
          <AppText variant="body" color={colors.onPrimaryMuted}>
            /mês
          </AppText>
        </AppText>
        <View style={styles.features}>
          {proFeatures.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.onPrimary} />
              <AppText variant="bodyStrong" color={colors.onPrimary} style={styles.featureText}>
                {feature}
              </AppText>
            </View>
          ))}
        </View>
        <Button
          label="Assinar o Pro"
          onPress={() => {}}
          style={styles.proButton}
          labelColor={colors.primaryDark}
        />
      </LinearGradient>

      <AppText variant="caption" color={colors.muted} align="center" style={styles.note}>
        Cancele quando quiser, direto pelo app.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  currentPlan: { gap: spacing.sm },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proCard: {
    borderRadius: radius.xl,
    padding: spacing.xxl,
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  proHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  features: { gap: spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { flex: 1 },
  proButton: { backgroundColor: colors.surface },
  note: { marginTop: spacing.lg },
});
