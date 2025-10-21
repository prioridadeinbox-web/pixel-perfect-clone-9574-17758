import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AuditLogger } from "@/lib/auditLogger";
import { ActivityLogger } from "@/lib/activityLogger";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { TraderDetailsDialog } from "./TraderDetailsDialog";

interface Profile {
  id: string;
  nome: string;
  email: string;
  pagamento_ativo: boolean;
}

export const TraderManagementTab = () => {
  const [traders, setTraders] = useState<Profile[]>([]);
  const [selectedTrader, setSelectedTrader] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [comment, setComment] = useState("");
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentFilter, setPaymentFilter] = useState<"all" | "active" | "inactive">("all");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [traderPlans, setTraderPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const itemsPerPage = 5;

  useEffect(() => {
    loadTraders();
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadTraders = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("nome");

      if (error) throw error;
      setTraders(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar traders: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTraderPlans = async (traderId: string) => {
    try {
      const { data, error } = await supabase
        .from("planos_adquiridos")
        .select(`
          id,
          id_carteira,
          planos:plano_id(nome_plano)
        `)
        .eq("cliente_id", traderId)
        .order("id_carteira");

      if (error) throw error;
      setTraderPlans(data || []);
      setSelectedPlanId(data && data.length > 0 ? data[0].id : "");
    } catch (error: any) {
      console.error("Erro ao carregar planos:", error);
      setTraderPlans([]);
      setSelectedPlanId("");
    }
  };

  const handleTogglePayment = async (traderId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ pagamento_ativo: newStatus })
        .eq("id", traderId);

      if (error) throw error;

      setTraders((prev) =>
        prev.map((t) =>
          t.id === traderId ? { ...t, pagamento_ativo: newStatus } : t
        )
      );

      if (selectedTrader?.id === traderId) {
        setSelectedTrader({ ...selectedTrader, pagamento_ativo: newStatus });
      }

      await ActivityLogger.logPaymentStatusChanged(traderId, newStatus);
      toast.success("Status de pagamento atualizado!");
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };

  const confirmPasswordChange = async () => {
    if (!selectedTrader || !newPassword) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: {
          userId: selectedTrader.id,
          newPassword: newPassword
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await AuditLogger.logPasswordChange(selectedTrader.id);

      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setShowPasswordConfirm(false);
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast.error(error.message || "Ocorreu um erro ao alterar a senha");
    }
  };

  const handleChangePassword = () => {
    if (!selectedTrader || !newPassword) {
      toast.error("Selecione um trader e digite uma nova senha");
      return;
    }
    setShowPasswordConfirm(true);
  };

  const handleAddComment = async () => {
    if (!selectedTrader || !comment) {
      toast.error("Selecione um trader e digite um comentário");
      return;
    }

    if (!selectedPlanId) {
      toast.error("Selecione um plano para adicionar o comentário");
      return;
    }

    try {
      const { error } = await supabase
        .from("historico_observacoes")
        .insert({
          plano_adquirido_id: selectedPlanId,
          observacao: comment,
        });

      if (error) throw error;

      toast.success("Comentário adicionado!");
      setComment("");
    } catch (error: any) {
      toast.error("Erro ao adicionar comentário: " + error.message);
    }
  };

  if (loading) {
    return <div className="p-8">Carregando traders...</div>;
  }

  // Filter traders based on search query and payment status
  const filteredTraders = traders.filter((trader) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = trader.nome.toLowerCase().includes(query) || trader.email.toLowerCase().includes(query);
    const matchesPayment = 
      paymentFilter === "all" ? true :
      paymentFilter === "active" ? trader.pagamento_ativo :
      !trader.pagamento_ativo;
    return matchesSearch && matchesPayment;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredTraders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTraders = filteredTraders.slice(startIndex, startIndex + itemsPerPage);

  // Counters
  const activeCount = traders.filter(t => t.pagamento_ativo).length;
  const inactiveCount = traders.filter(t => !t.pagamento_ativo).length;

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Traders List */}
      <div className="col-span-1 bg-white rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-bold">Traders</h3>
        
        {/* Stats */}
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
            Ativos: {activeCount}
          </span>
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
            Inativos: {inactiveCount}
          </span>
        </div>

        {/* Payment Filter */}
        <Select value={paymentFilter} onValueChange={(value: any) => setPaymentFilter(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os pagamentos</SelectItem>
            <SelectItem value="active">Pagamento ativo</SelectItem>
            <SelectItem value="inactive">Pagamento inativo</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Search Bar */}
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        {/* Traders List */}
        <div className="space-y-2 min-h-[400px]">
          {paginatedTraders.map((trader) => (
            <div
              key={trader.id}
              onClick={() => {
                setSelectedTrader(trader);
                loadTraderPlans(trader.id);
              }}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedTrader?.id === trader.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <div className="font-medium">{trader.nome}</div>
              <div className="text-sm opacity-80">{trader.email}</div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-muted-foreground px-2">
              Página {currentPage} de {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Trader Details */}
      <div className="col-span-2 bg-white rounded-lg p-6 space-y-6">
        {selectedTrader ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                Gerenciar: {selectedTrader.nome}
              </h3>
              <Button
                variant="outline"
                onClick={() => setShowDetailsDialog(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Dados Completos
              </Button>
            </div>

            {/* Payment Status */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-base font-medium">Status de Pagamento</Label>
                <p className="text-sm text-muted-foreground">
                  Determine se o pagamento do trader está ativo
                </p>
              </div>
              <Switch
                checked={selectedTrader.pagamento_ativo}
                onCheckedChange={(checked) =>
                  handleTogglePayment(selectedTrader.id, checked)
                }
              />
            </div>

            {/* Change Password */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Alterar Senha</Label>
              <div className="flex gap-3">
                <Input
                  type="password"
                  placeholder="Nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button onClick={handleChangePassword}>Alterar</Button>
              </div>
            </div>

            {/* Add Comment */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Adicionar Comentário</Label>
              
              {traderPlans.length > 0 ? (
                <>
                  <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {traderPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.id_carteira} - {plan.planos?.nome_plano || 'Sem nome'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Textarea
                    placeholder="Digite um comentário sobre o plano..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={handleAddComment}>Adicionar Comentário</Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este trader não possui planos adquiridos
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            Selecione um trader para gerenciar
          </div>
        )}

        <AlertDialog open={showPasswordConfirm} onOpenChange={setShowPasswordConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Alteração de Senha</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a alterar a senha de <strong>{selectedTrader?.nome}</strong>. 
                Esta ação não pode ser desfeita. Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmPasswordChange}>
                Confirmar Alteração
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {selectedTrader && (
          <TraderDetailsDialog
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            traderId={selectedTrader.id}
            traderName={selectedTrader.nome}
          />
        )}
      </div>
    </div>
  );
};
