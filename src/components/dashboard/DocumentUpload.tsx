import { useState } from "react";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentUploadProps {
  userId: string;
  onUploadComplete: () => void;
}

type DocumentType = "cnh" | "selfie_rg";

export const DocumentUpload = ({ userId, onUploadComplete }: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipo: DocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG, WEBP ou PDF");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Tamanho máximo: 10MB");
      return;
    }

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${tipo}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store ONLY the storage path (bucket is private)
      const storagePath = fileName;

      // Save to database
      const { error: dbError } = await supabase
        .from("user_documents")
        .insert({
          user_id: userId,
          tipo_documento: tipo,
          arquivo_url: storagePath,
          status: "pendente",
        });

      if (dbError) throw dbError;

      toast.success("Documento enviado com sucesso!");
      onUploadComplete();
    } catch (error: any) {
      toast.error("Erro ao enviar documento: " + error.message);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center gap-6">
      <label className="flex items-center gap-2 cursor-pointer text-foreground hover:text-primary transition-colors">
        <input
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(e) => handleFileUpload(e, "cnh")}
          disabled={uploading}
        />
        <span className="text-sm underline">Clique para anexar CNH, RG ou CPF</span>
      </label>
      
      <label className="flex items-center gap-2 cursor-pointer text-foreground hover:text-primary transition-colors">
        <input
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(e) => handleFileUpload(e, "selfie_rg")}
          disabled={uploading}
        />
        <span className="text-sm underline">Clique para anexar selfie com RG</span>
      </label>
    </div>
  );
};
