import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, X } from "lucide-react";

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
  const [viewingDocument, setViewingDocument] = useState(false);
  const [signedUrl, setSignedUrl] = useState('');

  const getPath = (value: string) => {
    // Se for uma URL pública antiga, extrair o path
    if (value.includes('/public/documentos/')) {
      return value.split('/public/documentos/')[1];
    }
    // Se for uma URL com signed, extrair o path
    if (value.includes('/documentos/')) {
      return value.split('/documentos/')[1];
    }
    // Se já for apenas o path
    return value;
  };
  
  const isPdf = (value: string) => getPath(value).toLowerCase().endsWith('.pdf');

  // Criar signed URL quando o dialog de visualização abre
  useEffect(() => {
    if (!viewingDocument || !comprovanteUrl) {
      setSignedUrl('');
      return;
    }

    let cancelled = false;
    
    (async () => {
      try {
        const path = getPath(comprovanteUrl);
        const { data, error } = await supabase.storage
          .from('documentos')
          .createSignedUrl(path, 60 * 30); // 30 minutos

        if (!cancelled) {
          if (error) {
            console.error('Erro ao criar signed URL:', error);
            setSignedUrl(comprovanteUrl);
          } else {
            setSignedUrl(data?.signedUrl || comprovanteUrl);
          }
        }
      } catch (error) {
        console.error('Erro geral ao visualizar documento:', error);
        if (!cancelled) {
          setSignedUrl(comprovanteUrl);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewingDocument, comprovanteUrl]);

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

      // Salvar apenas o caminho do storage (bucket privado)
      setComprovanteUrl(filePath);
      toast.success("Comprovante enviado com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = () => {
    setViewingDocument(true);
  };

  const handleRemoveDocument = () => {
    setComprovanteUrl('');
    setSignedUrl('');
    toast.success("Comprovante removido");
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
            {!comprovanteUrl ? (
              <div className="flex gap-2">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {uploading && <span className="text-sm text-muted-foreground">Enviando...</span>}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <p className="text-sm text-primary flex-1">✓ Comprovante anexado</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleViewDocument}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveDocument}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
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

      {/* Dialog de visualização do comprovante */}
      <Dialog open={viewingDocument} onOpenChange={setViewingDocument}>
        <DialogContent className="sm:max-w-3xl" aria-describedby="comprovante-description">
          <DialogHeader>
            <DialogTitle>Visualizar Comprovante</DialogTitle>
            <DialogDescription>
              Visualização do documento anexado
            </DialogDescription>
          </DialogHeader>
          <div id="comprovante-description" className="w-full max-h-[600px] overflow-auto bg-muted rounded-lg p-4">
            {comprovanteUrl && isPdf(comprovanteUrl) ? (
              <div className="p-4 flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground">Arquivo PDF</p>
                <Button asChild>
                  <a href={signedUrl || comprovanteUrl} target="_blank" rel="noopener noreferrer">
                    Abrir PDF em nova guia
                  </a>
                </Button>
              </div>
            ) : comprovanteUrl ? (
              <img
                src={signedUrl || comprovanteUrl}
                alt="Comprovante"
                className="w-full h-auto object-contain"
                loading="lazy"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};