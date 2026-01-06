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
  const [comprarPlanoLink, setComprarPlanoLink] = useState("");
  const [contatarSuporteLink, setContatarSuporteLink] = useState("");
  const [voltarSiteLink, setVoltarSiteLink] = useState("");
  const [saqueQuinzenalLink, setSaqueQuinzenalLink] = useState("");
  const [profitOnePreco, setProfitOnePreco] = useState("");
  const [profitProPreco, setProfitProPreco] = useState("");
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
        .in("config_key", [
          "profit_one_link", 
          "profit_pro_link",
          "comprar_plano_link",
          "contatar_suporte_link",
          "voltar_site_link",
          "saque_quinzenal_link",
          "profit_one_preco",
          "profit_pro_preco"
        ]);

      if (error) throw error;

      const oneLink = data?.find(c => c.config_key === "profit_one_link");
      const proLink = data?.find(c => c.config_key === "profit_pro_link");
      const comprarLink = data?.find(c => c.config_key === "comprar_plano_link");
      const suporteLink = data?.find(c => c.config_key === "contatar_suporte_link");
      const voltarLink = data?.find(c => c.config_key === "voltar_site_link");
      const saqueLink = data?.find(c => c.config_key === "saque_quinzenal_link");
      const onePreco = data?.find(c => c.config_key === "profit_one_preco");
      const proPreco = data?.find(c => c.config_key === "profit_pro_preco");

      setProfitOneLink(oneLink?.config_value || "");
      setProfitProLink(proLink?.config_value || "");
      setComprarPlanoLink(comprarLink?.config_value || "");
      setContatarSuporteLink(suporteLink?.config_value || "");
      setVoltarSiteLink(voltarLink?.config_value || "");
      setSaqueQuinzenalLink(saqueLink?.config_value || "");
      setProfitOnePreco(onePreco?.config_value || "");
      setProfitProPreco(proPreco?.config_value || "");
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
      const normalizedComprarPlano = normalizeUrl(comprarPlanoLink);
      const normalizedContatarSuporte = normalizeUrl(contatarSuporteLink);
      const normalizedVoltarSite = normalizeUrl(voltarSiteLink);
      const normalizedSaqueQuinzenal = normalizeUrl(saqueQuinzenalLink);

      const updates = [
        {
          config_key: "profit_one_link",
          config_value: normalizedProfitOne,
        },
        {
          config_key: "profit_pro_link",
          config_value: normalizedProfitPro,
        },
        {
          config_key: "comprar_plano_link",
          config_value: normalizedComprarPlano,
        },
        {
          config_key: "contatar_suporte_link",
          config_value: normalizedContatarSuporte,
        },
        {
          config_key: "voltar_site_link",
          config_value: normalizedVoltarSite,
        },
        {
          config_key: "saque_quinzenal_link",
          config_value: normalizedSaqueQuinzenal,
        },
        {
          config_key: "profit_one_preco",
          config_value: profitOnePreco.trim(),
        },
        {
          config_key: "profit_pro_preco",
          config_value: profitProPreco.trim(),
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
      setComprarPlanoLink(normalizedComprarPlano);
      setContatarSuporteLink(normalizedContatarSuporte);
      setVoltarSiteLink(normalizedVoltarSite);
      setSaqueQuinzenalLink(normalizedSaqueQuinzenal);

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
          <Label htmlFor="profitOne">Link do botão "ATIVAR FAST TRADE START"</Label>
          <Input
            id="profitOne"
            type="text"
            placeholder="youtube.com ou https://exemplo.com/fast-trade-start"
            value={profitOneLink}
            onChange={(e) => setProfitOneLink(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Pode digitar com ou sem https:// (será adicionado automaticamente)
          </p>
        </div>

      <div className="space-y-2">
          <Label htmlFor="profitPro">Link do botão "ATIVAR FAST TRADE PRO"</Label>
          <Input
            id="profitPro"
            type="text"
            placeholder="youtube.com ou https://exemplo.com/fast-trade-pro"
            value={profitProLink}
            onChange={(e) => setProfitProLink(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Pode digitar com ou sem https:// (será adicionado automaticamente)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comprarPlano">Link do botão "COMPRAR UM PLANO"</Label>
          <Input
            id="comprarPlano"
            type="text"
            placeholder="youtube.com ou https://exemplo.com/planos"
            value={comprarPlanoLink}
            onChange={(e) => setComprarPlanoLink(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Pode digitar com ou sem https:// (será adicionado automaticamente)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contatarSuporte">Link do botão "CONTATAR SUPORTE"</Label>
          <Input
            id="contatarSuporte"
            type="text"
            placeholder="wa.me/5511999999999 ou https://exemplo.com/suporte"
            value={contatarSuporteLink}
            onChange={(e) => setContatarSuporteLink(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Pode digitar com ou sem https:// (será adicionado automaticamente)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="voltarSite">Link do botão "Voltar para o site"</Label>
          <Input
            id="voltarSite"
            type="text"
            placeholder="exemplo.com ou https://exemplo.com"
            value={voltarSiteLink}
            onChange={(e) => setVoltarSiteLink(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Pode digitar com ou sem https:// (será adicionado automaticamente)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="saqueQuinzenal">Link do botão "Mudança de Saque Quinzenal"</Label>
          <Input
            id="saqueQuinzenal"
            type="text"
            placeholder="exemplo.com ou https://exemplo.com/saque-quinzenal"
            value={saqueQuinzenalLink}
            onChange={(e) => setSaqueQuinzenalLink(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Pode digitar com ou sem https:// (será adicionado automaticamente)
          </p>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-4">Preços dos Planos</h4>
          
          <div className="space-y-2">
            <Label htmlFor="profitOnePreco">Preço do Fast Trade Start (exibido no painel)</Label>
            <Input
              id="profitOnePreco"
              type="text"
              placeholder="Ex: R$ 90,00 por mês"
              value={profitOnePreco}
              onChange={(e) => setProfitOnePreco(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Texto exibido abaixo do botão "ATIVAR FAST TRADE START"
            </p>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="profitProPreco">Preço do Fast Trade Pro (exibido no painel)</Label>
            <Input
              id="profitProPreco"
              type="text"
              placeholder="Ex: R$ 220,00 por mês"
              value={profitProPreco}
              onChange={(e) => setProfitProPreco(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Texto exibido abaixo do botão "ATIVAR FAST TRADE PRO"
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Salvando..." : "Salvar Links"}
        </Button>
      </div>
    </Card>
  );
};
