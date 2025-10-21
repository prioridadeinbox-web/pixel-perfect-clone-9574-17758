# 📊 Estratégia de Auditoria - Logs Invisíveis ao Frontend

## 🎯 Objetivo
Criar um sistema robusto de logs internos para auditoria e segurança, **completamente invisível** aos usuários finais e potenciais atacantes.

---

## 📍 Pontos Estratégicos de Logging

### 1️⃣ **AUTENTICAÇÃO E ACESSO** (Severidade: INFO/WARNING/CRITICAL)

#### Quando Logar:
```typescript
// ✅ Login bem-sucedido
AuditLogger.logLogin(userId, 'email')

// ⚠️ Login falhou
AuditLogger.logFailedLogin(email, 'senha_incorreta')

// ✅ Logout
AuditLogger.logLogout(userId)

// 🚨 Acesso não autorizado
AuditLogger.logUnauthorizedAccess('admin_panel', userId)
```

#### Onde Implementar:
- `src/pages/Auth.tsx` - Login/Logout
- `src/pages/Dashboard.tsx` - Verificação de acesso
- `src/pages/Admin.tsx` - Acesso ao painel admin

#### O Que Capturar:
- IP do usuário
- User-Agent (browser/device)
- Timestamp preciso
- Método de autenticação
- Razão de falha (se aplicável)

---

### 2️⃣ **SOLICITAÇÕES FINANCEIRAS** (Severidade: WARNING/CRITICAL)

#### Quando Logar:
```typescript
// ⚠️ Solicitação de saque
AuditLogger.logWithdrawalRequest(userId, planId, amount)

// ⚠️ Ativação de saque quinzenal
AuditLogger.logBiweeklyRequest(userId, planId)

// ⚠️ Segunda chance solicitada
AuditLogger.logSecondChanceRequest(userId, planId)

// ⚠️ Mudança de status de solicitação
AuditLogger.logRequestStatusChange(requestId, 'pendente', 'aprovada', adminId)
```

#### Onde Implementar:
- `src/components/dashboard/WithdrawalRequestDialog.tsx` - Após submit bem-sucedido
- `src/components/dashboard/BiweeklyWithdrawalDialog.tsx` - Após ativação
- `src/components/dashboard/SecondChanceDialog.tsx` - Após solicitação
- `src/components/admin/SolicitacoesTab.tsx` - Ao atualizar status

#### O Que Capturar:
- Valor solicitado (se aplicável)
- ID do plano associado
- Status anterior e novo
- Quem aprovou/rejeitou (se admin)

---

### 3️⃣ **GESTÃO DE PLANOS** (Severidade: CRITICAL)

#### Quando Logar:
```typescript
// 🚨 Criação de novo plano adquirido
AuditLogger.logPlanCreated(planId, clientId, adminId)

// 🚨 Mudança de status do plano
AuditLogger.logPlanStatusChange(planId, 'ativo', 'eliminado', adminId)

// 🚨 Exclusão de plano
AuditLogger.logPlanDeleted(planId, adminId)
```

#### Onde Implementar:
- `src/components/admin/PlanosAdquiridosTab.tsx`:
  - No `handleSubmit` (CREATE)
  - No `handleEdit` (UPDATE)
  - No `handleDelete` (DELETE)

#### O Que Capturar:
- ID da carteira gerado
- Cliente associado
- Admin que executou a ação
- Valores antigos vs novos (para updates)

---

### 4️⃣ **DADOS SENSÍVEIS** (Severidade: CRITICAL)

#### Quando Logar:
```typescript
// 🚨 Alteração de senha
AuditLogger.logPasswordChange(userId, adminId)

// 🚨 Mudança de status de pagamento
AuditLogger.logPaymentStatusChange(userId, false, true, adminId)

// ✅ Atualização de perfil
AuditLogger.logProfileUpdate(userId, oldData, newData)
```

#### Onde Implementar:
- `src/components/admin/TraderManagementTab.tsx`:
  - No `handleTogglePayment`
  - No `handleChangePassword`
- `src/pages/Dashboard.tsx`:
  - Ao salvar dados cadastrais

#### O Que Capturar:
- Dados antes e depois da alteração (sem expor senha em texto claro)
- Quem fez a alteração (se foi admin)
- Campos modificados

---

### 5️⃣ **UPLOAD DE DOCUMENTOS** (Severidade: INFO)

#### Quando Logar:
```typescript
// ✅ Documento enviado
AuditLogger.logDocumentUpload(userId, 'CNH', fileUrl)
```

#### Onde Implementar:
- `src/components/dashboard/DocumentUpload.tsx` - Após upload bem-sucedido
- `src/components/dashboard/ProfilePictureUpload.tsx` - Após upload de foto

#### O Que Capturar:
- Tipo de documento
- URL do arquivo (sem expor conteúdo)
- Tamanho do arquivo
- Timestamp

---

### 6️⃣ **AÇÕES ADMINISTRATIVAS** (Severidade: CRITICAL)

#### Quando Logar:
```typescript
// 🚨 Acesso a página admin
AuditLogger.logAdminAccess(adminId, '/admin/planos-adquiridos')

// 🚨 Qualquer ação admin
AuditLogger.logAdminAction(adminId, 'delete', 'planos_adquiridos', planId)
```

#### Onde Implementar:
- `src/pages/Admin.tsx` - useEffect ao carregar
- Cada aba do admin:
  - `ClientesTab.tsx` (se ainda existir)
  - `PlanosTab.tsx`
  - `PlanosAdquiridosTab.tsx`
  - `SolicitacoesTab.tsx`
  - `TraderManagementTab.tsx`

#### O Que Capturar:
- Qual página foi acessada
- Ação específica executada
- Recurso afetado
- Resultado da operação

---

### 7️⃣ **COMENTÁRIOS E HISTÓRICO** (Severidade: INFO)

#### Quando Logar:
```typescript
// ✅ Comentário adicionado
AuditLogger.logCommentAdded(planId, comment, adminId)
```

#### Onde Implementar:
- `src/components/admin/PlanosAdquiridosTab.tsx` - `addObservacao`
- `src/components/admin/TraderManagementTab.tsx` - `handleAddComment`

#### O Que Capturar:
- Quem adicionou o comentário
- Preview do comentário (primeiros 100 caracteres)
- Plano associado

---

## 🔍 Formato dos Logs (Backend)

### Estrutura JSON:
```json
{
  "timestamp": "2025-10-07T15:30:45.123Z",
  "user": {
    "id": "uuid-here",
    "email": "trader@example.com",
    "ip": "192.168.1.1"
  },
  "action": "solicitacao.saque.created",
  "resource": {
    "type": "solicitacoes",
    "id": "plan-uuid"
  },
  "changes": {
    "old": null,
    "new": { "amount": "5000.00" }
  },
  "context": {
    "user_agent": "Mozilla/5.0...",
    "session_id": "session-uuid",
    "metadata": { "custom": "data" }
  }
}
```

### Níveis de Severidade:

| Nível | Símbolo | Uso |
|-------|---------|-----|
| **INFO** | ℹ️ | Operações normais (login, documentos) |
| **WARNING** | ⚠️ | Solicitações financeiras, acessos admin |
| **CRITICAL** | 🚨 | Mudanças de plano, senha, pagamento, exclusões |

---

## 🚨 Detecção Automática de Ameaças

### Padrões Suspeitos Monitorados:
```typescript
const suspiciousPatterns = [
  'SELECT', 'DROP', 'DELETE', 'UPDATE', 'INSERT',  // SQL Injection
  '<script', 'javascript:', 'onerror=', 'onload=', // XSS
  '../', '..\\', '/etc/', 'cmd.exe', 'powershell'  // Path Traversal
]
```

### Alertas Automáticos:
- ✅ Log com padrão suspeito → Alerta CRÍTICO
- ✅ Múltiplas falhas de login → Alerta WARNING
- ✅ Acesso não autorizado → Alerta CRITICAL
- ✅ Mudança de role → Alerta CRITICAL

---

## 📊 Onde Visualizar os Logs

### 1. Logs da Edge Function (Backend):
```
Lovable Cloud → Edge Functions → audit-log → Logs
```

### 2. Exemplo de Log Crítico:
```
╔════════════════════════════════════════════════════════════╗
║ 🚨 ALERTA DE SEGURANÇA CRÍTICO                             ║
╠════════════════════════════════════════════════════════════╣
║ Usuário: admin@sistema.com                                 ║
║ Ação: plano_adquirido.deleted                              ║
║ Recurso: planos_adquiridos (uuid-123)                      ║
║ IP: 192.168.1.1                                            ║
║ Timestamp: 2025-10-07T15:30:45.123Z                       ║
╚════════════════════════════════════════════════════════════╝
```

---

## ✅ Checklist de Implementação

### Frontend:
- [ ] Importar `AuditLogger` nos componentes críticos
- [ ] Adicionar logs após operações bem-sucedidas
- [ ] **NUNCA** usar `console.log` para dados sensíveis
- [ ] Testar que logs NÃO aparecem no DevTools

### Backend:
- [ ] Edge function `audit-log` deployed
- [ ] Verificar autenticação obrigatória
- [ ] Testar formato JSON dos logs
- [ ] Configurar alertas para logs CRITICAL

### Segurança:
- [ ] Logs falham silenciosamente (sem expor erros)
- [ ] Validação de entrada na edge function
- [ ] Rate limiting para prevenir flood de logs
- [ ] Retenção de logs configurada (ex: 90 dias)

---

## 🔐 Exemplo de Implementação

### Antes (SEM auditoria):
```typescript
const handleSubmit = async () => {
  const { error } = await supabase
    .from("solicitacoes")
    .insert({ ...data });
  
  if (!error) toast.success("Sucesso!");
}
```

### Depois (COM auditoria):
```typescript
const handleSubmit = async () => {
  const { error } = await supabase
    .from("solicitacoes")
    .insert({ ...data });
  
  if (!error) {
    // ✅ Log invisível ao frontend
    await AuditLogger.logWithdrawalRequest(userId, planId, amount);
    toast.success("Sucesso!");
  }
}
```

---

## 📈 Métricas Sugeridas

### Dashboards de Auditoria:
1. **Solicitações por dia** (gráfico de linha)
2. **Ações críticas por admin** (tabela)
3. **Falhas de login** (alerta se > 5 em 1 hora)
4. **IPs suspeitos** (múltiplos acessos de locais diferentes)

### Alertas Automáticos:
- Email para admins em logs CRITICAL
- Notificação se padrão suspeito detectado
- Relatório semanal de atividades

---

**Sistema de auditoria completo e invisível ao frontend!** 🔒
