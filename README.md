# Prime Capital - Sistema de Gestão de Trading

Sistema de gestão de trading com dashboards para traders e administradores, desenvolvido com React, TypeScript, Vite e Supabase.

## 🚀 Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **Estilização**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Gerenciamento de Estado**: React Query
- **Roteamento**: React Router DOM
- **Formulários**: React Hook Form + Zod

## 📋 Pré-requisitos

- Node.js 18+ ou Bun
- Docker e Docker Compose (opcional)
- Conta Supabase (se for usar seu próprio backend)

## 🔧 Instalação e Configuração

### Opção 1: Executar Localmente

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd <nome-do-projeto>
```

2. **Instale as dependências**
```bash
npm install
# ou
bun install
```

3. **Configure as variáveis de ambiente**

O arquivo `.env` já está configurado com o projeto Supabase do Lovable. Se quiser usar seu próprio Supabase:

```bash
VITE_SUPABASE_PROJECT_ID="seu-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-publishable-key"
VITE_SUPABASE_URL="https://seu-project-id.supabase.co"
```

4. **Execute o projeto**
```bash
npm run dev
# ou
bun dev
```

O aplicativo estará disponível em `http://localhost:8080`

### Opção 2: Executar com Docker

1. **Build e execute com Docker Compose**
```bash
docker-compose up -d
```

O aplicativo estará disponível em `http://localhost:8080`

2. **Para parar os containers**
```bash
docker-compose down
```

## 🗄️ Configuração do Banco de Dados

### Usando Supabase Local

1. **Instale o Supabase CLI**
```bash
npm install -g supabase
```

2. **Inicie o Supabase local**
```bash
supabase start
```

3. **Execute as migrations**
```bash
supabase db reset
```

### Usando seu próprio Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Crie um novo projeto
3. No SQL Editor, execute os arquivos de migration em `supabase/migrations/` na ordem cronológica
4. Configure as variáveis de ambiente no arquivo `.env`

## 📁 Estrutura do Projeto

```
├── public/                 # Arquivos estáticos
├── scripts/               # Scripts de backup do Supabase
├── src/
│   ├── assets/           # Imagens e ícones
│   ├── components/       # Componentes React
│   │   ├── admin/       # Componentes da área admin
│   │   ├── dashboard/   # Componentes do dashboard do trader
│   │   └── ui/          # Componentes shadcn/ui
│   ├── hooks/           # Custom hooks
│   ├── integrations/    # Integração Supabase (auto-gerado)
│   ├── lib/             # Utilitários e helpers
│   ├── pages/           # Páginas da aplicação
│   └── main.tsx         # Entry point
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # Migrations do banco de dados
└── docker-compose.yml   # Configuração Docker
```

## 👥 Usuários e Permissões

O sistema possui três níveis de acesso:

- **Trader**: Acesso ao dashboard pessoal, gestão de planos e solicitações
- **Admin**: Gerenciamento de traders, planos e aprovações
- **Super Admin**: Acesso completo ao sistema

### Criar Primeiro Admin

Use a Edge Function `setup-admin`:

```bash
curl -X POST https://tqsshqhmzcwchdwenfqi.supabase.co/functions/v1/setup-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "senha-segura"}'
```

## 🔐 Autenticação

O sistema usa Supabase Auth com:
- Email/Senha
- Row Level Security (RLS) nas tabelas
- Políticas de acesso baseadas em roles

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint

# Backup do banco de dados (scripts/backup-database.sh)
./scripts/backup-database.sh

# Backup do storage (scripts/backup-storage.sh)
./scripts/backup-storage.sh
```

## 🐳 Docker

### Build da imagem
```bash
docker build -t prime-capital .
```

### Executar container
```bash
docker run -p 8080:8080 prime-capital
```

## 📊 Features

### Dashboard Trader
- Visualização de planos adquiridos
- Linha do tempo de progressão
- Solicitações de saque quinzenal
- Pedidos de segunda chance
- Upload de documentos
- Gestão de perfil

### Painel Admin
- Gerenciamento de traders
- Aprovação de solicitações
- Gestão de planos
- Visualização de documentos
- Controle de timeline
- Logs de auditoria

## 🔒 Segurança

- RLS (Row Level Security) habilitado em todas as tabelas
- Políticas de acesso baseadas em roles
- Autenticação obrigatória
- Upload de arquivos com validação
- Logs de auditoria para ações críticas

## 📝 Documentação Adicional

- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Estrutura detalhada do projeto
- [SECURITY.md](SECURITY.md) - Diretrizes de segurança
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Guia de migração
- [AUDIT_STRATEGY.md](AUDIT_STRATEGY.md) - Estratégia de auditoria

## 🚀 Deploy

### Lovable
O projeto já está configurado para deploy automático no Lovable. Basta clicar em "Publish".

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

### Docker em Servidor
```bash
# Build
docker build -t prime-capital .

# Run
docker run -d -p 80:8080 --name prime-capital prime-capital
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário e confidencial.

## 📧 Contato

Para suporte ou dúvidas, entre em contato com a equipe Prime Capital.
