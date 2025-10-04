import { Link } from "react-router-dom";
import { TrendingUp, User, Wallet } from "lucide-react";
import { Button } from "./ui/button";

export const Navbar = () => {
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
        </div>
      </div>
    </nav>
  );
};
