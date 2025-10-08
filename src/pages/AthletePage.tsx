import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { mockAthletes } from "@/data/mockAthletes";
import { TrendingUp, TrendingDown, Trophy, ArrowLeft, Twitter, Instagram } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const AthletePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const athlete = mockAthletes.find((a) => a.id === id);
  const [tokenAmount, setTokenAmount] = useState(1);
  const [buying, setBuying] = useState(false);

  if (!athlete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Atleta não encontrado</h1>
          <Link to="/marketplace">
            <Button variant="hero">Voltar ao Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = athlete.priceChange >= 0;
  const totalPrice = athlete.tokenPrice * tokenAmount;

  const handleBuy = async () => {
    if (!user) {
      toast.error("Você precisa fazer login para comprar tokens");
      navigate("/auth");
      return;
    }

    if (tokenAmount <= 0 || tokenAmount > athlete.availableTokens) {
      toast.error("Quantidade de tokens inválida");
      return;
    }

    setBuying(true);
    try {
      // Insere a compra na tabela user_tokens
      const { error: insertError } = await supabase
        .from('user_tokens')
        .insert({
          user_id: user.id,
          athlete_id: athlete.id,
          quantity: tokenAmount,
          purchase_price: athlete.tokenPrice
        });

      if (insertError) throw insertError;

      toast.success(`Compra realizada! ${tokenAmount} tokens de ${athlete.name} por R$ ${totalPrice.toFixed(2)}`);
      setTokenAmount(1);
    } catch (error) {
      console.error('Error buying tokens:', error);
      toast.error('Erro ao comprar tokens. Tente novamente.');
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Link to="/marketplace">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Athlete Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <img
                      src={athlete.avatar}
                      alt={athlete.name}
                      className="w-32 h-32 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h1 className="text-3xl font-bold mb-2">{athlete.name}</h1>
                          <Badge className="bg-secondary">
                            <Trophy className="w-3 h-3 mr-1" />
                            {athlete.sport}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {athlete.socialMedia.twitter && (
                            <Button variant="ghost" size="icon">
                              <Twitter className="w-5 h-5" />
                            </Button>
                          )}
                          {athlete.socialMedia.instagram && (
                            <Button variant="ghost" size="icon">
                              <Instagram className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{athlete.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas do Token</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
                      <p className="text-2xl font-bold">${(athlete.marketCap / 1000).toFixed(0)}k</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Volume 24h</p>
                      <p className="text-2xl font-bold">${(athlete.volume24h / 1000).toFixed(0)}k</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Tokens</p>
                      <p className="text-2xl font-bold">{athlete.totalTokens.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Disponíveis</p>
                      <p className="text-2xl font-bold">{athlete.availableTokens.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle>Conquistas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {athlete.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-premium" />
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Trading */}
            <div className="space-y-6">
              {/* Price Card */}
              <Card className="sticky top-24">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Preço Atual</CardTitle>
                    <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-danger'}`}>
                      {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      <span className="font-semibold">
                        {isPositive ? '+' : ''}{athlete.priceChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-4xl font-bold mb-1">
                      ${athlete.tokenPrice.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">por token</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Quantidade de Tokens
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max={athlete.availableTokens}
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>

                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Total</p>
                      <p className="text-2xl font-bold">${totalPrice.toFixed(2)}</p>
                    </div>

                    <Button 
                      variant="buy" 
                      size="lg" 
                      className="w-full"
                      onClick={handleBuy}
                      disabled={buying}
                    >
                      {buying ? 'Processando...' : 'Comprar Tokens'}
                    </Button>
                    <Button variant="outline" size="lg" className="w-full">
                      Adicionar à Watchlist
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AthletePage;
