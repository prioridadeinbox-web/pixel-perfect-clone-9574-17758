import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

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
      try {
        const path = getPath(documentUrl);
        const { data } = await supabase.storage
          .from('documentos')
          .createSignedUrl(path, 60 * 30); // 30 minutos
        
        setSignedUrl(data?.signedUrl || documentUrl);
      } catch {
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
