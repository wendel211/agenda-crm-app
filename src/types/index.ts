/** Tipos de domínio do CRM — espelham as tabelas do Supabase em camelCase. */

export interface DaySchedule {
  day: string;
  open: boolean;
  from: string;
  to: string;
}

export interface Business {
  id: string;
  name: string;
  segments: string[];
  schedule: DaySchedule[];
  logoUrl?: string;
}

export type BusinessRole = 'owner' | 'admin' | 'receptionist' | 'professional';

export interface BusinessMembership {
  id: string;
  role: BusinessRole;
  professionalId?: string;
}

export type AppointmentStatus = 'agendado' | 'confirmado' | 'concluido' | 'cancelado' | 'faltou';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  notes?: string;
  archived: boolean;
  avatarUrl?: string;
}

/** Cliente com agregados de histórico (visitas, total gasto, última visita). */
export interface ClientWithStats extends Client {
  visits: number;
  totalSpent: number;
  lastVisit?: string;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  color: string;
  active: boolean;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceIds: string[];
  serviceNames: string[];
  professionalId: string;
  professionalName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: AppointmentStatus;
  notes?: string;
}

export type TransactionKind = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  kind: TransactionKind;
  description: string;
  category: string;
  amount: number;
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  kind: 'pessoal' | 'profissional';
  target: number;
  current: number;
  unit: 'BRL' | 'atendimentos';
  deadline: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

export type MemberStatus = 'invited' | 'active' | 'revoked';

export interface TeamAccess {
  membershipId: string;
  professionalId?: string;
  name: string;
  email?: string;
  role: BusinessRole;
  status: MemberStatus;
}
