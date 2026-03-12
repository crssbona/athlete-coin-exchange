import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Athlete } from "@/types/athlete";
import { mockAthletes } from "@/data/mockAthletes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Trophy,
    Medal,
    Twitter,
    Instagram,
    Twitch,
    Youtube,
    ImageIcon,
    Coins,
    ArrowLeft,
    TrendingUp,
    TrendingDown
} from "lucide-react";

// Nova interface para os ativos
interface Asset {
    id: string;
    title: string;
    description: string;
    photo_url: string;
    total_tokens: number;
    available_tokens: number;
    price_per_token: number;
    price_change_24h: number;
}

const AthleteProfileVitrine = () => {
    const { id } = useParams<{ id: string }>();
    const [athlete, setAthlete] = useState<Athlete | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]); // Estado para guardar os ativos
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAthleteAndAssets = async () => {
            try {
                // 1. Busca os dados principais do atleta
                const { data: athleteData, error: athleteError } = await supabase
                    .from('athlete_tokens')
                    .select('*')
                    .eq('athlete_id', id)
                    .maybeSingle();

                if (athleteError) throw athleteError;

                if (athleteData) {
                    const supabaseAthlete: Athlete = {
                        id: athleteData.athlete_id,
                        name: athleteData.athlete_name,
                        sport: athleteData.sport,
                        avatar: athleteData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${athleteData.athlete_name}`,
                        tokenPrice: athleteData.price_per_token || 0,
                        priceChange: athleteData.price_change_24h || 0,
                        totalTokens: athleteData.total_tokens || 0,
                        availableTokens: athleteData.available_tokens || 0,
                        marketCap: athleteData.market_cap || 0,
                        volume24h: athleteData.volume_24h || 0,
                        description: athleteData.description || '',
                        achievements: athleteData.achievements || [],
                        galleryUrls: athleteData.gallery_urls || [],
                        socialMedia: {
                            twitter: athleteData.social_twitter,
                            instagram: athleteData.social_instagram,
                            twitch: athleteData.social_twitch,
                            youtube: athleteData.social_youtube,
                        }
                    };
                    setAthlete(supabaseAthlete);

                    // 2. Busca os ativos desse atleta específico
                    const { data: assetsData, error: assetsError } = await supabase
                        .from('athlete_assets')
                        .select('*')
                        .eq('athlete_id', athleteData.athlete_id)
                        .order('created_at', { ascending: false }); // Mostra os mais recentes primeiro

                    if (!assetsError && assetsData) {
                        setAssets(assetsData);
                    }
                } else {
                    // Fallback para mock caso não encontre no banco (apenas para testes)
                    const mockAthlete = mockAthletes.find(a => a.id === id);
                    setAthlete(mockAthlete || null);
                }
            } catch (error) {
                console.error("Erro ao carregar perfil do atleta na vitrine:", error);
                const mockAthlete = mockAthletes.find(a => a.id === id);
                setAthlete(mockAthlete || null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchAthleteAndAssets();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <main className="flex-grow flex items-center justify-center">
                    <p className="text-xl text-muted-foreground animate-pulse">Carregando perfil do atleta...</p>
                </main>
            </div>
        );
    }

    if (!athlete) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <main className="flex-grow flex flex-col items-center justify-center gap-4">
                    <h1 className="text-3xl font-bold">Atleta não encontrado</h1>
                    <p className="text-muted-foreground">O perfil que você está procurando não existe ou foi removido.</p>
                    <Link to="/vitrine">
                        <Button>Voltar para a Vitrine</Button>
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-5xl">
                    <Link to="/vitrine" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para a Vitrine
                    </Link>

                    {/* ... CABEÇALHO DO ATLETA (MANTIDO INTACTO) ... */}
                    <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                        <img src={athlete.avatar} alt={athlete.name} className="w-48 h-48 rounded-2xl object-cover shadow-lg border-4 border-card" />
                        <div className="flex-1 space-y-4">
                            <div>
                                <Badge variant="secondary" className="mb-2">
                                    <Trophy className="w-3 h-3 mr-1" />
                                    {athlete.sport}
                                </Badge>
                                <h1 className="text-4xl md:text-5xl font-bold">{athlete.name}</h1>
                            </div>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                {athlete.description || "Este atleta ainda não adicionou uma descrição ao perfil."}
                            </p>
                            <div className="flex gap-3 pt-2">
                                {athlete.socialMedia?.instagram && <a href={athlete.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-card rounded-full hover:bg-primary/20 hover:text-primary transition-colors"><Instagram className="w-5 h-5" /></a>}
                                {athlete.socialMedia?.twitter && <a href={athlete.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-card rounded-full hover:bg-primary/20 hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>}
                                {athlete.socialMedia?.youtube && <a href={athlete.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="p-2 bg-card rounded-full hover:bg-primary/20 hover:text-primary transition-colors"><Youtube className="w-5 h-5" /></a>}
                                {athlete.socialMedia?.twitch && <a href={athlete.socialMedia.twitch} target="_blank" rel="noopener noreferrer" className="p-2 bg-card rounded-full hover:bg-primary/20 hover:text-primary transition-colors"><Twitch className="w-5 h-5" /></a>}
                            </div>
                        </div>
                    </div>

                    {/* ... CONQUISTAS E GALERIA (MANTIDO INTACTO) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="md:col-span-1 space-y-6">
                            <Card>
                                <CardHeader><CardTitle className="flex items-center text-xl"><Medal className="w-5 h-5 mr-2 text-primary" />Conquistas</CardTitle></CardHeader>
                                <CardContent>
                                    {athlete.achievements && athlete.achievements.length > 0 ? (
                                        <ul className="space-y-3">
                                            {athlete.achievements.map((achievement, index) => (
                                                <li key={index} className="flex items-start"><span className="w-2 h-2 rounded-full bg-primary mt-2 mr-3 flex-shrink-0" /><span className="text-sm text-muted-foreground">{achievement}</span></li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-sm text-muted-foreground">Nenhuma conquista registrada ainda.</p>}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-2 space-y-6">
                            <Card className="h-full">
                                <CardHeader><CardTitle className="flex items-center text-xl"><ImageIcon className="w-5 h-5 mr-2 text-primary" />Galeria de Fotos</CardTitle></CardHeader>
                                <CardContent>
                                    {athlete.galleryUrls && athlete.galleryUrls.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {athlete.galleryUrls.map((url, index) => (
                                                <div key={index} className="aspect-square rounded-lg overflow-hidden relative group"><img src={url} alt={`Galeria ${index + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
                                            ))}
                                        </div>
                                    ) : <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-lg"><ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">Nenhuma foto adicionada à galeria.</p></div>}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* NOVA SEÇÃO: ATIVOS DISPONÍVEIS */}
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center">
                            <Coins className="w-6 h-6 mr-2 text-primary" />
                            Ativos Disponíveis
                        </h2>

                        {assets.length === 0 ? (
                            <Card className="border-dashed border-2 bg-card/50">
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                    <Coins className="w-16 h-16 text-primary/40 mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">Nenhum ativo listado</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        {athlete.name} ainda não gerou nenhum ativo ou NFT para investimento. Fique de olho!
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assets.map((asset) => {
                                    const isPositive = asset.price_change_24h > 0;
                                    const isNegative = asset.price_change_24h < 0;

                                    // Evita divisão por zero
                                    const total = asset.total_tokens || 1;
                                    const sold = total - asset.available_tokens;
                                    const progressPercentage = (sold / total) * 100;

                                    return (
                                        <Card key={asset.id} className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-300 flex flex-col bg-card">
                                            {/* Imagem do Ativo */}
                                            <div className="relative aspect-video overflow-hidden bg-muted">
                                                {asset.photo_url ? (
                                                    <img
                                                        src={asset.photo_url}
                                                        alt={asset.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur px-2 py-1 rounded text-xs font-semibold border">
                                                    Ativo Digital
                                                </div>
                                            </div>

                                            {/* Informações do Ativo */}
                                            <CardContent className="p-5 flex-grow space-y-4">
                                                <div>
                                                    <h3 className="font-bold text-lg line-clamp-1" title={asset.title}>{asset.title}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1" title={asset.description}>
                                                        {asset.description}
                                                    </p>
                                                </div>

                                                <div className="flex justify-between items-end pt-2">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Preço do Token</p>
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

                                                {/* Barra de Progresso de Vendas */}
                                                <div className="space-y-1.5 pt-4 border-t border-border/50">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground font-medium">Progresso de Venda</span>
                                                        <span className="font-bold">{progressPercentage.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-500"
                                                            style={{ width: `${progressPercentage}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                                                        <span>Restam: <strong>{asset.available_tokens}</strong></span>
                                                        <span>Total: <strong>{asset.total_tokens}</strong></span>
                                                    </div>
                                                </div>
                                            </CardContent>

                                            {/* Botão de Investir */}
                                            <div className="p-5 pt-0 mt-auto">
                                                <Link to={`/ativo/${asset.id}`} className="w-full">
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
                    </div>

                </div>
            </main>
        </div>
    );
};

export default AthleteProfileVitrine;