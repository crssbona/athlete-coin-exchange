import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

interface WatchlistItem {
  id: string;
  athlete_id: string;
  added_at: string;
}

export default function Watchlist() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [athletesData, setAthletesData] = useState<Map<string, any>>(new Map());
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadWatchlist();
    }
  }, [user]);

  const loadWatchlist = async () => {
    try {
      // 1. Pega os IDs que o usuário está seguindo
      const { data: watchlistData, error } = await supabase
        .from('user_watchlist')
        .select('*')
        .eq('user_id', user?.id)
        .order('added_at', { ascending: false });

      if (error) throw error;
      setWatchlist(watchlistData || []);

      // 2. Busca os detalhes reais desses atletas no banco de dados
      if (watchlistData && watchlistData.length > 0) {
        const athleteIds = watchlistData.map(item => item.athlete_id);
        const dataMap = new Map();

        const { data: athletes } = await supabase
          .from('athlete_tokens')
          .select('*')
          .in('athlete_id', athleteIds);

        if (athletes) {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

          // Usa Promise.all para calcular a variação de todos os atletas ao mesmo tempo
          await Promise.all(athletes.map(async (athlete) => {
            let realPriceChange = 0;

            try {
              // Tenta pegar o preço antes de 24h
              let { data: pastTx } = await supabase
                .from('transactions')
                .select('price')
                .eq('athlete_id', athlete.athlete_id)
                .lte('created_at', twentyFourHoursAgo)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              let oldPrice = pastTx?.price;

              // Se não tiver, tenta o primeiro preço dentro das 24h
              if (!oldPrice) {
                const { data: firstTx24h } = await supabase
                  .from('transactions')
                  .select('price')
                  .eq('athlete_id', athlete.athlete_id)
                  .gte('created_at', twentyFourHoursAgo)
                  .order('created_at', { ascending: true })
                  .limit(1)
                  .maybeSingle();
                oldPrice = firstTx24h?.price;
              }

              if (oldPrice && oldPrice > 0) {
                realPriceChange = ((athlete.price_per_token - oldPrice) / oldPrice) * 100;
              }
            } catch (calcError) {
              console.error("Erro ao calcular variação para", athlete.athlete_name);
            }

            dataMap.set(athlete.athlete_id, {
              id: athlete.athlete_id,
              name: athlete.athlete_name,
              avatar: athlete.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${athlete.athlete_name}`,
              tokenPrice: athlete.price_per_token,
              sport: athlete.sport,
              priceChange: realPriceChange
            });
          }));
        }

        setAthletesData(dataMap);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
      toast.error('Erro ao carregar watchlist');
    } finally {
      setLoadingWatchlist(false);
    }
  };

  const removeFromWatchlist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setWatchlist(watchlist.filter(item => item.id !== itemId));
      toast.success('Removido da watchlist');
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Erro ao remover da watchlist');
    }
  };

  const getAthleteInfo = (athleteId: string) => {
    return athletesData.get(athleteId);
  };

  if (loading || loadingWatchlist) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Carregando sua lista...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Minha Watchlist</h1>
            <p className="text-muted-foreground">
              Acompanhe os ativos que você marcou como favoritos
            </p>
          </div>

          {watchlist.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-xl font-semibold mb-2">Sua watchlist está vazia</p>
                  <p className="text-muted-foreground mb-6">
                    Adicione atletas à sua watchlist para acompanhar seus tokens
                  </p>
                  <Button onClick={() => navigate('/marketplace')}>
                    Explorar Marketplace
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlist.map((item) => {
                const athlete = getAthleteInfo(item.athlete_id);
                if (!athlete) return null;

                const isPositive = athlete.priceChange > 0;
                const isNegative = athlete.priceChange < 0;

                return (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow border-border hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={athlete.avatar}
                          alt={athlete.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <CardTitle className="text-lg">{athlete.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {athlete.sport}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Preço Atual</span>
                          <span className="text-xl font-bold">
                            R$ {athlete.tokenPrice.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Variação 24h</span>
                          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' :
                              isNegative ? 'text-red-500' :
                                'text-muted-foreground'
                            }`}>
                            {isPositive ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : isNegative ? (
                              <TrendingDown className="w-4 h-4" />
                            ) : (
                              <ArrowRight className="w-4 h-4" />
                            )}
                            <span className="font-semibold">
                              {isPositive ? '+' : ''}{athlete.priceChange.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button
                            className="flex-1"
                            onClick={() => navigate(`/athlete/${athlete.id}`)}
                          >
                            Ver Detalhes
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeFromWatchlist(item.id)}
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}