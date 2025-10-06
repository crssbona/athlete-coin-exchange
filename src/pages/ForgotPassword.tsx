import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    if (!email.includes('@')) {
      toast.error("Por favor, insira um email válido");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsLoading(false);

    if (error) {
      toast.error("Erro ao enviar email. Tente novamente.");
      console.error("Forgot password error:", error);
      return;
    }

    setEmailSent(true);
    toast.success("Email de recuperação enviado com sucesso!");
  };

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
            <CardTitle>Esqueceu sua senha?</CardTitle>
            <CardDescription>
              {emailSent 
                ? "Verifique seu email para redefinir sua senha" 
                : "Digite seu email e enviaremos um link para redefinir sua senha"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-success" />
                </div>
                <p className="text-muted-foreground">
                  Enviamos um email com instruções para redefinir sua senha.
                  <br />
                  <span className="text-sm">Verifique também a caixa de spam.</span>
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setEmailSent(false)}
                >
                  Enviar novamente
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
              </form>
            )}

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

export default ForgotPassword;
