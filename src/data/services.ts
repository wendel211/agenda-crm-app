import { supabase } from '@/lib/supabase';
import type { Service } from '@/types';

interface ServiceRow {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  color: string;
  active: boolean;
}

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    price: Number(row.price),
    color: row.color,
    active: row.active,
  };
}

const COLUMNS = 'id, name, duration_minutes, price, color, active';

export async function listServices(businessId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select(COLUMNS)
    .eq('business_id', businessId)
    .order('name');
  if (error) {
    throw new Error(error.message);
  }
  return data.map(mapService);
}

export async function getService(id: string): Promise<Service | null> {
  const { data, error } = await supabase.from('services').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? mapService(data) : null;
}

interface SaveServiceInput {
  id?: string;
  businessId: string;
  name: string;
  durationMinutes: number;
  price: number;
  color: string;
  active?: boolean;
}

export async function saveService(input: SaveServiceInput): Promise<void> {
  const row = {
    business_id: input.businessId,
    name: input.name,
    duration_minutes: input.durationMinutes,
    price: input.price,
    color: input.color,
    active: input.active ?? true,
  };
  const query = input.id
    ? supabase.from('services').update(row).eq('id', input.id)
    : supabase.from('services').insert(row);
  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
}
