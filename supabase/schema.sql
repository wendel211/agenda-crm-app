-- =============================================================
-- Agenda CRM — schema inicial
-- Execute no SQL Editor do Supabase (ou via supabase db push).
-- =============================================================

create extension if not exists btree_gist;

-- Tipo range para horários (Postgres não traz um nativo para "time").
create type public.timerange as range (subtype = time);

-- -------------------------------------------------------------
-- Negócio (1 por usuário no MVP)
-- -------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  segments text[] not null default '{}',
  -- horários por dia da semana: [{"day":"Segunda","open":true,"from":"09:00","to":"19:00"}, ...]
  schedule jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  role text not null default 'Profissional',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  birthday date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2) not null default 0 check (price >= 0),
  color text not null default '#6C5CE7',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  professional_id uuid not null references public.team_members (id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null check (end_time > start_time),
  price numeric(10, 2) not null default 0,
  status text not null default 'agendado'
    check (status in ('agendado', 'confirmado', 'concluido', 'cancelado', 'faltou')),
  notes text,
  created_at timestamptz not null default now(),
  -- Regra de negócio: um profissional não atende duas pessoas ao mesmo tempo.
  -- Cancelamentos e faltas liberam o horário.
  constraint no_overlapping_appointments exclude using gist (
    professional_id with =,
    date with =,
    timerange(start_time, end_time) with &&
  ) where (status in ('agendado', 'confirmado'))
);

create index appointments_by_day on public.appointments (business_id, date);

create table public.appointment_services (
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  primary key (appointment_id, service_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  kind text not null check (kind in ('receita', 'despesa')),
  description text not null,
  category text not null default 'Outros',
  amount numeric(10, 2) not null check (amount > 0),
  date date not null default current_date,
  appointment_id uuid references public.appointments (id) on delete set null,
  created_at timestamptz not null default now()
);

create index transactions_by_day on public.transactions (business_id, date);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  title text not null,
  kind text not null default 'profissional' check (kind in ('pessoal', 'profissional')),
  target numeric(12, 2) not null check (target > 0),
  current numeric(12, 2) not null default 0,
  unit text not null default 'BRL' check (unit in ('BRL', 'atendimentos')),
  deadline date not null,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Row Level Security: cada usuário enxerga apenas o próprio negócio
-- -------------------------------------------------------------
alter table public.businesses enable row level security;
alter table public.team_members enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;

create policy "owner manages business" on public.businesses
  for all using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Função auxiliar para as tabelas filhas.
create function public.owns_business(business uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from businesses where id = business and owner_id = auth.uid()
  );
$$;

create policy "owner manages team" on public.team_members
  for all using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "owner manages clients" on public.clients
  for all using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "owner manages services" on public.services
  for all using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "owner manages appointments" on public.appointments
  for all using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "owner manages appointment services" on public.appointment_services
  for all using (
    exists (
      select 1 from appointments a
      where a.id = appointment_id and public.owns_business(a.business_id)
    )
  )
  with check (
    exists (
      select 1 from appointments a
      where a.id = appointment_id and public.owns_business(a.business_id)
    )
  );

create policy "owner manages transactions" on public.transactions
  for all using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

create policy "owner manages goals" on public.goals
  for all using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

-- -------------------------------------------------------------
-- Regra de negócio: concluir atendimento gera receita automaticamente
-- -------------------------------------------------------------
create function public.handle_appointment_completed() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  client_name text;
begin
  if new.status = 'concluido' and old.status is distinct from 'concluido' and new.price > 0 then
    select name into client_name from clients where id = new.client_id;
    insert into transactions (business_id, kind, description, category, amount, date, appointment_id)
    values (
      new.business_id,
      'receita',
      'Atendimento — ' || coalesce(client_name, 'cliente'),
      'Atendimento',
      new.price,
      new.date,
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger on_appointment_completed
  after update of status on public.appointments
  for each row execute function public.handle_appointment_completed();
