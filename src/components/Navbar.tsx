import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, User, Wallet, Settings, LogOut, LayoutDashboard, UserCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
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

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Você saiu da conta");
      navigate("/");
    }
  };

  const getUserInitial = () => {
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary glow-primary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Opatrocinador</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/marketplace" className="text-sm font-medium hover:text-primary transition-colors">
            Marketplace
          </Link>
          <Link to="/how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
            Como Funciona
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <Wallet className="w-5 h-5" />
          </Button>
          
          {user ? (
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
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Usuário</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem>
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
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              </Link>
              <Link to="/auth" className="hidden md:inline-flex">
                <Button variant="hero" size="sm">
                  Criar Conta
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
