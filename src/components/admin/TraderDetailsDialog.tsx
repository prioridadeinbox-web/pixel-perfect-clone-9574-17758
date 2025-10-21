import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { AdminDocumentViewDialog } from "./AdminDocumentViewDialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TraderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  traderId: string;
  traderName: string;
}

interface ProfileData {
  nome: string;
  email: string;
  cpf: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  rua_bairro: string | null;
  numero_residencial: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  foto_perfil: string | null;
  pagamento_ativo: boolean;
  status_plataforma: string | null;
  documentos_completos: boolean;
}

interface Document {
  id: string;
  tipo_documento: string;
  arquivo_url: string;
  status: string;
  created_at: string;
}

export const TraderDetailsDialog = ({
  open,
  onOpenChange,
  traderId,
  traderName,
}: TraderDetailsDialogProps) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDocument, setViewDocument] = useState<Document | null>(null);
  const [planosAdquiridos, setPlanosAdquiridos] = useState<any[]>([]);

  useEffect(() => {
    if (open && traderId) {
      loadTraderData();
    }
  }, [open, traderId]);

  const loadTraderData = async () => {
    setLoading(true);
    try {
      // Carregar perfil
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", traderId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Carregar documentos
      const { data: docsData, error: docsError } = await supabase
        .from("user_documents")
        .select("*")
        .eq("user_id", traderId)
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;
      setDocuments(docsData || []);

      // Carregar planos adquiridos com histórico
      const { data: planosData, error: planosError } = await supabase
        .from("planos_adquiridos")
        .select(`
          *,
          planos:plano_id(nome_plano)
        `)
        .eq("cliente_id", traderId)
        .order("created_at", { ascending: false });

      if (planosError) throw planosError;

      // Para cada plano, carregar o histórico
      const planosComHistorico = await Promise.all(
        (planosData || []).map(async (plano) => {
          const { data: historico } = await supabase
            .from("historico_observacoes")
            .select("*")
            .eq("plano_adquirido_id", plano.id)
            .order("created_at", { ascending: false });

          return { ...plano, historico: historico || [] };
        })
      );

      setPlanosAdquiridos(planosComHistorico);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      rg: "RG",
      cnh: "CNH",
      comprovante_residencia: "Comprovante de Residência",
      selfie: "Selfie",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pendente: "bg-yellow-100 text-yellow-800",
      aprovado: "bg-green-100 text-green-800",
      rejeitado: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            Carregando...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalhes do Trader</DialogTitle>
          </DialogHeader>

          {profile && (
            <div className="space-y-6">
              {/* Foto de Perfil */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.foto_perfil || ""} />
                  <AvatarFallback className="text-2xl">
                    {profile.nome?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{profile.nome}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Pagamento</p>
                  <p className="font-medium">
                    {profile.pagamento_ativo ? "✓ Ativo" : "✗ Inativo"}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Plataforma</p>
                  <p className="font-medium">{profile.status_plataforma || "-"}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Documentos</p>
                  <p className="font-medium">
                    {profile.documentos_completos ? "✓ Completos" : "✗ Incompletos"}
                  </p>
                </div>
              </div>

              {/* Dados Pessoais */}
              <div>
                <h4 className="font-bold mb-3">Dados Pessoais</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">CPF</p>
                    <p className="font-medium">{profile.cpf || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium">{profile.telefone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                    <p className="font-medium">{formatDate(profile.data_nascimento)}</p>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h4 className="font-bold mb-3">Endereço</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Rua/Bairro</p>
                    <p className="font-medium">{profile.rua_bairro || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Número</p>
                    <p className="font-medium">{profile.numero_residencial || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cidade</p>
                    <p className="font-medium">{profile.cidade || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <p className="font-medium">{profile.estado || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CEP</p>
                    <p className="font-medium">{profile.cep || "-"}</p>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informações e Documentos</TabsTrigger>
                  <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6">
                  {/* Documentos */}
                  <div>
                    <h4 className="font-bold mb-3">Documentos Anexados</h4>
                    {documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
                    ) : (
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">
                                  {getDocumentTypeLabel(doc.tipo_documento)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(doc.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(doc.status)}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewDocument(doc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  {planosAdquiridos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum plano adquirido encontrado</p>
                  ) : (
                    planosAdquiridos.map((plano) => (
                      <div key={plano.id} className="border rounded-lg p-4 space-y-4 bg-card">
                        {/* Cabeçalho do Plano */}
                        <div className="flex items-start justify-between pb-3 border-b">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-lg">{plano.planos?.nome_plano || "Plano"}</h5>
                              <Badge variant="outline" className="font-mono">
                                #{plano.id_carteira}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                <strong>Status:</strong>{" "}
                                <Badge 
                                  variant={
                                    plano.status_plano === "ativo" ? "default" :
                                    plano.status_plano === "eliminado" ? "destructive" :
                                    plano.status_plano === "segunda_chance" ? "secondary" :
                                    "outline"
                                  }
                                >
                                  {plano.status_plano}
                                </Badge>
                              </span>
                              <span>
                                <strong>Tipo Saque:</strong> {plano.tipo_saque}
                              </span>
                              <span>
                                <strong>Adquirido em:</strong>{" "}
                                {new Date(plano.created_at).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Timeline do Plano */}
                        <div>
                          <h6 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                            Histórico de Atividades
                          </h6>
                          {plano.historico.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                              Nenhuma atividade registrada para este plano
                            </p>
                          ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                              {plano.historico.map((h: any) => (
                                <div
                                  key={h.id}
                                  className="relative pl-6 pb-4 border-l-2 border-primary/30"
                                >
                                  {/* Bolinha na linha do tempo */}
                                  <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-primary" />
                                  
                                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs text-muted-foreground font-medium">
                                        {new Date(h.created_at).toLocaleString("pt-BR")}
                                      </p>
                                      {h.status_evento && (
                                        <Badge variant="outline" className="text-xs">
                                          {h.status_evento}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="text-sm space-y-1.5">
                                      {h.tipo_evento && (
                                        <div>
                                          <span className="font-semibold text-foreground">
                                            {h.tipo_evento.replace(/_/g, " ").toUpperCase()}
                                          </span>
                                        </div>
                                      )}
                                      
                                      {h.observacao && (
                                        <p className="text-muted-foreground">
                                          {h.observacao}
                                        </p>
                                      )}
                                      
                                      <div className="flex gap-4 flex-wrap">
                                        {h.valor_solicitado && (
                                          <div>
                                            <span className="text-xs text-muted-foreground">Valor Solicitado:</span>
                                            <p className="font-semibold text-orange-600">
                                              R$ {parseFloat(h.valor_solicitado).toFixed(2)}
                                            </p>
                                          </div>
                                        )}
                                        
                                        {h.valor_final && (
                                          <div>
                                            <span className="text-xs text-muted-foreground">Valor Final:</span>
                                            <p className="font-semibold text-green-600">
                                              R$ {parseFloat(h.valor_final).toFixed(2)}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {h.comprovante_url && (
                                        <a
                                          href={h.comprovante_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          📎 Ver comprovante
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {viewDocument && (
        <AdminDocumentViewDialog
          open={!!viewDocument}
          onOpenChange={(open) => !open && setViewDocument(null)}
          documentUrl={viewDocument.arquivo_url}
          documentType={getDocumentTypeLabel(viewDocument.tipo_documento)}
        />
      )}
    </>
  );
};
