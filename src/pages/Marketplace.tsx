import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AthleteCard } from "@/components/AthleteCard";
import { AssetCard } from "@/components/AssetCard"; // NOVO COMPONENTE
import { mockAthletes } from "@/data/mockAthletes";
import { Athlete, Asset } from "@/types/athlete";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Flame, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState("all");

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [trendingAssets, setTrendingAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    try {
      // 1. Carregar os perfis de atletas (Vitrine)
      const { data: athletesData, error: athletesError } = await supabase
        .from('athlete_tokens')
        .select('*');

      if (athletesError) throw athletesError;

      const mappedAthletes: Athlete[] = (athletesData || [])
        .filter(t => t.athlete_name && t.sport)
        .map(t => ({
          id: t.athlete_id,
          name: t.athlete_name,
          sport: t.sport,
          avatar: t.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.athlete_name}`,
          description: t.description || '',
          achievements: t.achievements || [],
          socialMedia: {}
        }));

      // 2. Carregar os "Ativos em Alta" (Pegando os 4 mais recentes ou com maior valor)
      const { data: assetsData, error: assetsError } = await supabase
        .from('athlete_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (assetsError) throw assetsError;

      const mappedAssets: Asset[] = (assetsData || []).map(a => ({
        id: a.id,
        athleteId: a.athlete_id,
        title: a.title,
        description: a.description,
        imageUrl: a.image_url,
        youtubeUrl: a.youtube_url,
        totalTokens: a.total_tokens,
        availableTokens: a.available_tokens,
        initialPrice: a.initial_price,
        currentPrice: a.current_price,
        priceChange: a.price_change_24h,
        marketCap: a.market_cap,
        volume24h: a.volume_24h,
        createdAt: new Date(a.created_at)
      }));

      setAthletes([...mappedAthletes, ...mockAthletes]); // Mantém mock por enquanto se quiser
      setTrendingAssets(mappedAssets);
    } catch (error) {
      console.error('Erro ao carregar marketplace:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = athletes.filter((athlete) => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.sport.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = sportFilter === "all" || athlete.sport.includes(sportFilter);
    return matchesSearch && matchesSport;
  });

  const sports = ["all", "E-Sports", "Atletismo", "Futebol", "MMA", "Basquete", "Vôlei", "Natação"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">

          {/* SEÇÃO 1: ATIVOS EM ALTA (NOVO) */}
          {!loading && trendingAssets.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-2 mb-6">
                <Flame className="w-8 h-8 text-orange-500" />
                <h2 className="text-3xl font-bold">Ativos em Alta</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {trendingAssets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            </div>
          )}

          {/* SEÇÃO 2: LISTA DE ATLETAS (ANTIGO MARKETPLACE) */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold">Descubra Atletas</h2>
            </div>
            <p className="text-lg text-muted-foreground">
              Encontre talentos, acesse suas vitrines e invista em seus projetos.
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar atletas por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                {sports.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport === "all" ? "Todas" : sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grid de Atletas */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">Carregando o mercado...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredAthletes.map((athlete) => (
                  <AthleteCard key={athlete.id} athlete={athlete} />
                ))}
              </div>

              {filteredAthletes.length === 0 && (
                <div className="text-center py-12 bg-muted/20 rounded-lg border-dashed border-2 mt-4">
                  <p className="text-xl text-muted-foreground py-8">
                    Nenhum atleta encontrado para essa busca.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Marketplace;