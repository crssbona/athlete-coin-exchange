import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, ArrowRight, ArrowLeft, ImageIcon, ListFilter, ChevronLeft, ChevronRight, ShoppingCart, Tag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

interface Order {
    id: string;
    quantity: number;
    limit_price: number;
    created_at: string;
}

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

    // Estados do Livro de Ofertas (Order Book)
    const [sellOrders, setSellOrders] = useState<Order[]>([]);
    const [buyOrders, setBuyOrders] = useState<Order[]>([]);

    const [currentSellPage, setCurrentSellPage] = useState(1);
    const [currentBuyPage, setCurrentBuyPage] = useState(1);
    const ordersPerPage = 10;

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

    const loadSellOrders = async () => {
        if (!assetId) return;
        const { data } = await supabase
            .from('pending_asset_sales')
            .select('id, quantity, limit_price, created_at')
            .eq('asset_id', assetId)
            .eq('status', 'pending')
            .order('limit_price', { ascending: true }) // Vendedores mais baratos primeiro
            .order('created_at', { ascending: true });
        if (data) setSellOrders(data);
    };

    const loadBuyOrders = async () => {
        if (!assetId) return;
        const { data } = await supabase
            .from('pending_asset_purchases')
            .select('id, quantity, limit_price, created_at')
            .eq('asset_id', assetId)
            .eq('status', 'pending')
            .order('limit_price', { ascending: false }) // Compradores que pagam mais primeiro
            .order('created_at', { ascending: true });
        if (data) setBuyOrders(data);
    };

    useEffect(() => {
        if (assetId) {
            loadAssetAndAthlete();
            loadSellOrders();
            loadBuyOrders();

            // INSCRIÇÃO REALTIME: Atualiza o livro de vendas
            const channelSales = supabase
                .channel(`public:pending_asset_sales:${assetId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_asset_sales', filter: `asset_id=eq.${assetId}` }, () => {
                    loadSellOrders();
                    loadAssetAndAthlete();
                }).subscribe();

            // INSCRIÇÃO REALTIME: Atualiza o livro de compras
            const channelPurchases = supabase
                .channel(`public:pending_asset_purchases:${assetId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_asset_purchases', filter: `asset_id=eq.${assetId}` }, () => {
                    loadBuyOrders();
                }).subscribe();

            return () => {
                supabase.removeChannel(channelSales);
                supabase.removeChannel(channelPurchases);
            };
        }
    }, [assetId]);

    useEffect(() => {
        if (asset?.tokenPrice != null && !limitPrice) {
            setLimitPrice(asset.tokenPrice.toFixed(2));
        }
    }, [asset?.tokenPrice]);

    useEffect(() => {
        const fetch24hChange = async () => {
            if (!asset?.id || !asset?.tokenPrice) return;
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            try {
                let { data: pastTx } = await supabase.from('transactions').select('price').eq('asset_id', asset.id).lte('created_at', twentyFourHoursAgo).order('created_at', { ascending: false }).limit(1).maybeSingle();
                let oldPrice = pastTx?.price;
                if (!oldPrice) {
                    const { data: firstTx24h } = await supabase.from('transactions').select('price').eq('asset_id', asset.id).gte('created_at', twentyFourHoursAgo).order('created_at', { ascending: true }).limit(1).maybeSingle();
                    oldPrice = firstTx24h?.price;
                }
                if (oldPrice && oldPrice > 0) {
                    setRealPriceChange(((asset.tokenPrice - oldPrice) / oldPrice) * 100);
                } else {
                    setRealPriceChange(0);
                }
                const { data: volumeTxs } = await supabase.from('transactions').select('quantity, price').eq('asset_id', asset.id).gte('created_at', twentyFourHoursAgo);
                if (volumeTxs) {
                    setRealVolume24h(volumeTxs.reduce((acc, tx) => acc + (tx.quantity * tx.price), 0));
                }
            } catch (error) {
                console.error("Erro ao calcular variação de 24h:", error);
            }
        };
        fetch24hChange();
    }, [asset?.id, asset?.tokenPrice]);

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

                const { data, error } = await supabase.from('transactions').select('price, created_at').eq('asset_id', asset.id).gte('created_at', startDate.toISOString()).order('created_at', { ascending: true });
                if (error) throw error;

                if (!data || data.length === 0) {
                    setChartEmpty(true);
                    setChartData([]);
                    return;
                }
                setChartEmpty(false);

                const formattedData = data.map(tx => {
                    const date = new Date(tx.created_at);
                    let timeLabel = timeframe === '1D' ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : timeframe === '1M' ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                    return { time: timeLabel, price: Number(tx.price) };
                });

                formattedData.push({
                    time: timeframe === '1D' ? now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : timeframe === '1M' ? now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : now.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
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
            const serverMessage = data?.message;

            if (executed) {
                toast.success(serverMessage || `Compra realizada!`);
                setTokenAmount(1);
            } else if (pending) {
                toast.success(serverMessage || `Ordem em espera registada.`);
                setTokenAmount(1);
            } else {
                toast.error(serverMessage || 'Não foi possível registar a ordem. Verifique o seu saldo.');
            }

        } catch (error: any) {
            console.error('Erro ao comprar tokens do ativo:', error);
            toast.error(error.message || 'Erro ao processar a compra. Tente novamente.');
        } finally {
            setBuying(false);
        }
    };

    const handleBuySpecificOrder = (order: Order) => {
        setTokenAmount(order.quantity);
        setLimitPrice(order.limit_price.toFixed(2));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.info(`Painel preenchido! Clique em 'Confirmar Compra' para adquirir os tokens.`);
    };

    const handleSellRedirect = () => {
        if (!user) {
            toast.error("Precisa de iniciar sessão.");
            navigate("/auth");
            return;
        }
        toast.info("Para vender seus tokens, acesse a sua Carteira na seção 'Meus Investimentos'.");
        navigate("/wallet");
    };

    const formatMarketValue = (value: number) => {
        if (!value) return "R$ 0,00";
        if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1).replace('.0', '')}M`;
        if (value >= 1000) return `R$ ${(value / 1000).toFixed(1).replace('.0', '')}mil`;
        return `R$ ${value.toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center min-h-[60vh]">
                <p className="text-xl text-muted-foreground animate-pulse">Carregando ativo...</p>
            </div>
        );
    }

    if (!asset) return <div className="min-h-screen bg-background flex items-center justify-center"><h1 className="text-4xl font-bold">Ativo não encontrado</h1></div>;

    const limitPriceNum = parseFloat(limitPrice) || asset.tokenPrice;
    const totalAtLimit = limitPriceNum * tokenAmount;

    // Paginação Vendas
    const idxLastSell = currentSellPage * ordersPerPage;
    const idxFirstSell = idxLastSell - ordersPerPage;
    const currentSellOrders = sellOrders.slice(idxFirstSell, idxLastSell);
    const totalSellPages = Math.ceil(sellOrders.length / ordersPerPage);

    // Paginação Compras
    const idxLastBuy = currentBuyPage * ordersPerPage;
    const idxFirstBuy = idxLastBuy - ordersPerPage;
    const currentBuyOrders = buyOrders.slice(idxFirstBuy, idxLastBuy);
    const totalBuyPages = Math.ceil(buyOrders.length / ordersPerPage);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-7xl">
                    <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                    </Button>

                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                                            {asset.photoUrl ? (
                                                <img src={asset.photoUrl} alt={asset.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-muted-foreground/30" /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <div className="mb-4">
                                                <Badge variant="secondary" className="mb-2">Ativo Digital</Badge>
                                                <h1 className="text-3xl font-bold mb-2">{asset.title}</h1>
                                                {athleteInfo && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span>Gerado por:</span>
                                                        <img src={athleteInfo.avatar_url} alt="Criador" className="w-5 h-5 rounded-full object-cover" />
                                                        <span className="font-semibold text-foreground">{athleteInfo.athlete_name}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed flex-grow">{asset.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Estatísticas do Ativo</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div><p className="text-sm text-muted-foreground mb-1">Market Cap</p><p className="text-2xl font-bold">{formatMarketValue(asset.marketCap)}</p></div>
                                        <div><p className="text-sm text-muted-foreground mb-1">Volume 24h</p><p className="text-2xl font-bold">{formatMarketValue(realVolume24h)}</p></div>
                                        <div><p className="text-sm text-muted-foreground mb-1">Total Tokens</p><p className="text-2xl font-bold">{asset.totalTokens.toLocaleString()}</p></div>
                                        <div><p className="text-sm text-muted-foreground mb-1">Na Plataforma</p><p className="text-2xl font-bold">{asset.availableTokens.toLocaleString()}</p></div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* LIVRO DE OFERTAS (ORDER BOOK) */}
                            <Card className="border-primary/20">
                                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <ListFilter className="w-5 h-5 text-primary" />
                                            Livro de Ofertas
                                        </CardTitle>
                                        <CardDescription>Veja ordens de outros patrocinadores</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Tabs defaultValue="sell_orders" className="w-full">
                                        <div className="p-4 border-b bg-muted/10">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="sell_orders">
                                                    Estão Vendendo <Badge variant="secondary" className="ml-2">{sellOrders.length}</Badge>
                                                </TabsTrigger>
                                                <TabsTrigger value="buy_orders">
                                                    Estão Comprando <Badge variant="secondary" className="ml-2">{buyOrders.length}</Badge>
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>

                                        {/* ABA: OFERTAS DE VENDA (Para você comprar) */}
                                        <TabsContent value="sell_orders" className="m-0">
                                            {sellOrders.length === 0 ? (
                                                <div className="p-8 text-center text-muted-foreground">Nenhum patrocinador está vendendo no momento.</div>
                                            ) : (
                                                <div className="divide-y">
                                                    <div className="grid grid-cols-4 p-4 text-xs font-semibold text-muted-foreground bg-muted/30">
                                                        <div>Quantidade</div>
                                                        <div>Preço Unitário</div>
                                                        <div>Total</div>
                                                        <div className="text-right">Ação</div>
                                                    </div>
                                                    {currentSellOrders.map((order) => (
                                                        <div key={order.id} className="grid grid-cols-4 items-center p-4 hover:bg-muted/10 transition-colors">
                                                            <div className="font-medium">{order.quantity} un.</div>
                                                            <div className="font-bold text-red-500">R$ {order.limit_price.toFixed(2)}</div>
                                                            <div className="text-muted-foreground">R$ {(order.quantity * order.limit_price).toFixed(2)}</div>
                                                            <div className="text-right">
                                                                <Button size="sm" variant="outline" className="h-8 border-green-500/50 hover:bg-green-500/10 text-green-600" onClick={() => handleBuySpecificOrder(order)}>
                                                                    <ShoppingCart className="w-3 h-3 mr-2" /> Comprar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {totalSellPages > 1 && (
                                                <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                                                    <span className="text-xs text-muted-foreground">Página {currentSellPage} de {totalSellPages}</span>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => setCurrentSellPage(p => Math.max(1, p - 1))} disabled={currentSellPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                                                        <Button variant="outline" size="sm" onClick={() => setCurrentSellPage(p => Math.min(totalSellPages, p + 1))} disabled={currentSellPage === totalSellPages}><ChevronRight className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>

                                        {/* ABA: OFERTAS DE COMPRA (Para você vender) */}
                                        <TabsContent value="buy_orders" className="m-0">
                                            {buyOrders.length === 0 ? (
                                                <div className="p-8 text-center text-muted-foreground">Nenhum patrocinador está comprando no momento.</div>
                                            ) : (
                                                <div className="divide-y">
                                                    <div className="grid grid-cols-4 p-4 text-xs font-semibold text-muted-foreground bg-muted/30">
                                                        <div>Quantidade</div>
                                                        <div>Preço Unitário</div>
                                                        <div>Total</div>
                                                        <div className="text-right">Ação</div>
                                                    </div>
                                                    {currentBuyOrders.map((order) => (
                                                        <div key={order.id} className="grid grid-cols-4 items-center p-4 hover:bg-muted/10 transition-colors">
                                                            <div className="font-medium">{order.quantity} un.</div>
                                                            <div className="font-bold text-green-600">R$ {order.limit_price.toFixed(2)}</div>
                                                            <div className="text-muted-foreground">R$ {(order.quantity * order.limit_price).toFixed(2)}</div>
                                                            <div className="text-right">
                                                                <Button size="sm" variant="outline" className="h-8 border-red-500/50 hover:bg-red-500/10 text-red-600" onClick={handleSellRedirect}>
                                                                    <Tag className="w-3 h-3 mr-2" /> Vender
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {totalBuyPages > 1 && (
                                                <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                                                    <span className="text-xs text-muted-foreground">Página {currentBuyPage} de {totalBuyPages}</span>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => setCurrentBuyPage(p => Math.max(1, p - 1))} disabled={currentBuyPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                                                        <Button variant="outline" size="sm" onClick={() => setCurrentBuyPage(p => Math.min(totalBuyPages, p + 1))} disabled={currentBuyPage === totalBuyPages}><ChevronRight className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>

                                    </Tabs>
                                </CardContent>
                            </Card>

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
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground animate-pulse">A carregar dados...</div>
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

                        <div className="space-y-6">
                            <Card className="sticky top-24 shadow-xl border-primary/20">
                                <CardHeader className="bg-muted/30 border-b">
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Preço de Referência</CardTitle>
                                        <div className={`flex items-center gap-1 ${realPriceChange > 0 ? 'text-green-500' : realPriceChange < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                            {realPriceChange > 0 ? <TrendingUp className="w-5 h-5" /> : realPriceChange < 0 ? <TrendingDown className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                                            <span className="font-semibold">{realPriceChange > 0 ? '+' : ''}{realPriceChange.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div>
                                        <p className="text-5xl font-bold tracking-tight mb-1">R${asset.tokenPrice.toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">último negócio</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Quantidade a Comprar</label>
                                            <Input type="number" min="1" value={tokenAmount} onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))} className="text-lg" />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Preço Máximo a Pagar (R$)</label>
                                            <Input type="number" min="0.01" step="0.01" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder={asset.tokenPrice.toFixed(2)} className="text-lg font-semibold text-primary" />
                                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                                O sistema vai procurar ofertas iguais ou mais baratas. Se não encontrar, criará uma ordem em espera.
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-lg bg-secondary/50 border border-border flex justify-between items-center">
                                            <span className="text-sm font-medium">Total Estimado</span>
                                            <span className="text-2xl font-bold">R$ {totalAtLimit.toFixed(2)}</span>
                                        </div>

                                        <Button variant="buy" size="lg" className="w-full text-lg h-14" onClick={handleBuy} disabled={buying}>
                                            {buying ? 'A processar...' : 'Confirmar Compra'}
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