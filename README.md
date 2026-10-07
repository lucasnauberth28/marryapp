# MarryApp

Plataforma de gestão de casamentos: painel dos noivos (convidados, RSVP, mesas, credenciamento, finanças,
presentes com Pix/cartão, cronograma, WhatsApp), site público do casal e marketplace de fornecedores.

Stack: Next.js 16 (App Router, Server Actions, `proxy.ts`), React 19, Prisma 7 + Postgres (Supabase),
Mercado Pago, Supabase Storage, Evolution API (WhatsApp), Tailwind 4 + shadcn/ui.

> Esta versão do Next.js tem mudanças incompatíveis com versões anteriores. Consulte
> `node_modules/next/dist/docs/` antes de alterar código (veja `AGENTS.md`).

## Rodando localmente

```bash
cp .env.example .env.local     # preencha as variáveis
npm install
npm run db:migrate             # aplica as migrations
npm run db:seed                # (opcional) fornecedores de demonstração
npm run dev
```

Scripts úteis: `npm run typecheck`, `npm run lint`, `npm test`.

## Segurança: regras do projeto

- **Toda Server Action é um endpoint público.** Ações do painel chamam `requirePathPermission("/modulo")`
  (ou `requireAuthSession()`) de `src/lib/security/auth-guard.ts` na primeira linha. Ações públicas
  (RSVP, checkout, mural, avaliações, leads, cadastro) validam a entrada com `zod` e aplicam `rateLimitByIp`.
- O `proxy.ts` é deny-by-default e serve apenas para redirecionamento otimista; a autorização real
  acontece no servidor, relendo usuário e perfil do banco a cada request.
- Pagamentos só são aprovados pelo Mercado Pago (webhook assinado ou consulta direta, com conferência
  de valor) ou pela conferência manual do casal em `/financas`. Dados de cartão são tokenizados no
  navegador (MercadoPago.js) e nunca passam pelo servidor.
- Preços de planos vêm de `src/lib/plans.ts`, nunca do navegador.
- Não grave texto escapado em HTML no banco (`normalizeText`, não `sanitizeHtmlText`): o React já escapa.

## Deploy e migrations

O build (`next build`) **não acessa o banco**: as páginas que leem dados são renderizadas por request.
Migrations também não rodam no build, porque deploys de Preview (qualquer branch) apontariam para
o banco de produção. O antigo `prisma db push --accept-data-loss` foi removido: ele podia apagar dados.

Aplique migrations de forma explícita, com a `DIRECT_URL` do ambiente desejado:

```bash
npm run db:migrate             # prisma migrate deploy
```

**Banco de produção criado com `db push` (uma única vez):** marque as migrations existentes como
aplicadas, para que não sejam executadas sobre tabelas que já existem:

```bash
npx prisma migrate resolve --applied 20260428143558_init_marry_app
npx prisma migrate resolve --applied 20261007120000_baseline_current_schema
npx prisma migrate status      # deve indicar "Database schema is up to date"
```

Daqui em diante, mudanças de schema são feitas com `npx prisma migrate dev --name <descricao>` e
aplicadas com `npm run db:migrate` antes (ou junto) do deploy que depende delas.

### Supabase: `DATABASE_URL` e `DIRECT_URL`

- `DATABASE_URL`: pooler em modo transação, porta **6543** (`...pooler.supabase.com:6543/postgres?pgbouncer=true`).
- `DIRECT_URL`: conexão de sessão, porta **5432**, usada só pelo Prisma CLI.
- Copie as duas de *Project Settings → Database → Connection string* do próprio projeto: o host do
  pooler inclui a região (ex.: `aws-0-sa-east-1`) e o usuário inclui o ref (`postgres.<ref>`).
- O erro `Tenant or user not found` significa que o pooler não reconhece o projeto: região/host
  errados, ref errado, ou projeto **pausado** (projetos gratuitos pausam após inatividade).
