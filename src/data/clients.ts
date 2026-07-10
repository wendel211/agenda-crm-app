import { supabase } from '@/lib/supabase';
import type { Client, ClientWithStats } from '@/types';

interface ClientRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  birthday: string | null;
  notes: string | null;
  archived: boolean;
  avatar_url: string | null;
}

function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    birthday: row.birthday ?? undefined,
    notes: row.notes ?? undefined,
    archived: row.archived,
    avatarUrl: row.avatar_url ?? undefined,
  };
}

const COLUMNS = 'id, name, phone, email, birthday, notes, archived, avatar_url';

/** Lista clientes com visitas/total gasto agregados dos atendimentos concluídos. */
export async function listClientsWithStats(businessId: string): Promise<ClientWithStats[]> {
  const [clientsResult, appointmentsResult] = await Promise.all([
    supabase
      .from('clients')
      .select(COLUMNS)
      .eq('business_id', businessId)
      .eq('archived', false)
      .order('name'),
    supabase
      .from('appointments')
      .select('client_id, price, date')
      .eq('business_id', businessId)
      .eq('status', 'concluido'),
  ]);
  if (clientsResult.error) {
    throw new Error(clientsResult.error.message);
  }
  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message);
  }

  const stats = new Map<string, { visits: number; totalSpent: number; lastVisit?: string }>();
  for (const appointment of appointmentsResult.data) {
    const entry = stats.get(appointment.client_id) ?? { visits: 0, totalSpent: 0 };
    entry.visits += 1;
    entry.totalSpent += Number(appointment.price);
    if (!entry.lastVisit || appointment.date > entry.lastVisit) {
      entry.lastVisit = appointment.date;
    }
    stats.set(appointment.client_id, entry);
  }

  return clientsResult.data.map((row) => ({
    ...mapClient(row),
    visits: stats.get(row.id)?.visits ?? 0,
    totalSpent: stats.get(row.id)?.totalSpent ?? 0,
    lastVisit: stats.get(row.id)?.lastVisit,
  }));
}

export async function getClient(id: string): Promise<ClientWithStats | null> {
  const { data, error } = await supabase.from('clients').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const { data: history, error: historyError } = await supabase
    .from('appointments')
    .select('price, date')
    .eq('client_id', id)
    .eq('status', 'concluido');
  if (historyError) {
    throw new Error(historyError.message);
  }

  return {
    ...mapClient(data),
    visits: history.length,
    totalSpent: history.reduce((sum, item) => sum + Number(item.price), 0),
    lastVisit: history.reduce<string | undefined>(
      (latest, item) => (!latest || item.date > latest ? item.date : latest),
      undefined,
    ),
  };
}

interface SaveClientInput {
  id?: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  notes?: string;
}

/** Arquivar preserva o histórico; o cliente some da lista e do agendamento. */
export async function setClientArchived(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase.from('clients').update({ archived }).eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function setClientAvatar(id: string, avatarUrl: string): Promise<void> {
  const { error } = await supabase.from('clients').update({ avatar_url: avatarUrl }).eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function saveClient(input: SaveClientInput): Promise<void> {
  const row = {
    business_id: input.businessId,
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    birthday: input.birthday || null,
    notes: input.notes || null,
  };
  const query = input.id
    ? supabase.from('clients').update(row).eq('id', input.id)
    : supabase.from('clients').insert(row);
  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
}
