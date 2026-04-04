# 🚀 Guia de Deploy na Vercel

As etapas 6-9 foram concluídas! Agora você está pronto para fazer o deploy.

## Pré-requisitos

- [ ] **Conta na Vercel** — Crie em [vercel.com](https://vercel.com)
- [ ] **Conta no GitHub** — Crie em [github.com](https://github.com)
- [ ] **Repositório GitHub do projeto** — Crie em [github.com/new](https://github.com/new)
- [ ] **Projeto no Supabase** — Crie em [supabase.com](https://supabase.com)
- [ ] **Chave da API da Anthropic** — Obtenha em [console.anthropic.com](https://console.anthropic.com)

## Paso 1: Subir o Projeto pro GitHub

### 1.1 — Criar repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. **Repository name**: `pastor-rhema-plus`
3. **Description**: "SaaS para preparar sermões com IA"
4. **Visibility**: `Public` (se quiser compartilhar) ou `Private`
5. **NÃO adicione** README, .gitignore ou license (você já tem)
6. Clique **Create repository**

### 1.2 — Adicionar remote e fazer push

Copie os comandos que aparecem e rode no terminal:

```bash
cd /Users/paulointeligente/pastor-rhema-plus
git remote add origin https://github.com/SEUSUSARIO/pastor-rhema-plus.git
git branch -M main
git push -u origin main
```

**Substitua `SEUSUSARIO` pelo seu usuário do GitHub.**

Verifique se funcionou: vá em `https://github.com/SEUSUSARIO/pastor-rhema-plus` — deve ver o código lá.

---

## Paso 2: Configurar Variáveis de Ambiente

### 2.1 — Obter as chaves do Supabase

1. Acesse seu projeto no [supabase.com](https://supabase.com)
2. Vá em **Settings > API**
3. Copie:
   - **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL`
   - **anon key** → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.2 — Obter a chave da Anthropic

1. Acesse [console.anthropic.com/account/keys](https://console.anthropic.com/account/keys)
2. Clique **Create Key**
3. Copie a chave → será `ANTHROPIC_API_KEY`

### 2.3 — Guardar em lugar seguro

Salve essas 3 chaves em um arquivo de texto seguro (ou tenha-as à mão). **NÃO as compartilhe!**

---

## Paso 3: Conectar na Vercel

### 3.1 — Criar novo projeto

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique **+ Add New** > **Project**
3. Selecione **Import Git Repository**

### 3.2 — Escolher o repositório

1. Clique **Import Repository**
2. Escolha `SEUSUSARIO/pastor-rhema-plus`
3. Clique **Import**

Vercel detectará que é um projeto Next.js automaticamente.

### 3.3 — Configurar variáveis de ambiente

1. Na página **Configure Project**, encontre a seção **Environment Variables**
2. Adicione as 3 variáveis:

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | a URL do Supabase que copiou |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a chave anon que copiou |
| `ANTHROPIC_API_KEY` | a chave da Anthropic que copiou |

3. Clique **Deploy**

---

## Paso 4: Aguardar o Deploy

A Vercel vai:

1. Clonar seu repositório do GitHub
2. Instalar as dependências (`npm install`)
3. Fazer build do Next.js
4. Fazer deploy dos arquivos na rede global da Vercel

Quando terminar, você vai ver um link como: `https://pastor-rhema-plus.vercel.app`

---

## Paso 5: Testar o App

1. Acesse o link que Vercel forneceu
2. Você deve ver a página de **login**
3. Crie uma conta com seu email
4. Confirme o email (verifique seu inbox)
5. Faça login
6. Você deve entrar no **dashboard**

Se tudo funcionou, **parabéns! 🎉 Seu app está no ar!**

---

## Paso 6: Novo Deploy Automático

A partir de agora, sempre que você fazer `git push` pro main:

```bash
git add .
git commit -m "sua mensagem"
git push origin main
```

A Vercel detecta a mudança e faz deploy automaticamente. **Sem precisar fazer nada!**

---

## Se der erro...

### "Cannot find module '@/lib/supabase_client'"

Verifique que a pasta `lib/` com `supabase_client.js` existe no repositório do GitHub.

### "NEXT_PUBLIC_SUPABASE_URL is not set"

Verifique as variables de environment no painel da Vercel. Deve ter exatamente as 3 variáveis com os nomes corretos.

### "Invalid API key" da Anthropic

Verifique que `ANTHROPIC_API_KEY` está correta (começa com `sk-ant-`).

### "User not found" ao fazer login

Verifique que:
1. Seu projeto Supabase tem a tabela `profiles` criada
2. Email confirmation está habilitada (Settings > Authentication > Email)
3. Você confirmou o email

---

## Próximos Passos após Deploy

Agora você pode:

1. **Integrar os componentes do app atual** — Copie o código da página principal (`pastor_rhema_plus.jsx`) e adapte pra Next.js
2. **Criar as APIs dos outros geradores** — `/api/gerar-estudo`, `/api/gerar-estrutura`, etc
3. **Testar com dados reais** — Crie uma série, gere conteúdo, veja se tudo salva no banco
4. **Customizar o design** — Adicione CSS/Tailwind pro dashboard ficar bonito
5. **Monitorar uso** — Acompanhe na Vercel Dashboard e Supabase o tráfego/banco de dados

---

## Dúvidas?

Consulte as documentações:
- Next.js: [nextjs.org/docs](https://nextjs.org/docs)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- Anthropic: [anthropic.com/docs](https://anthropic.com/docs)
