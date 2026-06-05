import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Athlete } from "@/types/athlete";
import { mockAthletes } from "@/data/mockAthletes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
    Heart, Trophy, Medal, Twitter, Instagram, Twitch, Youtube,
    ImageIcon, Coins, ArrowLeft, TrendingUp, TrendingDown, X,
    ChevronLeft, ChevronRight
} from "lucide-react";
import { CosmicAvatar } from "@/components/CosmicAvatar";
import { useIsMobile } from "@/hooks/use-mobile";

interface Asset {
    id: string;
    title: string;
    description: string;
    photo_url: string;
    youtube_link: string;
    total_tokens: number;
    available_tokens: number;
    price_per_token: number;
    price_change_24h: number;
}

interface AssetCardVitrineProps {
    asset: Asset;
    isWatchlisted: boolean;
    onToggleWatchlist: (id: string) => void;
}

const AssetCardVitrine = ({ asset, isWatchlisted, onToggleWatchlist }: AssetCardVitrineProps) => {
    const isMobile = useIsMobile();
    const [showVideo, setShowVideo] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const embedUrl = (() => {
        if (!asset.youtube_link) return null;
        const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
        const match = asset.youtube_link.match(regExp);
        return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&controls=0&modestbranding=1&rel=0` : null;
    })();

    const handleMouseEnter = () => {
        if (isMobile || !embedUrl) return;
        hoverTimer.current = setTimeout(() => setShowVideo(true), 600);
    };

    const handleMouseLeave = () => {
        if (isMobile) return;
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        setShowVideo(false);
        setVideoLoaded(false);
    };

    const handleImageClick = () => {
        if (!isMobile || !embedUrl) return;
        setShowVideo(true);
    };

    const handleOverlayClick = () => {
        setShowVideo(false);
        setVideoLoaded(false);
    };

    const isPositive = asset.price_change_24h > 0;
    const isNegative = asset.price_change_24h < 0;
    const total = asset.total_tokens || 1;
    const sold = total - asset.available_tokens;
    const progressPercentage = (sold / total) * 100;

    return (
        <>
            {isMobile && showVideo && (
                <div className="fixed inset-0 z-40" onClick={handleOverlayClick} />
            )}
            <Card className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-300 flex flex-col bg-card">
                <div
                    className={`relative aspect-video overflow-hidden bg-muted ${isMobile && showVideo ? "z-50" : ""}`}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleImageClick}
                    style={{ cursor: isMobile && embedUrl && !showVideo ? "pointer" : "default" }}
                >
                    {showVideo && embedUrl ? (
                        <>
                            {!videoLoaded && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-3">
                                    <svg className="w-10 h-10 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <span className="text-white/70 text-xs font-medium tracking-wide">A carregar vídeo...</span>
                                </div>
                            )}
                            <iframe
                                src={embedUrl}
                                className="w-full h-full"
                                allow="autoplay; encrypted-media"
                                allowFullScreen={false}
                                title={asset.title}
                                onLoad={() => setVideoLoaded(true)}
                            />
                        </>
                    ) : asset.photo_url ? (
                        <img src={asset.photo_url} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                    )}
                    <div className="absolute top-2 right-2 bg-background/80 backdrop-blur px-2 py-1 rounded text-xs font-semibold border">Ativo Digital</div>
                    {embedUrl && !showVideo && (
                        <div className="absolute bottom-2 left-2 bg-background/70 backdrop-blur px-2 py-1 rounded text-[10px] text-muted-foreground border border-border/50 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                            {isMobile ? "Clique na imagem para ver o vídeo" : "Passe o mouse para ver o vídeo"}
                        </div>
                    )}
                </div>

                <CardContent className="p-5 flex-grow space-y-4">
                    <div>
                        <h3 className="font-bold text-lg line-clamp-1" title={asset.title}>{asset.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1" title={asset.description}>{asset.description}</p>
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

                    <div className="space-y-1.5 pt-4 border-t border-border/50">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Progresso de Venda</span>
                            <span className="font-bold">{progressPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground pt-1">
                            <span>Restam: <strong>{asset.available_tokens}</strong></span>
                            <span>Total: <strong>{asset.total_tokens}</strong></span>
                        </div>
                    </div>
                </CardContent>

                <div className="p-5 pt-0 mt-auto space-y-2">
                    <Link to={`/ativo/${asset.id}`} className="w-full block">
                        <Button className="w-full" variant="default">Ver ativo</Button>
                    </Link>
                    <Button className="w-full" variant="outline" onClick={() => onToggleWatchlist(asset.id)}>
                        <Heart className={`w-4 h-4 mr-2 ${isWatchlisted ? 'fill-red-500 text-red-500' : ''}`} />
                        {isWatchlisted ? 'Remover da Watchlist' : 'Adicionar à Watchlist'}
                    </Button>
                </div>
            </Card>
        </>
    );
};

const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    // Regex melhorado: Captura web, mobile (m.), shorts, live e links curtos (youtu.be)
    const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = url.match(regExp);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const AthleteProfileVitrine = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const [athlete, setAthlete] = useState<Athlete | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchAthleteAndAssets = async () => {
            try {
                // Busca os dados do atleta na tabela de tokens
                const { data: athleteData, error: athleteError } = await supabase
                    .from('athlete_tokens')
                    .select('*')
                    .eq('athlete_id', id)
                    .maybeSingle();

                if (athleteError) throw athleteError;

                if (athleteData) {

                    // 👇 BUSCA SEPARADA DE VERIFICAÇÃO 👇
                    let isVerifiedStatus = false;
                    if (athleteData.user_id) {
                        const { data: profileData } = await supabase
                            .from('vw_public_profiles')
                            .select('is_verified')
                            .eq('id', athleteData.user_id)
                            .maybeSingle();

                        isVerifiedStatus = profileData?.is_verified || false;
                    }

                    const supabaseAthlete: Athlete & { featuredVideo?: string } = {
                        id: athleteData.athlete_id,
                        isVerified: isVerifiedStatus, // <-- Atribui aqui
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
                        featuredVideo: athleteData.featured_video || "",
                        socialMedia: {
                            twitter: athleteData.social_twitter,
                            instagram: athleteData.social_instagram,
                            twitch: athleteData.social_twitch,
                            youtube: athleteData.social_youtube,
                        }
                    };
                    setAthlete(supabaseAthlete);

                    // Busca os ativos do atleta
                    const { data: assetsData, error: assetsError } = await supabase
                        .from('athlete_assets')
                        .select('*')
                        .eq('athlete_id', athleteData.athlete_id)
                        .order('created_at', { ascending: false });

                    if (!assetsError && assetsData) {
                        setAssets(assetsData);
                    }
                } else {
                    const mockAthlete = mockAthletes.find(a => a.id === id);
                    setAthlete(mockAthlete || null);
                }
            } catch (error) {
                console.error("Erro ao carregar perfil:", error);
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

    useEffect(() => {
        const fetchWatchlist = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('user_watchlists')
                    .select('asset_id')
                    .eq('user_id', user.id);

                if (error) throw error;
                if (data) {
                    setWatchlist(new Set(data.map(item => item.asset_id)));
                }
            } catch (error) {
                console.error("Erro ao carregar watchlist:", error);
            }
        };
        fetchWatchlist();
    }, [user]);

    const toggleWatchlist = async (assetId: string) => {
        if (!user) {
            toast.error("Você precisa estar logado para adicionar à watchlist.");
            return;
        }

        const isWatchlisted = watchlist.has(assetId);

        try {
            if (isWatchlisted) {
                await supabase.from('user_watchlists').delete().eq('user_id', user.id).eq('asset_id', assetId);
                setWatchlist(prev => { const newSet = new Set(prev); newSet.delete(assetId); return newSet; });
                toast.success("Ativo removido da sua Watchlist!");
            } else {
                await supabase.from('user_watchlists').insert({ user_id: user.id, asset_id: assetId });
                setWatchlist(prev => new Set(prev).add(assetId));
                toast.success("Ativo adicionado à Watchlist!");
            }
        } catch (error) {
            toast.error("Ocorreu um erro. Tente novamente.");
        }
    };

    const openLightbox = (index: number) => setSelectedImageIndex(index);
    const closeLightbox = () => setSelectedImageIndex(null);

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (athlete?.galleryUrls && selectedImageIndex !== null) {
            setSelectedImageIndex((selectedImageIndex + 1) % athlete.galleryUrls.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (athlete?.galleryUrls && selectedImageIndex !== null) {
            setSelectedImageIndex((selectedImageIndex - 1 + athlete.galleryUrls.length) % athlete.galleryUrls.length);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedImageIndex === null) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight' && athlete?.galleryUrls) setSelectedImageIndex((prev) => (prev! + 1) % athlete.galleryUrls!.length);
            if (e.key === 'ArrowLeft' && athlete?.galleryUrls) setSelectedImageIndex((prev) => (prev! - 1 + athlete.galleryUrls!.length) % athlete.galleryUrls!.length);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImageIndex, athlete]);

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="animate-pulse">A carregar...</p></div>;
    if (!athlete) return <div className="min-h-screen bg-background flex items-center justify-center"><h1 className="text-3xl font-bold">Atleta não encontrado</h1></div>;

    return (
        <div className="min-h-screen bg-background relative">
            <Navbar />

            <main className="pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-5xl">
                    <Link to="/vitrine" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para a Vitrine
                    </Link>

                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left mb-12">
                        <CosmicAvatar
                            src={athlete.avatar}
                            verified={athlete.isVerified}
                            className="w-40 h-40 md:w-48 md:h-48 shrink-0 shadow-lg"
                        />

                        <div className="flex-1 space-y-4 flex flex-col items-center md:items-start w-full">
                            <div className="flex flex-col items-center md:items-start">
                                <Badge variant="secondary" className="mb-3">
                                    <Trophy className="w-3 h-3 mr-1" />
                                    {athlete.sport}
                                </Badge>
                                <h1 className="text-4xl md:text-5xl font-bold">{athlete.name}</h1>
                            </div>
                            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                                {athlete.description || "Este atleta ainda não adicionou uma descrição ao perfil."}
                            </p>
                            <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
                                {athlete.socialMedia?.instagram && <a href={athlete.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-card rounded-full hover:bg-primary/20 hover:text-primary transition-colors"><Instagram className="w-5 h-5" /></a>}
                                {athlete.socialMedia?.twitter && <a href={athlete.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-card rounded-full hover:bg-primary/20 hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>}
                                {athlete.socialMedia?.youtube && <a href={athlete.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="p-2 bg-card rounded-full hover:bg-primary/20 hover:text-primary transition-colors"><Youtube className="w-5 h-5" /></a>}
                                {athlete.socialMedia?.twitch && <a href={athlete.socialMedia.twitch} target="_blank" rel="noopener noreferrer" className="p-2 bg-card rounded-full hover:bg-primary/20 hover:text-primary transition-colors"><Twitch className="w-5 h-5" /></a>}
                            </div>
                        </div>
                    </div>

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
                                                <div
                                                    key={index}
                                                    className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer border border-border/50"
                                                    onClick={() => openLightbox(index)}
                                                >
                                                    <img src={url} alt={`Galeria ${index + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                        <span className="opacity-0 group-hover:opacity-100 bg-background/80 text-foreground px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transform scale-50 group-hover:scale-100 transition-all duration-300">
                                                            Ampliar
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-lg"><ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">Nenhuma foto adicionada à galeria.</p></div>}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {(athlete as any).featuredVideo && getYouTubeEmbedUrl((athlete as any).featuredVideo) && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold mb-6 flex items-center">
                                <Youtube className="w-6 h-6 mr-2 text-primary" />
                                Vídeo de Destaque
                            </h2>

                            {(() => {
                                const videoUrl = (athlete as any).featuredVideo;
                                const isShort = videoUrl.includes('/shorts/');

                                return (
                                    <Card className={`overflow-hidden shadow-sm border-border ${isShort ? 'max-w-[350px] mx-auto' : 'w-full'}`}>
                                        <CardContent className="p-0">
                                            {/* Se for Short, usa proporção 9:16 (vertical). Se for normal, usa 16:9 (aspect-video) */}
                                            <div className={`w-full bg-black flex items-center justify-center ${isShort ? 'aspect-[9/16]' : 'aspect-video'}`}>
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    src={getYouTubeEmbedUrl(videoUrl)!}
                                                    title="Vídeo do Atleta"
                                                    frameBorder="0"
                                                    allowFullScreen
                                                    className="w-full h-full"
                                                ></iframe>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })()}
                        </div>
                    )}

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
                                {assets.map((asset) => (
                                    <AssetCardVitrine
                                        key={asset.id}
                                        asset={asset}
                                        isWatchlisted={watchlist.has(asset.id)}
                                        onToggleWatchlist={toggleWatchlist}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {selectedImageIndex !== null && athlete?.galleryUrls && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200" onClick={closeLightbox}>
                    <button className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full z-[110]" onClick={closeLightbox}>
                        <X className="w-6 h-6 md:w-8 md:h-8" />
                    </button>
                    <button className="hidden md:flex absolute md:left-8 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full z-[110]" onClick={prevImage}>
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button className="hidden md:flex absolute md:right-8 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full z-[110]" onClick={nextImage}>
                        <ChevronRight className="w-8 h-8" />
                    </button>
                    <div className="hidden md:block absolute md:bottom-8 md:left-1/2 -translate-x-1/2 text-white/90 bg-white/10 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm border border-white/20 z-[110]">
                        {selectedImageIndex + 1} / {athlete.galleryUrls.length}
                    </div>
                    <img src={athlete.galleryUrls[selectedImageIndex]} alt="Galeria ampliada" className="max-w-[95vw] max-h-[75vh] md:max-w-[85vw] md:max-h-[90vh] object-contain rounded-md shadow-2xl z-[105]" onClick={(e) => e.stopPropagation()} />
                    <div className="flex md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-3 bg-black/60 px-2 py-1 rounded-full border border-white/10 text-white shadow-lg backdrop-blur-sm z-[110]" onClick={(e) => e.stopPropagation()}>
                        <button onClick={prevImage} className="p-2.5 active:bg-white/20 rounded-full transition-colors"><ChevronLeft className="w-6 h-6" /></button>
                        <span className="text-sm font-semibold px-2 min-w-[50px] text-center tabular-nums">{selectedImageIndex + 1} / {athlete.galleryUrls.length}</span>
                        <button onClick={nextImage} className="p-2.5 active:bg-white/20 rounded-full transition-colors"><ChevronRight className="w-6 h-6" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AthleteProfileVitrine;