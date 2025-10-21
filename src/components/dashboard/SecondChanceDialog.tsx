import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuditLogger } from "@/lib/auditLogger";
import { X } from "lucide-react";

interface SecondChanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
}

export const SecondChanceDialog = ({
  open,
  onOpenChange,
  planId,
}: SecondChanceDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: solicitacao, error } = await supabase
        .from("solicitacoes")
        .insert({
          user_id: user.id,
          plano_adquirido_id: planId,
          tipo_solicitacao: "segunda_chance",
          descricao: "Solicitação de segunda chance no teste",
        })
        .select()
        .single();

      if (error) throw error;


      await AuditLogger.logSecondChanceRequest();
      toast.success("Solicitação enviada com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao enviar solicitação: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white p-12">
        <div className="flex flex-col items-center text-center space-y-8">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-4xl font-bold text-foreground leading-tight">
              Deseja solicitar a segunda chance no teste?
            </DialogTitle>
          </DialogHeader>

          <p className="text-foreground/80 text-lg max-w-md">
            Caso esteja em um plano com teste e queira recomeçar, pode solicitar por aqui!
          </p>

          <Button
            onClick={handleRequest}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-xl px-16 py-7 rounded-xl uppercase"
          >
            {loading ? "PROCESSANDO..." : "QUERO RECOMEÇAR"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
