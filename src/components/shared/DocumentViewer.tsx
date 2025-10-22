import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  title?: string;
  description?: string;
}

// Extrai o path do objeto no bucket a partir de diferentes formatos possíveis
const getPath = (value: string) => {
  if (!value) return "";
  if (value.includes("/public/documentos/")) return value.split("/public/documentos/")[1];
  if (value.includes("/documentos/")) return value.split("/documentos/")[1];
  return value; // já é apenas o path
};

const isPdf = (value: string) => getPath(value).toLowerCase().endsWith(".pdf");

export const DocumentViewer = ({ open, onOpenChange, url, title = "Visualizar Comprovante", description = "Visualização do documento anexado" }: DocumentViewerProps) => {
  const [signedUrl, setSignedUrl] = useState("");

  useEffect(() => {
    if (!open || !url) { setSignedUrl(""); return; }

    let cancelled = false;
    (async () => {
      try {
        const path = getPath(url);
        if (!path) { setSignedUrl(""); return; }
        const { data, error } = await supabase.storage
          .from("documentos")
          .createSignedUrl(path, 60 * 30);
        if (!cancelled) setSignedUrl(error ? "" : (data?.signedUrl || ""));
      } catch {
        if (!cancelled) setSignedUrl("");
      }
    })();

    return () => { cancelled = true; };
  }, [open, url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl" aria-describedby="doc-viewer-description">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div id="doc-viewer-description" className="w-full max-h-[600px] overflow-auto bg-muted rounded-lg p-4">
          {url && isPdf(url) ? (
            <div className="p-4 flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">Arquivo PDF</p>
              <Button asChild>
                <a href={signedUrl || undefined} target="_blank" rel="noopener noreferrer">
                  Abrir PDF em nova guia
                </a>
              </Button>
            </div>
          ) : url ? (
            signedUrl ? (
              <img src={signedUrl} alt="Comprovante" className="w-full h-auto object-contain" loading="lazy" />
            ) : (
              <div className="w-full h-48 flex items-center justify-center text-sm text-muted-foreground bg-muted rounded-md">
                Carregando anexo...
              </div>
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
