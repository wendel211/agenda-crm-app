import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { QueryBoundary } from '@/components/query-boundary';
import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  ListRow,
  Screen,
  ScreenHeader,
  TextField,
} from '@/components/ui';
import { useAuth, useBusiness } from '@/context/auth-context';
import {
  inviteTeamMember,
  listTeamAccess,
  updateTeamMemberAccess,
} from '@/data/team';
import { useQuery } from '@/data/use-query';
import { roleLabels } from '@/lib/permissions';
import { colors, radius, spacing } from '@/theme';
import type { BusinessRole, TeamAccess } from '@/types';

type EditableRole = Exclude<BusinessRole, 'owner'>;

const editableRoles: { value: EditableRole; label: string }[] = [
  { value: 'professional', label: 'Profissional' },
  { value: 'receptionist', label: 'Recepção' },
  { value: 'admin', label: 'Administrador' },
];

function RolePicker({
  value,
  onChange,
}: {
  value: EditableRole;
  onChange: (role: EditableRole) => void;
}) {
  return (
    <View style={styles.roles}>
      {editableRoles.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.roleChip, selected ? styles.roleChipSelected : null]}
          >
            <AppText variant="caption" color={selected ? colors.onPrimary : colors.sub}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TeamScreen() {
  const business = useBusiness();
  const { can } = useAuth();
  const canManage = can('manageTeam');
  const query = useQuery(() => listTeamAccess(business.id), [business.id]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<EditableRole>('professional');
  const [selectedId, setSelectedId] = useState<string>();
  const [editRole, setEditRole] = useState<EditableRole>('professional');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const selected = query.data?.find((member) => member.membershipId === selectedId);

  function selectMember(member: TeamAccess) {
    if (!canManage || member.role === 'owner') return;
    setSelectedId(member.membershipId);
    setEditRole(member.role);
    setError(undefined);
  }

  async function handleInvite() {
    if (!name.trim() || !email.trim()) {
      setError('Preencha nome e e-mail.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      const result = await inviteTeamMember({
        businessId: business.id,
        name: name.trim(),
        email: email.trim(),
        role,
      });
      setName('');
      setEmail('');
      await query.refetch();
      Alert.alert(
        'Convite criado',
        result.emailSent
          ? 'O acesso foi criado e o convite foi enviado por e-mail.'
          : 'O usuário já possuía conta. O acesso estará disponível no próximo login.',
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível convidar.');
    } finally {
      setSaving(false);
    }
  }

  async function saveMember(active: boolean) {
    if (!selected) return;
    setSaving(true);
    setError(undefined);
    try {
      await updateTeamMemberAccess(selected.membershipId, editRole, active);
      setSelectedId(undefined);
      await query.refetch();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Equipe" subtitle="Acessos e agendas por profissional" />

      {canManage ? (
        <Card style={styles.form}>
          <AppText variant="subheading">Convidar pessoa</AppText>
          <TextField
            label="Nome"
            placeholder="Nome da pessoa"
            value={name}
            onChangeText={setName}
          />
          <TextField
            label="E-mail"
            placeholder="pessoa@empresa.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <RolePicker value={role} onChange={setRole} />
          <Button label="Enviar convite" onPress={handleInvite} loading={saving} />
        </Card>
      ) : null}

      <QueryBoundary loading={query.loading} error={query.error} onRetry={query.refetch}>
        <Card style={styles.list}>
          {(query.data ?? []).map((member) => (
            <ListRow
              key={member.membershipId}
              title={member.name}
              subtitle={`${roleLabels[member.role]}${member.email ? ` · ${member.email}` : ''}`}
              left={<Avatar name={member.name} />}
              right={
                member.status === 'active' ? undefined : (
                  <Badge
                    label={member.status === 'invited' ? 'Convidado' : 'Inativo'}
                    tone={member.status === 'invited' ? 'warning' : 'neutral'}
                  />
                )
              }
              onPress={
                canManage && member.role !== 'owner' ? () => selectMember(member) : undefined
              }
              chevron={canManage && member.role !== 'owner'}
            />
          ))}
        </Card>
      </QueryBoundary>

      {selected ? (
        <Card style={styles.form}>
          <AppText variant="subheading">Editar {selected.name}</AppText>
          <RolePicker value={editRole} onChange={setEditRole} />
          {error ? (
            <AppText variant="caption" color={colors.danger}>
              {error}
            </AppText>
          ) : null}
          <Button
            label={selected.status === 'active' ? 'Salvar alterações' : 'Reativar acesso'}
            onPress={() => saveMember(true)}
            loading={saving}
          />
          {selected.status !== 'revoked' ? (
            <Button
              label="Revogar acesso"
              variant="danger"
              onPress={() => saveMember(false)}
              disabled={saving}
            />
          ) : null}
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={() => setSelectedId(undefined)}
            disabled={saving}
          />
        </Card>
      ) : error ? (
        <AppText variant="caption" color={colors.danger} style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, marginBottom: spacing.xl },
  list: { paddingVertical: spacing.xs },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  roleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  roleChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  error: { marginVertical: spacing.md },
});
