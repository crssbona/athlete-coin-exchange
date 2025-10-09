import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AthleteCard } from "@/components/AthleteCard";
import { mockAthletes } from "@/data/mockAthletes";
import { Athlete } from "@/types/athlete";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_tokens')
        .select('*')
        .gt('available_tokens', 0);

      if (error) throw error;

      // Convert database records to Athlete type
      const supabaseAthletes: Athlete[] = (data || [])
        .filter(token => token.athlete_name && token.sport) // Only show complete profiles
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
            youtube: token.social_youtube,
          }
        }));

      // Combine with mock athletes (you can remove mockAthletes later)
      setAthletes([...supabaseAthletes, ...mockAthletes]);
    } catch (error) {
      console.error('Error loading athletes:', error);
      // Fallback to mock data on error
      setAthletes(mockAthletes);
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
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Marketplace</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Explore e invista nos melhores atletas e gamers do mercado
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar atletas..."
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

          {/* Athletes Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">Carregando atletas...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAthletes.map((athlete) => (
                  <AthleteCard key={athlete.id} athlete={athlete} />
                ))}
              </div>

              {filteredAthletes.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-xl text-muted-foreground">
                    Nenhum atleta encontrado
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
