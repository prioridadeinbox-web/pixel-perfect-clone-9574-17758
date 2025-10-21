import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoImage from "@/assets/logo-prime-new.png";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    dataNascimento: "",
    telefone: "",
    email: "",
    cpf: "",
    ruaBairro: "",
    numeroResidencial: "",
    cep: "",
    cidade: "",
    estado: "",
    password: "",
    confirmPassword: "",
  });

  const validarCPF = (cpf: string): boolean => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false; // todos iguais -> inválido
    
    const nums = digits.slice(0, 9).split('').map(Number);
    
    // Primeiro dígito
    let s = 0;
    for (let i = 0; i < 9; i++) s += nums[i] * (10 - i);
    let r = s % 11;
    let d1 = 11 - r;
    if (d1 >= 10) d1 = 0;
    
    // Segundo dígito
    nums.push(d1);
    let s2 = 0;
    for (let i = 0; i < 10; i++) s2 += nums[i] * (11 - i);
    let r2 = s2 % 11;
    let d2 = 11 - r2;
    if (d2 >= 10) d2 = 0;
    
    return digits.slice(9) === `${d1}${d2}`;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      setLoading(false);
      return;
    }

    // Validar CPF
    if (!validarCPF(formData.cpf)) {
      toast.error("CPF inválido");
      setLoading(false);
      return;
    }

    // Validar telefone
    const telefoneDigits = formData.telefone.replace(/\D/g, '');
    if (telefoneDigits.length > 11) {
      toast.error("Telefone deve ter no máximo 11 dígitos");
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome: formData.nome,
          },
        },
      });

      if (error) throw error;

      // Update profile with additional data
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            data_nascimento: formData.dataNascimento || null,
            telefone: formData.telefone || null,
            cpf: formData.cpf || null,
            rua_bairro: formData.ruaBairro || null,
            numero_residencial: formData.numeroResidencial || null,
            cep: formData.cep || null,
            cidade: formData.cidade || null,
            estado: formData.estado || null,
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;
      }
      
      toast.success("Cadastro realizado! Você já pode fazer login.");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with gradient */}
      <header className="gradient-header px-8 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={logoImage} 
            alt="Prime Capital" 
            className="h-12 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white text-2xl font-bold">Painel do Trader</span>
          <button 
            onClick={() => navigate("/")}
            className="text-white flex items-center gap-2 text-sm hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o site
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="space-y-8">
            <div>
              <h2 className="text-5xl font-bold text-foreground mb-4">Cadastro</h2>
              <p className="text-foreground/80 text-lg">
                Preencha todos os dados para realizar o cadastro.
              </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-6">
              {/* Row 1: Nome completo & Data de nascimento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground text-base font-normal">
                    Nome completo
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="h-14 text-base border-input bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-foreground text-base font-normal">
                    Data de nascimento
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    required
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                    className="h-14 text-base border-input bg-muted/50"
                  />
                </div>
              </div>

              {/* Row 2: Telefone, Email & CPF */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground text-base font-normal">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.telefone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      if (digits.length <= 11) {
                        setFormData({ ...formData, telefone: e.target.value });
                      }
                    }}
                    className="h-14 text-base border-input bg-muted/50"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground text-base font-normal">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-14 text-base border-input bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-foreground text-base font-normal">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    type="text"
                    required
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })}
                    className="h-14 text-base border-input bg-muted/50"
                    placeholder="000.000.000-00"
                    maxLength={11}
                  />
                </div>
              </div>

              {/* Row 3: Rua e Bairro & Número residencial */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="street" className="text-foreground text-base font-normal">
                    Rua e Bairro
                  </Label>
                  <Input
                    id="street"
                    type="text"
                    required
                    value={formData.ruaBairro}
                    onChange={(e) => setFormData({ ...formData, ruaBairro: e.target.value })}
                    className="h-14 text-base border-input bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number" className="text-foreground text-base font-normal">
                    Número residencial
                  </Label>
                  <Input
                    id="number"
                    type="text"
                    required
                    value={formData.numeroResidencial}
                    onChange={(e) => setFormData({ ...formData, numeroResidencial: e.target.value })}
                    className="h-14 text-base border-input bg-muted/50"
                  />
                </div>
              </div>

              {/* Row 4: CEP, Cidade & Estado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cep" className="text-foreground text-base font-normal">
                    CEP
                  </Label>
                  <Input
                    id="cep"
                    type="text"
                    required
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value.replace(/\D/g, '') })}
                    className="h-14 text-base border-input bg-muted/50"
                    placeholder="00000-000"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-foreground text-base font-normal">
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    required
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className="h-14 text-base border-input bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-foreground text-base font-normal">
                    Estado
                  </Label>
                  <Input
                    id="state"
                    type="text"
                    required
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                    className="h-14 text-base border-input bg-muted/50"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground text-base font-normal">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-14 text-base border-input bg-muted/50 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground text-base font-normal">
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-14 text-base border-input bg-muted/50 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Buttons and agreement text */}
              <div className="flex items-center gap-6 pt-6">
                <Button
                  type="button"
                  onClick={() => navigate("/")}
                  disabled={loading}
                  className="bg-foreground hover:bg-foreground/90 text-white font-bold text-lg px-12 py-6 rounded-lg transition-all"
                >
                  CANCELAR
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-12 py-6 rounded-lg shadow-lg transition-all hover:shadow-xl"
                >
                  {loading ? "CADASTRANDO..." : "CADASTRAR"}
                </Button>
                <p className="text-foreground/70 text-sm flex-1">
                  Ao cadastrar, você está de acordo com o nosso regulamento atual.
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
