import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { mockAthletes } from "@/data/mockAthletes";
import { TrendingUp, TrendingDown, ArrowRight, Trophy, ArrowLeft, Twitter, Instagram } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const AthletePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [athlete, setAthlete] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tokenAmount, setTokenAmount] = useState(1);
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [buying, setBuying] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'1D' | '1M' | '1Y'>('1M');
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartEmpty, setChartEmpty] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [realPriceChange, setRealPriceChange] = useState<number>(0);
  const [realVolume24h, setRealVolume24h] = useState<number>(0);

  // Calcula a variação real das últimas 24 horas
  useEffect(() => {
    const fetch24hChange = async () => {
      if (!athlete?.id || !athlete?.tokenPrice) return;

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      try {
        let { data: pastTx } = await supabase
          .from('transactions')
          .select('price')
          .eq('athlete_id', athlete.id)
          .lte('created_at', twentyFourHoursAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let oldPrice = pastTx?.price;

        if (!oldPrice) {
          const { data: firstTx24h } = await supabase
            .from('transactions')
            .select('price')
            .eq('athlete_id', athlete.id)
            .gte('created_at', twentyFourHoursAgo)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          oldPrice = firstTx24h?.price;
        }

        if (oldPrice) {
          const change = ((athlete.tokenPrice - oldPrice) / oldPrice) * 100;
          setRealPriceChange(change);
        } else {
          setRealPriceChange(0);
        }

        const { data: volumeTxs } = await supabase
          .from('transactions')
          .select('quantity, price')
          .eq('athlete_id', athlete.id)
          .gte('created_at', twentyFourHoursAgo);

        if (volumeTxs) {
          const totalVolume = volumeTxs.reduce((acc, tx) => acc + (tx.quantity * tx.price), 0);
          setRealVolume24h(totalVolume);
        }
      } catch (error) {
        console.error("Erro ao calcular variação de 24h:", error);
      }
    };

    fetch24hChange();
  }, [athlete?.id, athlete?.tokenPrice]);

  useEffect(() => {
    const loadChartData = async () => {
      if (!athlete?.id) return;

      setLoadingChart(true);
      try {
        const now = new Date();
        let startDate = new Date();

        if (timeframe === '1D') startDate.setDate(now.getDate() - 1);
        else if (timeframe === '1M') startDate.setMonth(now.getMonth() - 1);
        else if (timeframe === '1Y') startDate.setFullYear(now.getFullYear() - 1);

        const { data, error } = await supabase
          .from('transactions')
          .select('price, created_at')
          .eq('athlete_id', athlete.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          setChartEmpty(true);
          setChartData([]);
          return;
        }

        setChartEmpty(false);

        const formattedData = data.map(tx => {
          const date = new Date(tx.created_at);
          let timeLabel = '';

          if (timeframe === '1D') {
            timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          } else if (timeframe === '1M') {
            timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          } else {
            timeLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          }

          return { time: timeLabel, price: Number(tx.price) };
        });

        formattedData.push({
          time: timeframe === '1D' ? now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) :
            timeframe === '1M' ? now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) :
              now.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          price: athlete.tokenPrice
        });

        setChartData(formattedData);
      } catch (error) {
        console.error('Erro ao carregar dados do gráfico:', error);
      } finally {
        setLoadingChart(false);
      }
    };

    loadChartData();
  }, [athlete?.id, timeframe, athlete?.tokenPrice]);

  useEffect(() => {
    loadAthlete();
  }, [id]);

  useEffect(() => {
    if (user && athlete) {
      checkWatchlist();
    }
  }, [user, athlete]);

  useEffect(() => {
    if (athlete?.tokenPrice != null) {
      setLimitPrice(athlete.tokenPrice.toFixed(2));
    }
  }, [athlete?.tokenPrice]);

  const formatMarketValue = (value: number) => {
    if (!value) return "R$ 0,00";
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1).replace('.0', '')}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1).replace('.0', '')}mil`;
    }
    return `R$ ${value.toFixed(2)}`;
  };

  const loadAthlete = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_tokens')
        .select('*')
        .eq('athlete_id', id)
        .maybeSingle();

      if (data && data.athlete_name) {
        setAthlete({
          id: data.athlete_id,
          name: data.athlete_name,
          sport: data.sport,
          avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.athlete_name}`,
          tokenPrice: data.price_per_token,
          priceChange: data.price_change_24h || 0,
          totalTokens: data.total_tokens,
          availableTokens: data.available_tokens,
          marketCap: data.market_cap || (data.total_tokens * data.price_per_token),
          volume24h: data.volume_24h || 0,
          description: data.description || '',
          achievements: data.achievements || [],
          featuredVideo: data.featured_video || '',
          galleryUrls: data.gallery_urls || [],
          socialMedia: {
            twitter: data.social_twitter,
            instagram: data.social_instagram,
            twitch: data.social_twitch,
            youtube: data.social_youtube,
          },
          dbId: data.id
        });
      } else {
        const mockAthlete = mockAthletes.find((a) => a.id === id);
        setAthlete(mockAthlete);
      }
    } catch (error) {
      console.error('Error loading athlete:', error);
      const mockAthlete = mockAthletes.find((a) => a.id === id);
      setAthlete(mockAthlete);
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlist = async () => {
    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('id')
        .eq('user_id', user?.id)
        .eq('athlete_id', athlete?.id)
        .maybeSingle();

      if (error) throw error;
      setIsInWatchlist(!!data);
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const toggleWatchlist = async () => {
    if (!user) {
      toast.error("Você precisa fazer login");
      navigate("/auth");
      return;
    }

    setWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        const { error } = await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('athlete_id', athlete?.id);

        if (error) throw error;
        setIsInWatchlist(false);
        toast.success('Removido da watchlist');
      } else {
        const { error } = await supabase
          .from('user_watchlist')
          .insert({
            user_id: user.id,
            athlete_id: athlete?.id
          });

        if (error) throw error;
        setIsInWatchlist(true);
        toast.success('Adicionado à watchlist');
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      toast.error('Erro ao atualizar watchlist');
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-xl text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Atleta não encontrado</h1>
          <Link to="/marketplace">
            <Button variant="hero">Voltar ao Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = athlete.priceChange >= 0;
  const limitPriceNum = parseFloat(limitPrice) || athlete.tokenPrice;
  const totalPrice = athlete.tokenPrice * tokenAmount;
  const totalAtLimit = limitPriceNum * tokenAmount;

  const handleBuy = async () => {
    if (!user) {
      toast.error("Você precisa fazer login para comprar tokens");
      navigate("/auth");
      return;
    }

    if (tokenAmount <= 0) {
      toast.error("Quantidade de tokens inválida");
      return;
    }

    if (limitPriceNum <= 0) {
      toast.error("Preço desejado inválido");
      return;
    }

    if (!athlete.dbId) {
      toast.error("Este atleta não está disponível para compra");
      return;
    }

    setBuying(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('place_purchase_order', {
        p_athlete_token_id: athlete.dbId,
        p_athlete_id: athlete.id,
        p_quantity: tokenAmount,
        p_limit_price: limitPriceNum
      });

      if (rpcError) {
        throw rpcError;
      }

      const executed = data?.executed === true;
      const pending = data?.pending === true;

      // VERIFICAÇÃO ATUALIZADA:
      if (executed) {
        // Sucesso na compra imediata
        toast.success(data?.message || `Compra realizada! ${tokenAmount} tokens de ${athlete.name}`);
        setTokenAmount(1);
        setLimitPrice(athlete.tokenPrice.toFixed(2));
      } else if (pending) {
        // Sucesso ao colocar na fila de espera
        toast.success(data?.message || `Ordem em espera registrada para ${athlete.name}`);
        setTokenAmount(1);
      } else {
        // ERRO: Se não executou nem ficou em espera, o banco recusou (ex: sem saldo)
        // Mostramos a mensagem exata que o banco de dados enviou como erro!
        toast.error(data?.message || 'Não foi possível processar a ordem.');
      }

      await loadAthlete();
    } catch (error: any) {
      console.error('Error buying tokens:', error);
      toast.error(error.message || 'Erro ao comprar tokens. Tente novamente.');
      await loadAthlete();
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Link to="/marketplace">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Athlete Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <img
                      src={athlete.avatar}
                      alt={athlete.name}
                      className="w-32 h-32 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h1 className="text-3xl font-bold mb-2">{athlete.name}</h1>
                          <Badge className="bg-secondary">
                            <Trophy className="w-3 h-3 mr-1" />
                            {athlete.sport}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {athlete.socialMedia.twitter && (
                            <Button variant="ghost" size="icon">
                              <Twitter className="w-5 h-5" />
                            </Button>
                          )}
                          {athlete.socialMedia.instagram && (
                            <Button variant="ghost" size="icon">
                              <Instagram className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{athlete.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Variação de Preço */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle>Histórico de Preço</CardTitle>
                  <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as '1D' | '1M' | '1Y')} className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="1D">1D</TabsTrigger>
                      <TabsTrigger value="1M">1M</TabsTrigger>
                      <TabsTrigger value="1Y">1Y</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full mt-4">
                    {loadingChart ? (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground animate-pulse">
                        Carregando histórico do mercado...
                      </div>
                    ) : chartEmpty ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center px-4 border-2 border-dashed border-border rounded-lg bg-muted/20">
                        <TrendingUp className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
                        <p className="text-muted-foreground font-medium">
                          Este token não possui movimentações neste período.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Seja o primeiro a negociar {athlete.name}!
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                          <XAxis
                            dataKey="time"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            domain={['auto', 'auto']}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `R$ ${value.toFixed(2)}`}
                          />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor do Token']}
                            labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                          />
                          <Line
                            type="stepAfter"
                            dataKey="price"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                            activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas do Token</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
                      <p className="text-2xl font-bold">{formatMarketValue(athlete.marketCap)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Volume 24h</p>
                      <p className="text-2xl font-bold">{formatMarketValue(realVolume24h)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Tokens</p>
                      <p className="text-2xl font-bold">{athlete.totalTokens.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Disponíveis</p>
                      <p className="text-2xl font-bold">{athlete.availableTokens.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle>Conquistas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {athlete.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Galeria e Vídeo */}
              {(athlete.featuredVideo || (athlete.galleryUrls && athlete.galleryUrls.length > 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Galeria</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* YouTube Video */}
                    {athlete.featuredVideo && getYouTubeEmbedUrl(athlete.featuredVideo) && (
                      <div className="aspect-video rounded-lg overflow-hidden border border-border shadow-sm">
                        <iframe
                          width="100%"
                          height="100%"
                          src={getYouTubeEmbedUrl(athlete.featuredVideo)!}
                          title="Apresentação do Atleta"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}

                    {/* Gallery Images */}
                    {athlete.galleryUrls && athlete.galleryUrls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {athlete.galleryUrls.map((url: string, index: number) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden border border-border shadow-sm">
                            <img
                              src={url}
                              alt={`Galeria ${athlete.name} ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Trading */}
            <div className="space-y-6">
              {/* Price Card */}
              <Card className="sticky top-24">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Preço Atual</CardTitle>
                    <div className={`flex items-center gap-1 ${realPriceChange > 0 ? 'text-green-500' :
                      realPriceChange < 0 ? 'text-red-500' :
                        'text-muted-foreground'
                      }`}>
                      {realPriceChange > 0 ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : realPriceChange < 0 ? (
                        <TrendingDown className="w-5 h-5" />
                      ) : (
                        <ArrowRight className="w-5 h-5" />
                      )}
                      <span className="font-semibold">
                        {realPriceChange > 0 ? '+' : ''}{realPriceChange.toFixed(2)}%
                      </span>
                      <span className="text-xs opacity-70 ml-1 mt-0.5 font-normal">24h</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-4xl font-bold mb-1">
                      R${athlete.tokenPrice.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">por token</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Quantidade de Tokens
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max={athlete.availableTokens > 0 ? athlete.availableTokens : undefined}
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Preço máximo por token (R$)
                      </label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder={athlete.tokenPrice.toFixed(2)}
                      />
                      {athlete.availableTokens > 0 ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Compra imediata se houver tokens disponíveis, ou fica em espera.
                        </p>
                      ) : (
                        <p className="text-xs text-yellow-500 mt-1 font-medium">
                          Todos os tokens estão em posse de patrocinadores. Sua ordem ficará em espera até que alguém venda por um valor menor ou igual a R$ {limitPrice || '0.00'}.
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-sm text-muted-foreground mb-1">
                        {athlete.availableTokens > 0 && limitPriceNum <= athlete.tokenPrice
                          ? "Total (compra imediata)"
                          : "Total (ordem em espera)"}
                      </p>
                      <p className="text-2xl font-bold">R$ {totalAtLimit.toFixed(2)}</p>
                    </div>

                    <Button
                      variant="buy"
                      size="lg"
                      className="w-full"
                      onClick={handleBuy}
                      disabled={buying}
                    >
                      {buying
                        ? 'Processando...'
                        : athlete.availableTokens > 0
                          ? 'Comprar Tokens'
                          : 'Criar Ordem de Compra'}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={toggleWatchlist}
                      disabled={watchlistLoading}
                    >
                      {isInWatchlist ? 'Remover da Watchlist' : 'Adicionar à Watchlist'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AthletePage;