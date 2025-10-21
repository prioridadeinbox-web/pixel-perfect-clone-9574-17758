import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Package, ShoppingCart, FileText, UserCog } from "lucide-react";
import { toast } from "sonner";
import PlanosTab from "@/components/admin/PlanosTab";
import PlanosAdquiridosTab from "@/components/admin/PlanosAdquiridosTab";
import { SolicitacoesTab } from "@/components/admin/SolicitacoesTab";
import { TraderManagementTab } from "@/components/admin/TraderManagementTab";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Acesso não autorizado. Por favor, faça login.");
      navigate("/");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (!roles || !roles.some(r => r.role === "admin")) {
      toast.error("Acesso negado. Você não tem permissão de administrador.");
      navigate("/");
      return;
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Painel Administrativo
          </h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="solicitacoes" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="solicitacoes">
              <FileText className="mr-2 h-4 w-4" />
              Solicitações
            </TabsTrigger>
            <TabsTrigger value="traders">
              <UserCog className="mr-2 h-4 w-4" />
              Gerenciar Traders
            </TabsTrigger>
            <TabsTrigger value="planos">
              <Package className="mr-2 h-4 w-4" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="planos-adquiridos">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Planos Adquiridos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="solicitacoes">
            <SolicitacoesTab />
          </TabsContent>

          <TabsContent value="traders">
            <TraderManagementTab />
          </TabsContent>

          <TabsContent value="planos">
            <PlanosTab />
          </TabsContent>

          <TabsContent value="planos-adquiridos">
            <PlanosAdquiridosTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
