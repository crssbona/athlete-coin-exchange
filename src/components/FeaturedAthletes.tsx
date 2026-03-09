import { useState, useEffect } from "react";
import { AthleteCard } from "./AthleteCard";
import { supabase } from "@/lib/supabase";
import { Athlete } from "@/types/athlete";

export const FeaturedAthletes = () => {
  const [featured, setFeatured] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedAthletes();
  }, []);

  const loadFeaturedAthletes = async () => {
    try {
      // 1. Busca todos os atletas cadastrados
      const { data: athletesData, error: athletesError } = await supabase
        .from('athlete_tokens')
        .select('*');

      if (athletesError) throw athletesError;

      // 2. Busca todas as transações das últimas 24 horas
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('athlete_id, quantity, price')
        .gte('created_at', twentyFourHoursAgo);

      if (txError) throw txError;

      // 3. Calcula o volume total movimentado por cada atleta
      const volumeMap: Record<string, number> = {};
      if (txData) {
        txData.forEach(tx => {
          if (!volumeMap[tx.athlete_id]) volumeMap[tx.athlete_id] = 0;
          // Volume = Quantidade de tokens * Preço negociado
          volumeMap[tx.athlete_id] += (tx.quantity * tx.price);
        });
      }

      // 4. Monta a lista de atletas formatada para o Card e vincula o volume calculado
      const formattedAthletes: (Athlete & { tempVolume: number })[] = (athletesData || [])
        .filter(token => token.athlete_name && token.sport) // Pega apenas perfis que já foram preenchidos
        .map(token => ({
          id: token.athlete_id,
          name: token.athlete_name,
          sport: token.sport,
          avatar: token.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${token.athlete_name}`,
          tokenPrice: token.price_per_token,
          priceChange: token.price_change_24h || 0,
          totalTokens: token.total_tokens,
          availableTokens: token.available_tokens,
          marketCap: token.market_cap || (token.total_tokens * token.price_per_token),
          volume24h: token.volume_24h || 0,
          description: token.description || '',
          achievements: token.achievements || [],
          socialMedia: {
            twitter: token.social_twitter,
            instagram: token.social_instagram,
            twitch: token.social_twitch,
            youtube: token.social_youtube
          },
          tempVolume: volumeMap[token.athlete_id] || 0 // Armazena o volume real para usarmos na ordenação
        }));

      // 5. Ordena os atletas (do maior volume para o menor) e corta os 3 primeiros!
      const top3 = formattedAthletes
        .sort((a, b) => b.tempVolume - a.tempVolume)
        .slice(0, 3);

      setFeatured(top3);
    } catch (error) {
      console.error("Erro ao carregar atletas em destaque:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 relative">
        <div className="container mx-auto px-4 flex justify-center">
          <p className="text-muted-foreground animate-pulse">Buscando os melhores ativos do mercado...</p>
        </div>
      </section>
    );
  }

  // Se o banco estiver totalmente vazio, não renderiza a seção
  if (featured.length === 0) {
    return null;
  }

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Atletas em Destaque</h2>
          <p className="text-xl text-muted-foreground">
            Os tokens mais negociados nas últimas 24 horas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((athlete) => (
            <AthleteCard key={athlete.id} athlete={athlete} />
          ))}
        </div>
      </div>
    </section>
  );
};