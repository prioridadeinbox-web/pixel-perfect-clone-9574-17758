import { useState } from "react";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SignedImage } from "@/components/dashboard/SignedImage";

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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentDocUrl, setCurrentDocUrl] = useState<string | null>(null);

  if (!entries || entries.length === 0) {
    return (
      <div className="text-sm text-foreground/70">Nenhuma solicitação.</div>
    );
  }

  const handleViewDocument = (comprovanteUrl: string) => {
    setCurrentDocUrl(comprovanteUrl);
    setViewerOpen(true);
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

      {/* Dialog idêntico ao admin */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="sm:max-w-3xl" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>Visualizar Comprovante</DialogTitle>
            <DialogDescription>
              Visualização do documento anexado
            </DialogDescription>
          </DialogHeader>
          <div id="dialog-description" className="w-full max-h-[600px] overflow-auto bg-muted rounded-lg p-4">
            {currentDocUrl ? (
              <SignedImage pathOrUrl={currentDocUrl} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
