import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Pencil, Check, Eye, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { DocumentViewDialog } from "@/components/dashboard/DocumentViewDialog";
import iconsRecomecar from "@/assets/icons-recomecar.png";
import iconsSaque from "@/assets/icons-saque.png";
import iconsComentarios from "@/assets/icons-comentarios.png";
import iconsSolicitarAprovacao from "@/assets/icons-solicitar-aprovacao.png";
import { Badge } from "@/components/ui/badge";
import { WithdrawalRequestDialog } from "@/components/dashboard/WithdrawalRequestDialog";
import { BiweeklyWithdrawalDialog } from "@/components/dashboard/BiweeklyWithdrawalDialog";
import { SecondChanceDialog } from "@/components/dashboard/SecondChanceDialog";
import { CommentsDialog } from "@/components/dashboard/CommentsDialog";
import { ApprovalRequestDialog } from "@/components/dashboard/ApprovalRequestDialog";

import { ProfilePictureUpload } from "@/components/dashboard/ProfilePictureUpload";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { PlanTimeline } from "@/components/dashboard/PlanTimeline";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import logoImage from "@/assets/logo-prime.png";
import { z } from "zod";
import { AuditLogger } from "@/lib/auditLogger";
import { ActivityLogger } from "@/lib/activityLogger";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [planosAdquiridos, setPlanosAdquiridos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDialog, setActiveDialog] = useState<{
    type: 'withdrawal' | 'biweekly' | 'secondChance' | 'comments' | 'approval' | null;
    planId: string;
  }>({ type: null, planId: '' });
  const [personalInfo, setPersonalInfo] = useState({
    nome: '',
    dataNascimento: '',
    telefone: '',
    email: '',
    cpf: '',
    endereco: '',
    numero: '',
    cep: '',
    cidade: '',
    estado: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [cnhViewOpen, setCnhViewOpen] = useState(false);
  const [selfieViewOpen, setSelfieViewOpen] = useState(false);
  const [planosCurrentPage, setPlanosCurrentPage] = useState(1);
  const planosPerPage = 5;
  const user = session?.user || null;
  const cnhInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const REFRESH_INTERVAL = 30000; // 30 segundos

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session) {
          checkUserAccess(session.user.id);
        } else {
          toast.error("Sessão expirada. Por favor, faça login novamente.");
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUserAccess(session.user.id);
      } else {
        toast.error("Acesso não autorizado. Por favor, faça login.");
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh para verificar novas atualizações (pausa quando há dialogs abertos)
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(async () => {
      // Não atualizar se houver algum diálogo aberto
      if (activeDialog.type || isEditing) {
        return;
      }
      
      setIsRefreshing(true);
      await loadUserData(user.id);
      setIsRefreshing(false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [user, activeDialog.type, isEditing]);

  const checkUserAccess = async (userId: string) => {
    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roles && roles.some(r => r.role === "admin")) {
      toast.error("Administradores não têm acesso ao dashboard de traders.");
      navigate("/admin");
      return;
    }

    // If not admin, load user data
    await loadUserData(userId);
  };

  const loadUserData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      setProfile(profileData);
      
      // Carregar informações pessoais nos campos
      if (profileData) {
        // Tentar parsear informações antigas se existirem
        let infoPersonalizadas = null;
        try {
          if (profileData.informacoes_personalizadas) {
            infoPersonalizadas = JSON.parse(profileData.informacoes_personalizadas);
          }
        } catch (e) {
          console.error('Erro ao parsear informações personalizadas:', e);
        }

        setPersonalInfo({
          nome: profileData.nome || '',
          dataNascimento: profileData.data_nascimento || '',
          telefone: profileData.telefone || '',
          email: profileData.email || '',
          cpf: profileData.cpf || infoPersonalizadas?.cpf || '',
          endereco: profileData.rua_bairro || infoPersonalizadas?.endereco || '',
          numero: profileData.numero_residencial || infoPersonalizadas?.numero || '',
          cep: profileData.cep || infoPersonalizadas?.cep || '',
          cidade: profileData.cidade || infoPersonalizadas?.cidade || '',
          estado: profileData.estado || infoPersonalizadas?.estado || ''
        });
      }

      const { data: planosData } = await supabase
        .from("planos_adquiridos")
        .select(`
          *,
          planos:plano_id(nome_plano),
          historico_observacoes(*)
        `)
        .eq("cliente_id", userId)
        .order("id_carteira", { ascending: true });

      setPlanosAdquiridos(planosData || []);
      
      // Carregar documentos do usuário
      const { data: documentsData } = await supabase
        .from("user_documents")
        .select("*")
        .eq("user_id", userId);
      
      setUserDocuments(documentsData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await ActivityLogger.logLogout();
    await AuditLogger.logLogout();
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleBackToSite = () => {
    window.location.href = "/";
  };

  const handleContratarPlano = () => {
    window.location.href = "/";
  };

  const handleContatarSuporte = () => {
    window.open("https://wa.me/5512987072587", "_blank");
  };

  const openDialog = (type: 'withdrawal' | 'biweekly' | 'secondChance' | 'comments' | 'approval', planId: string) => {
    setActiveDialog({ type, planId });
  };

  const closeDialog = () => {
    setActiveDialog({ type: null, planId: '' });
  };

  // Upload de documentos diretamente desta seção para evitar duplicações visuais
  const uploadDoc = async (file: File, tipo: 'cnh' | 'selfie_rg') => {
    if (!user) return;

    // Validações básicas
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG, WEBP ou PDF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Tamanho máximo: 10MB");
      return;
    }

    try {
      console.log('Iniciando upload do documento:', tipo);
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${tipo}_${Date.now()}.${fileExt}`;

      console.log('Fazendo upload para storage:', fileName);
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, file);
      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      // NÃO usar URL pública, bucket é privado. Guardar o caminho do arquivo
      const storagePath = fileName;
      
      // Salvar no banco de dados (permitir múltiplos por tipo)
      const { data, error: dbError } = await supabase
        .from("user_documents")
        .insert({
          user_id: user.id,
          tipo_documento: tipo,
          arquivo_url: storagePath,
          status: "pendente",
        })
        .select();
      
      if (dbError) {
        console.error('Erro ao salvar no banco:', dbError);
        throw dbError;
      }
      
      console.log('Documento salvo com sucesso:', data);
      await ActivityLogger.logDocumentUploaded(tipo);
      toast.success("Documento enviado com sucesso!");
      await loadUserData(user.id);
    } catch (error: any) {
      console.error('Erro geral:', error);
      toast.error("Erro ao enviar documento: " + error.message);
    }
  };

  const handleDeleteDocument = async (docId: string, url: string) => {
    if (!user) return;

    try {
      // Extrair caminho do arquivo do valor salvo (pode ser URL antiga ou apenas o path)
      const filePath = url.includes('/documentos/') ? url.split('/documentos/')[1] : url;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documentos')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      await ActivityLogger.logDocumentDeleted(docId);
      toast.success("Documento excluído com sucesso!");
      await loadUserData(user.id);
    } catch (error: any) {
      console.error('Erro ao excluir documento:', error);
      toast.error("Erro ao excluir documento: " + error.message);
    }
  };

  const handleSavePersonalInfo = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const personalInfoSchema = z.object({
        nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
        dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
        telefone: z.string().min(10, "Telefone deve ter no mínimo 10 dígitos"),
        email: z.string().email("Email inválido"),
        cpf: z.string()
          .min(11, "CPF deve ter 11 dígitos")
          .max(11, "CPF deve ter 11 dígitos")
          .regex(/^\d+$/, "CPF deve conter apenas números"),
        endereco: z.string().min(5, "Endereço deve ter no mínimo 5 caracteres"),
        numero: z.string().min(1, "Número é obrigatório"),
        cep: z.string()
          .min(8, "CEP deve ter 8 dígitos")
          .max(8, "CEP deve ter 8 dígitos")
          .regex(/^\d+$/, "CEP deve conter apenas números"),
        cidade: z.string().min(2, "Cidade deve ter no mínimo 2 caracteres"),
        estado: z.string()
          .length(2, "Estado deve ter 2 caracteres")
          .regex(/^[A-Z]{2}$/, "Estado deve conter apenas letras maiúsculas"),
      });

      personalInfoSchema.parse(personalInfo);

      const { error } = await supabase
        .from("profiles")
        .update({
          nome: personalInfo.nome,
          data_nascimento: personalInfo.dataNascimento,
          telefone: personalInfo.telefone,
          email: personalInfo.email,
          cpf: personalInfo.cpf,
          rua_bairro: personalInfo.endereco,
          numero_residencial: personalInfo.numero,
          cep: personalInfo.cep,
          cidade: personalInfo.cidade,
          estado: personalInfo.estado,
        })
        .eq("id", user.id);

      if (error) throw error;

      await ActivityLogger.logProfileUpdated(personalInfo);
      toast.success("Informações atualizadas com sucesso!");
      setIsEditing(false);
      await loadUserData(user.id);
    } catch (error: any) {
      if (error.errors) {
        const messages = error.errors.map((e: any) => e.message).join(", ");
        toast.error(messages);
      } else {
        toast.error(error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      eliminado: { color: "text-red-500", label: "Eliminado" },
      segunda_chance: { color: "text-orange-500", label: "Segunda Chance" },
      teste_1: { color: "text-orange-500", label: "Teste 1" },
      teste_2: { color: "text-orange-500", label: "Teste 2" },
      sim_rem: { color: "text-green-500", label: "Simulador Rem." },
      ativo: { color: "text-blue-500", label: "Ativo" },
      pausado: { color: "text-gray-500", label: "Pausado" },
    };

    const config = statusMap[status] || statusMap.ativo;
    return (
      <div className="flex items-center gap-2">
        <span className={`text-2xl ${config.color}`}>●</span>
        <span className="font-bold text-foreground">{config.label}</span>
      </div>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with gradient */}
      <header className="gradient-header px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src={logoImage} 
            alt="Prime Capital" 
            className="h-20 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white text-xl font-bold">
            Painel do Trader
          </span>
          <span className="text-white text-sm">- Voltar para o site</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-8 py-12">
          {/* Profile Section */}
          <div className="bg-white rounded-lg p-8 mb-8 relative">
            <div className="absolute top-6 right-6">
              <UserMenu onLogout={handleLogout} onBackToSite={handleBackToSite} />
            </div>
            
            <div className="flex items-center gap-8">
              <ProfilePictureUpload
                userId={session!.user.id}
                currentPhotoUrl={profile?.foto_perfil}
                userName={profile?.nome || "Trader"}
                onUploadComplete={(url) => setProfile({ ...profile, foto_perfil: url })}
              />
              
              <div className="flex-1 space-y-4">
                <h2 className="text-3xl font-bold text-foreground">
                  Olá, <span className="text-primary">{profile?.nome || "Trader"}</span>.
                </h2>
                <p className="text-foreground/70 text-sm">
                  Seja bem vindo ao Painel do Trader. Aqui você poderá controlar todas as funções da sua conta na nossa mesa proprietária.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleContratarPlano}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-2.5 text-sm"
                  >
                    COMPRAR UM PLANO
                  </Button>
                  <Button
                    onClick={handleContatarSuporte}
                    className="bg-foreground hover:bg-foreground/90 text-white font-bold px-6 py-2.5 text-sm"
                  >
                    CONTATAR SUPORTE
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Plans Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-[32px] font-bold text-foreground">Planos adquiridos</h3>
                <div className="border-b border-border/30 mt-2"></div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Atualizando a cada 30s</span>
              </div>
            </div>

            {planosAdquiridos.length === 0 ? (
              <div className="pt-32 pb-32 text-center">
                <p className="text-foreground/70 text-base">Nenhum plano adquirido ainda</p>
              </div>
            ) : (
              <>
                {/* Header Row */}
                <div className="grid grid-cols-5 gap-6 px-6 text-sm font-medium text-foreground/70">
                  <div>ID da Carteira</div>
                  <div>Tipo de plano</div>
                  <div>Status do Plano</div>
                  <div>Saque</div>
                  <div>Solicitações</div>
                </div>

                {/* Cards */}
                {planosAdquiridos
                  .slice((planosCurrentPage - 1) * planosPerPage, planosCurrentPage * planosPerPage)
                  .map((plano) => (
                  <div key={plano.id} className="space-y-3">
                    {/* Main Card */}
                    <div className="bg-gray-100 rounded-lg p-6">
                      <div className="grid grid-cols-5 gap-6 items-center">
                        {/* ID da Carteira */}
                        <div className="text-foreground font-semibold text-lg">
                          {plano.id_carteira}
                        </div>

                        {/* Tipo de plano */}
                        <div className="text-foreground font-medium">
                          {plano.planos?.nome_plano || '-'}
                        </div>

                        {/* Status do Plano */}
                        <div>
                          {getStatusBadge(plano.status_plano)}
                        </div>

                        {/* Saque */}
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium">
                            {plano.tipo_saque === 'mensal' ? 'Mensal' : 'Quinzenal'}
                          </span>
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border border-border text-foreground font-bold text-sm">
                            {plano.tipo_saque === 'mensal' ? '30' : '15'}
                          </span>
                          <button
                            onClick={() => plano.tipo_saque === 'mensal' ? openDialog('biweekly', plano.id) : null}
                            className={`text-foreground/50 text-xs hover:text-primary hover:underline ${plano.tipo_saque === 'mensal' ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            mudar para {plano.tipo_saque === 'mensal' ? 'quinzenal' : 'mensal'}
                          </button>
                        </div>

                        {/* Solicitações - Action Buttons */}
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => openDialog('secondChance', plano.id)}
                            className="w-10 h-10 border border-border rounded flex items-center justify-center hover:bg-white transition-colors bg-white"
                            title="Segunda chance"
                          >
                            <img src={iconsRecomecar} alt="Recomeçar" className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => openDialog('withdrawal', plano.id)}
                            className="w-10 h-10 border border-border rounded flex items-center justify-center hover:bg-white transition-colors bg-white"
                            title="Solicitação de saque"
                          >
                            <img src={iconsSaque} alt="Saque" className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => openDialog('comments', plano.id)}
                            className="w-10 h-10 border border-border rounded flex items-center justify-center hover:bg-white transition-colors bg-white"
                            title="Comentários"
                          >
                            <img src={iconsComentarios} alt="Comentários" className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => openDialog('approval', plano.id)}
                            className="w-10 h-10 border border-border rounded flex items-center justify-center hover:bg-white transition-colors bg-white"
                            title="Solicitar aprovação"
                          >
                            <img src={iconsSolicitarAprovacao} alt="Solicitar aprovação" className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Section - Outside card, white background */}
                    <div className="px-6">
                      <div className="text-sm font-semibold text-foreground mb-2">
                        Linha do tempo
                      </div>
                      <div className="pl-4">
                        <PlanTimeline entries={plano.historico_observacoes || []} />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                {planosAdquiridos.length > planosPerPage && (
                  <div className="flex items-center justify-center gap-3 pt-6">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPlanosCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={planosCurrentPage === 1}
                      className="h-10 w-10"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    
                    <span className="text-sm text-muted-foreground px-3">
                      Página {planosCurrentPage} de {Math.ceil(planosAdquiridos.length / planosPerPage)}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPlanosCurrentPage((prev) => Math.min(Math.ceil(planosAdquiridos.length / planosPerPage), prev + 1))}
                      disabled={planosCurrentPage === Math.ceil(planosAdquiridos.length / planosPerPage)}
                      className="h-10 w-10"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Status da plataforma Section */}
            <div className="bg-white rounded-lg p-8 space-y-6">
              <div>
                <h3 className="text-[32px] font-bold text-foreground">Status da plataforma</h3>
                <div className="border-b border-border/30 mt-2"></div>
              </div>
              
              <div className="flex items-start justify-between gap-6">
                {/* Status indicator on the left */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-2xl">
                    {profile?.pagamento_ativo ? '🟩' : '🟥'}
                  </span>
                  <span className="text-foreground">
                    {profile?.pagamento_ativo ? 'A plataforma está ativa' : 'A plataforma não está ativa'}
                  </span>
                </div>

                {/* Buttons on the right */}
                {profile?.pagamento_ativo && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-start">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                        ATIVAR PROFIT ONE
                      </Button>
                      <p className="text-[22px] font-bold text-foreground mt-2">R$ 90,00 por mês</p>
                      <p className="text-xs text-foreground/70">Primeiro mês grátis para novos usuários</p>
                    </div>
                    <div className="flex flex-col items-start">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                        ATIVAR PROFIT PRO
                      </Button>
                      <p className="text-[22px] font-bold text-foreground mt-2">R$ 220,00 por mês</p>
                    </div>
                    <Button className="bg-foreground hover:bg-foreground/90 text-white font-bold px-8">
                      DESATIVAR PLANO
                    </Button>
                  </div>
                )}
              </div>
              
              {!profile?.pagamento_ativo && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    Seu acesso à plataforma foi desativado. Entre em contato com o suporte para mais informações.
                  </p>
                </div>
              )}
            </div>

            {/* Informações cadastrais Section */}
            <div className="bg-white rounded-lg p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[32px] font-bold text-foreground mb-2">Informações cadastrais</h3>
                  <div className="border-b border-border/30"></div>
                  <p className="text-foreground/70">
                    Preencha todos os dados para que você não tenha nenhum problema ao solicitar um saque.
                  </p>
                </div>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                  title={isEditing ? "Cancelar edição" : "Editar informações"}
                >
                  <Pencil className="w-5 h-5 text-foreground/70" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm text-foreground">Nome completo</label>
                  <input 
                    type="text" 
                    value={personalInfo.nome}
                    onChange={(e) => setPersonalInfo({...personalInfo, nome: e.target.value})}
                    readOnly={!isEditing}
                    className="w-full px-4 py-3 rounded-lg bg-muted/30 border-0 disabled:opacity-70 read-only:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-foreground">Data de nascimento</label>
                  <input 
                    type="date" 
                    value={personalInfo.dataNascimento}
                    onChange={(e) => setPersonalInfo({...personalInfo, dataNascimento: e.target.value})}
                    readOnly={!isEditing}
                    className="w-full px-4 py-3 rounded-lg bg-muted/30 border-0 disabled:opacity-70 read-only:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-foreground">Telefone</label>
                  <input 
                    type="tel" 
                    value={personalInfo.telefone}
                    onChange={(e) => setPersonalInfo({...personalInfo, telefone: e.target.value})}
                    readOnly={!isEditing}
                    className="w-full px-4 py-3 rounded-lg bg-muted/30 border-0 disabled:opacity-70 read-only:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-foreground">Email</label>
                  <input 
                    type="email" 
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                    readOnly={!isEditing}
                    className="w-full px-4 py-3 rounded-lg bg-muted/30 border-0 disabled:opacity-70 read-only:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-foreground">CPF</label>
                  <input 
                    type="text" 
                    value={personalInfo.cpf}
                    onChange={(e) => setPersonalInfo({...personalInfo, cpf: e.target.value.replace(/\D/g, '').slice(0, 11)})}
                    placeholder="Apenas números"
                    readOnly={!isEditing}
                    className="w-full px-4 py-3 rounded-lg bg-muted/30 border-0 disabled:opacity-70 read-only:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-foreground">Rua e Bairro</label>
                  <input 
                    type="text" 
                    value={personalInfo.endereco}
                    onChange={(e) => setPersonalInfo({...personalInfo, endereco: e.target.value})}
                    readOnly={!isEditing}
                    className="w-full px-4 py-3 rounded-lg bg-muted/30 border-0 disabled:opacity-70 read-only:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-foreground">Número residencial</label>
                  <input 
                    type="text" 
                    value={personalInfo.numero}
                    onChange={(e) => setPersonalInfo({...personalInfo, numero: e.target.value})}
                    readOnly={!isEditing}
                    className="w-full px-4 py-3 rounded-lg bg-muted/30 border-0 disabled:opacity-70 read-only:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-foreground">CEP</label>
                  <input 
                    type="text" 
                    value={personalInfo.cep}
                    onChange={(e) => setPersonalInfo({...personalInfo, cep: e.target.value.replace(/\D/g, '').slice(0, 8)})}
                    placeholder="Apenas números"
                    readOnly={!isEditing}
                    className="w-full px-4 py-3 rounded-lg bg-muted/30 border-0 disabled:opacity-70 read-only:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-foreground">Cidade</label>
                  <input 
                    type="text" 
                    value={personalInfo.cidade}
                    onChange={(e) => setPersonalInfo({...personalInfo, cidade: e.target.value})}
                    readOnly={!isEditing}
                    className="w-full px-4 py-3 rounded-lg bg-muted/30 border-0 disabled:opacity-70 read-only:opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-foreground">Estado</label>
                  <input 
                    type="text" 
                    value={personalInfo.estado}
                    onChange={(e) => setPersonalInfo({...personalInfo, estado: e.target.value.toUpperCase().slice(0, 2)})}
                    placeholder="Ex: SP"
                    maxLength={2}
                    readOnly={!isEditing}
                    className="w-full px-4 py-3 rounded-lg bg-muted/30 border-0 disabled:opacity-70 read-only:opacity-70"
                  />
                </div>
              </div>

              {/* Document Upload Status */}
              <div className="space-y-3 pt-4 border-t">
                <DocumentViewDialog
                  tipo="cnh"
                  label="CNH, RG ou CPF"
                  hasDocument={userDocuments.some(doc => doc.tipo_documento === 'cnh')}
                  documents={userDocuments.filter(doc => doc.tipo_documento === 'cnh')}
                  open={cnhViewOpen}
                  onOpenChange={setCnhViewOpen}
                  onUploadClick={() => cnhInputRef.current?.click()}
                  onDelete={handleDeleteDocument}
                />
                <DocumentViewDialog
                  tipo="selfie_rg"
                  label="Selfie segurando RG"
                  hasDocument={userDocuments.some(doc => doc.tipo_documento === 'selfie_rg')}
                  documents={userDocuments.filter(doc => doc.tipo_documento === 'selfie_rg')}
                  open={selfieViewOpen}
                  onOpenChange={setSelfieViewOpen}
                  onUploadClick={() => selfieInputRef.current?.click()}
                  onDelete={handleDeleteDocument}
                />
                {/* Inputs de arquivo ocultos para disparar o upload */}
                <input
                  ref={cnhInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const files = e.target.files;
                    (async () => {
                      if (files && files.length) {
                        for (const file of Array.from(files)) {
                          await uploadDoc(file, 'cnh');
                        }
                      }
                      e.currentTarget.value = '';
                    })();
                  }}
                />
                <input
                  ref={selfieInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    const files = e.target.files;
                    (async () => {
                      if (files && files.length) {
                        for (const file of Array.from(files)) {
                          await uploadDoc(file, 'selfie_rg');
                        }
                      }
                      e.currentTarget.value = '';
                    })();
                  }}
                />

              </div>

              {isEditing && (
                <div className="pt-4">
                  <p className="text-sm text-foreground/70 mb-4">
                    Ao salvar, você está de acordo com o nosso regulamento atual. Vale lembrar que qualquer saque é efetuado apenas para chave PIX cadastrada no CPF do trader.
                  </p>
                  <Button 
                    onClick={handleSavePersonalInfo}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-12 py-3"
                  >
                    {isSaving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                  </Button>
                </div>
              )}
            </div>

            {/* Status Legend */}
            <div className="bg-white rounded-lg p-6 mt-8">
              <h4 className="text-xl font-bold text-foreground mb-6">Entenda o status do seu plano:</h4>
              
              <div className="grid md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="font-bold text-foreground">Teste 1 / Teste 2</span>
                  </div>
                  <p className="text-sm text-foreground/70">
                    Você está nesta primeira fase. Vamos aguardar você atingir a meta para que possa passar para próxima etapa. Caso seja um plano Economic, terá o Teste 1 e 2, caso não, terá apenas Teste 1.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="font-bold text-foreground">Segunda chance</span>
                  </div>
                  <p className="text-sm text-foreground/70">
                    Você falhou no teste e solicitou uma segunda chance para passar na primeira fase
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive"></div>
                    <span className="font-bold text-foreground">Eliminado</span>
                  </div>
                  <p className="text-sm text-foreground/70">
                    Caso você bata o valor máximo de prejuízo ou descumpra alguma das regras do regulamento, será eliminado com esse status.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-bold text-foreground">Simulador Rem.</span>
                  </div>
                  <p className="text-sm text-foreground/70">
                    Nessa fase, todo valor que você fizer é apto para saque ou bater a meta no plano Skip ou a partir de R$ 100,00 nos demais planos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <WithdrawalRequestDialog
        open={activeDialog.type === 'withdrawal'}
        onOpenChange={closeDialog}
        planId={activeDialog.planId}
      />
      <BiweeklyWithdrawalDialog
        open={activeDialog.type === 'biweekly'}
        onOpenChange={closeDialog}
        planId={activeDialog.planId}
      />
      <SecondChanceDialog
        open={activeDialog.type === 'secondChance'}
        onOpenChange={closeDialog}
        planId={activeDialog.planId}
      />
      <CommentsDialog
        open={activeDialog.type === 'comments'}
        onOpenChange={closeDialog}
        planId={activeDialog.planId}
      />
      <ApprovalRequestDialog
        open={activeDialog.type === 'approval'}
        onOpenChange={closeDialog}
        planoId={activeDialog.planId}
      />
    </div>
  );
};

export default Dashboard;
