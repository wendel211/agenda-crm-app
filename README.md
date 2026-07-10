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
│   ├── appointments/, clients/, services/, finance/, profile/
├── components/    # componentes de UI reutilizáveis
├── theme/         # tokens de design (cores, tipografia, espaçamento)
├── lib/           # supabase, formatadores, helpers
├── mocks/         # dados de exemplo até o backend estar plugado
└── types/         # tipos de domínio
```

## Próximos passos

- [ ] Modelo de dados no Supabase (tabelas + RLS)
- [ ] Trocar mocks por queries reais
- [ ] Lembretes por WhatsApp/push
- [ ] Link público de agendamento online
