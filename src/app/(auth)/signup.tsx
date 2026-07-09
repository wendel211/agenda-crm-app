import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, ScreenHeader, TextField } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!name || !email || password.length < 6) {
      setError('Preencha todos os campos. A senha precisa de ao menos 6 caracteres.');
      return;
    }
    setError(undefined);
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);

    if (authError) {
      setError('Não foi possível criar a conta. Tente novamente.');
      return;
    }
    router.replace('/(auth)/onboarding');
  }

  return (
    <Screen>
      <ScreenHeader title="Criar conta" />
      <View style={styles.form}>
        <AppText variant="title">Comece grátis</AppText>
        <AppText variant="body" color={colors.sub}>
          Leva menos de um minuto para organizar seu negócio.
        </AppText>

        <View style={styles.fields}>
          <TextField
            label="Seu nome"
            icon="person-outline"
            placeholder="Como podemos te chamar?"
            value={name}
            onChangeText={setName}
          />
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
            placeholder="Mínimo de 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={error}
          />
        </View>

        <Button label="Criar minha conta" onPress={handleSignup} loading={loading} />
        <AppText variant="caption" color={colors.muted} align="center">
          Ao continuar você concorda com os Termos de Uso e a Política de Privacidade.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, paddingTop: spacing.xl },
  fields: { gap: spacing.lg, marginVertical: spacing.lg },
});
