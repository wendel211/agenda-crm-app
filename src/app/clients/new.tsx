import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppText, Avatar, Button, Screen, ScreenHeader, TextField } from '@/components/ui';
import { useBusiness } from '@/context/auth-context';
import { getClient, saveClient } from '@/data/clients';
import { dateMaskToISO, maskDate, maskPhone } from '@/lib/masks';
import { pickImage, uploadImage } from '@/lib/upload';
import { colors, radius, spacing } from '@/theme';

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
  const [photoUri, setPhotoUri] = useState<string>();
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
        setPhotoUri(client.avatarUrl);
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
      // Foto nova (URI local) sobe para o Storage; URL existente é mantida.
      let avatarUrl: string | undefined;
      if (photoUri?.startsWith('file')) {
        avatarUrl = await uploadImage(photoUri, business.id, 'clients');
      }
      await saveClient({
        id,
        businessId: business.id,
        name: name.trim(),
        phone,
        email: email.trim() || undefined,
        birthday: dateMaskToISO(birthday),
        notes: notes.trim() || undefined,
        avatarUrl,
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escolher foto do cliente"
          onPress={async () => {
            const uri = await pickImage();
            if (uri) {
              setPhotoUri(uri);
            }
          }}
          style={styles.photoPicker}
        >
          <Avatar name={name || '?'} size={80} uri={photoUri} />
          <View style={styles.photoBadge}>
            <Ionicons name="camera" size={14} color={colors.onPrimary} />
          </View>
        </Pressable>

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
  photoPicker: { alignSelf: 'center' },
  photoBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
});
