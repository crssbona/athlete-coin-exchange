import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Wallet, Settings, LogOut, Eye, UserCircle, Menu, ChevronDown, ChevronUp, Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "./ui/sheet";

// 🔥 Atualize aqui para os caminhos correctos das suas imagens!
import logoDark from "@/assets/logo-dark.png"; // Caminho para o logo do modo escuro
import logoLight from "@/assets/logo-light.png"; // Caminho para o logo do modo claro

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileSubmenuOpen, setIsProfileSubmenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Você saiu da conta");
      setIsMobileMenuOpen(false);
      setIsProfileSubmenuOpen(false);
      navigate("/");
    }
  };

  const getUserInitial = () => {
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const handleNavigation = (path: string) => {
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const renderUserMenuDesktop = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getUserInitial()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 z-[100]">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Usuário</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/watchlist')}>
          <Eye className="w-4 h-4 mr-2" />
          Watchlist
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <UserCircle className="w-4 h-4 mr-2" />
          Meu Perfil
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          {/* 👇 LÓGICA DE TROCA DE LOGO AQUI 👇 */}
          <img
            // Se o tema for escuro, mostra o logo escura. Caso contrário (claro), mostra o logo clara.
            src={theme === 'dark' ? logoDark : logoLight}
            alt="Logo Opatrocinador"
            // Mantemos as classes de tamanho e object-contain. Removemos a lógica de filtro 'invert'.
            className="w-[160px] md:w-[250px] h-auto object-contain transition-all"
          />
        </Link>

        {/* NAVEGAÇÃO DESKTOP */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/vitrine" className="text-sm font-medium hover:text-primary transition-colors">
            Vitrine
          </Link>
          <Link to="/how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
            Como Funciona
          </Link>
        </div>

        {/* ACÇÕES DESKTOP */}
        <div className="hidden md:flex items-center gap-3">
          {/* Botão de Tema (Desktop) */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:text-primary transition-colors mr-2">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <Link to="/wallet">
            <Button variant="ghost" size="icon" className="hover:text-primary transition-colors">
              <Wallet className="w-5 h-5" />
            </Button>
          </Link>

          {user ? (
            renderUserMenuDesktop()
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero" size="sm">
                  Criar Conta
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* NAVEGAÇÃO MOBILE */}
        <div className="md:hidden flex items-center gap-2">
          {/* Botão de Tema (Mobile) - Fora da gaveta para fácil acesso */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-7 h-7" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] flex flex-col pt-12 overflow-y-auto">
              <SheetHeader className="hidden">
                <SheetTitle>Menu de Navegação</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6">

                {user ? (
                  <div className="flex flex-col gap-5">
                    <button onClick={() => handleNavigation('/wallet')} className="flex items-center gap-4 w-full text-left group">
                      <div className="w-10 h-10 rounded-full bg-muted border flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <span className="text-lg font-medium group-hover:text-primary transition-colors">Minha Carteira</span>
                    </button>

                    <div className="flex flex-col gap-2">
                      <button onClick={() => setIsProfileSubmenuOpen(!isProfileSubmenuOpen)} className="flex items-center justify-between w-full text-left group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted border flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {getUserInitial()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <span className="text-lg font-medium group-hover:text-primary transition-colors">Meu Perfil</span>
                        </div>
                        {isProfileSubmenuOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
                      </button>

                      {isProfileSubmenuOpen && (
                        <div className="flex flex-col gap-4 pl-[56px] mt-2 pb-2 animate-in slide-in-from-top-2">
                          <button onClick={() => handleNavigation('/watchlist')} className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-left w-full py-1">
                            <Eye className="w-4 h-4" /> Watchlist
                          </button>
                          <button onClick={() => handleNavigation('/profile')} className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-left w-full py-1">
                            <UserCircle className="w-4 h-4" /> Editar Perfil
                          </button>
                          <button className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-left w-full py-1">
                            <Settings className="w-4 h-4" /> Configurações
                          </button>
                          <button onClick={handleSignOut} className="flex items-center gap-3 text-destructive hover:text-destructive/80 transition-colors text-left w-full mt-2 pt-4 border-t border-border/50">
                            <LogOut className="w-4 h-4" /> Sair
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button variant="outline" className="w-full justify-center h-12" onClick={() => handleNavigation('/auth')}>
                      <User className="w-4 h-4 mr-2" /> Entrar
                    </Button>
                    <Button variant="default" className="w-full justify-center bg-primary h-12" onClick={() => handleNavigation('/auth')}>
                      Criar Conta
                    </Button>
                  </div>
                )}

                <div className="h-px bg-border w-full my-1" />

                <div className="flex flex-col gap-5">
                  <Link to="/vitrine" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary transition-colors">Vitrine</Link>
                  <Link to="/how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium hover:text-primary transition-colors">Como Funciona</Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </nav>
  );
};