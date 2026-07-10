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
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);

    if (authError) {
      const messages: Record<string, string> = {
        user_already_exists: 'Já existe uma conta com este e-mail. Use "Entrar".',
        email_exists: 'Já existe uma conta com este e-mail. Use "Entrar".',
        over_email_send_rate_limit:
          'Limite de e-mails atingido. Aguarde alguns minutos ou desative a confirmação de e-mail no Supabase.',
        weak_password: 'Senha muito fraca. Use ao menos 6 caracteres.',
      };
      setError(messages[authError.code ?? ''] ?? 'Não foi possível criar a conta. Tente novamente.');
      return;
    }

    // Sem sessão = projeto exige confirmação de e-mail antes do primeiro acesso.
    if (!data.session) {
      setError(
        'Conta criada, mas o projeto exige confirmação de e-mail. Confirme pelo link enviado antes de entrar.',
      );
      return;
    }
    router.replace('/');
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
