# Agenda CRM

CRM e agenda para profissionais de beleza — agendamentos, clientes, serviços, financeiro e metas em um só app.

> O nome definitivo do produto ainda será escolhido.

## Stack

- **Expo (React Native + TypeScript)** com Expo Router
- **Supabase** — autenticação, banco Postgres e realtime
- Design system próprio: paleta minimalista com acentos vívidos (violeta `#6C5CE7` e rosa `#FF5C8A`), tipografia Manrope

## Telas

| Módulo | Telas |
| --- | --- |
| Autenticação | Boas-vindas, login, cadastro, recuperar senha, onboarding em 3 passos |
| Início | Dashboard com previsão do dia, ações rápidas, agenda de hoje e metas |
| Agenda | Visão por dia com filtro por profissional, novo agendamento, detalhe com ações |
| Clientes | Lista com busca e alerta de inatividade, perfil com histórico e ficha, cadastro |
| Serviços | Catálogo com duração/preço/cor, formulário |
| Financeiro | Saldo com entradas/saídas, lançamentos, novo lançamento, relatórios |
| Extras | Metas, notificações, perfil do negócio, horário de funcionamento, equipe, assinatura |

## Rodando o projeto

```bash
npm install
cp .env.example .env   # preencha com as chaves do seu projeto Supabase
npx expo start
```

Abra no Expo Go (Android/iOS) ou emulador.

**Antes do primeiro uso:** aplique `supabase/schema.sql` e depois `supabase/schema_v2.sql` no SQL Editor — veja [supabase/README.md](supabase/README.md). No painel do Supabase, recomenda-se desativar a confirmação de e-mail (Authentication → Providers → Email) para o cadastro entrar direto no app.

Testes: `npm test`

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Chave publicável (anon/publishable) |

## Estrutura

```
src/
├── app/           # rotas (Expo Router)
│   ├── (auth)/    # fluxo de autenticação e onboarding
│   ├── (tabs)/    # abas: início, agenda, clientes, financeiro
│   ├── appointments/, clients/, services/, finance/, goals/, profile/
├── components/    # componentes de UI reutilizáveis
├── context/       # sessão e negócio ativo
├── data/          # camada de acesso ao Supabase
├── theme/         # tokens de design (cores, tipografia, espaçamento)
├── lib/           # supabase, formatadores, máscaras, helpers
└── types/         # tipos de domínio

supabase/
└── schema.sql     # tabelas, RLS e regras de negócio no banco
```

## Regras de negócio

- **Conflito de horário**: a agenda só oferece horários livres do profissional, e o banco garante a exclusividade mesmo em uso simultâneo.
- **Concluir → cobrar**: marcar um atendimento como concluído lança a receita no financeiro automaticamente (trigger no banco).
- **Isolamento por conta**: RLS em todas as tabelas — cada profissional só acessa os próprios dados.

## Próximos passos

- [ ] Push remoto (deploy da edge function `daily-reminders` + tabela de tokens)
- [ ] Link público de agendamento online
- [ ] Convite de profissionais com login próprio
- [ ] Assinatura do plano Pro (RevenueCat)
