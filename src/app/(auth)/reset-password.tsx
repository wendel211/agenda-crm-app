import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { clearPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (password.length < 6) {
      setError('A senha precisa de ao menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }
    setError(undefined);
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError('Não foi possível alterar a senha. Abra o link do e-mail novamente.');
      return;
    }
    clearPasswordRecovery();
    router.replace('/');
  }

  return (
    <Screen>
      <View style={styles.form}>
        <AppText variant="title">Criar nova senha</AppText>
        <AppText variant="body" color={colors.sub}>
          Escolha uma nova senha para a sua conta.
        </AppText>

        <TextField
          label="Nova senha"
          icon="lock-closed-outline"
          placeholder="Mínimo de 6 caracteres"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextField
          label="Confirmar senha"
          icon="lock-closed-outline"
          placeholder="Repita a nova senha"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          error={error}
        />

        <Button label="Salvar nova senha" onPress={handleSave} loading={saving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, paddingTop: spacing.xxxl },
});
