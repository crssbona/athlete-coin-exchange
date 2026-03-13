import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowRight, Coins, ImageIcon } from "lucide-react";

export const FeaturedAthletes = () => {
  const [featuredAssets, setFeaturedAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedAssets();
  }, []);

  const loadFeaturedAssets = async () => {
    try {
      setLoading(true);
      // 1. Busca os 3 ativos mais recentes para o destaque
      const { data: assetsData, error: assetsError } = await supabase
        .from('athlete_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (assetsError) throw assetsError;

      if (!assetsData || assetsData.length === 0) {
        setFeaturedAssets([]);
        return;
      }

      // 2. Busca os dados dos atletas criadores para exibir no card
      const athleteIds = [...new Set(assetsData.map(a => a.athlete_id))];
      const { data: athletesData, error: athletesError } = await supabase
        .from('athlete_tokens')
        .select('athlete_id, athlete_name, avatar_url')
        .in('athlete_id', athleteIds);

      if (athletesError) throw athletesError;

      const athletesMap: Record<string, any> = {};
      (athletesData || []).forEach(ath => {
        athletesMap[ath.athlete_id] = ath;
      });

      // 3. Junta tudo num único objeto
      const mergedAssets = assetsData.map(asset => ({
        ...asset,
        athlete: athletesMap[asset.athlete_id] || { athlete_name: 'Desconhecido', avatar_url: '' }
      }));

      setFeaturedAssets(mergedAssets);
    } catch (error) {
      console.error("Erro ao carregar destaques:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 relative">
        <div className="container mx-auto px-4 flex justify-center">
          <p className="text-muted-foreground animate-pulse">A procurar os melhores ativos do mercado...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Coins className="w-8 h-8 text-primary" />
            Tokens em Destaque
          </h2>
          <p className="text-muted-foreground mt-2">Os ativos digitais mais recentes adicionados ao mercado.</p>
        </div>
        <Link to="/vitrine" className="hidden md:flex items-center text-primary hover:underline font-medium">
          Ver todos <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {featuredAssets.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-2xl border-2 border-dashed">
          <Coins className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium">Nenhum token listado ainda.</p>
          <p className="text-muted-foreground">Os atletas estão a preparar os seus ativos!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredAssets.map((asset) => {
            const isPositive = asset.price_change_24h > 0;
            const isNegative = asset.price_change_24h < 0;
            const total = asset.total_tokens || 1;
            const sold = total - asset.available_tokens;
            const progressPercentage = (sold / total) * 100;

            return (
              <Card key={asset.id} className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-300 flex flex-col bg-card shadow-sm hover:shadow-md">
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {asset.photo_url ? (
                    <img src={asset.photo_url} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Tag flutuante com o autor do ativo */}
                  <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-2 shadow-sm">
                    <img src={asset.athlete.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${asset.athlete.athlete_name}`} alt="Criador" className="w-4 h-4 rounded-full" />
                    {asset.athlete.athlete_name}
                  </div>
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
                      <span className="text-muted-foreground font-medium">Tokens Vendidos</span>
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
      )}

      <div className="mt-8 text-center md:hidden">
        <Link to="/vitrine">
          <Button variant="outline" className="w-full">
            Ver todos os tokens <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
};