# Blood Bank Inventory & Traceability System

Sistema web de inventário e rastreabilidade de amostras de sangue com suporte a múltiplos laboratórios.

## Estrutura do Projeto

```
Ro dol fo/
├── blood-bank-api/          # Backend NestJS
│   ├── src/
│   │   ├── auth/            # Autenticação e autorização
│   │   ├── laboratory/      # Gestão de laboratórios
│   │   ├── sample/          # Gestão de amostras
│   │   ├── storage/         # Gestão de armazenamento
│   │   └── prisma/          # Serviço Prisma
│   └── prisma/
│       ├── schema.prisma    # Schema do banco de dados
│       └── seed.ts          # Dados iniciais
│
├── blood-bank-web/          # Frontend React
│   └── src/
│       ├── components/      # Componentes reutilizáveis
│       ├── pages/           # Páginas da aplicação
│       ├── store/           # Estado global (Zustand)
│       └── lib/             # Utilitários e API
│
└── docker-compose.yml       # PostgreSQL e Redis
```

## Requisitos

- Node.js 20+
- Docker Desktop (para PostgreSQL)
- npm ou yarn

## Início Rápido

### 1. Iniciar o Banco de Dados

```bash
docker-compose up -d
```

### 2. Configurar o Backend

```bash
cd blood-bank-api

# Copiar arquivo de ambiente
copy .env.example .env

# Gerar cliente Prisma
npm run prisma:generate

# Aplicar migrations e seed
npm run prisma:push
npm run prisma:seed

# Iniciar servidor de desenvolvimento
npm run start:dev
```

### 3. Configurar o Frontend

```bash
cd blood-bank-web

# Iniciar servidor de desenvolvimento
npm run dev
```

### 4. Acessar o Sistema

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000/api

### Credenciais de Teste

| Usuário   | Senha        | Perfil                   |
|-----------|--------------|--------------------------|
| admin     | admin123     | Administrador Global     |
| labadmin  | labadmin123  | Administrador do Lab     |
| tecnico   | tech123      | Técnico de Laboratório   |

## Funcionalidades

- ✅ Autenticação com JWT + refresh token
- ✅ Controle de acesso por roles e permissões
- ✅ Multi-tenant com isolamento por laboratório
- ✅ Gestão de amostras com rastreabilidade
- ✅ Hierarquia de armazenamento (Sala > Freezer > Prateleira > Caixa)
- ✅ Dashboard com estatísticas
- ✅ Logs de auditoria imutáveis

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Renovar token

### Amostras
- `GET /api/samples` - Listar amostras
- `POST /api/samples` - Cadastrar amostra
- `POST /api/samples/:id/move` - Movimentar amostra
- `GET /api/samples/:id/history` - Histórico de movimentações

### Armazenamento
- `GET /api/storage/hierarchy` - Estrutura completa
- `GET /api/storage/boxes/:id` - Grade de posições da caixa
- `GET /api/storage/occupancy` - Estatísticas de ocupação

## Tecnologias

### Backend
- NestJS + TypeScript
- Prisma ORM
- PostgreSQL
- JWT (passport-jwt)

### Frontend
- React + TypeScript
- Vite
- TanStack Query
- Zustand
- Recharts
- Lucide Icons
