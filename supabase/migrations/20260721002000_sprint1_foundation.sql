-- Sprint 1: atomic appointment writes and idempotent financial reconciliation.

-- A transaction generated from an appointment is unique by definition.
-- Keep the oldest row if a previous trigger produced duplicates.
with duplicates as (
  select
    id,
    row_number() over (partition by appointment_id order by created_at, id) as position
  from public.transactions
  where appointment_id is not null
)
delete from public.transactions as transaction
using duplicates
where transaction.id = duplicates.id
  and duplicates.position > 1;

create unique index if not exists transactions_one_per_appointment
  on public.transactions (appointment_id)
  where appointment_id is not null;

-- Keep generated revenue synchronized with the appointment. Replaying the same
-- status update updates the existing row instead of creating a duplicate.
create or replace function public.sync_appointment_transaction() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  client_name text;
begin
  if new.status = 'concluido' and new.price > 0 then
    select name into client_name from public.clients where id = new.client_id;

    insert into public.transactions (
      business_id,
      kind,
      description,
      category,
      amount,
      date,
      appointment_id
    )
    values (
      new.business_id,
      'receita',
      'Atendimento — ' || coalesce(client_name, 'cliente'),
      'Atendimento',
      new.price,
      new.date,
      new.id
    )
    on conflict (appointment_id) where appointment_id is not null
    do update set
      business_id = excluded.business_id,
      kind = excluded.kind,
      description = excluded.description,
      category = excluded.category,
      amount = excluded.amount,
      date = excluded.date;
  else
    delete from public.transactions where appointment_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_appointment_completed on public.appointments;
drop trigger if exists on_appointment_financial_sync on public.appointments;
create trigger on_appointment_financial_sync
  after insert or update of status, price, client_id, date on public.appointments
  for each row execute function public.sync_appointment_transaction();

-- Reconcile existing data while adopting the idempotent trigger.
insert into public.transactions (
  business_id,
  kind,
  description,
  category,
  amount,
  date,
  appointment_id
)
select
  appointment.business_id,
  'receita',
  'Atendimento — ' || client.name,
  'Atendimento',
  appointment.price,
  appointment.date,
  appointment.id
from public.appointments as appointment
join public.clients as client on client.id = appointment.client_id
where appointment.status = 'concluido'
  and appointment.price > 0
on conflict (appointment_id) where appointment_id is not null
do update set
  business_id = excluded.business_id,
  kind = excluded.kind,
  description = excluded.description,
  category = excluded.category,
  amount = excluded.amount,
  date = excluded.date;

delete from public.transactions as transaction
using public.appointments as appointment
where transaction.appointment_id = appointment.id
  and (appointment.status <> 'concluido' or appointment.price <= 0);

create or replace function public.validate_appointment_relations(
  requested_business_id uuid,
  requested_client_id uuid,
  requested_professional_id uuid,
  requested_service_ids uuid[]
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.owns_business(requested_business_id) then
    raise exception using
      errcode = '42501',
      message = 'Você não tem acesso a este negócio.';
  end if;

  if not exists (
    select 1 from public.clients
    where id = requested_client_id
      and business_id = requested_business_id
      and archived = false
  ) then
    raise exception using errcode = '23514', message = 'Cliente inválido para este negócio.';
  end if;

  if not exists (
    select 1 from public.team_members
    where id = requested_professional_id
      and business_id = requested_business_id
      and active = true
  ) then
    raise exception using errcode = '23514', message = 'Profissional inválido para este negócio.';
  end if;

  if coalesce(cardinality(requested_service_ids), 0) = 0 then
    raise exception using errcode = '23514', message = 'Selecione ao menos um serviço.';
  end if;

  if exists (
    select 1
    from unnest(requested_service_ids) as requested(service_id)
    left join public.services as service on service.id = requested.service_id
    where service.id is null
       or service.business_id <> requested_business_id
       or service.active = false
  ) then
    raise exception using errcode = '23514', message = 'Serviço inválido para este negócio.';
  end if;
end;
$$;

create or replace function public.create_appointment_atomic(
  p_business_id uuid,
  p_client_id uuid,
  p_professional_id uuid,
  p_service_ids uuid[],
  p_date date,
  p_start_time time,
  p_end_time time,
  p_price numeric,
  p_notes text default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  created_id uuid;
begin
  perform public.validate_appointment_relations(
    p_business_id,
    p_client_id,
    p_professional_id,
    p_service_ids
  );

  insert into public.appointments (
    business_id,
    client_id,
    professional_id,
    date,
    start_time,
    end_time,
    price,
    notes
  ) values (
    p_business_id,
    p_client_id,
    p_professional_id,
    p_date,
    p_start_time,
    p_end_time,
    p_price,
    nullif(trim(p_notes), '')
  ) returning id into created_id;

  insert into public.appointment_services (appointment_id, service_id)
  select created_id, service_id
  from (select distinct unnest(p_service_ids) as service_id) as selected;

  return created_id;
end;
$$;

create or replace function public.update_appointment_atomic(
  p_appointment_id uuid,
  p_business_id uuid,
  p_client_id uuid,
  p_professional_id uuid,
  p_service_ids uuid[],
  p_date date,
  p_start_time time,
  p_end_time time,
  p_price numeric,
  p_notes text default null
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  stored_business_id uuid;
begin
  select business_id into stored_business_id
  from public.appointments
  where id = p_appointment_id
  for update;

  if stored_business_id is null or stored_business_id <> p_business_id then
    raise exception using errcode = 'P0002', message = 'Agendamento não encontrado.';
  end if;

  perform public.validate_appointment_relations(
    p_business_id,
    p_client_id,
    p_professional_id,
    p_service_ids
  );

  update public.appointments set
    client_id = p_client_id,
    professional_id = p_professional_id,
    date = p_date,
    start_time = p_start_time,
    end_time = p_end_time,
    price = p_price,
    notes = nullif(trim(p_notes), '')
  where id = p_appointment_id;

  delete from public.appointment_services where appointment_id = p_appointment_id;
  insert into public.appointment_services (appointment_id, service_id)
  select p_appointment_id, service_id
  from (select distinct unnest(p_service_ids) as service_id) as selected;
end;
$$;

create or replace function public.set_appointment_status(
  p_appointment_id uuid,
  p_status text
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  stored_business_id uuid;
begin
  if p_status not in ('agendado', 'confirmado', 'concluido', 'cancelado', 'faltou') then
    raise exception using errcode = '23514', message = 'Status de agendamento inválido.';
  end if;

  select business_id into stored_business_id
  from public.appointments
  where id = p_appointment_id
  for update;

  if stored_business_id is null then
    raise exception using errcode = 'P0002', message = 'Agendamento não encontrado.';
  end if;

  if not public.owns_business(stored_business_id) then
    raise exception using errcode = '42501', message = 'Você não tem acesso a este agendamento.';
  end if;

  update public.appointments set status = p_status where id = p_appointment_id;
end;
$$;

-- Tighten the junction policy: the selected service must belong to the same
-- business as the appointment, even if writes happen outside the app.
drop policy if exists "owner manages appointment services" on public.appointment_services;
create policy "owner manages appointment services" on public.appointment_services
  for all using (
    exists (
      select 1
      from public.appointments as appointment
      join public.services as service on service.id = appointment_services.service_id
      where appointment.id = appointment_services.appointment_id
        and appointment.business_id = service.business_id
        and public.owns_business(appointment.business_id)
    )
  )
  with check (
    exists (
      select 1
      from public.appointments as appointment
      join public.services as service on service.id = appointment_services.service_id
      where appointment.id = appointment_services.appointment_id
        and appointment.business_id = service.business_id
        and public.owns_business(appointment.business_id)
    )
  );

revoke all on function public.validate_appointment_relations(uuid, uuid, uuid, uuid[]) from public;
revoke all on function public.create_appointment_atomic(uuid, uuid, uuid, uuid[], date, time, time, numeric, text) from public;
revoke all on function public.update_appointment_atomic(uuid, uuid, uuid, uuid, uuid[], date, time, time, numeric, text) from public;
revoke all on function public.set_appointment_status(uuid, text) from public;

grant execute on function public.create_appointment_atomic(uuid, uuid, uuid, uuid[], date, time, time, numeric, text) to authenticated;
grant execute on function public.update_appointment_atomic(uuid, uuid, uuid, uuid, uuid[], date, time, time, numeric, text) to authenticated;
grant execute on function public.set_appointment_status(uuid, text) to authenticated;

-- Appointments can only be changed through the validated transactional RPCs.
revoke insert, update, delete on public.appointments from anon, authenticated;
revoke insert, update, delete on public.appointment_services from anon, authenticated;

grant select, insert, update, delete on public.businesses to authenticated;
grant select, insert, update, delete on public.team_members to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select on public.appointments to authenticated;
grant select on public.appointment_services to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;
