import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { VitrineCard } from "@/components/VitrineCard";
import { Athlete } from "@/types/athlete";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Vitrine = () => {
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
                .select('*');

            if (error) throw error;

            // Converter os registros do banco para o tipo Athlete
            const supabaseAthletes: Athlete[] = (data || [])
                .filter(token => token.athlete_name && token.sport)
                .map(token => ({
                    id: token.athlete_id,
                    name: token.athlete_name,
                    sport: token.sport,
                    avatar: token.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${token.athlete_name}`,
                    tokenPrice: token.price_per_token || 0,
                    priceChange: token.price_change_24h || 0,
                    totalTokens: token.total_tokens || 0,
                    availableTokens: token.available_tokens || 0,
                    marketCap: token.market_cap || 0,
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

            // Agora define APENAS os atletas reais da base de dados
            setAthletes(supabaseAthletes);
        } catch (error) {
            console.error('Erro ao carregar atletas:', error);
            // Em caso de erro, a vitrine fica vazia em vez de carregar perfis falsos
            setAthletes([]);
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
                    {/* Cabeçalho */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="w-8 h-8 text-primary" />
                            <h1 className="text-4xl font-bold">Vitrine de Atletas</h1>
                        </div>
                        <p className="text-lg text-muted-foreground">
                            Conheça as histórias e perfis de todos os atletas apoiados na plataforma.
                        </p>
                    </div>

                    {/* Filtros de Busca */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome ou esporte..."
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
                                        {sport === "all" ? "Todas Modalidades" : sport}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Grid de Atletas */}
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-xl text-muted-foreground">Carregando vitrine...</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredAthletes.map((athlete) => (
                                    <VitrineCard key={athlete.id} athlete={athlete} />
                                ))}
                            </div>

                            {filteredAthletes.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-xl text-muted-foreground">
                                        Nenhum atleta encontrado.
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

export default Vitrine;