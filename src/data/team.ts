import { supabase } from '@/lib/supabase';
import type { TeamMember } from '@/types';

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
