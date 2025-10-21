import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Upload, Search, RefreshCw } from "lucide-react";

interface Solicitacao {
  id: string;
  tipo_solicitacao: string;
  status: string;
  descricao: string | null;
  created_at: string;
  user_id: string;
  plano_adquirido_id: string | null;
  profiles: {
    nome: string;
    email: string;
  };
}

export const SolicitacoesTab = () => {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [valorFinal, setValorFinal] = useState("");
  const [status, setStatus] = useState("pendente");
  const [uploading, setUploading] = useState(false);
  const [comprovanteUrl, setComprovanteUrl] = useState("");
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [observacaoTimeline, setObservacaoTimeline] = useState("");

  useEffect(() => {
    loadSolicitacoes();
  }, []);

  const loadSolicitacoes = async () => {
    try {
      const { data, error } = await supabase
        .from("solicitacoes")
        .select(`
          *,
          profiles!solicitacoes_user_id_fkey(nome, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSolicitacoes(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar solicitações: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const groupByDate = (items: Solicitacao[]) => {
    let filtered = filter === "all" 
      ? items 
      : items.filter((s) => s.tipo_solicitacao === filter);

    // Filtro por busca
    if (searchQuery) {
      filtered = filtered.filter((s) => 
        s.profiles?.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getTipoLabel(s.tipo_solicitacao).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por data
    if (startDate) {
      filtered = filtered.filter((s) => new Date(s.created_at) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((s) => new Date(s.created_at) <= end);
    }

    const grouped: Record<string, Solicitacao[]> = {};
    
    filtered.forEach((item) => {
      const date = format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR });
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });

    return grouped;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      pendente: { className: "bg-orange-500 text-white", label: "Pendente" },
      atendida: { className: "bg-green-500 text-white", label: "Atendida" },
      rejeitada: { className: "bg-red-500 text-white", label: "Rejeitada" },
      aprovado: { className: "bg-blue-500 text-white", label: "Aprovado" },
      efetuado: { className: "bg-emerald-500 text-white", label: "Efetuado" },
      recusado: { className: "bg-gray-500 text-white", label: "Recusado" },
    };

    const config = statusMap[status] || statusMap.pendente;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTipoLabel = (tipo: string) => {
    const tipoMap: Record<string, string> = {
      saque_quinzenal: "Mudança de Saque Quinzenal",
      segunda_chance: "Segunda Chance no Teste",
      outro: "Outras Solicitações",
      saque: "Solicitação de Saque",
    };
    return tipoMap[tipo] || tipo;
  };

  const handleVisualizarClick = (solicitacao: Solicitacao) => {
    setSelectedSolicitacao(solicitacao);
    setValorFinal("");
    setStatus("pendente");
    setComprovanteUrl("");
    setObservacaoTimeline("");
    setDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `comprovantes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);

      setComprovanteUrl(publicUrl);
      toast.success("Comprovante enviado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao enviar comprovante: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateSolicitacao = async () => {
    if (!selectedSolicitacao) return;

    try {
      setUpdating(true);

      // Atualizar a solicitação (trigger irá INSERIR nova entrada no histórico)
      const { error: solicitacaoError } = await supabase
        .from('solicitacoes')
        .update({
          status: status,
          resposta_admin: observacaoTimeline || (valorFinal ? `Valor final: R$ ${valorFinal}` : null)
        })
        .eq('id', selectedSolicitacao.id);

      if (solicitacaoError) throw solicitacaoError;

      // Anexar extras (valor_final/comprovante) na última entrada criada pela trigger
      if (valorFinal || comprovanteUrl) {
        // Garantir que a trigger executou
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data: ultima, error: selectErr } = await supabase
          .from('historico_observacoes')
          .select('id')
          .eq('solicitacao_id', selectedSolicitacao.id)
          .eq('origem', 'admin')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (selectErr) throw selectErr;

        if (ultima?.id) {
          const { error: historicoError } = await supabase
            .from('historico_observacoes')
            .update({
              valor_final: valorFinal ? parseFloat(valorFinal) : null,
              comprovante_url: comprovanteUrl || null,
            })
            .eq('id', ultima.id);

          if (historicoError) throw historicoError;
        }
      }

      toast.success("Solicitação atualizada com sucesso!");
      setDialogOpen(false);
      loadSolicitacoes();
    } catch (error: any) {
      toast.error("Erro ao atualizar solicitação: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const groupedData = groupByDate(solicitacoes);

  if (loading) {
    return <div className="p-8">Carregando solicitações...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Lista de Solicitações</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSolicitacoes}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="saque_quinzenal">Mudança de Saque</TabsTrigger>
            <TabsTrigger value="segunda_chance">Segunda Chance</TabsTrigger>
            <TabsTrigger value="outro">Outras Solicitações</TabsTrigger>
            <TabsTrigger value="saque">Saque</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Nome, email ou tipo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-medium">
              Data Inicial
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium">
              Data Final
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        {(searchQuery || startDate || endDate) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStartDate("");
              setEndDate("");
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {Object.keys(groupedData).length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
          </div>
        ) : (
          Object.entries(groupedData).map(([date, items]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-lg font-bold text-foreground">{date}</h3>
              <div className="bg-white rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">Trader</th>
                      <th className="text-left p-4 text-sm font-medium">Tipo</th>
                      <th className="text-left p-4 text-sm font-medium">Descrição</th>
                      <th className="text-left p-4 text-sm font-medium">Horário</th>
                      <th className="text-left p-4 text-sm font-medium">Status</th>
                      <th className="text-left p-4 text-sm font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{item.profiles?.nome}</div>
                            <div className="text-sm text-muted-foreground">{item.profiles?.email}</div>
                          </div>
                        </td>
                        <td className="p-4">{getTipoLabel(item.tipo_solicitacao)}</td>
                        <td className="p-4 text-sm">{item.descricao || "-"}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format(new Date(item.created_at), "HH:mm", { locale: ptBR })}
                        </td>
                        <td className="p-4">{getStatusBadge(item.status)}</td>
                        <td className="p-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleVisualizarClick(item)}
                          >
                            Responder
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog para responder solicitação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Responder Solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSolicitacao && (
              <>
                {/* Cabeçalho com tipo e data */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-1 border-l-4 border-primary">
                  <div className="text-lg font-bold text-foreground">
                    {getTipoLabel(selectedSolicitacao.tipo_solicitacao)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(selectedSolicitacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  {selectedSolicitacao.descricao && (
                    <div className="text-sm text-foreground mt-2">
                      <span className="font-medium">Descrição: </span>
                      {selectedSolicitacao.descricao}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="observacao-timeline">Observação para a Linha do Tempo</Label>
                  <Input
                    list="observacoes-predefinidas"
                    id="observacao-timeline"
                    value={observacaoTimeline}
                    onChange={(e) => setObservacaoTimeline(e.target.value)}
                    placeholder="Selecione ou digite uma observação..."
                    className="mt-2"
                  />
                  <datalist id="observacoes-predefinidas">
                    <option value="Aprovação solicitada" />
                    <option value="Segunda chance aprovada" />
                    <option value="Saque aprovado" />
                    <option value="Saque efetuado" />
                    <option value="Solicitação em análise" />
                    <option value="Documentação pendente" />
                    <option value="Aguardando aprovação" />
                  </datalist>
                </div>

                <div>
                  <Label htmlFor="status-solicitacao">Status</Label>
                  <Input
                    list="status-predefinidos"
                    id="status-solicitacao"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="Selecione ou digite um status..."
                    className="mt-2"
                  />
                  <datalist id="status-predefinidos">
                    <option value="pendente" />
                    <option value="aprovado" />
                    <option value="efetuado" />
                    <option value="atendida" />
                    <option value="recusado" />
                    <option value="rejeitada" />
                  </datalist>
                </div>

                <Button 
                  onClick={handleUpdateSolicitacao} 
                  disabled={updating}
                  className="w-full"
                >
                  {updating ? 'Salvando...' : 'Responder Solicitação'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
