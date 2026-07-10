import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, ScreenHeader, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function NewClientScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string>();

  function handleSave() {
    if (!name.trim() || !phone.trim()) {
      setError('Nome e telefone são obrigatórios.');
      return;
    }
    router.back();
  }

  return (
    <Screen>
      <ScreenHeader title="Novo cliente" subtitle="Só nome e telefone já bastam para começar" />

      <View style={styles.form}>
        <TextField
          label="Nome completo"
          icon="person-outline"
          placeholder="Ex.: Mariana Duarte"
          value={name}
          onChangeText={setName}
          error={error}
        />
        <TextField
          label="Telefone / WhatsApp"
          icon="call-outline"
          placeholder="(11) 90000-0000"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextField
          label="E-mail (opcional)"
          icon="mail-outline"
          placeholder="cliente@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Aniversário (opcional)"
          icon="gift-outline"
          placeholder="DD/MM"
          value={birthday}
          onChangeText={setBirthday}
        />
        <TextField
          label="Ficha / observações (opcional)"
          icon="document-text-outline"
          placeholder="Preferências, fórmulas, alergias..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <AppText variant="caption" color={colors.muted}>
          Dica: use a ficha para anotar fórmulas de coloração e preferências — ela aparece no perfil e em cada atendimento.
        </AppText>

        <Button label="Salvar cliente" onPress={handleSave} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, paddingTop: spacing.sm },
});
