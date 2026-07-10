import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText, Button, Screen, ScreenHeader, TextField } from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { getClient, saveClient } from '@/data/clients';
import { dateMaskToISO, maskDate, maskPhone } from '@/lib/masks';
import { colors, spacing } from '@/theme';

function isoToDateMask(iso?: string): string {
  if (!iso) {
    return '';
  }
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

export default function ClientFormScreen() {
  const router = useRouter();
  const business = useBusiness();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    getClient(id).then((client) => {
      if (client) {
        setName(client.name);
        setPhone(client.phone);
        setEmail(client.email ?? '');
        setBirthday(isoToDateMask(client.birthday));
        setNotes(client.notes ?? '');
      }
    });
  }, [id]);

  async function handleSave() {
    if (!name.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Informe o nome e um telefone válido com DDD.');
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      await saveClient({
        id,
        businessId: business.id,
        name: name.trim(),
        phone,
        email: email.trim() || undefined,
        birthday: dateMaskToISO(birthday),
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title={id ? 'Editar cliente' : 'Novo cliente'}
        subtitle="Só nome e telefone já bastam para começar"
      />

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
          onChangeText={(value) => setPhone(maskPhone(value))}
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
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
          value={birthday}
          onChangeText={(value) => setBirthday(maskDate(value))}
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

        <Button label="Salvar cliente" onPress={handleSave} loading={saving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, paddingTop: spacing.sm },
});
