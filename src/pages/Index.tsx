import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoImage from "@/assets/logo-prime-new.png";

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        checkUserRole(session.user.id);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          checkUserRole(session.user.id);
        }
      }
    );

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roles && roles.length > 0) {
      if (roles.some(r => r.role === "admin")) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await checkUserRole(data.user.id);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
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
          <button className="text-white flex items-center gap-2 text-sm hover:opacity-90 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o site
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Left Column - Welcome Message */}
            <div className="space-y-8">
              <h2 className="text-5xl font-bold text-foreground">
                Bem vindo de <br />
                volta, <span className="text-primary">Trader</span>.
              </h2>

              <div className="space-y-4 text-foreground/80 text-lg">
                <p>
                  Seja bem vindo ao Painel do Trader. Aqui você poderá controlar todas as funções da sua conta na nossa mesa proprietária.
                </p>
                <p>
                  Faça seu login ou realize o cadastro para acessar as funções.
                </p>
              </div>

              <Button 
                onClick={() => navigate("/cadastro")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-12 py-6 rounded-lg shadow-lg transition-all hover:shadow-xl"
              >
                FAZER CADASTRO
              </Button>
            </div>

            {/* Right Column - Login Form */}
            <div className="space-y-8">
              <h3 className="text-4xl font-bold text-foreground">Login</h3>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-foreground text-base font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 text-base border-input bg-background"
                    placeholder=""
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-foreground text-base font-medium">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 text-base border-input bg-background"
                    placeholder=""
                    required
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 rounded-lg shadow-lg transition-all hover:shadow-xl"
                >
                  {loading ? "ENTRANDO..." : "FAZER LOGIN"}
                </Button>

                <div className="text-center">
                  <a
                    href="https://wa.me/5512987072587"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/70 hover:text-foreground transition-colors text-sm inline-block"
                  >
                    Está com problemas?<br />Clique aqui
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
