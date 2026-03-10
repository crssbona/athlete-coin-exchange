import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, ArrowRight, ArrowLeft, Video, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// Função para extrair o ID do YouTube e gerar o link de embed
const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const AssetPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [asset, setAsset] = useState<any>(null);
    const [creator, setCreator] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Estados de Negociação
    const [tokenAmount, setTokenAmount] = useState(1);
    const [limitPrice, setLimitPrice] = useState<string>("");
    const [buying, setBuying] = useState(false);

    // Estados do Gráfico e Mercado
    const [timeframe, setTimeframe] = useState<'1D' | '1M' | '1Y'>('1M');
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartEmpty, setChartEmpty] = useState(false);
    const [loadingChart, setLoadingChart] = useState(false);

    useEffect(() => {
        loadAssetDetails();
    }, [id]);

    useEffect(() => {
        if (asset?.current_price != null) {
            setLimitPrice(asset.current_price.toFixed(2));
        }
        loadChartData();
    }, [asset?.id, timeframe, asset?.current_price]);

    const loadAssetDetails = async () => {
        try {
            setLoading(true);
            // 1. Carregar o Ativo
            const { data: assetData, error: assetError } = await supabase
                .from('athlete_assets')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (assetError) throw assetError;
            if (!assetData) {
                setLoading(false);
                return;
            }
            setAsset(assetData);

            // 2. Carregar o Criador (Atleta)
            const { data: creatorData, error: creatorError } = await supabase
                .from('athlete_tokens')
                .select('athlete_name, avatar_url, athlete_id')
                .eq('user_id', assetData.athlete_id)
                .maybeSingle();

            if (!creatorError && creatorData) {
                setCreator(creatorData);
            }
        } catch (error) {
            console.error('Erro ao carregar ativo:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadChartData = async () => {
        if (!asset?.id) return;
        setLoadingChart(true);

        try {
            const now = new Date();
            let startDate = new Date();
            if (timeframe === '1D') startDate.setDate(now.getDate() - 1);
            else if (timeframe === '1M') startDate.setMonth(now.getMonth() - 1);
            else if (timeframe === '1Y') startDate.setFullYear(now.getFullYear() - 1);

            // NOTA: A tabela de transactions precisa estar preparada para filtrar por asset_id
            const { data, error } = await supabase
                .from('transactions')
                .select('price, created_at')
                .eq('asset_id', asset.id)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true });

            if (error || !data || data.length === 0) {
                setChartEmpty(true);
                setChartData([]);
                return;
            }

            setChartEmpty(false);
            const formattedData = data.map(tx => {
                const date = new Date(tx.created_at);
                let timeLabel = timeframe === '1D'
                    ? date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
                    : timeframe === '1M'
                        ? date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
                        : date.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' });

                return { time: timeLabel, price: Number(tx.price) };
            });

            // Adicionar o preço atual como último ponto
            formattedData.push({
                time: 'Agora',
                price: asset.current_price
            });

            setChartData(formattedData);
        } catch (error) {
            console.error('Erro ao carregar dados do gráfico:', error);
        } finally {
            setLoadingChart(false);
        }
    };

    const handleBuy = async () => {
        if (!user) {
            toast.error("Precisa de iniciar sessão para comprar tokens.");
            navigate("/auth");
            return;
        }

        const limitPriceNum = parseFloat(limitPrice);
        if (tokenAmount <= 0 || limitPriceNum <= 0) {
            toast.error("Valores de compra inválidos.");
            return;
        }

        setBuying(true);
        try {
            const { data, error: rpcError } = await supabase.rpc('place_purchase_order', {
                p_asset_id: asset.id,
                p_quantity: tokenAmount,
                p_limit_price: limitPriceNum
            });

            if (rpcError) throw rpcError;

            // ---- CORREÇÃO AQUI: LER A RESPOSTA DO BANCO DE DADOS ----
            if (data && data.executed === false) {
                // Se a ordem foi apenas para a fila de espera (pending = true)
                if (data.pending) {
                    toast.info(data.message || "Ordem colocada em espera.");
                    setTokenAmount(1);
                    await loadAssetDetails();
                } else {
                    // Se foi bloqueada por falta de saldo ou outro erro
                    toast.error(data.message || "Não foi possível realizar a compra.");
                }
                return; // Pára a execução aqui para não dar mensagem de sucesso!
            }
            // ---------------------------------------------------------

            // Se passou pelas validações, foi um sucesso real
            toast.success(data.message || "Ordem processada com sucesso!");
            setTokenAmount(1);
            await loadAssetDetails(); // Recarregar dados e gráfico
        } catch (error: any) {
            console.error('Erro na compra:', error);
            toast.error(error.message || 'Erro ao comprar tokens. Tente novamente.');
        } finally {
            setBuying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="text-xl text-muted-foreground animate-pulse">A carregar ativo...</p>
                </div>
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <Navbar />
                <h1 className="text-4xl font-bold mb-4">Ativo não encontrado</h1>
                <Link to="/marketplace">
                    <Button>Voltar ao Marketplace</Button>
                </Link>
            </div>
        );
    }

    const limitPriceNum = parseFloat(limitPrice) || asset.current_price;
    const totalAtLimit = limitPriceNum * tokenAmount;
    const isPositive = asset.price_change_24h >= 0;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-6xl">
                    <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* COLUNA ESQUERDA - DETALHES DO ATIVO */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* VÍDEO PRINCIPAL DO ATIVO */}
                            {asset.youtube_url && getYouTubeEmbedUrl(asset.youtube_url) && (
                                <div className="aspect-video rounded-xl overflow-hidden border shadow-lg bg-black">
                                    <iframe
                                        width="100%" height="100%"
                                        src={getYouTubeEmbedUrl(asset.youtube_url)!}
                                        title="Vídeo do Ativo" frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            {/* TÍTULO E CRIADOR */}
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-start pt-2">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">{asset.title}</h1>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        {asset.description}
                                    </p>
                                </div>

                                {/* Card do Criador (Atleta) */}
                                {creator && (
                                    <Link to={`/athlete/${creator.athlete_id}`} className="shrink-0">
                                        <Card className="hover:border-primary transition-colors cursor-pointer bg-muted/20">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                {creator.avatar_url ? (
                                                    <img src={creator.avatar_url} alt="Criador" className="w-12 h-12 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><User className="w-6 h-6" /></div>
                                                )}
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Criado por</p>
                                                    <p className="font-bold">{creator.athlete_name}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                )}
                            </div>

                            {/* GRÁFICO DE PREÇO */}
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
                                            <div className="w-full h-full flex flex-col items-center justify-center text-center px-4 border-2 border-dashed rounded-lg bg-muted/10">
                                                <TrendingUp className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
                                                <p className="text-muted-foreground font-medium">Sem movimentos recentes.</p>
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                                                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis domain={['auto', 'auto']} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v.toFixed(2)}`} />
                                                    <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px' }} formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Preço']} />
                                                    <Line type="stepAfter" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* COLUNA DIREITA - CAIXA DE NEGOCIAÇÃO */}
                        <div className="space-y-6">
                            <Card className="sticky top-24 shadow-xl border-primary/20">
                                <CardHeader className="bg-muted/10 border-b">
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Comprar Frações</CardTitle>
                                        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                            {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                            <span className="font-bold">{isPositive ? '+' : ''}{asset.price_change_24h || 0}%</span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6 pt-6">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Preço por cota</p>
                                        <p className="text-4xl font-bold tracking-tight">R$ {asset.current_price.toFixed(2)}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Quantidade</label>
                                            <Input
                                                type="number" min="1"
                                                max={asset.available_tokens > 0 ? asset.available_tokens : undefined}
                                                value={tokenAmount}
                                                onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="text-lg"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                                <span>Disponíveis: {asset.available_tokens} / {asset.total_tokens}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Preço Limite (R$)</label>
                                            <Input
                                                type="number" min="0.01" step="0.01"
                                                value={limitPrice}
                                                onChange={(e) => setLimitPrice(e.target.value)}
                                                className="text-lg"
                                            />
                                        </div>

                                        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                                            <p className="text-sm text-muted-foreground mb-1">Total Estimado</p>
                                            <p className="text-2xl font-bold">R$ {totalAtLimit.toFixed(2)}</p>
                                        </div>

                                        <Button variant="default" size="lg" className="w-full text-lg h-14" onClick={handleBuy} disabled={buying}>
                                            {buying ? 'A Processar...' : 'Confirmar Investimento'}
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

export default AssetPage;