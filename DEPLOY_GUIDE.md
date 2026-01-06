# Guia de Deploy: Vercel + Supabase

Este guia explica como fazer deploy do sistema Blood Bank no **Vercel** (frontend e backend) e **Supabase** (banco de dados PostgreSQL).

---

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com)
- Repositório Git (GitHub, GitLab ou Bitbucket)

---

## 1️⃣ Configurar Supabase

### 1.1 Criar Projeto

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **New Project**
3. Preencha:
   - **Name**: `blood-bank-db`
   - **Database Password**: **Anote esta senha!**
   - **Region**: São Paulo (`sa-east-1`)
4. Aguarde a criação (~2 minutos)

### 1.2 Obter Strings de Conexão

1. Vá em **Project Settings** → **Database**
2. Na seção **Connection string**, copie:

| Tipo | Para que usar | Porta |
|------|---------------|-------|
| **Transaction** (Pooler) | `DATABASE_URL` | 6543 |
| **Session** (Direct) | `DIRECT_URL` | 5432 |

**Formato da string:**
```
postgresql://postgres.[PROJECT_REF]:[SUA_SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

> ⚠️ Substitua `[SUA_SENHA]` pela senha que você definiu!

---

## 2️⃣ Deploy do Backend no Vercel

### 2.1 Subir para Git

```bash
cd "c:\Users\enzo.baiao\Desktop\Ro dol fo\blood-bank-api"

# Se ainda não inicializou
git init
git add .
git commit -m "Initial commit - Blood Bank API"

# Adicione seu repositório remoto
git remote add origin https://github.com/SEU_USUARIO/blood-bank-api.git
git push -u origin main
```

### 2.2 Importar no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Conecte seu GitHub e selecione o repositório `blood-bank-api`
3. Configure:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Other |
| **Build Command** | `npm run vercel-build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 2.3 Configurar Variáveis de Ambiente

Em **Settings** → **Environment Variables**, adicione:

| Variável | Valor | Exemplo |
|----------|-------|---------|
| `DATABASE_URL` | String Supabase (Pooler) | `postgresql://postgres.xxx:senha@...6543/postgres` |
| `DIRECT_URL` | String Supabase (Direct) | `postgresql://postgres.xxx:senha@...5432/postgres` |
| `JWT_SECRET` | String secreta (32+ chars) | `minha-chave-super-secreta-jwt-123456` |
| `JWT_REFRESH_SECRET` | String secreta diferente | `outra-chave-super-secreta-refresh-789` |
| `JWT_EXPIRATION` | `15m` | |
| `JWT_REFRESH_EXPIRATION` | `7d` | |
| `APP_ENV` | `production` | |
| `BCRYPT_SALT_ROUNDS` | `12` | |

> 💡 Para gerar secrets seguros: `openssl rand -base64 32`

### 2.4 Deploy

Clique em **Deploy**. Anote a URL gerada:
```
https://blood-bank-api-xxxx.vercel.app
```

### 2.5 Aplicar Migrations no Supabase

Após o deploy, execute **localmente**:

```bash
cd blood-bank-api

# Configure as variáveis de ambiente
$env:DATABASE_URL="postgresql://postgres.xxx:senha@...6543/postgres?pgbouncer=true"
$env:DIRECT_URL="postgresql://postgres.xxx:senha@...5432/postgres"

# Aplique o schema
npx prisma db push

# Execute o seed com dados iniciais
npm run prisma:seed
```

---

## 3️⃣ Deploy do Frontend no Vercel

### 3.1 Configurar URL da API

Edite o arquivo `blood-bank-web/.env.production`:

```env
VITE_API_URL=https://blood-bank-api-xxxx.vercel.app/api
```

> ⚠️ Substitua `blood-bank-api-xxxx` pela URL real do seu backend!

### 3.2 Subir para Git

```bash
cd "c:\Users\enzo.baiao\Desktop\Ro dol fo\blood-bank-web"

git init
git add .
git commit -m "Initial commit - Blood Bank Web"
git remote add origin https://github.com/SEU_USUARIO/blood-bank-web.git
git push -u origin main
```

### 3.3 Importar no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Selecione o repositório `blood-bank-web`
3. Configure:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.4 Configurar Variável de Ambiente

| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | `https://blood-bank-api-xxxx.vercel.app/api` |

### 3.5 Deploy

Clique em **Deploy**. URL final:
```
https://blood-bank-web-xxxx.vercel.app
```

---

## 4️⃣ Atualizar CORS no Backend

Após ter a URL do frontend, adicione como variável no backend:

1. Vá no projeto do **backend** no Vercel
2. **Settings** → **Environment Variables**
3. Adicione:

| Variável | Valor |
|----------|-------|
| `FRONTEND_URL` | `https://blood-bank-web-xxxx.vercel.app` |

4. **Redeploy** o backend para aplicar

---

## 5️⃣ Testar

### Acessar o Sistema

1. Abra: `https://blood-bank-web-xxxx.vercel.app`
2. Login com:

| Usuário | Senha | Perfil |
|---------|-------|--------|
| `admin` | `admin123` | Administrador Global |
| `labadmin` | `labadmin123` | Admin do Laboratório |
| `tecnico` | `tech123` | Técnico |

---

## ✅ Checklist Final

- [ ] Supabase: Projeto criado
- [ ] Supabase: Strings de conexão copiadas
- [ ] Backend: Deploy no Vercel
- [ ] Backend: Variáveis de ambiente configuradas
- [ ] Database: `prisma db push` executado
- [ ] Database: `prisma:seed` executado
- [ ] Frontend: `.env.production` atualizado com URL do backend
- [ ] Frontend: Deploy no Vercel
- [ ] Frontend: `VITE_API_URL` configurado
- [ ] Backend: `FRONTEND_URL` adicionado
- [ ] Teste: Login funcionando

---

## 🔧 Troubleshooting

### "Cannot find module '@prisma/client'"

O build command deve ser:
```
npm run vercel-build
```

### "Connection refused"

Verifique:
- Porta **6543** para pooled (DATABASE_URL)
- Porta **5432** para direct (DIRECT_URL)
- Senha correta na string de conexão

### CORS Error

1. Verifique se `FRONTEND_URL` está configurado no backend
2. Redeploy o backend após adicionar a variável

### Timeout na API

No plano gratuito do Vercel, funções têm limite de 10s. Considere:
- Otimizar queries
- Upgrade para Vercel Pro

---

## 📊 Arquitetura do Deploy

```
┌─────────────────────┐
│   Navegador         │
│   (Usuário)         │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Vercel CDN         │     │  Vercel Serverless  │
│  blood-bank-web     │────▶│  blood-bank-api     │
│  (React + Vite)     │     │  (NestJS)           │
└─────────────────────┘     └─────────┬───────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │  Supabase           │
                            │  (PostgreSQL)       │
                            └─────────────────────┘
```

---

## 🔐 Segurança

1. **Troque as senhas** dos usuários de teste após deploy
2. **Use secrets fortes** (32+ caracteres) para JWT
3. **Nunca commite** arquivos `.env` com senhas reais
4. Configure **RLS no Supabase** se necessário
