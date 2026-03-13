import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Clock, ArrowUpRight, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface UserAssetToken {
  id: string;
  asset_id: string;
  quantity: number;
  average_purchase_price: number;
  purchased_at: string;
}

interface PendingPurchase {
  id: string;
  asset_id: string;
  quantity: number;
  limit_price: number;
  created_at: string;
}

interface PendingSale {
  id: string;
  asset_id: string;
  quantity: number;
  limit_price: number;
  created_at: string;
}

interface TransactionRecord {
  id: string;
  asset_id: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  created_at: string;
  original_quantity?: number;
}

interface SponsorPanelProps {
  userId: string;
}

export function SponsorPanel({ userId }: SponsorPanelProps) {
  const [tokens, setTokens] = useState<UserAssetToken[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [assetsData, setAssetsData] = useState<Map<string, any>>(new Map());

  // Sell dialog state
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedWalletItem, setSelectedWalletItem] = useState<any>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellPrice, setSellPrice] = useState("");
  const [selling, setSelling] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellingSaleId, setCancellingSaleId] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
    loadPendingPurchases();
    loadPendingSales();
    loadTransactions();
  }, [userId]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .not('asset_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  useEffect(() => {
    if (tokens.length > 0 || pendingPurchases.length > 0 || pendingSales.length > 0 || transactions.length > 0) {
      loadAssetsData();
    }
  }, [tokens, pendingPurchases, pendingSales, transactions]);

  const loadTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('user_asset_tokens')
        .select('*')
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_asset_purchases')
        .select('id, asset_id, quantity, limit_price, created_at')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingPurchases(data || []);
    } catch (error) {
      console.error('Error loading pending purchases:', error);
    }
  };

  const loadPendingSales = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_asset_sales')
        .select('id, asset_id, quantity, limit_price, created_at')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPendingSales(data);
      }
    } catch (error) {
      // Ignora erro se a tabela ainda não existir no momento
    }
  };

  const loadAssetsData = async () => {
    const tokenAssetIds = tokens.map(t => t.asset_id);
    const pendingAssetIds = pendingPurchases.map(p => p.asset_id);
    const pendingSaleAssetIds = pendingSales.map(p => p.asset_id);
    const txAssetIds = transactions.map(t => t.asset_id);
    const assetIds = [...new Set([...tokenAssetIds, ...pendingAssetIds, ...pendingSaleAssetIds, ...txAssetIds])].filter(Boolean);

    if (assetIds.length === 0) return;

    const dataMap = new Map();

    const { data: assets } = await supabase
      .from('athlete_assets')
      .select('id, title, photo_url, price_per_token, athlete_id')
      .in('id', assetIds);

    if (assets) {
      assets.forEach(asset => {
        dataMap.set(asset.id, {
          name: asset.title,
          avatar: asset.photo_url,
          tokenPrice: asset.price_per_token,
          athleteId: asset.athlete_id
        });
      });
    }

    setAssetsData(dataMap);
  };

  const getAssetInfo = (assetId: string) => assetsData.get(assetId);

  const getTotalValue = () =>
    tokens.reduce((sum, token) => {
      const asset = getAssetInfo(token.asset_id);
      return asset ? sum + token.quantity * asset.tokenPrice : sum;
    }, 0);

  const getTotalInvested = () =>
    tokens.reduce((sum, token) => sum + token.quantity * token.average_purchase_price, 0);

  // A mesma lógica de agrupamento que você enviou, adaptada para Ativos!
  const groupedTokens = tokens.reduce((acc, token) => {
    if (!acc[token.asset_id]) {
      acc[token.asset_id] = {
        asset_id: token.asset_id,
        totalQuantity: 0,
        totalInvested: 0,
        tokens: []
      };
    }
    acc[token.asset_id].totalQuantity += token.quantity;
    acc[token.asset_id].totalInvested += (token.quantity * token.average_purchase_price);
    acc[token.asset_id].tokens.push(token);
    return acc;
  }, {} as Record<string, { asset_id: string, totalQuantity: number, totalInvested: number, tokens: UserAssetToken[] }>);

  const walletItems = Object.values(groupedTokens);

  const openSellDialog = (walletItem: any) => {
    const asset = getAssetInfo(walletItem.asset_id);
    setSelectedWalletItem(walletItem);
    setSellQuantity(1);
    setSellPrice(asset?.tokenPrice?.toFixed(2) || "0");
    setSellDialogOpen(true);
  };

  const handleSell = async () => {
    if (!selectedWalletItem) return;

    const price = parseFloat(sellPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Preço de venda inválido");
      return;
    }
    if (sellQuantity <= 0 || sellQuantity > selectedWalletItem.totalQuantity) {
      toast.error("Quantidade inválida");
      return;
    }

    setSelling(true);
    try {
      let remainingToSell = sellQuantity;
      let somePending = false;
      let someExecuted = false;

      // Mantive a sua lógica exata de FIFO para os lotes
      const sortedTokens = [...selectedWalletItem.tokens].sort((a, b) =>
        new Date(a.purchased_at).getTime() - new Date(b.purchased_at).getTime()
      );

      for (const token of sortedTokens) {
        if (remainingToSell <= 0) break;

        const qtyFromBatch = Math.min(token.quantity, remainingToSell);

        // Chamada à nova RPC de venda de Ativos
        const { data, error } = await supabase.rpc('place_asset_sell_order', {
          p_user_asset_token_id: token.id,
          p_asset_id: token.asset_id,
          p_quantity: qtyFromBatch,
          p_sell_price: price
        });

        if (error) throw error;

        if (data?.executed) someExecuted = true;
        if (data?.pending) somePending = true;

        remainingToSell -= qtyFromBatch;
      }

      const asset = getAssetInfo(selectedWalletItem.asset_id);

      if (someExecuted && !somePending) {
        toast.success(`Venda realizada! ${sellQuantity} tokens de ${asset?.name || 'ativo'}`);
      } else if (somePending && !someExecuted) {
        toast.success(`Venda em espera! ${sellQuantity} tokens de ${asset?.name || 'ativo'} aguardam o preço chegar a R$ ${price.toFixed(2)}`);
      } else {
        toast.success(`Ordem processada! Parte executada e parte em espera.`);
      }

      setSellDialogOpen(false);
      await loadTokens();
      await loadPendingSales();
    } catch (error: any) {
      console.error('Error selling tokens:', error);
      toast.error(error.message || 'Erro ao vender tokens');
    } finally {
      setSelling(false);
    }
  };

  const handleCancelPending = async (pendingId: string) => {
    setCancellingId(pendingId);
    try {
      const { data, error } = await supabase.rpc('cancel_pending_asset_purchase', {
        p_pending_purchase_id: pendingId
      });

      if (error) throw error;
      toast.success('Ordem cancelada');
      await loadPendingPurchases();
    } catch (error: any) {
      toast.error('Erro ao cancelar ordem');
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelPendingSale = async (pendingSaleId: string) => {
    setCancellingSaleId(pendingSaleId);
    try {
      const { data, error } = await supabase.rpc('cancel_pending_asset_sale', {
        p_pending_sale_id: pendingSaleId
      });

      if (error) throw error;
      toast.success('Venda cancelada');
      await loadPendingSales();
    } catch (error: any) {
      toast.error('Erro ao cancelar venda');
    } finally {
      setCancellingSaleId(null);
    }
  };

  if (loading) return <div>Carregando tokens...</div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Valor Investido</CardDescription>
            <CardTitle className="text-2xl">R$ {getTotalInvested().toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Valor Atual</CardDescription>
            <CardTitle className="text-2xl">R$ {getTotalValue().toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Lucro/Prejuízo</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              R$ {(getTotalValue() - getTotalInvested()).toFixed(2)}
              {getTotalValue() >= getTotalInvested() ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Compras em espera */}
      {pendingPurchases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Compras em espera
            </CardTitle>
            <CardDescription>Ordens limitadas aguardando o ativo alcançar o preço desejado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPurchases.map((order) => {
                const asset = getAssetInfo(order.asset_id);
                const createdDate = new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-4">
                      {asset?.avatar ? (
                        <Link to={`/ativo/${order.asset_id}`}>
                          <img src={asset.avatar} className="w-12 h-12 rounded border object-cover cursor-pointer hover:ring-2 hover:ring-primary transition-all" />
                        </Link>
                      ) : <ImageIcon className="w-12 h-12 text-muted-foreground/30" />}
                      <div>
                        <h4 className="font-semibold">{asset?.name || 'Ativo'}</h4>
                        <p className="text-sm text-muted-foreground">{order.quantity} tokens • Preço limite: R$ {order.limit_price.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Criada em {createdDate}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleCancelPending(order.id)} disabled={cancellingId === order.id}>
                      {cancellingId === order.id ? 'Cancelando...' : 'Cancelar ordem'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendas em espera */}
      {pendingSales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5" />
              Vendas em espera
            </CardTitle>
            <CardDescription>Ordens limitadas aguardando o ativo alcançar o preço desejado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSales.map((sale) => {
                const asset = getAssetInfo(sale.asset_id);
                const createdDate = new Date(sale.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-4">
                      {asset?.avatar ? (
                        <Link to={`/ativo/${sale.asset_id}`}>
                          <img src={asset.avatar} className="w-12 h-12 rounded border object-cover cursor-pointer hover:ring-2 hover:ring-primary transition-all" />
                        </Link>
                      ) : <ImageIcon className="w-12 h-12 text-muted-foreground/30" />}
                      <div>
                        <h4 className="font-semibold">{asset?.name || 'Ativo'}</h4>
                        <p className="text-sm text-muted-foreground">{sale.quantity} tokens • Preço mínimo: R$ {sale.limit_price.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Criada em {createdDate}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleCancelPendingSale(sale.id)} disabled={cancellingSaleId === sale.id}>
                      {cancellingSaleId === sale.id ? 'Cancelando...' : 'Cancelar venda'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Minha Carteira */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Minha Carteira</CardTitle>
          <CardDescription>Resumo dos seus ativos consolidados</CardDescription>
        </CardHeader>
        <CardContent>
          {walletItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Sua carteira está vazia.</p>
          ) : (
            <div className="space-y-4">
              {walletItems.map((item) => {
                const asset = getAssetInfo(item.asset_id);
                if (!asset) return null;

                const avgPrice = item.totalInvested / item.totalQuantity;
                const currentValue = item.totalQuantity * asset.tokenPrice;
                // Proteção contra divisão por zero (+Infinity)
                let priceChange = 0;
                if (avgPrice > 0) {
                  priceChange = ((asset.tokenPrice - avgPrice) / avgPrice) * 100;
                } else if (asset.tokenPrice > 0) {
                  priceChange = 100; // Se o custo médio foi 0 e o ativo tem valor, consideramos 100% de lucro positivo
                }

                return (
                  <div key={item.asset_id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors gap-4">
                    {/* Topo no Mobile / Esquerda no Desktop */}
                    <div className="flex items-center gap-4">
                      <Link to={`/ativo/${item.asset_id}`} className="shrink-0">
                        <div className="w-14 h-14 md:w-12 md:h-12 rounded border bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                          {asset.avatar ? <img src={asset.avatar} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground/30" />}
                        </div>
                      </Link>
                      <div>
                        <h4 className="font-bold md:font-semibold text-lg md:text-base leading-tight mb-1">{asset.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.totalQuantity} tokens <span className="hidden md:inline">•</span><br className="md:hidden" /> Preço: R$ {asset.tokenPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Fundo no Mobile / Direita no Desktop */}
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-4 md:pt-0 border-t border-border/50 md:border-transparent mt-2 md:mt-0">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-muted-foreground md:hidden mb-0.5">Valor Atual</p>
                        <p className="font-bold text-xl md:text-lg">R$ {currentValue.toFixed(2)}</p>
                        <div className="flex items-center gap-1 justify-start md:justify-end mt-1 md:mt-0">
                          <Badge variant={priceChange >= 0 ? "default" : "destructive"} className="text-[10px] md:text-xs px-1.5 py-0">
                            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                          </Badge>
                          {priceChange >= 0 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openSellDialog(item)} className="h-10 md:h-9 px-6 md:px-3">Vender</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>Seu histórico completo de compras e vendas</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Você ainda não realizou nenhuma transação.</p>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => {
                const asset = getAssetInfo(tx.asset_id);
                if (!asset) return null;

                const totalValue = tx.quantity * tx.price;
                const txDate = new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                const isBuy = tx.type === 'buy';
                const isPartial = tx.original_quantity && tx.quantity < tx.original_quantity;

                return (
                  <div key={tx.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors gap-4">
                    {/* Topo no Mobile / Esquerda no Desktop */}
                    <div className="flex items-start md:items-center gap-4">
                      <Link to={`/ativo/${tx.asset_id}`} className="shrink-0 mt-1 md:mt-0">
                        <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                          {asset.avatar ? <img src={asset.avatar} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground/30" />}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5 md:mb-1">
                          <h4 className="font-semibold truncate max-w-[150px] sm:max-w-[200px]">{asset.name}</h4>
                          <Badge variant={isBuy ? "default" : "destructive"} className={isBuy ? "bg-green-600 hover:bg-green-700 text-white text-[10px] py-0" : "text-[10px] py-0"}>
                            {isBuy ? 'COMPRA' : 'VENDA'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1">
                          <p className="text-sm text-muted-foreground">
                            {tx.quantity} un. <span className="hidden md:inline">•</span> R$ {tx.price.toFixed(2)}/un
                          </p>
                          {isPartial && (
                            <span className="text-[10px] font-medium bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full whitespace-nowrap mt-1 md:mt-0">
                              Parcial ({tx.quantity} de {tx.original_quantity})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 md:mt-0.5">Data: {txDate}</p>
                      </div>
                    </div>

                    {/* Fundo no Mobile / Direita no Desktop */}
                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto pt-3 md:pt-0 border-t border-border/50 md:border-transparent mt-2 md:mt-0">
                      <p className="text-sm text-muted-foreground md:hidden font-medium">Total da transação</p>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1 hidden md:block">Total</p>
                        <p className={`font-bold text-xl md:text-lg ${isBuy ? 'text-foreground' : 'text-destructive'}`}>
                          {isBuy ? '-' : '+'} R$ {totalValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vender Tokens</DialogTitle>
            <DialogDescription>
              {selectedWalletItem && getAssetInfo(selectedWalletItem.asset_id)
                ? `Vender tokens do ativo ${getAssetInfo(selectedWalletItem.asset_id).name}`
                : 'Defina o preço e a quantidade'}
            </DialogDescription>
          </DialogHeader>
          {selectedWalletItem && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Você possui <span className="font-semibold text-foreground">{selectedWalletItem.totalQuantity}</span> tokens
              </p>
              <div className="space-y-2">
                <Label>Quantidade para vender</Label>
                <Input
                  type="number"
                  min={1}
                  max={selectedWalletItem.totalQuantity}
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(Math.max(1, Math.min(selectedWalletItem.totalQuantity, parseInt(e.target.value) || 1)))}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço por token (R$)</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Preço atual: R$ {getAssetInfo(selectedWalletItem.asset_id)?.tokenPrice?.toFixed(2)}.
                  Venda abaixo ou igual: imediata. Acima: ordem em espera.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Total da venda</p>
                <p className="text-2xl font-bold">
                  R$ {(sellQuantity * (parseFloat(sellPrice) || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSellDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSell} disabled={selling}>
              {selling ? 'Processando...' : 'Confirmar Venda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}