import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ManualTimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planoAdquiridoId: string;
  onSuccess: () => void;
}

export const ManualTimelineDialog = ({ 
  open, 
  onOpenChange, 
  planoAdquiridoId,
  onSuccess 
}: ManualTimelineDialogProps) => {
  const [observacao, setObservacao] = useState('');
  const [status, setStatus] = useState('pendente');
  const [uploading, setUploading] = useState(false);
  const [comprovanteUrl, setComprovanteUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `comprovantes/${fileName}`;

      const { error: uploadError } = await supabase.storage
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

  const handleSubmit = async () => {
    if (!observacao.trim()) {
      toast.error("A observação é obrigatória");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('historico_observacoes')
        .insert({
          plano_adquirido_id: planoAdquiridoId,
          observacao: observacao,
          status_evento: status,
          comprovante_url: comprovanteUrl || null,
          tipo_evento: 'manual_admin',
          origem: 'admin'
        });

      if (error) throw error;

      toast.success("Entrada adicionada à linha do tempo!");
      
      // Reset form
      setObservacao('');
      setStatus('pendente');
      setComprovanteUrl('');
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Linha na Timeline</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Observação *</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Descreva a observação..."
              rows={4}
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
            <Label>Comprovante (opcional)</Label>
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
              <p className="text-sm text-primary mt-2">✓ Comprovante anexado</p>
            )}
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={loading || !observacao.trim()}
            className="w-full"
          >
            {loading ? 'Adicionando...' : 'Adicionar à Timeline'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};