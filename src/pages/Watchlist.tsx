import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, TrendingUp, TrendingDown, ImageIcon, User } from "lucide-react";
import { toast } from "sonner";

interface AthleteData {
  athlete_name: string;
  avatar_url: string;
}

interface GroupedAssets {
  athlete: AthleteData;
  assets: any[];
}

export default function Watchlist() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // O estado agora guarda os ativos agrupados pelo ID do atleta
  const [groupedAssets, setGroupedAssets] = useState<Record<string, GroupedAssets>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      loadWatchlistAssets();
    }
  }, [user, authLoading, navigate]);

  const loadWatchlistAssets = async () => {
    try {
      setLoading(true);
      // 1. Pega os IDs da watchlist do usuário
      const { data: watchlistData, error: watchlistError } = await supabase
        .from('user_watchlists')
        .select('asset_id')
        .eq('user_id', user?.id);

      if (watchlistError) throw watchlistError;

      if (!watchlistData || watchlistData.length === 0) {
        setGroupedAssets({});
        return;
      }

      const assetIds = watchlistData.map(item => item.asset_id);

      // 2. Busca os dados reais dos ativos
      const { data: assetsData, error: assetsError } = await supabase
        .from('athlete_assets')
        .select('*')
        .in('id', assetIds);

      if (assetsError) throw assetsError;
      const fetchedAssets = assetsData || [];

      // 3. Extrai os IDs únicos dos atletas que criaram esses ativos
      const athleteIds = [...new Set(fetchedAssets.map(a => a.athlete_id))];

      // 4. Busca os perfis desses atletas (para pegar nome e foto)
      const { data: athletesData, error: athletesError } = await supabase
        .from('athlete_tokens')
        .select('athlete_id, athlete_name, avatar_url')
        .in('athlete_id', athleteIds);

      if (athletesError) throw athletesError;

      const athletesMap: Record<string, AthleteData> = {};
      (athletesData || []).forEach(ath => {
        athletesMap[ath.athlete_id] = {
          athlete_name: ath.athlete_name,
          avatar_url: ath.avatar_url
        };
      });

      // 5. Agrupa os ativos pelo criador
      const grouped = fetchedAssets.reduce((acc, asset) => {
        if (!acc[asset.athlete_id]) {
          acc[asset.athlete_id] = {
            athlete: athletesMap[asset.athlete_id] || { athlete_name: 'Desconhecido', avatar_url: '' },
            assets: []
          };
        }
        acc[asset.athlete_id].assets.push(asset);
        return acc;
      }, {} as Record<string, GroupedAssets>);

      setGroupedAssets(grouped);

    } catch (error) {
      console.error("Erro ao carregar watchlist:", error);
      toast.error("Erro ao carregar seus favoritos.");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (assetId: string) => {
    try {
      const { error } = await supabase
        .from('user_watchlists')
        .delete()
        .eq('user_id', user?.id)
        .eq('asset_id', assetId);

      if (error) throw error;

      // Atualiza o estado removendo o ativo do grupo específico
      setGroupedAssets(prev => {
        const newGrouped = { ...prev };
        for (const athleteId in newGrouped) {
          newGrouped[athleteId].assets = newGrouped[athleteId].assets.filter(a => a.id !== assetId);

          // Se o atleta ficou sem nenhum ativo na watchlist, removemos a seção dele
          if (newGrouped[athleteId].assets.length === 0) {
            delete newGrouped[athleteId];
          }
        }
        return newGrouped;
      });

      toast.success("Ativo removido da Watchlist!");
    } catch (error) {
      toast.error("Erro ao remover ativo.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-xl text-muted-foreground animate-pulse">Carregando sua Watchlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" />
              Sua Watchlist
            </h1>
            <p className="text-muted-foreground">
              Acompanhe de perto os ativos que você marcou como favoritos, organizados por criador.
            </p>
          </div>

          {Object.keys(groupedAssets).length === 0 ? (
            <Card className="border-dashed border-2 bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sua Watchlist está vazia</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Você ainda não adicionou nenhum ativo aos seus favoritos. Navegue pela vitrine para descobrir novas oportunidades de investimento.
                </p>
                <Link to="/vitrine">
                  <Button>Explorar Vitrine</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-12">
              {Object.values(groupedAssets).map((group, index) => (
                <div key={index} className="space-y-6">

                  {/* Cabeçalho do Atleta (Criador dos Ativos) */}
                  <div className="flex items-center gap-4 border-b pb-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 shadow-sm bg-muted flex items-center justify-center shrink-0">
                      {group.athlete.avatar_url ? (
                        <img
                          src={group.athlete.avatar_url}
                          alt={group.athlete.athlete_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{group.athlete.athlete_name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {group.assets.length} {group.assets.length === 1 ? 'ativo favoritado' : 'ativos favoritados'}
                      </p>
                    </div>
                  </div>

                  {/* Grid de Ativos daquele Atleta */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.assets.map((asset) => {
                      const isPositive = asset.price_change_24h > 0;
                      const isNegative = asset.price_change_24h < 0;
                      const total = asset.total_tokens || 1;
                      const sold = total - asset.available_tokens;
                      const progressPercentage = (sold / total) * 100;

                      return (
                        <Card key={asset.id} className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-300 flex flex-col bg-card">
                          <div className="relative aspect-video overflow-hidden bg-muted">
                            {asset.photo_url ? (
                              <img src={asset.photo_url} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                              </div>
                            )}
                            <button
                              onClick={() => removeFromWatchlist(asset.id)}
                              className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur rounded-full border hover:bg-red-50 transition-colors z-10"
                              title="Remover da Watchlist"
                            >
                              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                            </button>
                          </div>

                          <CardContent className="p-5 flex-grow space-y-4">
                            <div>
                              <h3 className="font-bold text-lg line-clamp-1">{asset.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{asset.description}</p>
                            </div>

                            <div className="flex justify-between items-end pt-2">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Preço Atual</p>
                                <p className="text-2xl font-bold text-primary">R$ {asset.price_per_token.toFixed(2)}</p>
                              </div>

                              <div className={`flex flex-col items-end ${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-muted-foreground'}`}>
                                <div className="flex items-center gap-1 text-sm font-semibold">
                                  {isPositive ? <TrendingUp className="w-4 h-4" /> : isNegative ? <TrendingDown className="w-4 h-4" /> : null}
                                  {isPositive ? '+' : ''}{asset.price_change_24h.toFixed(2)}%
                                </div>
                                <span className="text-[10px] opacity-70">24h</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-4 border-t border-border/50">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Progresso de Venda</span>
                                <span className="font-bold">{progressPercentage.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                              </div>
                            </div>
                          </CardContent>

                          <div className="p-5 pt-0 mt-auto">
                            <Link to={`/ativo/${asset.id}`} className="w-full block">
                              <Button className="w-full" variant="default">
                                Investir neste Ativo
                              </Button>
                            </Link>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}