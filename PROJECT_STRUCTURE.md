# 🗺️ Guia Completo do Projeto - Prime Capital

**Versão:** 1.0  
**Data:** 2025-10-07  
**Tipo:** Sistema de Trading com Dashboard de Traders e Admin

---

## 📂 Estrutura de Arquivos

```
prime-capital/
├── public/                              # Arquivos estáticos
│   ├── robots.txt                       # SEO
│   └── placeholder.svg                  # Imagem placeholder
│
├── src/
│   ├── assets/                          # Imagens e recursos
│   │   └── logo-prime.png              # Logo da aplicação
│   │
│   ├── components/                      # Componentes React
│   │   ├── admin/                       # Componentes do painel admin
│   │   │   ├── PlanosAdquiridosTab.tsx # Gestão de planos adquiridos
│   │   │   ├── PlanosTab.tsx           # Gestão de planos disponíveis
│   │   │   ├── SolicitacoesTab.tsx     # Gestão de solicitações
│   │   │   ├── TimelineUpdateDialog.tsx # Atualizar timeline de planos
│   │   │   └── TraderManagementTab.tsx # Gerenciar traders
│   │   │
│   │   ├── dashboard/                   # Componentes do dashboard trader
│   │   │   ├── ApprovalRequestDialog.tsx     # Solicitar aprovação
│   │   │   ├── BiweeklyWithdrawalDialog.tsx  # Saque quinzenal
│   │   │   ├── CommentsDialog.tsx            # Comentários
│   │   │   ├── DocumentUpload.tsx            # Upload de documentos
│   │   │   ├── PlanTimeline.tsx              # Linha do tempo do plano
│   │   │   ├── ProfilePictureUpload.tsx      # Upload foto perfil
│   │   │   ├── SecondChanceDialog.tsx        # Segunda chance
│   │   │   ├── UserMenu.tsx                  # Menu do usuário
│   │   │   └── WithdrawalRequestDialog.tsx   # Solicitação de saque
│   │   │
│   │   └── ui/                          # Componentes de UI (shadcn)
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       └── use-toast.ts
│   │
│   ├── hooks/                           # Custom hooks
│   │   ├── use-mobile.tsx              # Detectar mobile
│   │   └── use-toast.ts                # Toast notifications
│   │
│   ├── integrations/                    # Integrações externas
│   │   └── supabase/
│   │       ├── client.ts               # Cliente Supabase (NÃO EDITAR)
│   │       └── types.ts                # Types do DB (NÃO EDITAR)
│   │
│   ├── lib/                             # Utilitários
│   │   ├── auditLogger.ts              # Logger de auditoria
│   │   └── utils.ts                    # Funções auxiliares
│   │
│   ├── pages/                           # Páginas da aplicação
│   │   ├── Admin.tsx                   # Painel administrativo
│   │   ├── Dashboard.tsx               # Dashboard do trader
│   │   ├── Index.tsx                   # Landing page / Login
│   │   ├── NotFound.tsx                # Página 404
│   │   └── Register.tsx                # Registro de usuário
│   │
│   ├── App.css                          # Estilos globais
│   ├── App.tsx                          # Componente raiz
│   ├── index.css                        # Estilos Tailwind
│   ├── main.tsx                         # Entry point
│   └── vite-env.d.ts                    # Types do Vite
│
├── supabase/                            # Configuração Supabase
│   ├── functions/                       # Edge Functions
│   │   ├── audit-log/
│   │   │   └── index.ts                # Logging de auditoria
│   │   ├── log-activity/
│   │   │   └── index.ts                # Log de atividades
│   │   └── setup-admin/
│   │       └── index.ts                # Setup admin inicial
│   │
│   ├── migrations/                      # Migrações SQL
│   │   └── [timestamp]_*.sql           # Arquivos de migração
│   │
│   └── config.toml                      # Configuração Supabase
│
├── scripts/                             # Scripts de backup
│   ├── backup-database.sh
│   ├── backup-storage.sh
│   ├── backup-to-cloud.sh
│   ├── restore-database.sh
│   ├── test-restore.sh
│   └── README.md
│
├── .env                                 # Variáveis de ambiente (auto)
├── .gitignore                          # Arquivos ignorados
├── AUDIT_STRATEGY.md                   # Estratégia de auditoria
├── MIGRATION_GUIDE.md                  # Guia de migração
├── README.md                           # Documentação
├── SECURITY.md                         # Documentação de segurança
├── components.json                     # Configuração shadcn
├── eslint.config.js                    # ESLint config
├── index.html                          # HTML principal
├── package.json                        # Dependências
├── postcss.config.js                   # PostCSS config
├── tailwind.config.ts                  # Tailwind config
├── tsconfig.json                       # TypeScript config
└── vite.config.ts                      # Vite config
```

---

## 🎯 Arquivos Principais e Suas Responsabilidades

### **Páginas (src/pages/)**

| Arquivo | Rota | Função | Acesso |
|---------|------|--------|--------|
| `Index.tsx` | `/` | Landing page + Login | Público |
| `Register.tsx` | `/register` | Registro de usuário | Público |
| `Dashboard.tsx` | `/dashboard` | Dashboard do trader | Autenticado |
| `Admin.tsx` | `/admin` | Painel administrativo | Admin |
| `NotFound.tsx` | `/404` | Página não encontrada | Público |

### **Componentes Admin (src/components/admin/)**

| Arquivo | Função | Usado em |
|---------|--------|----------|
| `PlanosTab.tsx` | CRUD de planos disponíveis | Admin.tsx |
| `PlanosAdquiridosTab.tsx` | Gestão de planos adquiridos por traders | Admin.tsx |
| `SolicitacoesTab.tsx` | Gestão de solicitações pendentes | Admin.tsx |
| `TraderManagementTab.tsx` | Gerenciar traders (senha, pagamento, etc) | Admin.tsx |
| `TimelineUpdateDialog.tsx` | Atualizar linha do tempo de planos | PlanosAdquiridosTab.tsx |

### **Componentes Dashboard (src/components/dashboard/)**

| Arquivo | Função | Usado em |
|---------|--------|----------|
| `PlanTimeline.tsx` | Exibir linha do tempo do plano | Dashboard.tsx |
| `WithdrawalRequestDialog.tsx` | Solicitar saque | Dashboard.tsx |
| `BiweeklyWithdrawalDialog.tsx` | Solicitar saque quinzenal | Dashboard.tsx |
| `SecondChanceDialog.tsx` | Solicitar segunda chance | Dashboard.tsx |
| `ApprovalRequestDialog.tsx` | Solicitar aprovação de ação | Dashboard.tsx |
| `CommentsDialog.tsx` | Visualizar comentários do admin | Dashboard.tsx |
| `DocumentUpload.tsx` | Upload de documentos | Dashboard.tsx |
| `ProfilePictureUpload.tsx` | Upload de foto de perfil | Dashboard.tsx |
| `UserMenu.tsx` | Menu dropdown do usuário | Dashboard.tsx |

### **Integrações (src/integrations/supabase/)**

| Arquivo | Função | ⚠️ Avisos |
|---------|--------|-----------|
| `client.ts` | Cliente Supabase configurado | **NÃO EDITAR** - Auto-gerado |
| `types.ts` | Types do banco de dados | **NÃO EDITAR** - Auto-gerado |

**Uso correto:**
```typescript
import { supabase } from "@/integrations/supabase/client";
```

### **Utilitários (src/lib/)**

| Arquivo | Função |
|---------|--------|
| `utils.ts` | Função `cn()` para classes CSS |
| `auditLogger.ts` | Logger de auditoria para ações |

---

## 🗄️ Banco de Dados (Supabase PostgreSQL)

### **Tabelas Principais**

#### **1. profiles**
**Path de queries:** Usar via `supabase.from('profiles')`

```typescript
interface Profile {
  id: uuid;                    // Primary key (FK para auth.users)
  nome: string;                // Nome completo
  email: string;               // Email
  cpf: string | null;          // CPF brasileiro
  telefone: string | null;     // Telefone
  data_nascimento: date | null;
  rua_bairro: string | null;
  numero_residencial: string | null;
  cep: string | null;
  cidade: string | null;
  estado: string | null;
  foto_perfil: string | null;  // URL da foto
  pagamento_ativo: boolean;    // Status de pagamento
  documentos_completos: boolean;
  informacoes_personalizadas: text | null;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**RLS Policies:**
- Users: podem ver/editar apenas seu próprio perfil
- Admins: podem ver/editar todos os perfis
- RESTRICTIVE: bloqueio total para anônimos

#### **2. user_roles**
**Path de queries:** Usar via `supabase.from('user_roles')`

```typescript
enum AppRole = 'admin' | 'cliente';

interface UserRole {
  id: uuid;
  user_id: uuid;               // FK para auth.users
  role: AppRole;
  created_at: timestamp;
}
```

**RLS Policies:**
- Users: podem ver suas próprias roles
- Admins: podem gerenciar roles de outros

**⚠️ NUNCA armazenar role no profiles!** Sempre usar tabela separada.

#### **3. planos**
**Path de queries:** Usar via `supabase.from('planos')`

```typescript
interface Plano {
  id: uuid;
  nome_plano: string;
  descricao: string | null;
  preco: numeric;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**RLS Policies:**
- Users autenticados: podem ver todos
- Admins: podem criar/editar/deletar

#### **4. planos_adquiridos**
**Path de queries:** Usar via `supabase.from('planos_adquiridos')`

```typescript
enum TipoSaque = 'mensal' | 'quinzenal';
enum PlanStatus = 'ativo' | 'inativo' | 'concluido';

interface PlanoAdquirido {
  id: uuid;
  cliente_id: uuid;            // FK para profiles
  plano_id: uuid;              // FK para planos
  id_carteira: string;         // Sequencial automático (001, 002...)
  tipo_saque: TipoSaque;
  status_plano: PlanStatus;
  data_aquisicao: timestamp;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**RLS Policies:**
- Users: veem apenas seus próprios planos
- Admins: veem e gerenciam todos

#### **5. solicitacoes**
**Path de queries:** Usar via `supabase.from('solicitacoes')`

```typescript
type TipoSolicitacao = 
  | 'saque' 
  | 'saque_quinzenal' 
  | 'segunda_chance' 
  | 'outro';

type StatusSolicitacao = 
  | 'pendente' 
  | 'aprovado' 
  | 'negado';

interface Solicitacao {
  id: uuid;
  user_id: uuid;               // FK para auth.users
  plano_adquirido_id: uuid | null; // FK para planos_adquiridos
  tipo_solicitacao: TipoSolicitacao;
  descricao: string | null;
  status: StatusSolicitacao;
  resposta_admin: string | null;
  atendida_por: uuid | null;   // Admin que atendeu
  atendida_em: timestamp | null;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**RLS Policies:**
- Users: veem e criam apenas suas próprias
- Admins: veem e atualizam todas

**Triggers:**
- `on_solicitacao_created`: Cria entrada na timeline
- `on_solicitacao_updated`: Atualiza entrada na timeline

#### **6. historico_observacoes**
**Path de queries:** Usar via `supabase.from('historico_observacoes')`

```typescript
interface HistoricoObservacao {
  id: uuid;
  plano_adquirido_id: uuid;    // FK para planos_adquiridos
  solicitacao_id: uuid | null; // FK para solicitacoes
  tipo_evento: string | null;  // Ex: 'saque', 'aprovacao'
  valor_solicitado: numeric | null;
  valor_final: numeric | null;
  status_evento: string | null;
  comprovante_url: string | null;
  observacao: string;
  created_at: timestamp;
}
```

**RLS Policies:**
- Users: veem histórico de seus planos
- Admins: veem e gerenciam todo histórico

#### **7. user_documents**
**Path de queries:** Usar via `supabase.from('user_documents')`

```typescript
type DocumentStatus = 'pendente' | 'aprovado' | 'rejeitado';
type TipoDocumento = 
  | 'cpf' 
  | 'rg' 
  | 'comprovante_residencia' 
  | 'selfie' 
  | 'outro';

interface UserDocument {
  id: uuid;
  user_id: uuid;
  tipo_documento: TipoDocumento;
  arquivo_url: string;
  status: DocumentStatus;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**RLS Policies:**
- Users: veem e fazem upload dos próprios
- Admins: veem e aprovam todos

---

## 🗂️ Storage Buckets

### **1. documentos** (Privado)

**Path:** `supabase.storage.from('documentos')`

**Estrutura:**
```
documentos/
└── {user_id}/
    ├── cpf_123.pdf
    ├── rg_456.pdf
    └── comprovante_789.pdf
```

**Políticas:**
- Users: upload/view apenas própria pasta
- Admins: view todos os documentos

**Upload:**
```typescript
const { data, error } = await supabase.storage
  .from('documentos')
  .upload(`${user.id}/cpf_${Date.now()}.pdf`, file);
```

### **2. fotos-perfil** (Público)

**Path:** `supabase.storage.from('fotos-perfil')`

**Estrutura:**
```
fotos-perfil/
└── {user_id}/
    └── avatar.jpg
```

**Políticas:**
- Todos: podem ver
- Users: upload/update apenas própria foto

**Upload:**
```typescript
const { data, error } = await supabase.storage
  .from('fotos-perfil')
  .upload(`${user.id}/avatar.jpg`, file, { upsert: true });
```

---

## ⚡ Edge Functions

**Path:** `supabase/functions/`

### **1. log-activity**
**Arquivo:** `supabase/functions/log-activity/index.ts`

**Função:** Registrar atividades internas

**Chamada:**
```typescript
await supabase.functions.invoke('log-activity', {
  body: { 
    action: 'user_login',
    details: { userId: user.id }
  }
});
```

### **2. audit-log**
**Arquivo:** `supabase/functions/audit-log/index.ts`

**Função:** Logging de auditoria avançado

### **3. setup-admin**
**Arquivo:** `supabase/functions/setup-admin/index.ts`

**Função:** Setup inicial do primeiro admin

---

## 🔐 Autenticação e Roles

### **Verificar role do usuário:**

```typescript
// Usar função has_role (RLS-safe)
const { data: isAdmin } = await supabase
  .rpc('has_role', { 
    _user_id: user.id, 
    _role: 'admin' 
  });

// Ou via query
const { data: roles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id);
```

### **Obter sessão atual:**

```typescript
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user;
```

### **Listener de autenticação:**

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    }
  );
  
  return () => subscription.unsubscribe();
}, []);
```

---

## 🎨 UI e Estilização

### **Componentes UI (shadcn)**
**Path:** `src/components/ui/`

Todos os componentes UI são do shadcn/ui e usam:
- Tailwind CSS
- Radix UI primitives
- CVA (class-variance-authority)

### **Função utilitária cn():**
```typescript
import { cn } from "@/lib/utils";

<div className={cn("base-class", condition && "conditional-class")} />
```

### **Tailwind Config:**
**Arquivo:** `tailwind.config.ts`

**Tema:**
- Design system com variáveis CSS
- Cores HSL configuráveis
- Modo dark/light

---

## 🔄 Fluxos Principais

### **1. Login/Registro**

**Arquivos envolvidos:**
- `src/pages/Index.tsx` (login)
- `src/pages/Register.tsx` (registro)

**Fluxo:**
```
User -> Index.tsx -> supabase.auth.signInWithPassword()
  -> Session criada
  -> Redirect para /dashboard ou /admin
```

### **2. Trader - Solicitar Saque**

**Arquivos envolvidos:**
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/WithdrawalRequestDialog.tsx`

**Fluxo:**
```
Trader -> Dashboard
  -> Clica em "Solicitar Saque"
  -> WithdrawalRequestDialog abre
  -> Preenche formulário
  -> Insert em 'solicitacoes'
  -> Trigger cria entrada em 'historico_observacoes'
  -> Timeline atualizada
```

### **3. Admin - Aprovar Solicitação**

**Arquivos envolvidos:**
- `src/pages/Admin.tsx`
- `src/components/admin/SolicitacoesTab.tsx`
- `src/components/admin/TimelineUpdateDialog.tsx`

**Fluxo:**
```
Admin -> Admin.tsx
  -> SolicitacoesTab
  -> Seleciona solicitação
  -> Atualiza status para 'aprovado'
  -> Update em 'solicitacoes'
  -> Trigger atualiza 'historico_observacoes'
  -> Trader vê atualização na timeline
```

### **4. Admin - Gerenciar Plano**

**Arquivos envolvidos:**
- `src/pages/Admin.tsx`
- `src/components/admin/PlanosAdquiridosTab.tsx`
- `src/components/admin/TimelineUpdateDialog.tsx`

**Fluxo:**
```
Admin -> Admin.tsx
  -> PlanosAdquiridosTab
  -> Visualiza timeline do plano
  -> Clica em "Adicionar Evento"
  -> TimelineUpdateDialog
  -> Preenche (valor final, comprovante, status)
  -> Insert em 'historico_observacoes'
  -> Timeline atualizada
```

---

## 🔧 Convenções de Código

### **Imports**
```typescript
// Sempre usar alias @
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

### **Componentes**
```typescript
// Functional components com TypeScript
export const MyComponent = () => {
  return <div>Content</div>;
};

// Com props
interface MyComponentProps {
  title: string;
  onSave?: () => void;
}

export const MyComponent = ({ title, onSave }: MyComponentProps) => {
  return <div>{title}</div>;
};
```

### **Queries Supabase**
```typescript
// Sempre verificar erros
const { data, error } = await supabase
  .from('tabela')
  .select('*');

if (error) {
  console.error('Erro:', error);
  toast.error('Erro ao carregar dados');
  return;
}

// Usar data normalmente
setItems(data || []);
```

### **Toast Notifications**
```typescript
import { toast } from "sonner";

// Sucesso
toast.success('Operação realizada com sucesso!');

// Erro
toast.error('Erro ao processar solicitação');

// Info
toast.info('Informação importante');
```

---

## 🔍 Funções Importantes do Banco

### **has_role(user_id, role)**
**Uso:** Verificar se usuário tem uma role específica

```sql
SELECT has_role(auth.uid(), 'admin'::app_role);
```

**Em TypeScript:**
```typescript
const { data: isAdmin } = await supabase
  .rpc('has_role', { 
    _user_id: user.id, 
    _role: 'admin' 
  });
```

### **Triggers**

#### **handle_new_user()**
Cria profile e atribui role 'cliente' quando usuário se registra

#### **create_timeline_entry_on_request()**
Cria entrada na timeline quando solicitação é criada

#### **update_timeline_entry_on_request()**
Atualiza timeline quando solicitação é atualizada

#### **audit_profile_access()**
Loga mudanças em campos sensíveis do profile

#### **log_role_changes()**
Loga mudanças de roles

---

## 📦 Dependências Principais

```json
{
  "@supabase/supabase-js": "^2.58.0",  // Cliente Supabase
  "react": "^18.3.1",                   // React
  "react-router-dom": "^6.30.1",        // Roteamento
  "@tanstack/react-query": "^5.83.0",   // Cache/queries
  "sonner": "^1.7.4",                   // Toast notifications
  "lucide-react": "^0.462.0",           // Ícones
  "date-fns": "^4.1.0",                 // Manipulação de datas
  "zod": "^3.25.76",                    // Validação
  "react-hook-form": "^7.61.1",         // Formulários
  "@radix-ui/*": "várias versões"       // Componentes UI
}
```

---

## ⚠️ Arquivos que NÃO DEVEM ser editados

```
❌ src/integrations/supabase/client.ts
❌ src/integrations/supabase/types.ts
❌ .env (auto-gerado)
❌ supabase/config.toml (auto-gerado)
❌ package.json (usar ferramentas do Lovable)
❌ bun.lockb
❌ tsconfig.*.json
```

---

## 🎯 Padrões de Desenvolvimento

### **1. Criar nova feature**
1. Decidir se é componente admin ou dashboard
2. Criar arquivo em `src/components/admin/` ou `src/components/dashboard/`
3. Importar em `src/pages/Admin.tsx` ou `src/pages/Dashboard.tsx`
4. Testar RLS policies
5. Adicionar validação com zod
6. Adicionar toast notifications

### **2. Adicionar nova tabela**
1. Criar migração SQL em `supabase/migrations/`
2. Adicionar RLS policies SEMPRE
3. Criar trigger `updated_at` se necessário
4. Testar policies com diferentes roles
5. Documentar no projeto

### **3. Adicionar edge function**
1. Criar pasta em `supabase/functions/nome-funcao/`
2. Criar `index.ts`
3. Adicionar CORS headers
4. Testar localmente
5. Deploy automático pelo Lovable

---

## 🚨 Segurança - Checklist

- ✅ RLS habilitado em TODAS as tabelas
- ✅ Validação client-side com zod
- ✅ Validação server-side com constraints
- ✅ Mensagens de erro genéricas
- ✅ Roles em tabela separada (user_roles)
- ✅ Storage com políticas adequadas
- ✅ Audit logging implementado
- ✅ RESTRICTIVE policies em profiles
- ✅ Triggers de auditoria ativos

---

## 📚 Recursos

- [Documentação Lovable](https://docs.lovable.dev/)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação shadcn/ui](https://ui.shadcn.com/)
- [Documentação Tailwind CSS](https://tailwindcss.com/docs)

---

## 🎓 Glossário

| Termo | Significado |
|-------|-------------|
| RLS | Row Level Security - Segurança em nível de linha |
| FK | Foreign Key - Chave estrangeira |
| UUID | Identificador único universal |
| Edge Function | Função serverless do Supabase |
| Trigger | Gatilho automático no banco |
| Policy | Política de acesso RLS |
| RESTRICTIVE | Tipo de policy que DEVE ser satisfeita |
| PERMISSIVE | Tipo de policy onde uma satisfeita é suficiente |

---

**Última atualização:** 2025-10-07  
**Versão:** 1.0  
**Projeto:** Prime Capital - Sistema de Trading
