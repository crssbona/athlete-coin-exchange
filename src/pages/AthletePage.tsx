import { useState, useEffect } from "react";
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
  const [athlete, setAthlete] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tokenAmount, setTokenAmount] = useState(1);
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [buying, setBuying] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    loadAthlete();
  }, [id]);

  useEffect(() => {
    if (user && athlete) {
      checkWatchlist();
    }
  }, [user, athlete]);

  useEffect(() => {
    if (athlete?.tokenPrice != null) {
      setLimitPrice(athlete.tokenPrice.toFixed(2));
    }
  }, [athlete?.tokenPrice]);

  const loadAthlete = async () => {
    try {
      // Try to load from Supabase first
      const { data, error } = await supabase
        .from('athlete_tokens')
        .select('*')
        .eq('athlete_id', id)
        .maybeSingle();

      if (data && data.athlete_name) {
        // Convert to Athlete type
        setAthlete({
          id: data.athlete_id,
          name: data.athlete_name,
          sport: data.sport,
          avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.athlete_name}`,
          tokenPrice: data.price_per_token,
          priceChange: data.price_change_24h || 0,
          totalTokens: data.total_tokens,
          availableTokens: data.available_tokens,
          marketCap: data.market_cap || (data.total_tokens * data.price_per_token),
          volume24h: data.volume_24h || 0,
          description: data.description || '',
          achievements: data.achievements || [],
          socialMedia: {
            twitter: data.social_twitter,
            instagram: data.social_instagram,
            twitch: data.social_twitch,
            youtube: data.social_youtube,
          },
          dbId: data.id // Store database ID for updates
        });
      } else {
        // Fallback to mock data
        const mockAthlete = mockAthletes.find((a) => a.id === id);
        setAthlete(mockAthlete);
      }
    } catch (error) {
      console.error('Error loading athlete:', error);
      // Fallback to mock data
      const mockAthlete = mockAthletes.find((a) => a.id === id);
      setAthlete(mockAthlete);
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlist = async () => {
    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('id')
        .eq('user_id', user?.id)
        .eq('athlete_id', athlete?.id)
        .maybeSingle();

      if (error) throw error;
      setIsInWatchlist(!!data);
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const toggleWatchlist = async () => {
    if (!user) {
      toast.error("Você precisa fazer login");
      navigate("/auth");
      return;
    }

    setWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        // Remove from watchlist
        const { error } = await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('athlete_id', athlete?.id);

        if (error) throw error;
        setIsInWatchlist(false);
        toast.success('Removido da watchlist');
      } else {
        // Add to watchlist
        const { error } = await supabase
          .from('user_watchlist')
          .insert({
            user_id: user.id,
            athlete_id: athlete?.id
          });

        if (error) throw error;
        setIsInWatchlist(true);
        toast.success('Adicionado à watchlist');
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      toast.error('Erro ao atualizar watchlist');
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-xl text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

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
  const limitPriceNum = parseFloat(limitPrice) || athlete.tokenPrice;
  const totalPrice = athlete.tokenPrice * tokenAmount;
  const totalAtLimit = limitPriceNum * tokenAmount;

  const handleBuy = async () => {
    if (!user) {
      toast.error("Você precisa fazer login para comprar tokens");
      navigate("/auth");
      return;
    }

    if (tokenAmount <= 0) {
      toast.error("Quantidade de tokens inválida");
      return;
    }

    if (limitPriceNum <= 0) {
      toast.error("Preço desejado inválido");
      return;
    }

    if (!athlete.dbId) {
      toast.error("Este atleta não está disponível para compra");
      return;
    }

    setBuying(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('place_purchase_order', {
        p_athlete_token_id: athlete.dbId,
        p_athlete_id: athlete.id,
        p_quantity: tokenAmount,
        p_limit_price: limitPriceNum
      });

      if (rpcError) {
        throw rpcError;
      }

      const executed = data?.executed === true;
      const pending = data?.pending === true;

      if (executed) {
        toast.success(`Compra realizada! ${tokenAmount} tokens de ${athlete.name} por R$ ${totalAtLimit.toFixed(2)}`);
        setTokenAmount(1);
        setLimitPrice(athlete.tokenPrice.toFixed(2));
      } else if (pending) {
        toast.success(
          `Ordem em espera! Seus ${tokenAmount} tokens de ${athlete.name} serão comprados quando alguém vender por ≤ R$ ${limitPriceNum.toFixed(2)}`
        );
        setTokenAmount(1);
      } else {
        toast.info('Ordem registrada.');
      }

      await loadAthlete();
    } catch (error: any) {
      console.error('Error buying tokens:', error);
      toast.error(error.message || 'Erro ao comprar tokens. Tente novamente.');
      await loadAthlete();
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
                        max={athlete.availableTokens > 0 ? athlete.availableTokens : undefined}
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Preço máximo por token (R$)
                      </label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder={athlete.tokenPrice.toFixed(2)}
                      />
                      {athlete.availableTokens > 0 ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Compra imediata se houver tokens disponíveis, ou fica em espera.
                        </p>
                      ) : (
                        <p className="text-xs text-yellow-500 mt-1 font-medium">
                          Todos os tokens estão em posse de patrocinadores. Sua ordem ficará em espera até que alguém venda por ≤ R$ {limitPrice || '0.00'}.
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-sm text-muted-foreground mb-1">
                        {athlete.availableTokens > 0 && limitPriceNum <= athlete.tokenPrice
                          ? "Total (compra imediata)"
                          : "Total (ordem em espera)"}
                      </p>
                      <p className="text-2xl font-bold">R$ {totalAtLimit.toFixed(2)}</p>
                    </div>

                    <Button 
                      variant="buy" 
                      size="lg" 
                      className="w-full"
                      onClick={handleBuy}
                      disabled={buying}
                    >
                      {buying
                        ? 'Processando...'
                        : athlete.availableTokens > 0
                          ? 'Comprar Tokens'
                          : 'Criar Ordem de Compra'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                      onClick={toggleWatchlist}
                      disabled={watchlistLoading}
                    >
                      {isInWatchlist ? 'Remover da Watchlist' : 'Adicionar à Watchlist'}
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
