begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('10000000-0000-0000-0000-000000000002', 'other@test.local');

insert into public.businesses (id, owner_id, name, schedule)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Studio Teste',
    '[]'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Outro Studio',
    '[]'
  );

insert into public.team_members (id, business_id, name)
values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Profissional Teste'
);

insert into public.clients (id, business_id, name, phone)
values (
  '40000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Cliente Teste',
  '11999999999'
);

insert into public.services (id, business_id, name, duration_minutes, price)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Corte',
    30,
    100
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'Escova',
    30,
    50
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002',
    'Serviço externo',
    30,
    50
  );

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';

select has_function(
  'public',
  'create_appointment_atomic',
  array['uuid', 'uuid', 'uuid', 'uuid[]', 'date', 'time without time zone', 'time without time zone', 'numeric', 'text'],
  'atomic create RPC exists'
);

select lives_ok(
  $$
    select public.create_appointment_atomic(
      '20000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000001',
      array[
        '50000000-0000-0000-0000-000000000001'::uuid,
        '50000000-0000-0000-0000-000000000002'::uuid
      ],
      '2026-08-01',
      '09:00',
      '10:00',
      150,
      'Teste atômico'
    )
  $$,
  'appointment and services are created atomically'
);

select is(
  (
    select count(*)::integer
    from public.appointment_services
    where appointment_id = (
      select id from public.appointments
      where client_id = '40000000-0000-0000-0000-000000000001'
        and date = '2026-08-01'
    )
  ),
  2,
  'all selected services are linked'
);

select lives_ok(
  $$
    select public.set_appointment_status(
      (select id from public.appointments where date = '2026-08-01'),
      'concluido'
    )
  $$,
  'appointment can be completed'
);

select is(
  (select count(*)::integer from public.transactions where appointment_id is not null),
  1,
  'completion creates one financial transaction'
);

select lives_ok(
  $$
    select public.set_appointment_status(
      (select id from public.appointments where date = '2026-08-01'),
      'concluido'
    )
  $$,
  'replaying completion is safe'
);

select is(
  (select count(*)::integer from public.transactions where appointment_id is not null),
  1,
  'replayed completion does not duplicate revenue'
);

select lives_ok(
  $$
    select public.update_appointment_atomic(
      (select id from public.appointments where date = '2026-08-01'),
      '20000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000001',
      array['50000000-0000-0000-0000-000000000001'::uuid],
      '2026-08-01',
      '09:00',
      '09:30',
      175,
      null
    )
  $$,
  'completed appointment can be corrected atomically'
);

select is(
  (select amount from public.transactions where appointment_id is not null),
  175.00::numeric,
  'financial transaction follows the corrected price'
);

select lives_ok(
  $$
    select public.set_appointment_status(
      (select id from public.appointments where date = '2026-08-01'),
      'cancelado'
    )
  $$,
  'completed appointment can be reopened or cancelled'
);

select is(
  (select count(*)::integer from public.transactions where appointment_id is not null),
  0,
  'leaving completed status reverses generated revenue'
);

select throws_ok(
  $$
    select public.create_appointment_atomic(
      '20000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000001',
      array['50000000-0000-0000-0000-000000000003'::uuid],
      '2026-08-02',
      '09:00',
      '09:30',
      50,
      null
    )
  $$,
  '23514',
  'Serviço inválido para este negócio.',
  'service from another business is rejected'
);

select is(
  (select count(*)::integer from public.appointments),
  1,
  'failed atomic create leaves no partial appointment'
);

select * from finish();
rollback;
