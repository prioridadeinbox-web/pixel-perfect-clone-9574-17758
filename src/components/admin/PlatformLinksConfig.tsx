import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "lucide-react";

export const PlatformLinksConfig = () => {
  const [profitOneLink, setProfitOneLink] = useState("");
  const [profitProLink, setProfitProLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_config")
        .select("*")
        .in("config_key", ["profit_one_link", "profit_pro_link"]);

      if (error) throw error;

      const oneLink = data?.find(c => c.config_key === "profit_one_link");
      const proLink = data?.find(c => c.config_key === "profit_pro_link");

      setProfitOneLink(oneLink?.config_value || "");
      setProfitProLink(proLink?.config_value || "");
    } catch (error: any) {
      toast.error("Erro ao carregar links: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Normaliza a URL adicionando https:// se necessário
  const normalizeUrl = (url: string): string => {
    if (!url || url.trim() === "") return "";
    
    const trimmedUrl = url.trim();
    
    // Se já tem protocolo, retorna como está
    if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
      return trimmedUrl;
    }
    
    // Adiciona https:// automaticamente
    return `https://${trimmedUrl}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Normaliza as URLs antes de salvar
      const normalizedProfitOne = normalizeUrl(profitOneLink);
      const normalizedProfitPro = normalizeUrl(profitProLink);

      const updates = [
        {
          config_key: "profit_one_link",
          config_value: normalizedProfitOne,
        },
        {
          config_key: "profit_pro_link",
          config_value: normalizedProfitPro,
        },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_config")
          .upsert(update, { onConflict: "config_key" });

        if (error) throw error;
      }

      // Atualiza os estados com as URLs normalizadas
      setProfitOneLink(normalizedProfitOne);
      setProfitProLink(normalizedProfitPro);

      toast.success("Links atualizados com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar links: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Carregando configurações...</div>;
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Link className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Configurar Links de Ativação</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profitOne">Link do botão "ATIVAR PROFIT ONE"</Label>
          <Input
            id="profitOne"
            type="text"
            placeholder="youtube.com ou https://exemplo.com/profit-one"
            value={profitOneLink}
            onChange={(e) => setProfitOneLink(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Pode digitar com ou sem https:// (será adicionado automaticamente)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profitPro">Link do botão "ATIVAR PROFIT PRO"</Label>
          <Input
            id="profitPro"
            type="text"
            placeholder="youtube.com ou https://exemplo.com/profit-pro"
            value={profitProLink}
            onChange={(e) => setProfitProLink(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Pode digitar com ou sem https:// (será adicionado automaticamente)
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Salvando..." : "Salvar Links"}
        </Button>
      </div>
    </Card>
  );
};
