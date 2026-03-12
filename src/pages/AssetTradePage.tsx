import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, ArrowRight, ArrowLeft, ImageIcon } from "lucide-react";
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

const AssetTradePage = () => {
    const { assetId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [asset, setAsset] = useState<any>(null);
    const [athleteInfo, setAthleteInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [tokenAmount, setTokenAmount] = useState(1);
    const [limitPrice, setLimitPrice] = useState<string>("");
    const [buying, setBuying] = useState(false);

    const [timeframe, setTimeframe] = useState<'1D' | '1M' | '1Y'>('1M');
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartEmpty, setChartEmpty] = useState(false);
    const [loadingChart, setLoadingChart] = useState(false);

    const [realPriceChange, setRealPriceChange] = useState<number>(0);
    const [realVolume24h, setRealVolume24h] = useState<number>(0);

    // Carrega os dados do ativo e do atleta criador
    const loadAssetAndAthlete = async () => {
        try {
            const { data: assetData, error: assetError } = await supabase
                .from('athlete_assets')
                .select('*')
                .eq('id', assetId)
                .maybeSingle();

            if (assetError) throw assetError;

            if (assetData) {
                setAsset({
                    id: assetData.id,
                    athlete_id: assetData.athlete_id,
                    title: assetData.title,
                    description: assetData.description,
                    photoUrl: assetData.photo_url,
                    youtubeLink: assetData.youtube_link,
                    tokenPrice: assetData.price_per_token,
                    priceChange: assetData.price_change_24h || 0,
                    totalTokens: assetData.total_tokens,
                    availableTokens: assetData.available_tokens,
                    marketCap: assetData.market_cap || (assetData.total_tokens * assetData.price_per_token),
                    volume24h: assetData.volume_24h || 0,
                });

                // Buscar nome do atleta para mostrar no cabeçalho
                const { data: athleteData } = await supabase
                    .from('athlete_tokens')
                    .select('athlete_name, avatar_url')
                    .eq('athlete_id', assetData.athlete_id)
                    .maybeSingle();

                if (athleteData) setAthleteInfo(athleteData);
            }
        } catch (error) {
            console.error('Erro ao carregar ativo:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (assetId) loadAssetAndAthlete();
    }, [assetId]);

    useEffect(() => {
        if (asset?.tokenPrice != null) {
            setLimitPrice(asset.tokenPrice.toFixed(2));
        }
    }, [asset?.tokenPrice]);

    // Calcula a variação real das últimas 24 horas (adaptado para asset_id)
    useEffect(() => {
        const fetch24hChange = async () => {
            if (!asset?.id || !asset?.tokenPrice) return;

            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            try {
                let { data: pastTx } = await supabase
                    .from('transactions')
                    .select('price')
                    .eq('asset_id', asset.id)
                    .lte('created_at', twentyFourHoursAgo)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                let oldPrice = pastTx?.price;

                if (!oldPrice) {
                    const { data: firstTx24h } = await supabase
                        .from('transactions')
                        .select('price')
                        .eq('asset_id', asset.id)
                        .gte('created_at', twentyFourHoursAgo)
                        .order('created_at', { ascending: true })
                        .limit(1)
                        .maybeSingle();
                    oldPrice = firstTx24h?.price;
                }

                if (oldPrice && oldPrice > 0) {
                    const change = ((asset.tokenPrice - oldPrice) / oldPrice) * 100;
                    setRealPriceChange(change);
                } else {
                    setRealPriceChange(0);
                }

                const { data: volumeTxs } = await supabase
                    .from('transactions')
                    .select('quantity, price')
                    .eq('asset_id', asset.id)
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
    }, [asset?.id, asset?.tokenPrice]);

    // Carrega os dados do Gráfico
    useEffect(() => {
        const loadChartData = async () => {
            if (!asset?.id) return;

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
                    .eq('asset_id', asset.id)
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
                    price: asset.tokenPrice
                });

                setChartData(formattedData);
            } catch (error) {
                console.error('Erro ao carregar dados do gráfico:', error);
            } finally {
                setLoadingChart(false);
            }
        };

        loadChartData();
    }, [asset?.id, timeframe, asset?.tokenPrice]);

    const formatMarketValue = (value: number) => {
        if (!value) return "R$ 0,00";
        if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1).replace('.0', '')}M`;
        if (value >= 1000) return `R$ ${(value / 1000).toFixed(1).replace('.0', '')}mil`;
        return `R$ ${value.toFixed(2)}`;
    };

    const handleBuy = async () => {
        if (!user) {
            toast.error("Precisa de iniciar sessão para investir neste ativo");
            navigate("/auth");
            return;
        }

        if (tokenAmount <= 0) {
            toast.error("Quantidade de tokens inválida");
            return;
        }

        const limitPriceNum = parseFloat(limitPrice);
        if (limitPriceNum <= 0) {
            toast.error("Preço desejado inválido");
            return;
        }

        setBuying(true);
        try {
            const { data, error: rpcError } = await supabase.rpc('place_asset_purchase_order', {
                p_asset_id: asset.id,
                p_athlete_id: asset.athlete_id,
                p_quantity: tokenAmount,
                p_limit_price: limitPriceNum
            });

            if (rpcError) throw rpcError;

            const executed = data?.executed === true;
            const pending = data?.pending === true;

            // 🚨 CORREÇÃO: Lemos a mensagem que o banco de dados enviou!
            const serverMessage = data?.message;

            if (executed) {
                toast.success(serverMessage || `Compra realizada!`);
                setTokenAmount(1);
                setLimitPrice(asset.tokenPrice.toFixed(2));
            } else if (pending) {
                toast.success(serverMessage || `Ordem em espera registada.`);
                setTokenAmount(1);
            } else {
                // Se não foi executada nem ficou pendente, é porque deu erro (ex: Saldo Insuficiente)
                toast.error(serverMessage || 'Não foi possível registar a ordem. Verifique o seu saldo.');
            }

            await loadAssetAndAthlete();
        } catch (error: any) {
            console.error('Erro ao comprar tokens do ativo:', error);
            toast.error(error.message || 'Erro ao processar a compra. Tente novamente.');
        } finally {
            setBuying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="text-xl text-muted-foreground">A carregar ativo...</p>
                </div>
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Ativo não encontrado</h1>
                    <Button variant="default" onClick={() => navigate(-1)}>Voltar à Vitrine</Button>
                </div>
            </div>
        );
    }

    const limitPriceNum = parseFloat(limitPrice) || asset.tokenPrice;
    const totalAtLimit = limitPriceNum * tokenAmount;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-24 pb-12">
                <div className="container mx-auto px-4">
                    <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Coluna Esquerda - Informações do Ativo e Gráfico */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Cabeçalho do Ativo */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                                            {asset.photoUrl ? (
                                                <img src={asset.photoUrl} alt={asset.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <div className="mb-4">
                                                <Badge variant="secondary" className="mb-2">Ativo Digital</Badge>
                                                <h1 className="text-3xl font-bold mb-2">{asset.title}</h1>
                                                {athleteInfo && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span>Gerado por:</span>
                                                        <img src={athleteInfo.avatar_url} alt="Criador" className="w-5 h-5 rounded-full" />
                                                        <span className="font-semibold text-foreground">{athleteInfo.athlete_name}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed flex-grow">{asset.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Gráfico */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle>Histórico de Mercado</CardTitle>
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
                                                A carregar dados...
                                            </div>
                                        ) : chartEmpty ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-center px-4 border-2 border-dashed border-border rounded-lg bg-muted/20">
                                                <TrendingUp className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
                                                <p className="text-muted-foreground font-medium">Sem movimentações neste período.</p>
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                                                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis domain={['auto', 'auto']} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value.toFixed(2)}`} />
                                                    <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor do Token']} labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }} />
                                                    <Line type="stepAfter" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6, fill: 'hsl(var(--primary))' }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Estatísticas */}
                            <Card>
                                <CardHeader><CardTitle>Estatísticas do Ativo</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div><p className="text-sm text-muted-foreground mb-1">Market Cap</p><p className="text-2xl font-bold">{formatMarketValue(asset.marketCap)}</p></div>
                                        <div><p className="text-sm text-muted-foreground mb-1">Volume 24h</p><p className="text-2xl font-bold">{formatMarketValue(realVolume24h)}</p></div>
                                        <div><p className="text-sm text-muted-foreground mb-1">Total Tokens</p><p className="text-2xl font-bold">{asset.totalTokens.toLocaleString()}</p></div>
                                        <div><p className="text-sm text-muted-foreground mb-1">Disponíveis</p><p className="text-2xl font-bold">{asset.availableTokens.toLocaleString()}</p></div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Vídeo do YouTube (Se existir) */}
                            {asset.youtubeLink && getYouTubeEmbedUrl(asset.youtubeLink) && (
                                <Card>
                                    <CardHeader><CardTitle>Vídeo de Apresentação</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="aspect-video rounded-lg overflow-hidden border shadow-sm">
                                            <iframe width="100%" height="100%" src={getYouTubeEmbedUrl(asset.youtubeLink)!} title="Apresentação" frameBorder="0" allowFullScreen></iframe>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Coluna Direita - Painel de Negociação */}
                        <div className="space-y-6">
                            <Card className="sticky top-24">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Preço Atual</CardTitle>
                                        <div className={`flex items-center gap-1 ${realPriceChange > 0 ? 'text-green-500' : realPriceChange < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                            {realPriceChange > 0 ? <TrendingUp className="w-5 h-5" /> : realPriceChange < 0 ? <TrendingDown className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                                            <span className="font-semibold">{realPriceChange > 0 ? '+' : ''}{realPriceChange.toFixed(2)}%</span>
                                            <span className="text-xs opacity-70 ml-1 mt-0.5 font-normal">24h</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <p className="text-4xl font-bold mb-1">R${asset.tokenPrice.toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">por token</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Quantidade de Tokens</label>
                                            <Input type="number" min="1" max={asset.availableTokens > 0 ? asset.availableTokens : undefined} value={tokenAmount} onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))} />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Preço máximo por token (R$)</label>
                                            <Input type="number" min="0.01" step="0.01" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder={asset.tokenPrice.toFixed(2)} />
                                            {asset.availableTokens > 0 ? (
                                                <p className="text-xs text-muted-foreground mt-1">Compra imediata se houver disponibilidade.</p>
                                            ) : (
                                                <p className="text-xs text-yellow-500 mt-1 font-medium">Ativo esgotado. A sua ordem ficará em espera até alguém vender por ≤ R$ {limitPrice || '0.00'}.</p>
                                            )}
                                        </div>

                                        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                                            <p className="text-sm text-muted-foreground mb-1">{asset.availableTokens > 0 && limitPriceNum <= asset.tokenPrice ? "Total (compra imediata)" : "Total (ordem em espera)"}</p>
                                            <p className="text-2xl font-bold">R$ {totalAtLimit.toFixed(2)}</p>
                                        </div>

                                        <Button variant="buy" size="lg" className="w-full" onClick={handleBuy} disabled={buying}>
                                            {buying ? 'A processar...' : asset.availableTokens > 0 ? 'Comprar Ativo' : 'Criar Ordem de Compra'}
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

export default AssetTradePage;