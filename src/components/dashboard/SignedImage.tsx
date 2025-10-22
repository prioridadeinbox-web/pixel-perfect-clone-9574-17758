import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ActivityLogger } from "@/lib/activityLogger";

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
      const started = performance.now?.() || Date.now();
      try {
        const path = getPath(pathOrUrl);
        const pdf = isPdf(pathOrUrl);
        console.debug("[SignedImage] start", { pathOrUrl, path, pdf });
        if (!path) { 
          console.warn("[SignedImage] empty path", { pathOrUrl });
          return; 
        }
        await ActivityLogger.log("document.signed_url.requested", "documentos", { path, pdf, source: "SignedImage" });

        const { data, error } = await supabase.storage
          .from("documentos")
          .createSignedUrl(path, 60 * 30);

        if (error || !data?.signedUrl) {
          console.warn("[SignedImage] signed URL error", { path, error });
          await ActivityLogger.log("document.signed_url.error", "documentos", { path, pdf, error: String(error) });
          const isAbs = /^https?:\/\//i.test(pathOrUrl);
          if (!cancelled) {
            if (isAbs) {
              setSignedUrl(pathOrUrl);
            } else {
              const { data: pub } = supabase.storage.from("documentos").getPublicUrl(path);
              setSignedUrl(pub.publicUrl || "");
            }
          }
        } else {
          if (!cancelled) setSignedUrl(data.signedUrl);
          await ActivityLogger.log("document.signed_url.success", "documentos", { path, pdf, duration_ms: Math.round((performance.now?.() || Date.now()) - started) });
        }
      } catch (e) {
        console.error("[SignedImage] unexpected error", e);
        await ActivityLogger.log("document.signed_url.exception", "documentos", { error: String(e), source: "SignedImage" });
        if (!cancelled) setSignedUrl("");
      }
    })();
    return () => { cancelled = true; };
  }, [pathOrUrl]);

  if (isPdf(pathOrUrl)) {
    return (
      <div className="p-4 flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">Arquivo PDF</p>
        <Button asChild disabled={!signedUrl}>
          <a href={signedUrl || undefined} target="_blank" rel="noopener noreferrer">
            {signedUrl ? "Abrir PDF em nova guia" : "Gerando link seguro..."}
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
