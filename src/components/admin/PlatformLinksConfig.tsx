import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Link, Settings } from "lucide-react";
import { BackupButton } from "./BackupButton";

interface PlanConfig {
  name: string;
  link: string;
  price: string;
}

export const PlatformLinksConfig = () => {
  // Planos Config
  const [plans, setPlans] = useState<PlanConfig[]>([
    { name: "", link: "", price: "" },
    { name: "", link: "", price: "" },
    { name: "", link: "", price: "" },
    { name: "", link: "", price: "" },
  ]);

  // Outros Links
  const [comprarPlanoLink, setComprarPlanoLink] = useState("");
  const [contatarSuporteLink, setContatarSuporteLink] = useState("");
  const [voltarSiteLink, setVoltarSiteLink] = useState("");
  const [saqueQuinzenalLink, setSaqueQuinzenalLink] = useState("");
  const [desativarPlanoLink, setDesativarPlanoLink] = useState("");

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
          "profit_one_link", "profit_pro_link", "profit_one_preco", "profit_pro_preco",
          "plan_1_name", "plan_1_link", "plan_1_price",
          "plan_2_name", "plan_2_link", "plan_2_price",
          "plan_3_name", "plan_3_link", "plan_3_price",
          "plan_4_name", "plan_4_link", "plan_4_price",
          "comprar_plano_link", "contatar_suporte_link", "voltar_site_link",
          "saque_quinzenal_link", "desativar_plano_link"
        ]);

      if (error) throw error;

      const getConfig = (key: string) => data?.find(c => c.config_key === key)?.config_value || "";

      // Load Plans with fallback to legacy data for Plan 1 and 2
      const newPlans = [...plans];

      // Plan 1 & 2 (Fallback to Old Keys if New Keys Empty)
      newPlans[0] = {
        name: getConfig("plan_1_name") || "Fast Trade Start",
        link: getConfig("plan_1_link") || getConfig("profit_one_link"),
        price: getConfig("plan_1_price") || getConfig("profit_one_preco")
      };

      newPlans[1] = {
        name: getConfig("plan_2_name") || "Fast Trade Pro",
        link: getConfig("plan_2_link") || getConfig("profit_pro_link"),
        price: getConfig("plan_2_price") || getConfig("profit_pro_preco")
      };

      // Plan 3 & 4
      newPlans[2] = {
        name: getConfig("plan_3_name"),
        link: getConfig("plan_3_link"),
        price: getConfig("plan_3_price")
      };
      newPlans[3] = {
        name: getConfig("plan_4_name"),
        link: getConfig("plan_4_link"),
        price: getConfig("plan_4_price")
      };

      setPlans(newPlans);

      // Load other links
      setComprarPlanoLink(getConfig("comprar_plano_link"));
      setContatarSuporteLink(getConfig("contatar_suporte_link"));
      setVoltarSiteLink(getConfig("voltar_site_link"));
      setSaqueQuinzenalLink(getConfig("saque_quinzenal_link"));
      setDesativarPlanoLink(getConfig("desativar_plano_link"));

    } catch (error: any) {
      toast.error("Erro ao carregar configurações: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const normalizeUrl = (url: string): string => {
    if (!url || url.trim() === "") return "";
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
      return trimmedUrl;
    }
    return `https://${trimmedUrl}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [];

      // Update Plans
      plans.forEach((plan, index) => {
        const i = index + 1;
        updates.push(
          { config_key: `plan_${i}_name`, config_value: plan.name },
          { config_key: `plan_${i}_link`, config_value: normalizeUrl(plan.link) },
          { config_key: `plan_${i}_price`, config_value: plan.price }
        );
      });

      // Update Other Links
      updates.push(
        { config_key: "comprar_plano_link", config_value: normalizeUrl(comprarPlanoLink) },
        { config_key: "contatar_suporte_link", config_value: normalizeUrl(contatarSuporteLink) },
        { config_key: "voltar_site_link", config_value: normalizeUrl(voltarSiteLink) },
        { config_key: "saque_quinzenal_link", config_value: normalizeUrl(saqueQuinzenalLink) },
        { config_key: "desativar_plano_link", config_value: normalizeUrl(desativarPlanoLink) }
      );

      // Update legacy keys for backward compatibility
      updates.push(
        { config_key: "profit_one_link", config_value: normalizeUrl(plans[0].link) },
        { config_key: "profit_pro_link", config_value: normalizeUrl(plans[1].link) },
        { config_key: "profit_one_preco", config_value: plans[0].price },
        { config_key: "profit_pro_preco", config_value: plans[1].price }
      );

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_config")
          .upsert(update, { onConflict: "config_key" });

        if (error) throw error;
      }

      // Update local state and reload to ensure sync
      loadLinks();

      toast.success("Configurações atualizadas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = (index: number, field: keyof PlanConfig, value: string) => {
    const newPlans = [...plans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setPlans(newPlans);
  };

  if (loading) {
    return <div>Carregando configurações...</div>;
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Configurar Links e Planos</h3>
      </div>

      <div className="space-y-8">

        {/* Configuração dos 4 Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan, index) => (
            <div key={index} className="space-y-3 p-4 border rounded-lg bg-muted/10">
              <h4 className="font-semibold text-sm uppercase text-muted-foreground mb-2">Plano {index + 1}</h4>

              <div className="space-y-2">
                <Label>Nome do Plano</Label>
                <Input
                  value={plan.name}
                  onChange={(e) => updatePlan(index, "name", e.target.value)}
                  placeholder={`Nome do Plano ${index + 1}`}
                />
              </div>

              <div className="space-y-2">
                <Label>Preço (exibido abaixo do botão)</Label>
                <Input
                  value={plan.price}
                  onChange={(e) => updatePlan(index, "price", e.target.value)}
                  placeholder="Ex: R$ 90,00 por mês"
                />
              </div>

              <div className="space-y-2">
                <Label>Link de Ativação</Label>
                <Input
                  value={plan.link}
                  onChange={(e) => updatePlan(index, "link", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Links Gerais */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium">Links Gerais</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Link "Desativar Plano"</Label>
              <Input
                value={desativarPlanoLink}
                onChange={(e) => setDesativarPlanoLink(e.target.value)}
                placeholder="Link para desativação ou suporte"
              />
            </div>

            <div className="space-y-2">
              <Label>Link "Comprar Plano"</Label>
              <Input
                value={comprarPlanoLink}
                onChange={(e) => setComprarPlanoLink(e.target.value)}
                placeholder="Link para compra de novos planos"
              />
            </div>

            <div className="space-y-2">
              <Label>Link "Contatar Suporte"</Label>
              <Input
                value={contatarSuporteLink}
                onChange={(e) => setContatarSuporteLink(e.target.value)}
                placeholder="Link para suporte (WhatsApp/Site)"
              />
            </div>

            <div className="space-y-2">
              <Label>Link "Voltar para o Site"</Label>
              <Input
                value={voltarSiteLink}
                onChange={(e) => setVoltarSiteLink(e.target.value)}
                placeholder="Link do site principal"
              />
            </div>

            <div className="space-y-2">
              <Label>Link "Saque Quinzenal"</Label>
              <Input
                value={saqueQuinzenalLink}
                onChange={(e) => setSaqueQuinzenalLink(e.target.value)}
                placeholder="Link para solicitação de saque quinzenal"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-lg font-bold">
          {saving ? "Salvando Alterações..." : "SALVAR CONFIGURAÇÕES"}
        </Button>

        {/* Backup Button - Hidden/Subtle in Footer */}
        <div className="flex justify-center pt-8 mt-8 border-t border-border/20">
          <BackupButton />
        </div>
      </div>
    </Card>
  );
};
