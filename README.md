# Pastor Rhema PLUS

Plataforma SaaS para auxiliar pastores na preparacao de sermoes com IA, Biblia interativa, chat pastoral, fluxo guiado de estudo e recursos administrativos.

Este README existe para orientar humanos, IAs e agentes de codigo que acessarem esta pasta. Antes de alterar qualquer arquivo, leia tambem o `AGENTS.md`.

## Regra Importante Para Agentes

Este projeto usa Next.js 16.2.2. Ele tem mudancas incompatíveis com versoes anteriores do Next.js.

Antes de escrever codigo em rotas, layouts, Server Components, APIs ou configuracoes do framework, consulte a documentacao local em:

```bash
node_modules/next/dist/docs/
```

Nao assuma APIs antigas do Next.js.

## Stack

- Next.js 16.2.2
- React 19.2.4
- Tailwind CSS 4
- Supabase Auth + PostgreSQL
- OpenAI via SDK `openai`
- Deploy na Vercel

## Comandos Principais

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Observacao: o build de producao usa `next build --webpack`, porque este projeto foi estabilizado assim.

## Fluxo de Trabalho Para IAs e Colaboradores

1. Verifique o estado do repositorio:

```bash
git status --short --branch
```

2. Entenda o contexto antes de editar:

```bash
git log --oneline --decorate -12
rg "termo-ou-funcao"
```

3. Respeite mudancas locais que voce nao fez. Nao reverta arquivos do usuario sem pedido explicito.

4. Para mudancas de codigo, rode pelo menos:

```bash
npm run build
```

Use `npm run lint` quando a mudanca tocar bastante codigo ou padroes de UI/API.

5. Se a mudanca depender de banco, crie ou atualize um arquivo SQL na raiz, por exemplo:

```bash
supabase_nome_da_migracao.sql
```

Depois aplique essa migracao no Supabase e registre no handover ou no commit.

## Como Fazer Commit

O fluxo usado neste projeto e Git simples na branch `main`, com deploy automatico pela integracao GitHub -> Vercel.

1. Confira exatamente o que mudou:

```bash
git status --short
git diff
```

2. Adicione somente os arquivos relacionados:

```bash
git add caminho/do/arquivo outro/arquivo
```

3. Crie um commit claro, em portugues, no imperativo ou descritivo curto:

```bash
git commit -m "Adiciona persistencia do chat no Supabase"
```

4. Envie para o GitHub:

```bash
git push origin main
```

5. A Vercel faz o deploy de producao automaticamente quando `origin/main` recebe o commit.

## Como Confirmar o Deploy

Use a Vercel CLI:

```bash
npx vercel inspect https://app.pastorrhema.com
npx vercel inspect https://app.pastorrhema.com --logs
```

Procure no log por:

- branch `main`
- commit esperado
- `Compiled successfully`
- `Deployment completed`
- status `Ready`

Tambem e util checar rotas publicas:

```bash
curl -I https://app.pastorrhema.com/bible
curl -I https://app.pastorrhema.com/profile
```

## Funcao Operacional Que Replicamos

Quando este projeto diz "fazer commit e deploy", a funcao operacional e:

```text
alterar codigo -> testar build -> git add -> git commit -> git push origin main -> Vercel deploy automatico
```

Nao ha uma funcao de codigo especial para publicar. O deploy vem da integracao da Vercel com o repositorio GitHub.

Para um agente de IA, a responsabilidade e:

- editar apenas o necessario;
- nao misturar mudancas independentes no mesmo commit;
- validar build antes do push quando possivel;
- confirmar na Vercel que o commit certo entrou em producao;
- documentar migracoes SQL quando houver banco envolvido.

## Arquivos de Referencia

- `AGENTS.md`: regra curta obrigatoria para agentes, especialmente sobre Next.js 16.
- `CONTEXTO_HANDOVER.md`: contexto operacional do projeto e historico recente. Pode existir apenas localmente.
- `DEPLOY.md`: guia complementar de deploy, quando presente.
- `supabase_*.sql`: schemas e migracoes aplicadas ou planejadas no Supabase.

## Variaveis de Ambiente

O app depende de variaveis como:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

Nunca commite `.env.local` nem chaves secretas.
