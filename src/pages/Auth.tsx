import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import logoInferior from "@/assets/logo-escrita-inferior.png";

// Validação Matemática de CPF
const isValidCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(cpf.substring(10, 11))) return false;
  return true;
};

// Validação Matemática de CNPJ
const isValidCNPJ = (cnpj: string) => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false;
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  let digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(1))) return false;
  return true;
};

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [keepConnected, setKeepConnected] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados para Formatação de Documento
  const [docType, setDocType] = useState<string>("cpf");
  const [docValue, setDocValue] = useState("");

  // Estados para Formatação de Telefone
  const [phoneCode, setPhoneCode] = useState<string>("+55");
  const [phoneValue, setPhoneValue] = useState("");

  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Função para formatar o documento em tempo real
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');

    if (docType === 'cpf') {
      if (value.length > 11) value = value.slice(0, 11);
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else if (docType === 'cnpj') {
      if (value.length > 14) value = value.slice(0, 14);
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }

    setDocValue(value);
  };

  // Função para formatar o telefone em tempo real
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');

    if (phoneCode === '+55') {
      // Máscara do Brasil: (XX) XXXXX-XXXX
      if (value.length > 11) value = value.slice(0, 11);
      if (value.length > 2) value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      if (value.length > 9) value = value.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
    } else {
      // Genérico para outros países (sem pontuação fixa)
      if (value.length > 15) value = value.slice(0, 15);
    }

    setPhoneValue(value);
  };

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

    if (!keepConnected) {
      localStorage.setItem('temp_session_flag', 'true');
      document.cookie = "session_active=true; path=/;";
    } else {
      localStorage.removeItem('temp_session_flag');
      document.cookie = "session_active=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }

    toast.success("Login realizado com sucesso!");
    navigate('/');
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const documentNumber = docValue.replace(/\D/g, '');
    const finalPhone = `${phoneCode} ${phoneValue}`; // Junta o DDI com o número formatado

    // Validações
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

    if (phoneValue.replace(/\D/g, '').length < 8) {
      toast.error("Número de telefone muito curto.");
      setIsLoading(false);
      return;
    }

    // Validação Matemática de Documento
    if (docType === 'cpf' && !isValidCPF(documentNumber)) {
      toast.error("O CPF digitado é inválido.");
      setIsLoading(false);
      return;
    }

    if (docType === 'cnpj' && !isValidCNPJ(documentNumber)) {
      toast.error("O CNPJ digitado é inválido.");
      setIsLoading(false);
      return;
    }

    // Verifica duplicação no banco de dados
    const { data: documentExists } = await supabase.rpc('check_document_exists', {
      p_document: documentNumber
    });

    if (documentExists) {
      toast.error(`Este ${docType.toUpperCase()} já está vinculado a uma conta existente.`);
      setIsLoading(false);
      return;
    }

    const { data, error } = await signUp(email, password, {
      first_name: firstName,
      last_name: lastName,
      phone: finalPhone, // Usa o telefone combinado
      document_type: docType,
      document_number: documentNumber
    });

    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already been registered")) {
        toast.error("Este email já está vinculado à uma conta");
      } else if (error.message.includes("Password")) {
        toast.error("Senha muito fraca. Use letras, números e caracteres especiais.");
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
      return;
    }

    if (data?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name: `${firstName} ${lastName}`.trim(),
          phone: finalPhone, // Usa o telefone combinado
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
          <img src={logoInferior} alt="Logo Opatrocinador" height={250} width={250} />
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
                    <div className="relative">
                      <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Checkbox de Manter Conectado */}
                  <div className="flex items-center space-x-2 py-2">
                    <Checkbox
                      id="keep-connected"
                      checked={keepConnected}
                      onCheckedChange={(checked) => setKeepConnected(checked as boolean)}
                    />
                    <label
                      htmlFor="keep-connected"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Manter conectado
                    </label>
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

                  {/* NOVO: Telefone com Seletor de País */}
                  <div className="space-y-2">
                    <Label>Telefone/WhatsApp</Label>
                    <div className="flex gap-2">
                      <Select
                        value={phoneCode}
                        onValueChange={(val) => {
                          setPhoneCode(val);
                          setPhoneValue(""); // Limpa o campo se trocar de país para evitar bugs
                        }}
                      >
                        <SelectTrigger className="w-[110px]" disabled={isLoading}>
                          <SelectValue placeholder="DDI" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+55">🇧🇷 +55</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder={phoneCode === '+55' ? "(00) 00000-0000" : "000000000"}
                        value={phoneValue}
                        onChange={handlePhoneChange}
                        required
                        disabled={isLoading}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Document Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Documento</Label>
                      <Select
                        value={docType}
                        onValueChange={(val) => {
                          setDocType(val);
                          setDocValue("");
                        }}
                      >
                        <SelectTrigger disabled={isLoading}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-docnumber">Número do Documento</Label>
                      <Input
                        id="signup-docnumber"
                        type="text"
                        placeholder={docType === 'cpf' ? "000.000.000-00" : "00.000.000/0000-00"}
                        value={docValue}
                        onChange={handleDocumentChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 8"
                          required
                          disabled={isLoading}
                          minLength={8}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Novamente"
                          required
                          disabled={isLoading}
                          minLength={8}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
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