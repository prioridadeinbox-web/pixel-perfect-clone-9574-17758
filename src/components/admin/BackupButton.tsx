import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const BackupButton = () => {
  const [downloading, setDownloading] = useState(false);

  const handleBackup = async () => {
    setDownloading(true);
    try {
      const { data: profiles, error: errProfiles } = await supabase.from("profiles").select("*");
      if (errProfiles) throw errProfiles;

      const { data: planosAdquiridos, error: errPlanos } = await supabase.from("planos_adquiridos").select("*");
      if (errPlanos) throw errPlanos;

      const { data: config, error: errConfig } = await supabase.from("platform_config").select("*");
      if (errConfig) throw errConfig;

      const backupData = {
        timestamp: new Date().toISOString(),
        profiles,
        planos_adquiridos: planosAdquiridos,
        platform_config: config,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_sistema_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Backup realizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao realizar backup:", error);
      toast.error("Erro ao realizar backup: " + error.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBackup}
      disabled={downloading}
      className="text-muted-foreground hover:text-foreground text-xs font-normal"
    >
      <Download className="mr-2 h-3 w-3" />
      {downloading ? "Gerando Backup..." : "Fazer Backup do Sistema"}
    </Button>
  );
};
