# Banco de dados

## Fluxo de migrations

As migrations em [`migrations/`](./migrations) são a fonte oficial do schema. Para um
projeto novo:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push --dry-run
supabase db push
```

### Adotando migrations no projeto que recebeu os SQLs antigos

O banco existente já possui as duas primeiras versões. Marque somente esses baselines
como aplicados e depois envie a migration do Sprint 1:

```bash
supabase migration repair --status applied 20260721000000
supabase migration repair --status applied 20260721001000
supabase db push --dry-run
supabase db push
```

Não execute `db reset --linked` em produção: esse comando apaga os dados remotos.

## Desenvolvimento local

Com Docker em execução:

```bash
supabase start
supabase db reset
supabase db lint --local --level error
supabase test db
```

O CI reconstrói um banco vazio a partir de todas as migrations antes de executar os
testes pgTAP em [`tests/`](./tests).

## Recomendação para o MVP

Em **Authentication → Providers → Email**, desative "Confirm email" para o cadastro entrar direto no app sem fricção de confirmação.

## Regras de negócio no banco

- **Conflito de horário**: a constraint `no_overlapping_appointments` impede dois agendamentos ativos do mesmo profissional no mesmo intervalo — cancelamentos e faltas liberam o horário.
- **Concluir → reconciliar**: a trigger `on_appointment_financial_sync` mantém exatamente uma receita por atendimento concluído e a remove se o status for reaberto/cancelado.
- **Agendamento atômico**: os RPCs `create_appointment_atomic` e `update_appointment_atomic` validam todas as relações e gravam horário + serviços na mesma transação.
- **RLS em tudo**: cada usuário só acessa dados do próprio negócio.
