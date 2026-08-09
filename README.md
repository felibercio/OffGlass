# OFFGLASS DECANTS — versão Next.js

Catálogo, carrinho e painel administrativo reescritos em Next.js (App Router) +
TypeScript + React, mantendo a mesma identidade visual da versão anterior em
HTML puro, agora com conta de admin real e escritas protegidas por API Routes.

## 1. Rodar a migração SQL

No Supabase, abra o **SQL Editor** e rode o arquivo `supabase/02_migration_nextjs.sql`
inteiro. Ele adiciona as colunas e tabelas novas (descrição, acordes, pedidos,
mensagens) sem apagar nada do que já existe.

## 2. Criar seu usuário admin (login real, sem senha fixa no código)

1. No Supabase, vá em **Authentication** → **Users** → **Add user**.
2. Preencha e-mail e senha (essas serão suas credenciais reais de login).
3. Marque **Auto Confirm User** para não precisar confirmar por e-mail.
4. Pronto — esse e-mail/senha substituem o login fixo "Priscila Schinato / 2154"
   da versão anterior.

## 3. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` (para rodar localmente) e/ou
configure as mesmas três variáveis na Vercel:

**Vercel → seu projeto → Settings → Environment Variables**

| Nome | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key (⚠️ secreta, nunca compartilhe) |

## 4. Subir no GitHub

Esta versão tem várias pastas e arquivos (não é mais um único HTML). O jeito
mais confiável de subir tudo de uma vez:

**Opção recomendada — GitHub Desktop** (app gratuito):
1. Baixe e instale o GitHub Desktop (desktop.github.com).
2. "Add local repository" → selecione a pasta `offglass-nextjs` (depois de
   descompactar o zip que te enviei).
3. Ele detecta que ainda não é um repositório git e oferece para criar um —
   aceite.
4. Escreva uma mensagem de commit (ex: "Versão Next.js") e clique em
   "Publish repository" — escolha o repositório `felibercio/OffGlass` como
   destino (ou crie um novo, se preferir manter o histórico HTML separado).

**Alternativa — upload pelo navegador:**
No GitHub, dentro do repositório, arraste a pasta inteira do projeto para a
área de upload (Chrome/Edge preservam a estrutura de pastas ao arrastar).
Evite arrastar `node_modules` — não é necessário subir essa pasta (ela é
reconstruída automaticamente pela Vercel a partir do `package.json`).

## 5. Importar/atualizar na Vercel

Se o projeto na Vercel já existia apontando para este repositório, basta o
push/upload no GitHub — ela detecta e publica sozinha. Se for a primeira vez,
siga o mesmo fluxo de antes: **Add New → Project → Import** o repositório.

A Vercel detecta automaticamente que é um projeto Next.js — não precisa mudar
nenhuma configuração de build.

## O que muda para o dia a dia

- **Login do admin**: agora é seu e-mail e senha reais (Supabase Auth), não
  mais usuário/senha fixos no código.
- **Estrutura de arquivos**: deixa de ser um único `catalogo.html` — vira um
  projeto com várias pastas. Toda vez que eu fizer um ajuste, vou te entregar
  o projeto atualizado (ou só os arquivos que mudaram, te explicando onde
  colar).
- **Domínio**: nada muda — o mesmo domínio conectado na Vercel continua
  funcionando normalmente após o novo deploy.
