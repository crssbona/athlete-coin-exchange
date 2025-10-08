import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockAthletes } from "@/data/mockAthletes";
import { TrendingUp, TrendingDown, Trash2, Eye } from "lucide-react";
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
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('*')
        .eq('user_id', user?.id)
        .order('added_at', { ascending: false });

      if (error) throw error;
      setWatchlist(data || []);
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
    return mockAthletes.find(a => a.id === athleteId);
  };

  if (loading || loadingWatchlist) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <p>Carregando...</p>
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
              Acompanhe os atletas que você está interessado
            </p>
          </div>

          {watchlist.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
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

                const isPositive = athlete.priceChange >= 0;

                return (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={athlete.avatar}
                          alt={athlete.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <CardTitle className="text-lg">{athlete.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {athlete.sport}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Preço</span>
                          <span className="text-xl font-bold">
                            R$ {athlete.tokenPrice.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Variação 24h</span>
                          <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-danger'}`}>
                            {isPositive ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="font-semibold">
                              {isPositive ? '+' : ''}{athlete.priceChange.toFixed(1)}%
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
