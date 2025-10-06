import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidToken(true);
      } else {
        toast.error("Link inválido ou expirado");
        setTimeout(() => navigate('/auth'), 2000);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validations
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres");
      setIsLoading(false);
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    setIsLoading(false);

    if (error) {
      toast.error("Erro ao redefinir senha. Tente novamente.");
      console.error("Reset password error:", error);
      return;
    }

    toast.success("Senha redefinida com sucesso!");
    setTimeout(() => navigate('/auth'), 1500);
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Verificando link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg gradient-primary glow-primary flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">Opatrocinador</span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Redefinir senha</CardTitle>
            <CardDescription>
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Redefinindo..." : "Redefinir senha"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                ← Voltar para login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
