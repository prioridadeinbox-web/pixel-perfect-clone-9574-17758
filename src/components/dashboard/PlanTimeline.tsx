import { useState, useEffect } from "react";
import { Paperclip, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface TimelineEntry {
  id: string;
  created_at: string;
  tipo_evento: string;
  valor_solicitado: number | null;
  valor_final: number | null;
  status_evento: string;
  comprovante_url: string | null;
  observacao: string;
  origem?: string;
}

interface PlanTimelineProps {
  entries: TimelineEntry[];
}

export const PlanTimeline = ({ entries }: PlanTimelineProps) => {
  const [viewingDocument, setViewingDocument] = useState(false);
  const [signedUrl, setSignedUrl] = useState('');
  const [currentDocUrl, setCurrentDocUrl] = useState('');

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

  // Criar signed URL quando o dialog abre
  useEffect(() => {
    if (!viewingDocument || !currentDocUrl) {
      setSignedUrl('');
      return;
    }

    let cancelled = false;
    
    (async () => {
      try {
        const path = getPath(currentDocUrl);
        const { data, error } = await supabase.storage
          .from('documentos')
          .createSignedUrl(path, 60 * 30); // 30 minutos

        if (!cancelled) {
          if (error) {
            console.error('Erro ao criar signed URL:', error);
            setSignedUrl(currentDocUrl);
          } else {
            setSignedUrl(data?.signedUrl || currentDocUrl);
          }
        }
      } catch (error) {
        console.error('Erro geral ao visualizar documento:', error);
        if (!cancelled) {
          setSignedUrl(currentDocUrl);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewingDocument, currentDocUrl]);

  if (!entries || entries.length === 0) {
    return (
      <div className="text-sm text-foreground/70">Nenhuma solicitação.</div>
    );
  }

  const handleViewDocument = (comprovanteUrl: string) => {
    setCurrentDocUrl(comprovanteUrl);
    setViewingDocument(true);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pendente': 'Pendente',
      'aprovado': 'Aprovado',
      'recusado': 'Negado - Fora do ciclo',
      'efetuado': 'Efetuado',
      'negado': 'Negado - Sem saldo'
    };
    return statusMap[status] || status;
  };

  const getEventLabel = (tipoEvento: string) => {
    if (tipoEvento === 'aprovacao_solicitada') {
      return 'Aprovação solicitada';
    }
    return null;
  };

  return (
    <div className="text-sm text-foreground space-y-2">
      {entries.map((entry) => {
        const eventLabel = getEventLabel(entry.tipo_evento);
        
        // Determinar o conteúdo a exibir: observacao ou tipo_evento
        const displayText = entry.observacao || eventLabel;
        
        // Não exibir a entrada se não houver conteúdo significativo
        if (!displayText && !entry.valor_solicitado && !entry.valor_final && !entry.comprovante_url) {
          return null;
        }
        
        const isAdmin = entry.origem === 'admin';
        
        return (
          <div key={entry.id} className="flex items-start gap-2">
            <span className="font-medium shrink-0">
              {new Date(entry.created_at).toLocaleDateString('pt-BR')}
            </span>
            <span className="shrink-0">|</span>
            <div className="flex items-center gap-2 flex-wrap">
              {displayText && (
                <>
                  <span className={isAdmin ? "font-medium" : ""}>{displayText}</span>
                  <span>|</span>
                </>
              )}
              {entry.valor_solicitado && (
                <>
                  <span>Valor solicitado: {formatCurrency(entry.valor_solicitado)}</span>
                  <span>|</span>
                </>
              )}
              {entry.valor_final && (
                <>
                  <span>Valor final: {formatCurrency(entry.valor_final)}</span>
                  <span>|</span>
                </>
              )}
              <span>Status: <span className="font-bold">{getStatusLabel(entry.status_evento)}</span></span>
              {entry.comprovante_url && (
                <>
                  <span>|</span>
                  <button
                    onClick={() => handleViewDocument(entry.comprovante_url!)}
                    className="inline-flex items-center gap-1 hover:opacity-70 text-primary cursor-pointer"
                    title="Ver comprovante"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Ver Anexo</span>
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Dialog de visualização do comprovante */}
      <Dialog open={viewingDocument} onOpenChange={setViewingDocument}>
        <DialogContent className="sm:max-w-3xl" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>Visualizar Comprovante</DialogTitle>
            <DialogDescription>
              Visualização do documento anexado
            </DialogDescription>
          </DialogHeader>
          <div id="dialog-description" className="w-full max-h-[600px] overflow-auto bg-muted rounded-lg p-4">
            {currentDocUrl && isPdf(currentDocUrl) ? (
              <div className="p-4 flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground">Arquivo PDF</p>
                <Button asChild>
                  <a href={signedUrl || currentDocUrl} target="_blank" rel="noopener noreferrer">
                    Abrir PDF em nova guia
                  </a>
                </Button>
              </div>
            ) : currentDocUrl ? (
              <img
                src={signedUrl || currentDocUrl}
                alt="Comprovante"
                className="w-full h-auto object-contain"
                loading="lazy"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
