import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ActivityLogger } from "@/lib/activityLogger";

interface AdminDocumentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string;
  documentType: string;
}

export const AdminDocumentViewDialog = ({
  open,
  onOpenChange,
  documentUrl,
  documentType,
}: AdminDocumentViewDialogProps) => {
  const [signedUrl, setSignedUrl] = useState<string>("");

  const getPath = (value: string) =>
    value.includes('/documentos/') ? value.split('/documentos/')[1] : value;

  useEffect(() => {
    if (!open || !documentUrl) {
      setSignedUrl("");
      return;
    }

    const loadSignedUrl = async () => {
      const started = performance.now?.() || Date.now();
      try {
        const path = getPath(documentUrl);
        console.debug("[AdminDocumentViewDialog] request", { documentUrl, path });
        await ActivityLogger.log("document.signed_url.requested", "documentos", { path, source: "AdminDocumentViewDialog" });
        const { data, error } = await supabase.storage
          .from('documentos')
          .createSignedUrl(path, 60 * 30); // 30 minutos
        if (error || !data?.signedUrl) {
          console.warn("[AdminDocumentViewDialog] signed URL error", { path, error });
          await ActivityLogger.log("document.signed_url.error", "documentos", { path, error: String(error), source: "AdminDocumentViewDialog" });
          setSignedUrl(documentUrl);
        } else {
          setSignedUrl(data.signedUrl);
          await ActivityLogger.log("document.signed_url.success", "documentos", { path, duration_ms: Math.round((performance.now?.() || Date.now()) - started), source: "AdminDocumentViewDialog" });
        }
      } catch (e) {
        console.error("[AdminDocumentViewDialog] unexpected error", e);
        await ActivityLogger.log("document.signed_url.exception", "documentos", { error: String(e), source: "AdminDocumentViewDialog" });
        setSignedUrl(documentUrl);
      }
    };

    loadSignedUrl();
  }, [open, documentUrl]);

  const isPdf = getPath(documentUrl).toLowerCase().endsWith('.pdf');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Visualizar {documentType}</DialogTitle>
        </DialogHeader>
        <div className="w-full max-h-[600px] overflow-auto bg-muted rounded-lg p-4">
          {isPdf ? (
            <div className="p-4 flex flex-col items-center gap-4">
              <span className="text-sm text-foreground">Arquivo PDF</span>
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Abrir em nova aba
              </a>
            </div>
          ) : (
            <img
              src={signedUrl}
              alt={documentType}
              className="w-full h-auto object-contain bg-muted"
              loading="lazy"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
