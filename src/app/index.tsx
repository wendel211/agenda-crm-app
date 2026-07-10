import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import { colors } from '@/theme';

/** Porta de entrada: decide a rota inicial a partir da sessão. */
export default function Index() {
  const { session, business, loading, passwordRecovery } = useAuth();

  if (passwordRecovery) {
    return <Redirect href="/(auth)/reset-password" />;
  }

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }
  if (!business) {
    return <Redirect href="/(auth)/onboarding" />;
  }
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
