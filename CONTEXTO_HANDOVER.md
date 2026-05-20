# Pastor Rhema PLUS — Documento de Handover

**Data**: 28 de abril de 2026
**Autor**: Paulo Inteligente
**Motivo**: Transferência de contexto para continuidade do desenvolvimento

---

## 1. O que é o projeto

**Pastor Rhema PLUS** é uma plataforma SaaS que auxilia pastores na preparação de sermões usando IA (OpenAI GPT-4o-mini). O app guia o pastor por um fluxo de 5 etapas:

1. **Estudo Bíblico** (`/study`) — Estudo exegético do texto
2. **Estrutura** (`/builder`) — Estrutura do sermão
3. **Ilustrações** (`/illustrations`) — Ilustrações e exemplos
4. **Aplicações** (`/application`) — Pontos de aplicação prática
5. **Sermão Final** (`/final`) — Sermão completo pronto para pregar

### Funcionalidades principais
- **Chat com IA** (`/chat`) — Conversa livre com o "Pastor Rhema"
- **Bíblia Interativa** (`/bible`) — Leitura, busca, destaques e notas
- **Gabinete Pastoral** (`/pastoral`) — Aconselhamento e orientação pastoral
- **Versículo do Dia** — Exibido no dashboard
- **Admin** (`/admin`) — Gerenciamento de usuários (para admins)
- **Sistema de planos** — Simple (gratuito) e Plus (pago via Hotmart)
- **PWA** — Instalável como app no celular
- **i18n** — Português, English, Español

---

## 2. Stack Técnico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js | 16.2.2 |
| Frontend | React | 19.2.4 |
| Estilo | Tailwind CSS 4 + CSS Modules | 4.x |
| Banco de Dados | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth | - |
| IA | OpenAI (gpt-4o-mini) via `openai` SDK | ^6.33.0 |
| Deploy | Vercel | - |
| Runtime | Node.js | - |

### Comandos
```bash
npm run dev          # Desenvolvimento (Turbopack)
npm run build        # Build de produção (usa --webpack)
npm run start        # Servidor de produção
npm run lint         # ESLint
```

### Variáveis de ambiente (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...
```

---

## 3. Estrutura de Pastas

```
pastor-rhema-plus/
├── app/
│   ├── page.tsx              # Redirect: autenticado → /dashboard, senão → /login
│   ├── layout.tsx            # Layout raiz (meta, fontes)
│   ├── manifest.ts           # PWA manifest
│   ├── globals.css           # Tailwind + tema customizado (brand colors)
│   ├── login/page.js         # Login + cadastro
│   ├── reset-password/page.js
│   ├── dashboard/page.js     # Dashboard principal (ThisWeek)
│   ├── chat/page.js          # Chat com IA
│   ├── bible/page.js         # Bíblia interativa
│   ├── study/page.js         # Etapa 1: Estudo bíblico
│   ├── builder/page.js       # Etapa 2: Estrutura
│   ├── illustrations/page.js # Etapa 3: Ilustrações
│   ├── application/page.js   # Etapa 4: Aplicações
│   ├── final/page.js         # Etapa 5: Sermão final
│   ├── series/page.js        # Criar/gerenciar séries
│   ├── sermons/page.js       # Biblioteca de sermões pregados
│   ├── pastoral/page.js      # Gabinete pastoral
│   ├── profile/page.js       # Perfil do usuário
│   ├── admin/page.js         # Painel admin
│   ├── support/page.js       # Suporte
│   ├── api/
│   │   ├── gerar-serie/route.js
│   │   ├── gerar-estudo/route.js
│   │   ├── gerar-sermao/route.js
│   │   ├── gerar-ilustracoes/route.js
│   │   ├── gerar-aplicacao/route.js
│   │   ├── chat/route.js
│   │   ├── pastoral/route.js
│   │   ├── bible/            # Rotas: /bible, /bible/chapter, /bible/deepen, /bible/books
│   │   ├── verse-of-day/     # Rotas: /verse-of-day, /verse-of-day/share
│   │   ├── hotmart/webhook/route.js
│   │   └── admin/            # Rotas: /admin/me, /admin/plus-audit, /admin/users, /admin/users/list, /admin/users/[userId]
│   └── *.module.css          # CSS Modules específicos
├── components/
│   ├── AppLayout.js          # Layout principal com sidebar/menu
│   ├── SeriesForm.js         # Formulário de criação de série
│   ├── SermonFlowNav.js      # Navegação entre etapas do sermão
│   ├── VersionHistoryCard.js # Card de histórico de versões
│   ├── VerseOfDay.js         # Versículo do dia
│   ├── SatisfactionSurvey.js # Pesquisa de satisfação in-app
│   ├── InstallPrompt.js      # Prompt de instalação PWA
│   ├── OnboardingTour.js     # **NOVO** Tour de onboarding (não commitado)
│   └── ui.js                 # Componentes UI reutilizáveis (Btn, Card, Loader, Notice)
├── lib/
│   ├── supabase_client.js    # Cliente Supabase + auth + profiles + CRUD + **chatThreads/chatMessages** (não commitado)
│   ├── i18n.js               # Internacionalização (PT/EN/ES) + **traduções de onboarding** (não commitado)
│   ├── prompts.js            # Prompts para IA
│   ├── api.js                # Helpers de API
│   ├── aiJson.js             # Parser de JSON da IA
│   ├── bible.js              # Dados e utilidades da Bíblia
│   ├── sermonFlow.js         # Lógica do fluxo de sermão
│   ├── versionedContent.js   # Sistema de versionamento de conteúdo
│   ├── satisfactionSurveyState.js
│   ├── serverEnv.js          # Variáveis de ambiente server-side
│   └── server/admin.js       # Lógica admin server-side
├── data/
│   └── bible/                # JSONs completos da Bíblia (pt.json, en.json, es.json)
├── public/
│   ├── sw.js                 # Service Worker (PWA)
│   ├── logo.png, icon.png    # Assets
│   └── *.svg                 # SVGs do Next.js
├── scripts/
│   ├── import-users.js
│   └── fix-plus-plans.js
├── supabase_schema.sql            # Schema principal (7 tabelas)
├── supabase_chat_tables.sql       # **NOVO** Schema de chat (não commitado)
├── supabase_chat_tables.sql       # tabelas chat_threads + chat_messages
├── supabase_bible_notes.sql       # Schema de notas bíblicas
├── supabase_satisfaction_surveys.sql
├── AGENTS.md                 # Nota sobre breaking changes do Next.js 16
├── CLAUDE.md                 # Referência ao AGENTS.md
├── DEPLOY.md                 # Guia de deploy
├── STATUS_PROJETO.md         # Status detalhado (desatualizado - data: 6/abr)
└── QA_MOBILE_PRODUCAO.md     # QA mobile
```

---

## 4. Histórico de Commits (cronológico, do mais recente ao mais antigo)

| Commit | Descrição |
|--------|-----------|
| `1cb9315` | Corrige loop no fluxo de sermão causado por cache stale |
| `7eaf42c` | Adiciona pesquisa de satisfação in-app e melhorias diversas |
| `441597e` | Adiciona auditoria de planos Plus no painel admin |
| `dfea466` | Corrige fluxo de criação de usuários e upgrade de plano via Hotmart |
| `425fcc1` | Add admin user management |
| `af677d4` | Adiciona card de upgrade no menu mobile para usuários sem plano Plus |
| `f36110b` | Redireciona botões de upgrade para pastorrhema.com/upgrade/ |
| `c058825` | Adiciona botão Admin no menu para usuários administradores |
| `eb14e4b` | Corrige webhook Hotmart: atribui plano correto por product.id |
| `462efa0` | Corrige ícone quebrado do menu Estudo e Contexto |
| `25ab160` | Corrige busca bíblica: remove auth das rotas da Bíblia |
| `7d765f4` | Corrige logout indevido na busca da Bíblia Interativa |
| `69b82dd` | Corrige busca bíblica: inclui bookIdx na resposta de lookupRef |
| `88f37cc` | Corrige build: useSearchParams dentro de Suspense boundary |
| `501e529` | Elimina loading lento entre páginas com cache de estado em memória |
| `d83c738` | Implementa Bíblia Interativa (/bible) |
| `5a5bc2a` | Adiciona Bíblia completa local com API de consulta de referências |
| `801ee7c` | Corrige sidebar desktop não acompanhando a rolagem |
| `edb8c84` | Corrige menu mobile flutuando no meio da tela no iOS Safari |
| `c6d547d` | Corrige scroll horizontal indesejado no mobile |
| `056ad8a` | Adiciona Versículo do Dia e emoji de presente no Gabinete Pastoral |
| `940c81c` | Adiciona Gabinete Pastoral — O Bom Amigo e Aconselhamento |
| `b08d8ef` | Corrige findings de segurança, lint e melhora formatação de output da IA |
| `35bd1b7` | Remove limite diário de mensagens no chat |
| `8eb9eed` | Adiciona webhook Hotmart para criação automática de usuários |
| `aae27f6` | Refatoração geral da UI, PWA e otimizações de build |
| `7e943dc` | Configurar link da Hotmart na tela de login |
| `1554840` | Improve dashboard weekly guidance |
| `d2ca857` | Improve final sermon export options |
| `7ae8975` | Improve sermon library browsing |
| `0996fae` | Weekly Sermon Loop + My Sermons + AI Continuity |
| `819fb43` | Implementar seletor de idioma: Português, English, Español |
| `33b3287` | Implementar controle de planos Simple e Plus |
| `5b41e24` | Adicionar chat Pastor Rhema ao app |
| `38a055f` | Migrar de Anthropic para OpenAI (gpt-4o-mini) |
| `427f64a` | Implementar fluxo completo de preparação de sermão |
| `b5085de` | Etapas 6-9: Implementação de API Routes, cliente Supabase, login e dashboard |
| `810b968` | Initial commit from Create Next App |

---

## 5. Alterações NÃO COMMITADAS (em andamento quando o sistema travou)

Estas são as mudanças que estavam sendo feitas na sessão anterior e **ainda não foram commitadas**:

### 5.1. Migração do Chat: localStorage → Supabase

**Objetivo**: Persistir o histórico de conversas do chat no banco de dados em vez de localStorage, permitindo sincronização entre dispositivos.

**Arquivos modificados:**

#### `lib/supabase_client.js` (+129 linhas)
- Adicionado módulo `chatThreads` com métodos: `getThreads`, `createThread`, `updateThread`, `deleteThread`
- Adicionado módulo `chatMessages` com métodos: `getMessages`, `addMessage`, `addMessages`
- Adicionada função `migrateChatFromLocalStorage(userId)` — migra automaticamente conversas do localStorage para o DB na primeira vez

#### `app/chat/page.js` (refatoração completa)
- Removidas funções locais: `readChatHistory`, `writeChatHistory`, `buildThreadId`, `persistConversation`, `getChatHistoryKey`
- Agora usa `chatThreads` e `chatMessages` do supabase_client
- Adicionado cache em memória (`messagesCache`) para evitar re-fetches
- Adicionada funcionalidade de **excluir conversa** (botão × no card do histórico)
- Migração automática do localStorage na primeira carga

#### `supabase_chat_tables.sql` (arquivo NOVO)
- Tabela `chat_threads` (id, user_id, title, created_at, updated_at)
- Tabela `chat_messages` (id, thread_id, role, content, created_at)
- Índices otimizados
- RLS policies (usuário só acessa suas próprias threads/mensagens)
- Trigger para auto-update de `updated_at`
- **Status: JÁ EXECUTADO no Supabase com sucesso**

### 5.2. Onboarding Tour para novos usuários Plus

**Objetivo**: Mostrar um tour guiado de 4 passos para usuários Plus que ainda não criaram nenhuma série.

#### `components/OnboardingTour.js` (arquivo NOVO, 132 linhas)
- Componente modal fullscreen com overlay
- 4 etapas: Criar série → Fluxo de 5 etapas → Chat → Bíblia
- Cada etapa tem botão de ação direta (navega para a rota)
- Botões: "Próximo" / "Concluir" / "Pular" (×)
- Indicadores visuais de progresso (dots)
- Persistência: grava no `localStorage` que o usuário já viu o tour

#### `app/dashboard/page.js` (modificado)
- Importa e renderiza `OnboardingTour`
- Mostra o tour apenas se: usuário é Plus + não tem séries + não dismissou antes
- Lógica: `!hasHistory && !isOnboardingDismissed(userId)`

#### `lib/i18n.js` (+51 linhas)
- Adicionadas traduções para onboarding em 3 idiomas (PT, EN, ES):
  - `onboarding_step1_title/desc/action` até `step4`
  - `onboarding_next`, `onboarding_finish`
- Adicionada `chat_delete_thread` nos 3 idiomas

---

## 6. Estado Atual do Projeto

### Funcionalidades COMPLETAS e em produção (commitadas):
- [x] Infraestrutura Next.js 16 + Tailwind 4 + Supabase
- [x] Autenticação (login, cadastro, reset password)
- [x] Dashboard com visão da semana atual
- [x] Fluxo completo de sermão (5 etapas com IA)
- [x] Chat com IA (OpenAI GPT-4o-mini)
- [x] Bíblia Interativa com busca, notas e destaques
- [x] Gabinete Pastoral (aconselhamento)
- [x] Versículo do Dia
- [x] Sistema de planos (Simple/Plus)
- [x] Webhook Hotmart para upgrade automático
- [x] Painel Admin (gerenciamento de usuários)
- [x] Internacionalização (PT/EN/ES)
- [x] PWA (instalável)
- [x] Pesquisa de satisfação in-app
- [x] Exportação de sermão (imprimir/copiar)
- [x] Biblioteca de sermões pregados
- [x] Sistema de versionamento de conteúdo
- [x] Deploy na Vercel em produção

### Funcionalidades EM ANDAMENTO (não commitadas):
- [ ] Migração do chat para Supabase (código pronto, tabelas criadas, **precisa de testes**)
- [ ] Onboarding Tour (código pronto, **precisa de testes**)
- [ ] Excluir conversa no chat (código pronto)

### Funcionalidades PLANEJADAS (não iniciadas):
- [ ] Exportar sermão para PDF/Word
- [ ] Podcast (TTS do sermão)
- [ ] Dashboard de analytics/estatísticas
- [ ] Página de configurações do usuário
- [ ] Testes automatizados (vitest, Cypress)
- [ ] Rate limiting nas APIs
- [ ] Dark mode completo

---

## 7. Problemas Conhecidos / Observações

1. **Next.js 16 Breaking Changes**: Este projeto usa Next.js 16.2.2 que tem breaking changes em relação a versões anteriores. Sempre consultar `node_modules/next/dist/docs/` antes de escrever código.
2. **Build usa webpack**: O `npm run build` usa flag `--webpack` pois o Turbopack build tinha problemas.
3. **Tailwind 4**: Usa `@tailwindcss/postcss` (não `tailwindcss` diretamente como plugin PostCSS). O CSS usa `@import "tailwindcss"` e `@theme {}`.
4. **STATUS_PROJETO.md desatualizado**: Data de 6/abril, muito progrediu desde então. Este documento o substitui como referência atual.
5. **Login page**: Usuários com plano "simple" são redirecionados para `/chat` (não veem o dashboard).
6. **API Key**: `OPENAI_API_KEY` é usada server-side nas API routes. Nunca exposta ao frontend.

---

## 8. Próximos Passos Recomendados

### Imediato:
1. **Testar as alterações não commitadas** (chat persistence + onboarding)
2. **Commitar** as alterações após validação
3. **Deploy** na Vercel

### Curto prazo:
1. Exportar sermão para PDF (biblioteca como jsPDF)
2. Página de configurações do perfil
3. Rate limiting nas rotas de API

### Médio prazo:
1. Testes automatizados
2. Analytics dashboard
3. Dark mode

---

## 9. Contas e Serviços

- **Supabase**: Banco de dados + Auth (projeto configurado)
- **Vercel**: Deploy contínuo (conectado ao repo Git)
- **OpenAI**: API Key configurada como env var na Vercel
- **Hotmart**: Webhook configurado para criação/upgrade de usuários
- **GitHub**: Repositório com deploy contínuo via Vercel

---

*Documento gerado em 28/abril/2026 para handover de desenvolvimento.*
