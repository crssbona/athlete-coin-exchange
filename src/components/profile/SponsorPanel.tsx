import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Clock, ArrowUpRight } from "lucide-react";
import { mockAthletes } from "@/data/mockAthletes";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface UserToken {
  id: string;
  athlete_id: string;
  quantity: number;
  purchase_price: number;
  purchased_at: string;
}

interface PendingPurchase {
  id: string;
  athlete_id: string;
  quantity: number;
  limit_price: number;
  created_at: string;
}

interface PendingSale {
  id: string;
  athlete_id: string;
  quantity: number;
  limit_price: number;
  created_at: string;
}

interface SponsorPanelProps {
  userId: string;
}

interface TransactionRecord {
  id: string;
  athlete_id: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  created_at: string;
  original_quantity?: number;
}

export function SponsorPanel({ userId }: SponsorPanelProps) {
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [athletesData, setAthletesData] = useState<Map<string, any>>(new Map());

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
    loadTransactions(); // <-- ADICIONE AQUI
  }, [userId]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // Atualize este useEffect para reagir também às transações
  useEffect(() => {
    if (tokens.length > 0 || pendingPurchases.length > 0 || pendingSales.length > 0 || transactions.length > 0) loadAthletesData();
  }, [tokens, pendingPurchases, pendingSales, transactions]);

  const loadTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
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
        .from('pending_purchases')
        .select('id, athlete_id, quantity, limit_price, created_at')
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
        .from('pending_sales')
        .select('id, athlete_id, quantity, limit_price, created_at')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingSales(data || []);
    } catch (error) {
      console.error('Error loading pending sales:', error);
    }
  };

  useEffect(() => {
    if (tokens.length > 0 || pendingPurchases.length > 0 || pendingSales.length > 0) loadAthletesData();
  }, [tokens, pendingPurchases, pendingSales]);

  const loadAthletesData = async () => {
    const tokenAthleteIds = tokens.map(t => t.athlete_id);
    const pendingAthleteIds = pendingPurchases.map(p => p.athlete_id);
    const pendingSaleAthleteIds = pendingSales.map(p => p.athlete_id);
    const txAthleteIds = transactions.map(t => t.athlete_id);
    const athleteIds = [...new Set([...tokenAthleteIds, ...pendingAthleteIds, ...pendingSaleAthleteIds, ...txAthleteIds])];
    const dataMap = new Map();

    const { data } = await supabase
      .from('athlete_tokens')
      .select('*')
      .in('athlete_id', athleteIds);

    if (data) {
      data.forEach(athlete => {
        dataMap.set(athlete.athlete_id, {
          name: athlete.athlete_name,
          avatar: athlete.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${athlete.athlete_name}`,
          tokenPrice: athlete.price_per_token,
          sport: athlete.sport
        });
      });
    }

    athleteIds.forEach(id => {
      if (!dataMap.has(id)) {
        const mock = mockAthletes.find(a => a.id === id);
        if (mock) dataMap.set(id, mock);
      }
    });

    setAthletesData(dataMap);
  };

  const getAthleteInfo = (athleteId: string) => athletesData.get(athleteId);

  const calculatePriceChange = (purchasePrice: number, currentPrice: number) =>
    ((currentPrice - purchasePrice) / purchasePrice) * 100;

  const getTotalValue = () =>
    tokens.reduce((sum, token) => {
      const athlete = getAthleteInfo(token.athlete_id);
      return athlete ? sum + token.quantity * athlete.tokenPrice : sum;
    }, 0);

  const getTotalInvested = () =>
    tokens.reduce((sum, token) => sum + token.quantity * token.purchase_price, 0);

  // Agrupa os tokens por atleta para montar a visualização da Carteira
  const groupedTokens = tokens.reduce((acc, token) => {
    if (!acc[token.athlete_id]) {
      acc[token.athlete_id] = {
        athlete_id: token.athlete_id,
        totalQuantity: 0,
        totalInvested: 0,
        tokens: [] // Guardamos os tokens originais caso precise
      };
    }
    acc[token.athlete_id].totalQuantity += token.quantity;
    acc[token.athlete_id].totalInvested += (token.quantity * token.purchase_price);
    acc[token.athlete_id].tokens.push(token);
    return acc;
  }, {} as Record<string, { athlete_id: string, totalQuantity: number, totalInvested: number, tokens: UserToken[] }>);

  const walletItems = Object.values(groupedTokens);

  const openSellDialog = (walletItem: any) => {
    const athlete = getAthleteInfo(walletItem.athlete_id);
    setSelectedWalletItem(walletItem); // Agora salva a carteira agrupada
    setSellQuantity(1);
    setSellPrice(athlete?.tokenPrice?.toFixed(2) || "0");
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

      // Ordenar os tokens pelos mais antigos primeiro (FIFO - First In First Out)
      const sortedTokens = [...selectedWalletItem.tokens].sort((a, b) =>
        new Date(a.purchased_at).getTime() - new Date(b.purchased_at).getTime()
      );

      // Passa por todos os lotes do usuário até atingir a quantidade que ele quer vender
      for (const token of sortedTokens) {
        if (remainingToSell <= 0) break;

        const qtyFromBatch = Math.min(token.quantity, remainingToSell);

        const { data, error } = await supabase.rpc('place_sell_order', {
          p_user_token_id: token.id,
          p_athlete_id: token.athlete_id,
          p_quantity: qtyFromBatch,
          p_sell_price: price
        });

        if (error) throw error;

        if (data?.executed) someExecuted = true;
        if (data?.pending) somePending = true;

        remainingToSell -= qtyFromBatch;
      }

      const athlete = getAthleteInfo(selectedWalletItem.athlete_id);

      if (someExecuted && !somePending) {
        toast.success(`Venda realizada! ${sellQuantity} tokens de ${athlete?.name || 'atleta'}`);
      } else if (somePending && !someExecuted) {
        toast.success(`Venda em espera! ${sellQuantity} tokens de ${athlete?.name || 'atleta'} aguardam o preço chegar a R$ ${price.toFixed(2)}`);
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
      const { data, error } = await supabase.rpc('cancel_pending_purchase', {
        p_pending_purchase_id: pendingId
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Ordem cancelada');
        await loadPendingPurchases();
      } else {
        toast.error(data?.message || 'Erro ao cancelar ordem');
      }
    } catch (error: any) {
      console.error('Error cancelling pending purchase:', error);
      toast.error(error.message || 'Erro ao cancelar ordem');
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelPendingSale = async (pendingSaleId: string) => {
    setCancellingSaleId(pendingSaleId);
    try {
      const { data, error } = await supabase.rpc('cancel_pending_sale', {
        p_pending_sale_id: pendingSaleId
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Venda cancelada');
        await loadPendingSales();
      } else {
        toast.error(data?.message || 'Erro ao cancelar venda');
      }
    } catch (error: any) {
      console.error('Error cancelling pending sale:', error);
      toast.error(error.message || 'Erro ao cancelar venda');
    } finally {
      setCancellingSaleId(null);
    }
  };

  if (loading) {
    return <div>Carregando tokens...</div>;
  }

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
            <CardDescription>
              Ordens limitadas aguardando o token alcançar o preço desejado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPurchases.map((order) => {
                const athlete = getAthleteInfo(order.athlete_id);
                const createdDate = new Date(order.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      {athlete?.avatar && (
                        <Link to={`/athlete/${order.athlete_id}`}>
                          <img
                            src={athlete.avatar}
                            alt={athlete?.name || 'Atleta'}
                            className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          />
                        </Link>
                      )}
                      <div>
                        <h4 className="font-semibold">{athlete?.name || 'Atleta'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {order.quantity} tokens • Preço limite: R$ {order.limit_price.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Criada em {createdDate}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelPending(order.id)}
                      disabled={cancellingId === order.id}
                    >
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
            <CardDescription>
              Ordens limitadas aguardando o token alcançar o preço desejado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSales.map((sale) => {
                const athlete = getAthleteInfo(sale.athlete_id);
                const createdDate = new Date(sale.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      {athlete?.avatar && (
                        <Link to={`/athlete/${sale.athlete_id}`}>
                          <img
                            src={athlete.avatar}
                            alt={athlete?.name || 'Atleta'}
                            className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          />
                        </Link>
                      )}
                      <div>
                        <h4 className="font-semibold">{athlete?.name || 'Atleta'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {sale.quantity} tokens • Preço mínimo: R$ {sale.limit_price.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Criada em {createdDate}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelPendingSale(sale.id)}
                      disabled={cancellingSaleId === sale.id}
                    >
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
          <CardDescription>Resumo dos seus ativos consolidados por atleta</CardDescription>
        </CardHeader>
        <CardContent>
          {walletItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Sua carteira está vazia.
            </p>
          ) : (
            <div className="space-y-4">
              {walletItems.map((item) => {
                const athlete = getAthleteInfo(item.athlete_id);
                if (!athlete) return null;

                // Cálculos da carteira consolidada
                const avgPrice = item.totalInvested / item.totalQuantity;
                const currentValue = item.totalQuantity * athlete.tokenPrice;
                const priceChange = ((athlete.tokenPrice - avgPrice) / avgPrice) * 100;

                return (
                  <div
                    key={item.athlete_id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Link to={`/athlete/${item.athlete_id}`}>
                        <img
                          src={athlete.avatar}
                          alt={athlete.name}
                          className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        />
                      </Link>
                      <div>
                        <h4 className="font-semibold">{athlete.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.totalQuantity} tokens • Preço Atual: R$ {athlete.tokenPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-lg">R$ {currentValue.toFixed(2)}</p>
                        <div className="flex items-center gap-1 justify-end">
                          <Badge variant={priceChange >= 0 ? "default" : "destructive"} className="text-xs">
                            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                          </Badge>
                          {priceChange >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSellDialog(item)}
                      >
                        Vender
                      </Button>
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
            <p className="text-muted-foreground text-center py-8">
              Você ainda não realizou nenhuma transação. Visite o marketplace para começar!
            </p>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => {
                const athlete = getAthleteInfo(tx.athlete_id);
                if (!athlete) return null;

                const totalValue = tx.quantity * tx.price;
                const txDate = new Date(tx.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                const isBuy = tx.type === 'buy';
                const isPartial = tx.original_quantity && tx.quantity < tx.original_quantity;

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Link to={`/athlete/${tx.athlete_id}`}>
                        <img
                          src={athlete.avatar}
                          alt={athlete.name}
                          className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        />
                      </Link>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{athlete.name}</h4>
                          <Badge variant={isBuy ? "default" : "destructive"} className={isBuy ? "bg-green-600 hover:bg-green-700 text-white" : ""}>
                            {isBuy ? 'COMPRA' : 'VENDA'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted-foreground">
                            {tx.quantity} tokens • R$ {tx.price.toFixed(2)} / token
                          </p>
                          {isPartial && (
                            <span className="text-[10px] font-medium bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full">
                              Parcial ({tx.quantity} de {tx.original_quantity})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Data: {txDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Total</p>
                        <p className={`font-semibold text-lg ${isBuy ? 'text-foreground' : 'text-destructive'}`}>
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
              {selectedWalletItem && getAthleteInfo(selectedWalletItem.athlete_id)
                ? `Vender tokens de ${getAthleteInfo(selectedWalletItem.athlete_id).name}`
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
                  Preço atual: R$ {getAthleteInfo(selectedWalletItem.athlete_id)?.tokenPrice?.toFixed(2)}.
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
