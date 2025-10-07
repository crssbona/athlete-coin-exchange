import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await signIn(email, password);
    
    setIsLoading(false);
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou senha incorretos");
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Por favor, confirme seu email antes de fazer login");
      } else {
        toast.error("Erro ao fazer login. Tente novamente.");
      }
      return;
    }

    toast.success("Login realizado com sucesso!");
    navigate('/');
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const userType = formData.get("userType") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const documentType = formData.get("documentType") as string;
    const documentNumber = formData.get("documentNumber") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Client-side validation
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

    if (!email.includes('@')) {
      toast.error("Email inválido");
      setIsLoading(false);
      return;
    }

    // Sign up with metadata
    const { data, error } = await signUp(email, password, {
      user_type: userType,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      document_type: documentType,
      document_number: documentNumber
    });

    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Este email já está cadastrado. Faça login.");
      } else if (error.message.includes("Password")) {
        toast.error("Senha muito fraca. Use letras, números e caracteres especiais.");
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
      return;
    }

    // Save profile data to profiles table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name: `${firstName} ${lastName}`.trim(),
          phone: phone,
          document: documentNumber,
          active_role: 'sponsor'
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }

    toast.success("Conta criada com sucesso! Verifique seu email para confirmar.");
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

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Bem-vindo de volta</CardTitle>
                <CardDescription>
                  Entre com suas credenciais para acessar sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
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
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>

                  <div className="text-center text-sm">
                    <Link to="/forgot-password" className="text-muted-foreground hover:text-primary transition-colors">
                      Esqueceu sua senha?
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Criar nova conta</CardTitle>
                <CardDescription>
                  Preencha os dados abaixo para começar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* User Type Selection */}
                  <div className="space-y-3">
                    <Label>Você é:</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="userType"
                          value="athlete"
                          defaultChecked
                          className="peer sr-only"
                        />
                        <div className="border-2 border-border peer-checked:border-primary peer-checked:bg-primary/5 rounded-lg p-4 text-center transition-all hover:border-primary/50">
                          <div className="text-4xl mb-2">🏆</div>
                          <h3 className="font-semibold mb-1">Atleta</h3>
                          <p className="text-xs text-muted-foreground">
                            Quero receber patrocínio
                          </p>
                        </div>
                      </label>

                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="userType"
                          value="sponsor"
                          className="peer sr-only"
                        />
                        <div className="border-2 border-border peer-checked:border-primary peer-checked:bg-primary/5 rounded-lg p-4 text-center transition-all hover:border-primary/50">
                          <div className="text-4xl mb-2">💰</div>
                          <h3 className="font-semibold mb-1">Patrocinador</h3>
                          <p className="text-xs text-muted-foreground">
                            Quero investir em atletas
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">Nome</Label>
                      <Input
                        id="signup-firstname"
                        name="firstName"
                        type="text"
                        placeholder="Seu nome"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Sobrenome</Label>
                      <Input
                        id="signup-lastname"
                        name="lastName"
                        type="text"
                        placeholder="Seu sobrenome"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Telefone/WhatsApp</Label>
                    <Input
                      id="signup-phone"
                      name="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Document Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-doctype">Tipo de Documento</Label>
                      <select
                        id="signup-doctype"
                        name="documentType"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                        disabled={isLoading}
                      >
                        <option value="">Selecione</option>
                        <option value="cpf">CPF</option>
                        <option value="rg">RG</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="passport">Passaporte</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-docnumber">Número do Documento</Label>
                      <Input
                        id="signup-docnumber"
                        name="documentNumber"
                        type="text"
                        placeholder="000.000.000-00"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        required
                        disabled={isLoading}
                        minLength={8}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                      <Input
                        id="signup-confirm"
                        name="confirmPassword"
                        type="password"
                        placeholder="Digite a senha novamente"
                        required
                        disabled={isLoading}
                        minLength={8}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Ao criar uma conta, você concorda com nossos{" "}
                    <a href="#" className="text-primary hover:underline">
                      Termos de Serviço
                    </a>{" "}
                    e{" "}
                    <a href="#" className="text-primary hover:underline">
                      Política de Privacidade
                    </a>
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/" className="hover:text-primary transition-colors">
            ← Voltar para home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
