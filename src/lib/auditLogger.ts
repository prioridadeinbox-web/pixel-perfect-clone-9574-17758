import { supabase } from "@/integrations/supabase/client";

type AuditSeverity = 'info' | 'warning' | 'critical';

interface AuditLogParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
}

/**
 * Sistema de auditoria invisível ao frontend
 * Logs são enviados para edge function e armazenados no backend
 * NUNCA aparecem no console do navegador
 */
export class AuditLogger {
  private static async log(params: AuditLogParams): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Silenciosamente falhar se não houver sessão
        return;
      }

      // Enviar para edge function de auditoria (logs invisíveis)
      await supabase.functions.invoke('audit-log', {
        body: {
          action: params.action,
          resource_type: params.resourceType,
          resource_id: params.resourceId,
          old_value: params.oldValue,
          new_value: params.newValue,
          severity: params.severity || 'info',
          session_id: session.user.id,
          metadata: params.metadata
        }
      });
    } catch (error) {
      // Silenciosamente falhar - NUNCA mostrar erro ao usuário
      // Isso previne que hackers vejam falhas no sistema de auditoria
    }
  }

  // ================== AUTENTICAÇÃO ==================
  static async logLogin(userId?: string, method: string = 'email') {
    await this.log({
      action: 'user.login',
      resourceType: 'auth',
      resourceId: userId,
      severity: 'info',
      metadata: { method }
    });
  }

  static async logLogout(userId?: string) {
    await this.log({
      action: 'user.logout',
      resourceType: 'auth',
      resourceId: userId,
      severity: 'info'
    });
  }

  static async logFailedLogin(email: string, reason: string = 'Invalid credentials') {
    await this.log({
      action: 'user.login.failed',
      resourceType: 'auth',
      severity: 'warning',
      metadata: { email, reason }
    });
  }

  // ================== SOLICITAÇÕES ==================
  static async logWithdrawalRequest(amount?: number) {
    await this.log({
      action: 'solicitacao.saque.created',
      resourceType: 'solicitacoes',
      severity: 'warning',
      metadata: { amount }
    });
  }

  static async logBiweeklyWithdrawalRequest() {
    await this.log({
      action: 'solicitacao.quinzenal.created',
      resourceType: 'solicitacoes',
      severity: 'warning'
    });
  }

  static async logSecondChanceRequest() {
    await this.log({
      action: 'solicitacao.segunda_chance.created',
      resourceType: 'solicitacoes',
      severity: 'warning'
    });
  }

  static async logRequestStatusChange(
    requestId: string,
    oldStatus: string,
    newStatus: string,
    changedBy: string
  ) {
    await this.log({
      action: 'solicitacao.status.changed',
      resourceType: 'solicitacoes',
      resourceId: requestId,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus },
      severity: 'warning',
      metadata: { changed_by: changedBy }
    });
  }

  // ================== PLANOS ADQUIRIDOS ==================
  static async logPlanCreated(planId: string, clientId: string, adminId: string) {
    await this.log({
      action: 'plano_adquirido.created',
      resourceType: 'planos_adquiridos',
      resourceId: planId,
      severity: 'critical',
      metadata: { client_id: clientId, created_by: adminId }
    });
  }

  static async logPlanStatusChange(
    planId: string,
    oldStatus: string,
    newStatus: string,
    changedBy: string
  ) {
    await this.log({
      action: 'plano_adquirido.status.changed',
      resourceType: 'planos_adquiridos',
      resourceId: planId,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus },
      severity: 'critical',
      metadata: { changed_by: changedBy }
    });
  }

  static async logPlanDeleted(planId: string, deletedBy: string) {
    await this.log({
      action: 'plano_adquirido.deleted',
      resourceType: 'planos_adquiridos',
      resourceId: planId,
      severity: 'critical',
      metadata: { deleted_by: deletedBy }
    });
  }

  // ================== PERFIL E DADOS SENSÍVEIS ==================
  static async logProfileUpdate() {
    await this.log({
      action: 'profile.updated',
      resourceType: 'profiles',
      severity: 'info'
    });
  }

  static async logPasswordChange(userId?: string, changedBy?: string) {
    await this.log({
      action: 'user.password.changed',
      resourceType: 'auth',
      resourceId: userId,
      severity: 'critical',
      metadata: { changed_by: changedBy }
    });
  }

  static async logPaymentStatusChange(
    userId: string,
    oldStatus: boolean,
    newStatus: boolean,
    changedBy: string
  ) {
    await this.log({
      action: 'user.payment_status.changed',
      resourceType: 'profiles',
      resourceId: userId,
      oldValue: { pagamento_ativo: oldStatus },
      newValue: { pagamento_ativo: newStatus },
      severity: 'critical',
      metadata: { changed_by: changedBy }
    });
  }

  // ================== DOCUMENTOS ==================
  static async logDocumentUpload(userId: string, documentType: string, fileUrl: string) {
    await this.log({
      action: 'document.uploaded',
      resourceType: 'user_documents',
      resourceId: userId,
      severity: 'info',
      metadata: { document_type: documentType, file_url: fileUrl }
    });
  }

  // ================== ACESSO ADMINISTRATIVO ==================
  static async logAdminAccess(adminId: string, accessedPage: string) {
    await this.log({
      action: 'admin.page.accessed',
      resourceType: 'admin',
      resourceId: adminId,
      severity: 'warning',
      metadata: { page: accessedPage }
    });
  }

  static async logAdminAction(
    adminId: string,
    action: string,
    targetResource: string,
    targetId: string
  ) {
    await this.log({
      action: `admin.${action}`,
      resourceType: targetResource,
      resourceId: targetId,
      severity: 'critical',
      metadata: { admin_id: adminId }
    });
  }

  // ================== TENTATIVAS DE ACESSO NÃO AUTORIZADO ==================
  static async logUnauthorizedAccess(
    attemptedResource: string,
    userId?: string
  ) {
    await this.log({
      action: 'security.unauthorized_access',
      resourceType: attemptedResource,
      resourceId: userId || 'anonymous',
      severity: 'critical',
      metadata: { attempted_at: new Date().toISOString() }
    });
  }

  // ================== OBSERVAÇÕES / COMENTÁRIOS ==================
  static async logCommentAdded(
    planId: string,
    comment: string,
    addedBy: string
  ) {
    await this.log({
      action: 'observacao.created',
      resourceType: 'historico_observacoes',
      resourceId: planId,
      severity: 'info',
      metadata: { 
        added_by: addedBy,
        comment_preview: comment.substring(0, 100)
      }
    });
  }
}
