import { useEffect, useState } from "react";
import { FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
interface DocumentViewDialogProps {
  tipo: 'cnh' | 'selfie_rg';
  label: string;
  hasDocument: boolean;
  documents: { id: string; arquivo_url: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadClick: () => void;
  onDelete: (docId: string, url: string) => void;
}

export const DocumentViewDialog = ({ 
  tipo, 
  label, 
  hasDocument, 
  documents,
  open,
  onOpenChange,
  onUploadClick,
  onDelete
}: DocumentViewDialogProps) => {
  const [signedMap, setSignedMap] = useState<Record<string, string>>({});

  const getPath = (value: string) =>
    value.includes('/documentos/') ? value.split('/documentos/')[1] : value;
  const isPdf = (value: string) => getPath(value).toLowerCase().endsWith('.pdf');

  useEffect(() => {
    if (!open || !(documents?.length)) { setSignedMap({}); return; }
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        documents.map(async (doc) => {
          try {
            const path = getPath(doc.arquivo_url);
            const { data } = await supabase.storage
              .from('documentos')
              .createSignedUrl(path, 60 * 30); // 30 minutos
            return [doc.id, data?.signedUrl || doc.arquivo_url] as const;
          } catch {
            return [doc.id, doc.arquivo_url] as const;
          }
        })
      );
      if (!cancelled) setSignedMap(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [open, documents]);

  return (
    <>
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-foreground/70" />
        <button
          type="button"
          onClick={onUploadClick}
          className={`text-sm underline transition-colors ${
            hasDocument
              ? 'text-green-600 hover:text-green-700'
              : 'text-red-600 hover:text-red-700'
          }`}
        >
          {label}
        </button>
        <span className={`text-xs ${hasDocument ? 'text-green-600' : 'text-muted-foreground'}`}>
          {hasDocument ? 'Anexado' : 'Pendente'}
        </span>
        {hasDocument && documents?.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(true)}
            className="h-8 px-2"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Visualizar {label}</DialogTitle>
            <DialogDescription>
              {hasDocument && (documents?.length ?? 0) > 0 ? 'Documento(s) anexado(s). Você pode visualizar abaixo ou abrir em nova guia.' : 'Nenhum documento foi anexado ainda.'}
            </DialogDescription>
          </DialogHeader>
          <div className="w-full max-h-[600px] overflow-auto bg-muted rounded-lg p-4">
            {documents && documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="relative bg-background rounded-md overflow-hidden border">
                    {getPath(doc.arquivo_url).toLowerCase().endsWith('.pdf') ? (
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm text-foreground">Arquivo PDF</span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={signedMap[doc.id] || doc.arquivo_url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${label}`}>
                              <Eye className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => onDelete(doc.id, doc.arquivo_url)}>
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <img
                          src={signedMap[doc.id] || doc.arquivo_url}
                          alt={label}
                          className="w-full h-64 object-contain bg-muted"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={signedMap[doc.id] || doc.arquivo_url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${label}`}>
                              <Eye className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => onDelete(doc.id, doc.arquivo_url)}>
                            Excluir
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum documento disponível</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
