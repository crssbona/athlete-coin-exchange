import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Twitter, Instagram, Video, PackageOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AssetCard } from "@/components/AssetCard";
import { Athlete, Asset } from "@/types/athlete";

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const AthletePage = () => {
  const { id } = useParams();

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAthleteAndAssets();
  }, [id]);

  const loadAthleteAndAssets = async () => {
    try {
      setLoading(true);

      // 1. Carrega os dados do Perfil do Atleta (Vitrine)
      const { data: athleteData, error: athleteError } = await supabase
        .from('athlete_tokens')
        .select('*')
        .eq('athlete_id', id)
        .maybeSingle();

      if (athleteError) throw athleteError;

      if (athleteData) {
        setAthlete({
          id: athleteData.athlete_id,
          name: athleteData.athlete_name,
          sport: athleteData.sport,
          avatar: athleteData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${athleteData.athlete_name}`,
          description: athleteData.description || '',
          achievements: athleteData.achievements || [],
          featuredVideo: athleteData.featured_video || '',
          galleryUrls: athleteData.gallery_urls || [],
          socialMedia: {
            twitter: athleteData.social_twitter,
            instagram: athleteData.social_instagram,
            twitch: athleteData.social_twitch,
            youtube: athleteData.social_youtube,
          }
        });
      }

      // 2. Carrega os Ativos criados por este atleta
      const { data: assetsData, error: assetsError } = await supabase
        .from('athlete_assets')
        .select('*')
        .eq('athlete_id', id)
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;

      if (assetsData) {
        const mappedAssets: Asset[] = assetsData.map(a => ({
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
        setAssets(mappedAssets);
      }

    } catch (error) {
      console.error('Erro ao carregar vitrine:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xl text-muted-foreground animate-pulse">Carregando vitrine...</p>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Navbar />
        <div className="text-center mt-20">
          <h1 className="text-4xl font-bold mb-4">Atleta não encontrado</h1>
          <p className="text-muted-foreground mb-8">Este perfil não existe ou ainda não foi configurado.</p>
          <Link to="/marketplace">
            <Button>Voltar ao Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/marketplace">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o Mercado
            </Button>
          </Link>

          {/* CABEÇALHO DO PERFIL (VITRINE) */}
          <div className="space-y-8">
            <Card className="overflow-hidden border-none shadow-md">
              <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 w-full" />
              <CardContent className="p-6 sm:p-10 relative pt-0">
                <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-16 sm:-mt-20 mb-6">
                  <img
                    src={athlete.avatar}
                    alt={athlete.name}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl object-cover border-4 border-background shadow-lg"
                  />
                  <div className="flex-1 pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-2">{athlete.name}</h1>
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          <Trophy className="w-4 h-4 mr-2 text-primary" />
                          {athlete.sport}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {athlete.socialMedia.twitter && (
                          <Button variant="outline" size="icon" className="rounded-full">
                            <Twitter className="w-4 h-4" />
                          </Button>
                        )}
                        {athlete.socialMedia.instagram && (
                          <Button variant="outline" size="icon" className="rounded-full">
                            <Instagram className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mt-8">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-3">Sobre</h3>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {athlete.description}
                      </p>
                    </div>

                    {athlete.achievements && athlete.achievements.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold mb-3">Principais Conquistas</h3>
                        <ul className="grid sm:grid-cols-2 gap-3">
                          {athlete.achievements.map((achievement, index) => (
                            <li key={index} className="flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                              <Trophy className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                              <span className="text-sm font-medium">{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* VÍDEO E FOTOS LATERAL */}
                  <div className="space-y-6">
                    {athlete.featuredVideo && getYouTubeEmbedUrl(athlete.featuredVideo) && (
                      <div className="space-y-3">
                        <h3 className="font-bold flex items-center gap-2">
                          <Video className="w-5 h-5 text-primary" /> Vídeo de Destaque
                        </h3>
                        <div className="aspect-video rounded-lg overflow-hidden border shadow-sm">
                          <iframe
                            width="100%" height="100%"
                            src={getYouTubeEmbedUrl(athlete.featuredVideo)!}
                            title="Apresentação" frameBorder="0" allowFullScreen
                          ></iframe>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEÇÃO DE ATIVOS (PROJETOS DO ATLETA) */}
            <div className="pt-8 border-t">
              <div className="flex items-center gap-3 mb-6">
                <PackageOpen className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="text-3xl font-bold">Projetos Ativos</h2>
                  <p className="text-muted-foreground">Invista nos ativos criados por {athlete.name}</p>
                </div>
              </div>

              {assets.length === 0 ? (
                <div className="text-center py-16 bg-muted/20 rounded-xl border-2 border-dashed">
                  <p className="text-xl text-muted-foreground">Este atleta ainda não lançou nenhum ativo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default AthletePage;