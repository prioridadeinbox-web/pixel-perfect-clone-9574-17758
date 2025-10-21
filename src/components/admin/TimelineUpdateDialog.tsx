import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface TimelineUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timelineEntry: any;
  onUpdate: () => void;
}

export const TimelineUpdateDialog = ({ 
  open, 
  onOpenChange, 
  timelineEntry,
  onUpdate 
}: TimelineUpdateDialogProps) => {
  const [valorFinal, setValorFinal] = useState(timelineEntry?.valor_final || '');
  const [status, setStatus] = useState(timelineEntry?.status_evento || 'pendente');
  const [uploading, setUploading] = useState(false);
  const [comprovanteUrl, setComprovanteUrl] = useState(timelineEntry?.comprovante_url || '');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `comprovantes/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('documentos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);

      setComprovanteUrl(publicUrl);
      toast.success("Comprovante enviado com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('historico_observacoes')
        .update({
          valor_final: valorFinal ? parseFloat(valorFinal) : null,
          status_evento: status,
          comprovante_url: comprovanteUrl || null
        })
        .eq('id', timelineEntry.id);

      if (error) throw error;

      // Atualizar também a solicitação se houver
      if (timelineEntry.solicitacao_id) {
        await supabase
          .from('solicitacoes')
          .update({
            status: status,
            resposta_admin: `Valor final: R$ ${valorFinal || '0,00'}`
          })
          .eq('id', timelineEntry.solicitacao_id);
      }

      toast.success("Linha do tempo atualizada com sucesso!");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Responder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Valor Solicitado</Label>
            <Input
              type="text"
              value={timelineEntry?.valor_solicitado ? 
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(timelineEntry.valor_solicitado) 
                : '-'}
              disabled
              className="bg-muted"
            />
          </div>

          <div>
            <Label>Valor Final</Label>
            <Input
              type="number"
              step="0.01"
              value={valorFinal}
              onChange={(e) => setValorFinal(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="efetuado">Efetuado</SelectItem>
                <SelectItem value="recusado">Negado - Fora do ciclo</SelectItem>
                <SelectItem value="negado">Negado - Sem saldo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Comprovante</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {uploading && <span className="text-sm text-muted-foreground">Enviando...</span>}
            </div>
            {comprovanteUrl && (
              <a 
                href={comprovanteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
              >
                <Upload className="w-3 h-3" />
                Ver comprovante anexado
              </a>
            )}
          </div>

          <Button 
            onClick={handleUpdate} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Salvando...' : 'Salvar Atualização'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
