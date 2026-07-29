begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (id, email)
values
  ('11000000-0000-0000-0000-000000000001', 'owner-s2@test.local'),
  ('11000000-0000-0000-0000-000000000002', 'admin-s2@test.local'),
  ('11000000-0000-0000-0000-000000000003', 'reception-s2@test.local'),
  ('11000000-0000-0000-0000-000000000004', 'pro-s2@test.local'),
  ('11000000-0000-0000-0000-000000000005', 'revoked-s2@test.local');

insert into public.businesses (id, owner_id, name, schedule)
values (
  '21000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  'Studio Sprint 2',
  '[]'
);

insert into public.team_members (id, business_id, name)
values
  (
    '31000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    'Profissional 1'
  ),
  (
    '31000000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000001',
    'Profissional 2'
  );

insert into public.business_members (
  business_id,
  user_id,
  professional_id,
  display_name,
  email,
  role,
  status
)
values
  (
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    null,
    'Dono',
    'owner-s2@test.local',
    'owner',
    'active'
  ),
  (
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000002',
    null,
    'Admin',
    'admin-s2@test.local',
    'admin',
    'active'
  ),
  (
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000003',
    null,
    'Recepção',
    'reception-s2@test.local',
    'receptionist',
    'active'
  ),
  (
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000004',
    '31000000-0000-0000-0000-000000000001',
    'Profissional',
    'pro-s2@test.local',
    'professional',
    'active'
  ),
  (
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000005',
    '31000000-0000-0000-0000-000000000002',
    'Revogado',
    'revoked-s2@test.local',
    'professional',
    'revoked'
  );

insert into public.notifications (
  business_id,
  professional_id,
  title,
  message,
  kind
)
values
  (
    '21000000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000001',
    'Agenda',
    'Notificação operacional',
    'agendamento'
  ),
  (
    '21000000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000001',
    'Financeiro',
    'Notificação financeira',
    'financeiro'
  );

select has_function(
  'public',
  'create_business_atomic',
  array['text', 'text[]', 'jsonb', 'text', 'text[]', 'text[]'],
  'atomic onboarding RPC exists'
);

set local role authenticated;

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}';
set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000001';
select ok(
  public.has_business_role(
    '21000000-0000-0000-0000-000000000001',
    array['owner']
  ),
  'owner has owner role'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}';
set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000002';
select ok(
  public.has_business_role(
    '21000000-0000-0000-0000-000000000001',
    array['admin']
  ),
  'admin has administrative role'
);
select ok(
  public.can_manage_professional(
    '21000000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000002'
  ),
  'admin can manage any professional agenda'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000003","role":"authenticated"}';
set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000003';
select ok(
  public.can_manage_professional(
    '21000000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000001'
  ),
  'reception can manage professional agendas'
);
select is(
  (select count(*)::integer from public.transactions),
  0,
  'reception cannot read finance through RLS'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000004","role":"authenticated"}';
set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000004';
select ok(
  public.can_manage_professional(
    '21000000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000001'
  ),
  'professional can manage the assigned agenda'
);
select ok(
  not public.can_manage_professional(
    '21000000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000002'
  ),
  'professional cannot manage another agenda'
);
select ok(
  not public.has_business_role(
    '21000000-0000-0000-0000-000000000001',
    array['owner', 'admin']
  ),
  'professional has no administrative role'
);
select is(
  (select count(*)::integer from public.notifications),
  1,
  'professional sees only operational notifications from the assigned agenda'
);
select is(
  (select count(*)::integer from public.notifications where kind = 'financeiro'),
  0,
  'professional cannot read financial notifications'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000005","role":"authenticated"}';
set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000005';
select ok(
  not public.has_business_access('21000000-0000-0000-0000-000000000001'),
  'revoked member loses access immediately'
);
select is(
  (select count(*)::integer from public.team_members),
  0,
  'revoked member cannot read the team through RLS'
);

reset role;
set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}';
set local "request.jwt.claim.sub" = '11000000-0000-0000-0000-000000000001';
select lives_ok(
  $$
    select public.update_business_member_access(
      (
        select id
        from public.business_members
        where user_id = '11000000-0000-0000-0000-000000000003'
      ),
      'admin',
      true
    )
  $$,
  'owner can promote a member'
);
select is(
  (
    select role
    from public.business_members
    where user_id = '11000000-0000-0000-0000-000000000003'
  ),
  'admin',
  'member promotion is persisted'
);
select throws_ok(
  $$
    select public.update_business_member_access(
      (
        select id
        from public.business_members
        where user_id = '11000000-0000-0000-0000-000000000001'
      ),
      'admin',
      true
    )
  $$,
  '42501',
  'O proprietário não pode ser alterado.',
  'owner role cannot be downgraded'
);

select * from finish();
rollback;
