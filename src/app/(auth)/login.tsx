import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, ScreenHeader, TextField } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError('Informe e-mail e senha.');
      return;
    }
    setError(undefined);
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      setError(
        authError.code === 'email_not_confirmed'
          ? 'Este e-mail ainda não foi confirmado. Confirme pelo link enviado ou peça ao administrador para desativar a confirmação de e-mail.'
          : 'E-mail ou senha incorretos.',
      );
      return;
    }
    router.replace('/');
  }

  return (
    <Screen>
      <ScreenHeader title="Entrar" />
      <View style={styles.form}>
        <AppText variant="institutionalTitle">Que bom te ver de novo</AppText>
        <AppText variant="body" color={colors.sub}>
          Acesse sua conta para cuidar da sua agenda.
        </AppText>

        <View style={styles.fields}>
          <TextField
            label="E-mail"
            icon="mail-outline"
            placeholder="voce@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Senha"
            icon="lock-closed-outline"
            placeholder="Sua senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={error}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(auth)/forgot-password')}
          hitSlop={8}
          style={styles.forgot}
        >
          <AppText variant="caption" color={colors.primaryDark}>
            Esqueci minha senha
          </AppText>
        </Pressable>

        <Button label="Entrar" onPress={handleLogin} loading={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, paddingTop: spacing.xl },
  fields: { gap: spacing.lg, marginTop: spacing.lg },
  forgot: { alignSelf: 'flex-end', marginBottom: spacing.sm },
});
