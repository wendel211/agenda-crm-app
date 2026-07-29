-- Sprint 2: multi-user business access, role-based authorization, invitations,
-- atomic onboarding, tenant-scoped media writes and remote push tokens.

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  professional_id uuid references public.team_members (id) on delete set null,
  display_name text not null,
  email text,
  role text not null check (role in ('owner', 'admin', 'receptionist', 'professional')),
  status text not null default 'invited' check (status in ('invited', 'active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id),
  unique (professional_id)
);

create index business_members_by_user
  on public.business_members (user_id, status, business_id);

create table public.business_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  business_member_id uuid not null references public.business_members (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'receptionist', 'professional')),
  invited_by uuid not null references auth.users (id) on delete cascade,
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  accepted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create unique index business_invitations_one_pending
  on public.business_invitations (business_id, lower(email))
  where accepted_at is null and revoked_at is null;

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  updated_at timestamptz not null default now()
);

create index push_tokens_by_business on public.push_tokens (business_id);

alter table public.notifications
  add column professional_id uuid references public.team_members (id) on delete set null;

-- Existing owners become active members without changing their current data.
insert into public.business_members (
  business_id,
  user_id,
  professional_id,
  display_name,
  email,
  role,
  status
)
select
  business.id,
  business.owner_id,
  owner_professional.id,
  coalesce(owner_professional.name, auth_user.raw_user_meta_data ->> 'full_name', 'Proprietário(a)'),
  auth_user.email,
  'owner',
  'active'
from public.businesses as business
join auth.users as auth_user on auth_user.id = business.owner_id
left join lateral (
  select team_member.id, team_member.name
  from public.team_members as team_member
  where team_member.business_id = business.id
  order by
    case when lower(team_member.role) like 'propriet%' then 0 else 1 end,
    team_member.created_at
  limit 1
) as owner_professional on true
on conflict (business_id, user_id) do nothing;

create or replace function public.has_business_access(requested_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.businesses as business
    where business.id = requested_business_id
      and business.owner_id = (select auth.uid())
  ) or exists (
    select 1
    from public.business_members as member
    where member.business_id = requested_business_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
  );
$$;

create or replace function public.has_business_role(
  requested_business_id uuid,
  requested_roles text[]
) returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select (
    'owner' = any(requested_roles)
    and exists (
      select 1
      from public.businesses as business
      where business.id = requested_business_id
        and business.owner_id = (select auth.uid())
    )
  ) or exists (
    select 1
    from public.business_members as member
    where member.business_id = requested_business_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role = any(requested_roles)
  );
$$;

create or replace function public.is_assigned_professional(
  requested_business_id uuid,
  requested_professional_id uuid
) returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.business_members as member
    where member.business_id = requested_business_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role = 'professional'
      and member.professional_id = requested_professional_id
  );
$$;

-- Keep Sprint 1 RPCs compatible while broadening access beyond the owner.
create or replace function public.owns_business(business uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.has_business_access(business);
$$;

create or replace function public.get_my_business_context()
returns table (
  id uuid,
  name text,
  segments text[],
  schedule jsonb,
  logo_url text,
  membership_id uuid,
  membership_role text,
  professional_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.business_members
  set status = 'active', updated_at = now()
  where business_members.user_id = (select auth.uid())
    and business_members.status = 'invited'
    and exists (
      select 1
      from public.business_invitations as invitation
      where invitation.business_member_id = business_members.id
        and invitation.revoked_at is null
        and invitation.accepted_at is null
        and invitation.expires_at > now()
    );

  update public.business_invitations as invitation
  set accepted_at = coalesce(invitation.accepted_at, now())
  where invitation.auth_user_id = (select auth.uid())
    and invitation.revoked_at is null
    and invitation.accepted_at is null
    and invitation.expires_at > now();

  return query
  select
    business.id,
    business.name,
    business.segments,
    business.schedule,
    business.logo_url,
    member.id,
    member.role,
    member.professional_id
  from public.business_members as member
  join public.businesses as business on business.id = member.business_id
  where member.user_id = (select auth.uid())
    and member.status = 'active'
  order by
    case when member.role = 'owner' then 0 else 1 end,
    member.created_at
  limit 1;
end;
$$;

create or replace function public.create_business_atomic(
  p_name text,
  p_segments text[],
  p_schedule jsonb,
  p_owner_name text,
  p_service_names text[],
  p_service_colors text[]
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  created_business_id uuid;
  created_professional_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Sessão inválida.';
  end if;
  if nullif(trim(p_name), '') is null then
    raise exception using errcode = '23514', message = 'Informe o nome do negócio.';
  end if;
  if exists (
    select 1 from public.businesses where owner_id = (select auth.uid())
  ) then
    raise exception using errcode = '23505', message = 'Este usuário já possui um negócio.';
  end if;
  if cardinality(p_service_names) <> cardinality(p_service_colors) then
    raise exception using errcode = '23514', message = 'Serviços e cores estão inconsistentes.';
  end if;

  insert into public.businesses (owner_id, name, segments, schedule)
  values (
    (select auth.uid()),
    trim(p_name),
    coalesce(p_segments, '{}'),
    coalesce(p_schedule, '[]'::jsonb)
  )
  returning id into created_business_id;

  insert into public.team_members (business_id, name, role)
  values (
    created_business_id,
    coalesce(nullif(trim(p_owner_name), ''), 'Proprietário(a)'),
    'Proprietário(a)'
  )
  returning id into created_professional_id;

  insert into public.business_members (
    business_id,
    user_id,
    professional_id,
    display_name,
    email,
    role,
    status
  )
  select
    created_business_id,
    auth_user.id,
    created_professional_id,
    coalesce(nullif(trim(p_owner_name), ''), 'Proprietário(a)'),
    auth_user.email,
    'owner',
    'active'
  from auth.users as auth_user
  where auth_user.id = (select auth.uid());

  insert into public.services (
    business_id,
    name,
    duration_minutes,
    price,
    color
  )
  select
    created_business_id,
    trim(service.name),
    60,
    0,
    service.color
  from unnest(
    coalesce(p_service_names, '{}'),
    coalesce(p_service_colors, '{}')
  ) as service(name, color)
  where nullif(trim(service.name), '') is not null;

  return created_business_id;
end;
$$;

create or replace function public.admin_create_business_invitation(
  p_business_id uuid,
  p_email text,
  p_display_name text,
  p_role text,
  p_auth_user_id uuid,
  p_invited_by uuid
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  created_professional_id uuid;
  created_member_id uuid;
  created_invitation_id uuid;
begin
  if p_role not in ('admin', 'receptionist', 'professional') then
    raise exception using errcode = '23514', message = 'Papel inválido.';
  end if;
  if not exists (
    select 1
    from public.business_members
    where business_id = p_business_id
      and user_id = p_invited_by
      and status = 'active'
      and role in ('owner', 'admin')
  ) then
    raise exception using errcode = '42501', message = 'Sem permissão para convidar.';
  end if;

  update public.business_invitations
  set revoked_at = now()
  where business_id = p_business_id
    and lower(email) = lower(trim(p_email))
    and accepted_at is null
    and revoked_at is null
    and expires_at <= now();

  if exists (
    select 1
    from public.business_invitations
    where business_id = p_business_id
      and lower(email) = lower(trim(p_email))
      and accepted_at is null
      and revoked_at is null
  ) then
    raise exception using errcode = '23505', message = 'Já existe um convite pendente para este e-mail.';
  end if;

  if p_role = 'professional' then
    select professional_id into created_professional_id
    from public.business_members
    where business_id = p_business_id and user_id = p_auth_user_id;

    if created_professional_id is null then
      insert into public.team_members (business_id, name, role)
      values (
        p_business_id,
        coalesce(nullif(trim(p_display_name), ''), split_part(p_email, '@', 1)),
        'Profissional'
      )
      returning id into created_professional_id;
    end if;
  end if;

  insert into public.business_members (
    business_id,
    user_id,
    professional_id,
    display_name,
    email,
    role,
    status
  ) values (
    p_business_id,
    p_auth_user_id,
    created_professional_id,
    coalesce(nullif(trim(p_display_name), ''), split_part(p_email, '@', 1)),
    lower(trim(p_email)),
    p_role,
    'invited'
  )
  on conflict (business_id, user_id) do update set
    professional_id = coalesce(excluded.professional_id, business_members.professional_id),
    display_name = excluded.display_name,
    email = excluded.email,
    role = excluded.role,
    status = case
      when business_members.status = 'active' then 'active'
      else 'invited'
    end,
    updated_at = now()
  returning id into created_member_id;

  insert into public.business_invitations (
    business_id,
    business_member_id,
    email,
    role,
    invited_by,
    auth_user_id
  ) values (
    p_business_id,
    created_member_id,
    lower(trim(p_email)),
    p_role,
    p_invited_by,
    p_auth_user_id
  )
  returning id into created_invitation_id;

  return created_invitation_id;
end;
$$;

create or replace function public.update_business_member_access(
  p_member_id uuid,
  p_role text,
  p_active boolean
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_business_id uuid;
  target_professional_id uuid;
  target_current_role text;
begin
  select business_id, professional_id, role
  into target_business_id, target_professional_id, target_current_role
  from public.business_members
  where id = p_member_id
  for update;

  if target_business_id is null then
    raise exception using errcode = 'P0002', message = 'Membro não encontrado.';
  end if;
  if not public.has_business_role(target_business_id, array['owner', 'admin']) then
    raise exception using errcode = '42501', message = 'Sem permissão para editar a equipe.';
  end if;
  if target_current_role = 'owner' then
    raise exception using errcode = '42501', message = 'O proprietário não pode ser alterado.';
  end if;
  if p_role not in ('admin', 'receptionist', 'professional') then
    raise exception using errcode = '23514', message = 'Papel inválido.';
  end if;
  if p_role = 'professional' and target_professional_id is null then
    insert into public.team_members (business_id, name, role)
    select target_business_id, display_name, 'Profissional'
    from public.business_members
    where id = p_member_id
    returning id into target_professional_id;
  end if;

  update public.business_members
  set
    role = p_role,
    professional_id = target_professional_id,
    status = case when p_active then 'active' else 'revoked' end,
    updated_at = now()
  where id = p_member_id;

  if target_professional_id is not null then
    update public.team_members
    set active = p_active
    where id = target_professional_id;
  end if;

  if not p_active then
    update public.business_invitations
    set revoked_at = coalesce(revoked_at, now())
    where business_member_id = p_member_id
      and accepted_at is null;
  end if;
end;
$$;

-- Professional accounts can only operate on their own agenda. Managers and
-- reception can operate on any active professional from the business.
create or replace function public.can_manage_professional(
  requested_business_id uuid,
  requested_professional_id uuid
) returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    public.has_business_role(
      requested_business_id,
      array['owner', 'admin', 'receptionist']
    )
    or public.is_assigned_professional(
      requested_business_id,
      requested_professional_id
    );
$$;

create or replace function public.validate_appointment_relations(
  requested_business_id uuid,
  requested_client_id uuid,
  requested_professional_id uuid,
  requested_service_ids uuid[]
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.can_manage_professional(
    requested_business_id,
    requested_professional_id
  ) then
    raise exception using
      errcode = '42501',
      message = 'Você não tem acesso à agenda deste profissional.';
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
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  stored_business_id uuid;
  stored_professional_id uuid;
begin
  select business_id, professional_id
  into stored_business_id, stored_professional_id
  from public.appointments
  where id = p_appointment_id
  for update;

  if stored_business_id is null or stored_business_id <> p_business_id then
    raise exception using errcode = 'P0002', message = 'Agendamento não encontrado.';
  end if;
  if not public.can_manage_professional(stored_business_id, stored_professional_id) then
    raise exception using errcode = '42501', message = 'Você não tem acesso a este agendamento.';
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
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  stored_business_id uuid;
  stored_professional_id uuid;
begin
  if p_status not in ('agendado', 'confirmado', 'concluido', 'cancelado', 'faltou') then
    raise exception using errcode = '23514', message = 'Status de agendamento inválido.';
  end if;

  select business_id, professional_id
  into stored_business_id, stored_professional_id
  from public.appointments
  where id = p_appointment_id
  for update;

  if stored_business_id is null then
    raise exception using errcode = 'P0002', message = 'Agendamento não encontrado.';
  end if;
  if not public.can_manage_professional(stored_business_id, stored_professional_id) then
    raise exception using errcode = '42501', message = 'Você não tem acesso a este agendamento.';
  end if;

  update public.appointments set status = p_status where id = p_appointment_id;
end;
$$;

create or replace function public.notify_appointment_created() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  client_name text;
begin
  select name into client_name from public.clients where id = new.client_id;
  insert into public.notifications (
    business_id,
    professional_id,
    title,
    message,
    kind
  )
  values (
    new.business_id,
    new.professional_id,
    'Novo agendamento',
    coalesce(client_name, 'Cliente') || ' — ' || to_char(new.date, 'DD/MM') || ' às ' || to_char(new.start_time, 'HH24:MI'),
    'agendamento'
  );
  return new;
end;
$$;

create or replace function public.notify_appointment_completed() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  client_name text;
begin
  if new.status = 'concluido' and old.status is distinct from 'concluido' then
    select name into client_name from public.clients where id = new.client_id;
    insert into public.notifications (
      business_id,
      professional_id,
      title,
      message,
      kind
    )
    values (
      new.business_id,
      new.professional_id,
      'Receita lançada',
      'Atendimento de ' || coalesce(client_name, 'cliente') || ' concluído: R$ ' || to_char(new.price, 'FM999G999D00'),
      'financeiro'
    );
  end if;
  return new;
end;
$$;

alter table public.business_members enable row level security;
alter table public.business_invitations enable row level security;
alter table public.push_tokens enable row level security;

drop policy if exists "owner manages business" on public.businesses;
create policy "members read business" on public.businesses
  for select using (public.has_business_access(id));
create policy "managers update business" on public.businesses
  for update using (public.has_business_role(id, array['owner', 'admin']))
  with check (public.has_business_role(id, array['owner', 'admin']));
create policy "owner deletes business" on public.businesses
  for delete using (public.has_business_role(id, array['owner']));

create policy "members read memberships" on public.business_members
  for select using (
    user_id = (select auth.uid())
    or public.has_business_role(business_id, array['owner', 'admin'])
  );

create policy "managers read invitations" on public.business_invitations
  for select using (
    public.has_business_role(business_id, array['owner', 'admin'])
    or auth_user_id = (select auth.uid())
  );

drop policy if exists "owner manages team" on public.team_members;
create policy "members read team" on public.team_members
  for select using (public.has_business_access(business_id));
create policy "managers create team" on public.team_members
  for insert with check (public.has_business_role(business_id, array['owner', 'admin']));
create policy "managers update team" on public.team_members
  for update using (public.has_business_role(business_id, array['owner', 'admin']))
  with check (public.has_business_role(business_id, array['owner', 'admin']));
create policy "managers delete team" on public.team_members
  for delete using (public.has_business_role(business_id, array['owner', 'admin']));

drop policy if exists "owner manages clients" on public.clients;
create policy "members manage clients" on public.clients
  for all using (public.has_business_access(business_id))
  with check (public.has_business_access(business_id));

drop policy if exists "owner manages services" on public.services;
create policy "members read services" on public.services
  for select using (public.has_business_access(business_id));
create policy "managers create services" on public.services
  for insert with check (public.has_business_role(business_id, array['owner', 'admin']));
create policy "managers update services" on public.services
  for update using (public.has_business_role(business_id, array['owner', 'admin']))
  with check (public.has_business_role(business_id, array['owner', 'admin']));
create policy "managers delete services" on public.services
  for delete using (public.has_business_role(business_id, array['owner', 'admin']));

drop policy if exists "owner manages appointments" on public.appointments;
create policy "authorized members read appointments" on public.appointments
  for select using (
    public.has_business_role(business_id, array['owner', 'admin', 'receptionist'])
    or public.is_assigned_professional(business_id, professional_id)
  );

drop policy if exists "owner manages appointment services" on public.appointment_services;
create policy "authorized members read appointment services" on public.appointment_services
  for select using (
    exists (
      select 1
      from public.appointments as appointment
      where appointment.id = appointment_id
        and (
          public.has_business_role(
            appointment.business_id,
            array['owner', 'admin', 'receptionist']
          )
          or public.is_assigned_professional(
            appointment.business_id,
            appointment.professional_id
          )
        )
    )
  );

drop policy if exists "owner manages transactions" on public.transactions;
create policy "managers manage transactions" on public.transactions
  for all using (public.has_business_role(business_id, array['owner', 'admin']))
  with check (public.has_business_role(business_id, array['owner', 'admin']));

drop policy if exists "owner manages goals" on public.goals;
create policy "managers manage goals" on public.goals
  for all using (public.has_business_role(business_id, array['owner', 'admin']))
  with check (public.has_business_role(business_id, array['owner', 'admin']));

drop policy if exists "owner manages notifications" on public.notifications;
create policy "authorized members read notifications" on public.notifications
  for select using (
    public.has_business_role(business_id, array['owner', 'admin', 'receptionist'])
    or (
      kind <> 'financeiro'
      and professional_id is not null
      and public.is_assigned_professional(business_id, professional_id)
    )
  );
create policy "authorized members update notifications" on public.notifications
  for update using (
    public.has_business_role(business_id, array['owner', 'admin', 'receptionist'])
    or (
      kind <> 'financeiro'
      and professional_id is not null
      and public.is_assigned_professional(business_id, professional_id)
    )
  )
  with check (
    public.has_business_role(business_id, array['owner', 'admin', 'receptionist'])
    or (
      kind <> 'financeiro'
      and professional_id is not null
      and public.is_assigned_professional(business_id, professional_id)
    )
  );

create policy "users manage their push tokens" on public.push_tokens
  for all using (
    user_id = (select auth.uid()) and public.has_business_access(business_id)
  )
  with check (
    user_id = (select auth.uid()) and public.has_business_access(business_id)
  );

drop policy if exists "authenticated users upload avatars" on storage.objects;
drop policy if exists "authenticated users update avatars" on storage.objects;
create policy "members upload tenant avatars" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and exists (
      select 1
      from public.businesses as business
      where business.id::text = (storage.foldername(name))[1]
        and public.has_business_access(business.id)
    )
  );
create policy "members update tenant avatars" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and exists (
      select 1
      from public.businesses as business
      where business.id::text = (storage.foldername(name))[1]
        and public.has_business_access(business.id)
    )
  )
  with check (
    bucket_id = 'avatars'
    and exists (
      select 1
      from public.businesses as business
      where business.id::text = (storage.foldername(name))[1]
        and public.has_business_access(business.id)
    )
  );
create policy "members delete tenant avatars" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and exists (
      select 1
      from public.businesses as business
      where business.id::text = (storage.foldername(name))[1]
        and public.has_business_access(business.id)
    )
  );

revoke all on function public.has_business_access(uuid) from public;
revoke all on function public.has_business_role(uuid, text[]) from public;
revoke all on function public.is_assigned_professional(uuid, uuid) from public;
revoke all on function public.can_manage_professional(uuid, uuid) from public;
revoke all on function public.get_my_business_context() from public;
revoke all on function public.create_business_atomic(text, text[], jsonb, text, text[], text[]) from public;
revoke all on function public.admin_create_business_invitation(uuid, text, text, text, uuid, uuid) from public;
revoke all on function public.update_business_member_access(uuid, text, boolean) from public;

grant execute on function public.has_business_access(uuid) to authenticated;
grant execute on function public.has_business_role(uuid, text[]) to authenticated;
grant execute on function public.is_assigned_professional(uuid, uuid) to authenticated;
grant execute on function public.can_manage_professional(uuid, uuid) to authenticated;
grant execute on function public.get_my_business_context() to authenticated;
grant execute on function public.create_business_atomic(text, text[], jsonb, text, text[], text[]) to authenticated;
grant execute on function public.admin_create_business_invitation(uuid, text, text, text, uuid, uuid) to service_role;
grant execute on function public.update_business_member_access(uuid, text, boolean) to authenticated;

grant select on public.business_members to authenticated;
grant select on public.business_invitations to authenticated;
grant select, insert, update, delete on public.push_tokens to authenticated;
