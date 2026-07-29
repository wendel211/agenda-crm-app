import { supabase } from '@/lib/supabase';
import type { BusinessRole, TeamAccess, TeamMember } from '@/types';

export async function listTeam(businessId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, name, role, active')
    .eq('business_id', businessId)
    .order('created_at');
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

interface TeamAccessRow {
  id: string;
  professional_id: string | null;
  display_name: string;
  email: string | null;
  role: BusinessRole;
  status: TeamAccess['status'];
}

export async function listTeamAccess(businessId: string): Promise<TeamAccess[]> {
  const { data, error } = await supabase
    .from('business_members')
    .select('id, professional_id, display_name, email, role, status')
    .eq('business_id', businessId)
    .order('created_at');
  if (error) {
    throw new Error(error.message);
  }
  return (data as TeamAccessRow[]).map((row) => ({
    membershipId: row.id,
    professionalId: row.professional_id ?? undefined,
    name: row.display_name,
    email: row.email ?? undefined,
    role: row.role,
    status: row.status,
  }));
}

export async function inviteTeamMember(input: {
  businessId: string;
  name: string;
  email: string;
  role: Exclude<BusinessRole, 'owner'>;
}): Promise<{ emailSent: boolean }> {
  const { data, error } = await supabase.functions.invoke('invite-business-member', {
    body: {
      businessId: input.businessId,
      displayName: input.name,
      email: input.email,
      role: input.role,
    },
  });
  if (error) {
    throw new Error(error.message);
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return { emailSent: Boolean(data?.emailSent) };
}

export async function updateTeamMemberAccess(
  membershipId: string,
  role: Exclude<BusinessRole, 'owner'>,
  active: boolean,
): Promise<void> {
  const { error } = await supabase.rpc('update_business_member_access', {
    p_member_id: membershipId,
    p_role: role,
    p_active: active,
  });
  if (error) {
    throw new Error(error.message);
  }
}
