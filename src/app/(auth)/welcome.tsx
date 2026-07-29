import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const wordmark = require('@/assets/images/horaro-wordmark.png');
const WORDMARK_RATIO = 1342 / 341;

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
      <View style={styles.content}>
        <Image
          source={wordmark}
          style={styles.wordmark}
          contentFit="contain"
          tintColor={colors.onPrimary}
          accessibilityLabel="Horaro"
        />

        <View style={styles.headline}>
          <AppText variant="institutionalDisplay" color={colors.onPrimary}>
            Seu negócio de beleza,{'\n'}organizado.
          </AppText>
          <AppText variant="body" color={colors.onPrimaryMuted} style={styles.lead}>
            Agendamentos, clientes e financeiro em um só lugar — feito para quem vive da beleza.
          </AppText>
        </View>

        <View style={styles.highlights}>
          {highlights.map((item) => (
            <View key={item.icon} style={styles.highlightRow}>
              <View style={styles.highlightIcon}>
                <Ionicons name={item.icon} size={20} color={colors.onPrimary} />
              </View>
              <AppText variant="bodyStrong" color={colors.onPrimary} style={styles.highlightText}>
                {item.text}
              </AppText>
            </View>
          ))}
        </View>
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
  },
  // Marca, headline e destaques ficam agrupados no topo; só a folga antes dos
  // botões absorve a sobra da tela (marginTop: 'auto' em `actions`).
  content: { gap: spacing.xxxl },
  wordmark: {
    width: 168,
    aspectRatio: WORDMARK_RATIO,
  },
  headline: { gap: spacing.md },
  lead: { fontSize: 17, lineHeight: 25 },
  highlights: { gap: spacing.lg },
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  highlightIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceTranslucent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: { flex: 1, fontSize: 16, lineHeight: 22 },
  actions: {
    gap: spacing.sm,
    marginTop: 'auto',
    paddingTop: spacing.xxxl,
  },
  primaryAction: { backgroundColor: colors.surface },
});
