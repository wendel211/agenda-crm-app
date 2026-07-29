import { supabase } from '@/lib/supabase';
import { servicePalette } from '@/theme';
import type { Business, BusinessMembership, BusinessRole, DaySchedule } from '@/types';

const WEEK: string[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export function defaultSchedule(from = '09:00', to = '19:00'): DaySchedule[] {
  return WEEK.map((day) => ({ day, open: day !== 'Domingo', from, to }));
}

interface BusinessRow {
  id: string;
  name: string;
  segments: string[];
  schedule: DaySchedule[];
  logo_url?: string | null;
  membership_id?: string;
  membership_role?: BusinessRole;
  professional_id?: string | null;
}

function mapBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    segments: row.segments,
    schedule: row.schedule.length > 0 ? row.schedule : defaultSchedule(),
    logoUrl: row.logo_url ?? undefined,
  };
}

export async function fetchMyBusinessContext(): Promise<{
  business: Business;
  membership: BusinessMembership;
} | null> {
  const { data, error } = await supabase.rpc('get_my_business_context');
  if (error) {
    throw new Error(error.message);
  }
  const row = (data?.[0] ?? null) as BusinessRow | null;
  if (!row?.membership_id || !row.membership_role) {
    return null;
  }
  return {
    business: mapBusiness(row),
    membership: {
      id: row.membership_id,
      role: row.membership_role,
      professionalId: row.professional_id ?? undefined,
    },
  };
}

interface CreateBusinessInput {
  ownerName: string;
  name: string;
  segments: string[];
  opensAt: string;
  closesAt: string;
  serviceNames: string[];
}

/** Onboarding: cria o negócio, o dono como profissional e os serviços iniciais. */
export async function createBusiness(input: CreateBusinessInput): Promise<Business> {
  const schedule = defaultSchedule(input.opensAt, input.closesAt);
  const { data: businessId, error } = await supabase.rpc('create_business_atomic', {
    p_name: input.name,
    p_segments: input.segments,
    p_schedule: schedule,
    p_owner_name: input.ownerName,
    p_service_names: input.serviceNames,
    p_service_colors: input.serviceNames.map(
      (_, index) => servicePalette[index % servicePalette.length],
    ),
  });
  if (error) {
    throw new Error(error.message);
  }
  return {
    id: businessId as string,
    name: input.name,
    segments: input.segments,
    schedule,
  };
}

export async function updateBusiness(
  businessId: string,
  changes: { name?: string; segments?: string[]; logoUrl?: string },
): Promise<void> {
  const { error } = await supabase
    .from('businesses')
    .update({
      ...(changes.name !== undefined ? { name: changes.name } : {}),
      ...(changes.segments !== undefined ? { segments: changes.segments } : {}),
      ...(changes.logoUrl !== undefined ? { logo_url: changes.logoUrl } : {}),
    })
    .eq('id', businessId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateSchedule(businessId: string, schedule: DaySchedule[]): Promise<void> {
  const { error } = await supabase
    .from('businesses')
    .update({ schedule })
    .eq('id', businessId);
  if (error) {
    throw new Error(error.message);
  }
}
