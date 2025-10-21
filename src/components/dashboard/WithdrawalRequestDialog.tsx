import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuditLogger } from "@/lib/auditLogger";
import { X } from "lucide-react";

interface WithdrawalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
}

export const WithdrawalRequestDialog = ({
  open,
  onOpenChange,
  planId,
}: WithdrawalRequestDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    cpf: "",
    valorSaque: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: solicitacao, error } = await supabase
        .from("solicitacoes")
        .insert({
          user_id: user.id,
          plano_adquirido_id: planId,
          tipo_solicitacao: "saque",
          descricao: `Solicitação de saque - Nome: ${formData.nomeCompleto}, CPF: ${formData.cpf}, Valor: R$ ${formData.valorSaque}`,
        })
        .select()
        .single();

      if (error) throw error;


      await AuditLogger.logWithdrawalRequest(parseFloat(formData.valorSaque));
      toast.success("Solicitação de saque enviada com sucesso!");
      onOpenChange(false);
      setFormData({ nomeCompleto: "", cpf: "", valorSaque: "" });
    } catch (error: any) {
      toast.error("Erro ao enviar solicitação: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white p-12">
        <div className="space-y-8">
          <DialogHeader>
            <DialogTitle className="text-4xl font-bold text-foreground">
              Solicitação de Saque
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome completo */}
            <div className="space-y-3">
              <Label htmlFor="nomeCompleto" className="text-foreground text-lg font-normal">
                Nome completo
              </Label>
              <Input
                id="nomeCompleto"
                type="text"
                required
                value={formData.nomeCompleto}
                onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                className="h-14 text-base border-input bg-muted/50 rounded-xl"
              />
            </div>

            {/* CPF e Valor do saque lado a lado */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="cpf" className="text-foreground text-lg font-normal">
                  CPF
                </Label>
                <Input
                  id="cpf"
                  type="text"
                  required
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })}
                  className="h-14 text-base border-input bg-muted/50 rounded-xl"
                  maxLength={11}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="valorSaque" className="text-foreground text-lg font-normal">
                  Valor do saque
                </Label>
                <Input
                  id="valorSaque"
                  type="number"
                  required
                  step="0.01"
                  value={formData.valorSaque}
                  onChange={(e) => setFormData({ ...formData, valorSaque: e.target.value })}
                  className="h-14 text-base border-input bg-muted/50 rounded-xl"
                />
              </div>
            </div>

            {/* Botão e texto */}
            <div className="flex items-start gap-8 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xl px-12 py-7 rounded-xl uppercase shrink-0"
              >
                {loading ? "PROCESSANDO..." : "SOLICITAR SAQUE"}
              </Button>

              <p className="text-foreground/70 text-sm leading-relaxed pt-2">
                Ao solicitar o saque, você está de acordo com o regulamento e está ciente que o PIX irá ser enviado na chave CPF.
              </p>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
