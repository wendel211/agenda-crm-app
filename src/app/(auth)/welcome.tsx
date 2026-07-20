import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const highlights = [
  { icon: 'calendar' as const, text: 'Agenda organizada por dia, semana e profissional' },
  { icon: 'people' as const, text: 'Histórico completo de cada cliente' },
  { icon: 'trending-up' as const, text: 'Financeiro e metas sem planilha' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.primaryHighlight, colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1.4 }}
      style={[styles.root, { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xxl }]}
    >
      <View style={styles.brand}>
        <View style={styles.logoBox}>
          <Ionicons name="sparkles" size={30} color={colors.primary} />
        </View>
        <AppText variant="display" color={colors.onPrimary}>
          Seu negócio de beleza,{'\n'}organizado.
        </AppText>
        <AppText variant="body" color={colors.onPrimaryMuted}>
          Agendamentos, clientes e financeiro em um só lugar — feito para quem vive da beleza.
        </AppText>
      </View>

      <View style={styles.highlights}>
        {highlights.map((item) => (
          <View key={item.icon} style={styles.highlightRow}>
            <View style={styles.highlightIcon}>
              <Ionicons name={item.icon} size={18} color={colors.onPrimary} />
            </View>
            <AppText variant="bodyStrong" color={colors.onPrimary} style={styles.highlightText}>
              {item.text}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          label="Criar conta grátis"
          onPress={() => router.push('/(auth)/signup')}
          style={styles.primaryAction}
          labelColor={colors.primaryDark}
        />
        <Button
          label="Já tenho conta"
          onPress={() => router.push('/(auth)/login')}
          variant="ghost"
          labelColor={colors.onPrimary}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'space-between',
  },
  brand: { gap: spacing.lg },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  highlights: { gap: spacing.lg },
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  highlightIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceTranslucent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: { flex: 1 },
  actions: { gap: spacing.sm },
  primaryAction: { backgroundColor: colors.surface },
});
