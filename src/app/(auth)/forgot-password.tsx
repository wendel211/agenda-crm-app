import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Screen, ScreenHeader, TextField } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!email) {
      return;
    }
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'agendacrm://reset-password',
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <Screen>
      <ScreenHeader title="Recuperar senha" />
      <View style={styles.form}>
        <AppText variant="institutionalTitle">Sem pânico</AppText>
        <AppText variant="body" color={colors.sub}>
          Informe seu e-mail e enviaremos um link para você criar uma nova senha.
        </AppText>

        <TextField
          label="E-mail"
          icon="mail-outline"
          placeholder="voce@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {sent ? (
          <AppText variant="bodyStrong" color={colors.success}>
            Se este e-mail estiver cadastrado, o link de recuperação já está a caminho.
          </AppText>
        ) : null}

        <Button label="Enviar link" onPress={handleReset} loading={loading} disabled={sent} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, paddingTop: spacing.xl },
});
