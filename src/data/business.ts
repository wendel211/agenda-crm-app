import { supabase } from '@/lib/supabase';
import type { Business, DaySchedule } from '@/types';

const WEEK: string[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export function defaultSchedule(from = '09:00', to = '19:00'): DaySchedule[] {
  return WEEK.map((day) => ({ day, open: day !== 'Domingo', from, to }));
}

interface BusinessRow {
  id: string;
  name: string;
  segments: string[];
  schedule: DaySchedule[];
}

function mapBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    segments: row.segments,
    schedule: row.schedule.length > 0 ? row.schedule : defaultSchedule(),
  };
}

export async function fetchMyBusiness(): Promise<Business | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, segments, schedule')
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? mapBusiness(data) : null;
}

interface CreateBusinessInput {
  ownerId: string;
  ownerName: string;
  name: string;
  segments: string[];
  opensAt: string;
  closesAt: string;
  serviceNames: string[];
}

const SERVICE_COLORS = ['#6C5CE7', '#FF5C8A', '#00C39A', '#FFAA2B', '#3E8BFF', '#FF5A5F'];

/** Onboarding: cria o negócio, o dono como profissional e os serviços iniciais. */
export async function createBusiness(input: CreateBusinessInput): Promise<Business> {
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      owner_id: input.ownerId,
      name: input.name,
      segments: input.segments,
      schedule: defaultSchedule(input.opensAt, input.closesAt),
    })
    .select('id, name, segments, schedule')
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const { error: teamError } = await supabase.from('team_members').insert({
    business_id: data.id,
    name: input.ownerName,
    role: 'Proprietário(a)',
  });
  if (teamError) {
    throw new Error(teamError.message);
  }

  if (input.serviceNames.length > 0) {
    const { error: servicesError } = await supabase.from('services').insert(
      input.serviceNames.map((name, index) => ({
        business_id: data.id,
        name,
        duration_minutes: 60,
        price: 0,
        color: SERVICE_COLORS[index % SERVICE_COLORS.length],
      })),
    );
    if (servicesError) {
      throw new Error(servicesError.message);
    }
  }

  return mapBusiness(data);
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
