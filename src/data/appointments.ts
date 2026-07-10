import { supabase } from '@/lib/supabase';
import type { Appointment, AppointmentStatus } from '@/types';

interface AppointmentRow {
  id: string;
  client_id: string;
  professional_id: string;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  status: AppointmentStatus;
  notes: string | null;
  clients: { name: string } | null;
  team_members: { name: string } | null;
  appointment_services: { service_id: string; services: { name: string } | null }[];
}

const COLUMNS = `
  id, client_id, professional_id, date, start_time, end_time, price, status, notes,
  clients (name),
  team_members (name),
  appointment_services (service_id, services (name))
`;

/** O Postgres devolve "09:00:00"; a UI usa "09:00". */
function trimTime(value: string): string {
  return value.slice(0, 5);
}

function mapAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.clients?.name ?? 'Cliente removido',
    professionalId: row.professional_id,
    professionalName: row.team_members?.name ?? '—',
    serviceIds: row.appointment_services.map((item) => item.service_id),
    serviceNames: row.appointment_services.map((item) => item.services?.name ?? 'Serviço removido'),
    date: row.date,
    startTime: trimTime(row.start_time),
    endTime: trimTime(row.end_time),
    price: Number(row.price),
    status: row.status,
    notes: row.notes ?? undefined,
  };
}

export async function listAppointmentsByDate(businessId: string, date: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(COLUMNS)
    .eq('business_id', businessId)
    .eq('date', date)
    .order('start_time');
  if (error) {
    throw new Error(error.message);
  }
  return (data as unknown as AppointmentRow[]).map(mapAppointment);
}

export async function listAppointmentsByClient(clientId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(COLUMNS)
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data as unknown as AppointmentRow[]).map(mapAppointment);
}

export async function listRecentAppointments(businessId: string, days: number): Promise<Appointment[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('appointments')
    .select(COLUMNS)
    .eq('business_id', businessId)
    .gte('date', sinceISO)
    .order('date', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data as unknown as AppointmentRow[]).map(mapAppointment);
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const { data, error } = await supabase.from('appointments').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? mapAppointment(data as unknown as AppointmentRow) : null;
}

/**
 * Intervalos ocupados de um profissional no dia (para desabilitar horários na UI).
 * `excludeId` ignora o próprio agendamento ao remarcar.
 */
export async function listBusyRanges(
  professionalId: string,
  date: string,
  excludeId?: string,
): Promise<{ start: string; end: string }[]> {
  let query = supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('professional_id', professionalId)
    .eq('date', date)
    .in('status', ['agendado', 'confirmado']);
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data.map((row) => ({ start: trimTime(row.start_time), end: trimTime(row.end_time) }));
}

interface CreateAppointmentInput {
  businessId: string;
  clientId: string;
  professionalId: string;
  serviceIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  notes?: string;
}

const OVERLAP_ERROR_CODE = '23P01';

export async function createAppointment(input: CreateAppointmentInput): Promise<void> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      business_id: input.businessId,
      client_id: input.clientId,
      professional_id: input.professionalId,
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      price: input.price,
      notes: input.notes || null,
    })
    .select('id')
    .single();
  if (error) {
    if (error.code === OVERLAP_ERROR_CODE) {
      throw new Error('Esse horário conflita com outro atendimento do profissional.');
    }
    throw new Error(error.message);
  }

  const { error: junctionError } = await supabase.from('appointment_services').insert(
    input.serviceIds.map((serviceId) => ({ appointment_id: data.id, service_id: serviceId })),
  );
  if (junctionError) {
    // Não deixa agendamento órfão de serviços.
    await supabase.from('appointments').delete().eq('id', data.id);
    throw new Error(junctionError.message);
  }
}

/** Remarcar/editar: atualiza o agendamento e substitui os serviços vinculados. */
export async function updateAppointment(id: string, input: CreateAppointmentInput): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({
      client_id: input.clientId,
      professional_id: input.professionalId,
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      price: input.price,
      notes: input.notes || null,
    })
    .eq('id', id);
  if (error) {
    if (error.code === OVERLAP_ERROR_CODE) {
      throw new Error('Esse horário conflita com outro atendimento do profissional.');
    }
    throw new Error(error.message);
  }

  const { error: clearError } = await supabase
    .from('appointment_services')
    .delete()
    .eq('appointment_id', id);
  if (clearError) {
    throw new Error(clearError.message);
  }
  const { error: junctionError } = await supabase.from('appointment_services').insert(
    input.serviceIds.map((serviceId) => ({ appointment_id: id, service_id: serviceId })),
  );
  if (junctionError) {
    throw new Error(junctionError.message);
  }
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}
