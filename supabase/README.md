# Banco de dados

## Como aplicar o schema

1. Abra o painel do projeto no Supabase → **SQL Editor**
2. Cole o conteúdo de [`schema.sql`](./schema.sql) e execute

Ou, com o CLI autenticado (`supabase login` + `supabase link --project-ref qedkqbgcjikrbryjmngc`):

```bash
supabase db push
```

## Recomendação para o MVP

Em **Authentication → Providers → Email**, desative "Confirm email" para o cadastro entrar direto no app sem fricção de confirmação.

## Regras de negócio no banco

- **Conflito de horário**: a constraint `no_overlapping_appointments` impede dois agendamentos ativos do mesmo profissional no mesmo intervalo — cancelamentos e faltas liberam o horário.
- **Concluir → cobrar**: a trigger `on_appointment_completed` insere a receita no financeiro quando um atendimento muda para `concluido`.
- **RLS em tudo**: cada usuário só acessa dados do próprio negócio.
