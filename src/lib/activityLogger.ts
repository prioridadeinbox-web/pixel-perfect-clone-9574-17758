import { supabase } from "@/integrations/supabase/client";

export class ActivityLogger {
  static async log(action: string, resource: string, details: any = {}) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('No session found for activity logging');
        return;
      }

      await supabase.functions.invoke('log-all-activity', {
        body: {
          action,
          resource,
          details,
          userId: session.user.id
        }
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw - logging failures shouldn't break the app
    }
  }

  // Convenience methods for common actions
  static async logLogin() {
    await this.log('user.login', 'auth', {});
  }

  static async logLogout() {
    await this.log('user.logout', 'auth', {});
  }

  static async logPlanoCreated(planoData: any) {
    await this.log('plano.created', 'planos_adquiridos', planoData);
  }

  static async logPlanoUpdated(planoId: string, changes: any) {
    await this.log('plano.updated', 'planos_adquiridos', { id: planoId, changes });
  }

  static async logPlanoDeleted(planoId: string) {
    await this.log('plano.deleted', 'planos_adquiridos', { id: planoId });
  }

  static async logSolicitacaoCreated(tipo: string, details: any) {
    await this.log('solicitacao.created', 'solicitacoes', { tipo, ...details });
  }

  static async logSolicitacaoUpdated(solicitacaoId: string, status: string) {
    await this.log('solicitacao.updated', 'solicitacoes', { id: solicitacaoId, status });
  }

  static async logProfileUpdated(changes: any) {
    await this.log('profile.updated', 'profiles', changes);
  }

  static async logDocumentUploaded(tipo: string) {
    await this.log('document.uploaded', 'user_documents', { tipo });
  }

  static async logDocumentDeleted(documentId: string) {
    await this.log('document.deleted', 'user_documents', { id: documentId });
  }

  static async logPaymentStatusChanged(traderId: string, newStatus: boolean) {
    await this.log('trader.payment_status_changed', 'profiles', { 
      traderId, 
      newStatus: newStatus ? 'active' : 'inactive' 
    });
  }

  static async logPasswordChanged(targetUserId: string) {
    await this.log('user.password_changed', 'auth', { targetUserId });
  }
}