import { Link } from "react-router-dom";
import { TrendingUp, Coins, DollarSign, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import heroImage from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Hero background"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 glow-primary">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">A Nova Geração de Investimentos Esportivos</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            A arena de Tokens{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              <br /> dos atletas
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Compre, venda e negoceie tokens de ativos exclusivos gerados pelos seus atletas favoritos num mercado transparente e seguro.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/vitrine">
              <Button variant="hero" size="lg" className="text-lg px-8">
                Explorar Vitrine
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline" size="lg" className="text-lg">
                Como Funciona
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-8 border-t border-border">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-success">
                <Coins className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">1,200+</p>
              <p className="text-sm text-muted-foreground">Tokens Listados</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">$50M+</p>
              <p className="text-sm text-muted-foreground">Volume Negociado</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-premium">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm text-muted-foreground">Mercado P2P Seguro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};