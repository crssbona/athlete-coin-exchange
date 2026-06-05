import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Layers, TrendingUp, TrendingDown, ImageIcon, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface Asset {
  id: string;
  athlete_id: string;
  athlete_name: string;
  title: string;
  description: string;
  photo_url: string;
  youtube_link: string;
  price_per_token: number;
  price_change_24h: number;
  total_tokens: number;
  available_tokens: number;
  volume_24h: number;
}

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&controls=0&modestbranding=1&rel=0` : null;
};

type SortOption = "az" | "za" | "most-traded" | "least-traded";

interface AssetCardProps {
  asset: Asset;
  embedUrl: string | null;
  isPositive: boolean;
  isNegative: boolean;
  progressPercentage: number;
  isWatchlisted: boolean;
  onToggleWatchlist: (id: string) => void;
}

const AssetCard = ({ asset, embedUrl, isPositive, isNegative, progressPercentage, isWatchlisted, onToggleWatchlist }: AssetCardProps) => {
  const isMobile = useIsMobile();
  const [showVideo, setShowVideo] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          {embedUrl && !showVideo && (
            <div className="absolute bottom-2 left-2 bg-background/70 backdrop-blur px-2 py-1 rounded text-[10px] text-muted-foreground border border-border/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              {isMobile ? "Clique na imagem para ver o vídeo" : "Passe o mouse para ver o vídeo"}
            </div>
          )}
        </div>

      <CardContent className="p-5 flex-grow space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{asset.athlete_name}</p>
          <h3 className="font-bold text-lg line-clamp-1" title={asset.title}>{asset.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1" title={asset.description}>{asset.description}</p>
        </div>

        <div className="flex justify-between items-end pt-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Preço do Token</p>
            <p className="text-2xl font-bold text-primary">R$ {asset.price_per_token.toFixed(2)}</p>
          </div>
          <div className={`flex flex-col items-end ${isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-muted-foreground"}`}>
            <div className="flex items-center gap-1 text-sm font-semibold">
              {isPositive ? <TrendingUp className="w-4 h-4" /> : isNegative ? <TrendingDown className="w-4 h-4" /> : null}
              {isPositive ? "+" : ""}{asset.price_change_24h.toFixed(2)}%
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
            <Heart className={`w-4 h-4 mr-2 ${isWatchlisted ? "fill-red-500 text-red-500" : ""}`} />
            {isWatchlisted ? "Remover da Watchlist" : "Adicionar à Watchlist"}
          </Button>
        </div>
      </Card>
    </>
  );
};

const Assets = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("most-traded");
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const { data: assetsData, error } = await supabase
          .from("athlete_assets")
          .select("*");

        if (error) throw error;

        if (!assetsData || assetsData.length === 0) {
          setAssets([]);
          return;
        }

        const athleteIds = [...new Set(assetsData.map((a) => a.athlete_id).filter(Boolean))];

        const { data: tokensData } = await supabase
          .from("athlete_tokens")
          .select("athlete_id, athlete_name")
          .in("athlete_id", athleteIds);

        const tokenMap = new Map(tokensData?.map((t) => [t.athlete_id, t]) || []);

        const combined: Asset[] = assetsData.map((asset) => {
          const token = (tokenMap.get(asset.athlete_id) || {}) as any;
          return {
            id: asset.id,
            athlete_id: asset.athlete_id,
            athlete_name: token.athlete_name || "Atleta",
            title: asset.title || "",
            description: asset.description || "",
            photo_url: asset.photo_url || "",
            youtube_link: asset.youtube_link || "",
            price_per_token: asset.price_per_token || 0,
            price_change_24h: asset.price_change_24h || 0,
            total_tokens: asset.total_tokens || 0,
            available_tokens: asset.available_tokens || 0,
            volume_24h: asset.volume_24h || 0,
          };
        });

        setAssets(combined);
      } catch (err) {
        console.error("Erro ao carregar ativos:", err);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchWatchlist = async () => {
      const { data } = await supabase
        .from("user_watchlists")
        .select("asset_id")
        .eq("user_id", user.id);
      if (data) setWatchlist(new Set(data.map((item) => item.asset_id)));
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
        await supabase.from("user_watchlists").delete().eq("user_id", user.id).eq("asset_id", assetId);
        setWatchlist((prev) => { const s = new Set(prev); s.delete(assetId); return s; });
        toast.success("Ativo removido da sua Watchlist!");
      } else {
        await supabase.from("user_watchlists").insert({ user_id: user.id, asset_id: assetId });
        setWatchlist((prev) => new Set(prev).add(assetId));
        toast.success("Ativo adicionado à Watchlist!");
      }
    } catch {
      toast.error("Ocorreu um erro. Tente novamente.");
    }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const result = assets.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        a.athlete_name.toLowerCase().includes(term)
    );
    switch (sortBy) {
      case "az": return [...result].sort((a, b) => a.title.localeCompare(b.title));
      case "za": return [...result].sort((a, b) => b.title.localeCompare(a.title));
      case "most-traded": return [...result].sort((a, b) => b.volume_24h - a.volume_24h);
      case "least-traded": return [...result].sort((a, b) => a.volume_24h - b.volume_24h);
      default: return result;
    }
  }, [assets, searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Ativos</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Explore todos os ativos disponíveis na plataforma e encontre oportunidades de investimento.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por token ou atleta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="most-traded">Mais negociados</SelectItem>
                <SelectItem value="least-traded">Menos negociados</SelectItem>
                <SelectItem value="az">Nome A→Z</SelectItem>
                <SelectItem value="za">Nome Z→A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">Carregando ativos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">Nenhum ativo encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((asset) => {
                const isPositive = asset.price_change_24h > 0;
                const isNegative = asset.price_change_24h < 0;
                const total = asset.total_tokens || 1;
                const sold = total - asset.available_tokens;
                const progressPercentage = (sold / total) * 100;
                const embedUrl = getYouTubeEmbedUrl(asset.youtube_link);

                return (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    embedUrl={embedUrl}
                    isPositive={isPositive}
                    isNegative={isNegative}
                    progressPercentage={progressPercentage}
                    isWatchlisted={watchlist.has(asset.id)}
                    onToggleWatchlist={toggleWatchlist}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Assets;
