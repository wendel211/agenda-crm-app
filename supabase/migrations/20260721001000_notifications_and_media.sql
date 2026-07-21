-- =============================================================
-- Agenda CRM — notificações e mídia (aplicada após a migration de baseline)
-- Notificações in-app, arquivar clientes, fotos e triggers de evento.
-- =============================================================

-- Arquivar clientes (some da lista e do agendamento, histórico preservado)
alter table public.clients add column if not exists archived boolean not null default false;

-- Fotos
alter table public.clients add column if not exists avatar_url text;
alter table public.businesses add column if not exists logo_url text;

-- -------------------------------------------------------------
-- Notificações in-app
-- -------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  title text not null,
  message text not null,
  kind text not null default 'sistema'
    check (kind in ('agendamento', 'lembrete', 'financeiro', 'sistema')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_by_business on public.notifications (business_id, created_at desc);

alter table public.notifications enable row level security;

create policy "owner manages notifications" on public.notifications
  for all using (public.owns_business(business_id))
  with check (public.owns_business(business_id));

-- Evento: novo agendamento criado
create function public.notify_appointment_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  client_name text;
begin
  select name into client_name from clients where id = new.client_id;
  insert into notifications (business_id, title, message, kind)
  values (
    new.business_id,
    'Novo agendamento',
    coalesce(client_name, 'Cliente') || ' — ' || to_char(new.date, 'DD/MM') || ' às ' || to_char(new.start_time, 'HH24:MI'),
    'agendamento'
  );
  return new;
end;
$$;

create trigger on_appointment_created
  after insert on public.appointments
  for each row execute function public.notify_appointment_created();

-- Evento: atendimento concluído (receita lançada)
create function public.notify_appointment_completed() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  client_name text;
begin
  if new.status = 'concluido' and old.status is distinct from 'concluido' then
    select name into client_name from clients where id = new.client_id;
    insert into notifications (business_id, title, message, kind)
    values (
      new.business_id,
      'Receita lançada',
      'Atendimento de ' || coalesce(client_name, 'cliente') || ' concluído: R$ ' || to_char(new.price, 'FM999G999D00'),
      'financeiro'
    );
  end if;
  return new;
end;
$$;

create trigger on_appointment_completed_notify
  after update of status on public.appointments
  for each row execute function public.notify_appointment_completed();

-- -------------------------------------------------------------
-- Storage: fotos de clientes e logo (bucket público para leitura)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars are publicly readable" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "authenticated users upload avatars" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars');

create policy "authenticated users update avatars" on storage.objects
  for update to authenticated using (bucket_id = 'avatars');
