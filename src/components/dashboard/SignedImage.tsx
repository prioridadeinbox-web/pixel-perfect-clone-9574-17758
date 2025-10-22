import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SignedImageProps {
  pathOrUrl: string;
}

const getPath = (value: string) => {
  if (!value) return "";
  if (value.includes("/public/documentos/")) return value.split("/public/documentos/")[1];
  if (value.includes("/documentos/")) return value.split("/documentos/")[1];
  return value;
};

const isPdf = (value: string) => getPath(value).toLowerCase().endsWith(".pdf");

export const SignedImage = ({ pathOrUrl }: SignedImageProps) => {
  const [signedUrl, setSignedUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path = getPath(pathOrUrl);
        if (!path) return;
        const { data, error } = await supabase.storage
          .from("documentos")
          .createSignedUrl(path, 60 * 30);
        if (!cancelled) setSignedUrl(error ? "" : (data?.signedUrl || ""));
      } catch {
        if (!cancelled) setSignedUrl("");
      }
    })();
    return () => { cancelled = true; };
  }, [pathOrUrl]);

  if (isPdf(pathOrUrl)) {
    return (
      <div className="p-4 flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">Arquivo PDF</p>
        <Button asChild>
          <a href={signedUrl || undefined} target="_blank" rel="noopener noreferrer">
            Abrir PDF em nova guia
          </a>
        </Button>
      </div>
    );
  }

  return signedUrl ? (
    <img src={signedUrl} alt="Comprovante" className="w-full h-auto object-contain" loading="lazy" />
  ) : (
    <div className="w-full h-48 flex items-center justify-center text-sm text-muted-foreground bg-muted rounded-md">
      Carregando anexo...
    </div>
  );
};
