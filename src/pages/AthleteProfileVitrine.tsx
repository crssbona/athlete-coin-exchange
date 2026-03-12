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
    ArrowLeft
} from "lucide-react";

const AthleteProfileVitrine = () => {
    const { id } = useParams<{ id: string }>();
    const [athlete, setAthlete] = useState<Athlete | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAthlete = async () => {
            try {
                const { data, error } = await supabase
                    .from('athlete_tokens')
                    .select('*')
                    .eq('athlete_id', id)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    const supabaseAthlete: Athlete = {
                        id: data.athlete_id,
                        name: data.athlete_name,
                        sport: data.sport,
                        avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.athlete_name}`,
                        tokenPrice: data.price_per_token || 0,
                        priceChange: data.price_change_24h || 0,
                        totalTokens: data.total_tokens || 0,
                        availableTokens: data.available_tokens || 0,
                        marketCap: data.market_cap || 0,
                        volume24h: data.volume_24h || 0,
                        description: data.description || '',
                        achievements: data.achievements || [],
                        galleryUrls: data.gallery_urls || [],
                        socialMedia: {
                            twitter: data.social_twitter,
                            instagram: data.social_instagram,
                            twitch: data.social_twitch,
                            youtube: data.social_youtube,
                        }
                    };
                    setAthlete(supabaseAthlete);
                } else {
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
            fetchAthlete();
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

                    <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                        <img
                            src={athlete.avatar}
                            alt={athlete.name}
                            className="w-48 h-48 rounded-2xl object-cover shadow-lg border-4 border-card"
                        />
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
                                {athlete.socialMedia?.instagram && (
                                    <a href={athlete.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-card rounded-full hover:bg-primary/20 hover:text-primary transition-colors">
                                        <Instagram className="w-5 h-5" />
                                    </a>
                                )}
                                {athlete.socialMedia?.twitter && (
                                    <a href={athlete.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-card rounded-full hover:bg-primary/20 hover:text-primary transition-colors">
                                        <Twitter className="w-5 h-5" />
                                    </a>
                                )}
                                {athlete.socialMedia?.youtube && (
                                    <a href={athlete.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="p-2 bg-card rounded-full hover:bg-primary/20 hover:text-primary transition-colors">
                                        <Youtube className="w-5 h-5" />
                                    </a>
                                )}
                                {athlete.socialMedia?.twitch && (
                                    <a href={athlete.socialMedia.twitch} target="_blank" rel="noopener noreferrer" className="p-2 bg-card rounded-full hover:bg-primary/20 hover:text-primary transition-colors">
                                        <Twitch className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="md:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-xl">
                                        <Medal className="w-5 h-5 mr-2 text-primary" />
                                        Conquistas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {athlete.achievements && athlete.achievements.length > 0 ? (
                                        <ul className="space-y-3">
                                            {athlete.achievements.map((achievement, index) => (
                                                <li key={index} className="flex items-start">
                                                    <span className="w-2 h-2 rounded-full bg-primary mt-2 mr-3 flex-shrink-0" />
                                                    <span className="text-sm text-muted-foreground">{achievement}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Nenhuma conquista registrada ainda.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="md:col-span-2 space-y-6">
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-xl">
                                        <ImageIcon className="w-5 h-5 mr-2 text-primary" />
                                        Galeria de Fotos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {athlete.galleryUrls && athlete.galleryUrls.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {athlete.galleryUrls.map((url, index) => (
                                                <div key={index} className="aspect-square rounded-lg overflow-hidden relative group">
                                                    <img
                                                        src={url}
                                                        alt={`Galeria ${index + 1} de ${athlete.name}`}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-lg">
                                            <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-3" />
                                            <p className="text-muted-foreground">Nenhuma foto adicionada à galeria.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center">
                            <Coins className="w-6 h-6 mr-2 text-primary" />
                            Ativos do Atleta
                        </h2>
                        <Card className="border-dashed border-2 bg-card/50">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <Coins className="w-16 h-16 text-primary/40 mb-4 animate-pulse" />
                                <h3 className="text-xl font-semibold mb-2">Esquema de Ativos em Breve</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Estamos construindo a estrutura de tokens e ativos para {athlete.name}.
                                    Em breve você poderá visualizar e interagir com os ativos digitais deste atleta aqui.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default AthleteProfileVitrine;