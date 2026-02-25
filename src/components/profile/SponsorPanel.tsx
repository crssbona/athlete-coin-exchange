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

export function SponsorPanel({ userId }: SponsorPanelProps) {
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [athletesData, setAthletesData] = useState<Map<string, any>>(new Map());

  // Sell dialog state
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<UserToken | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellPrice, setSellPrice] = useState("");
  const [selling, setSelling] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellingSaleId, setCancellingSaleId] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
    loadPendingPurchases();
    loadPendingSales();
  }, [userId]);

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
    const athleteIds = [...new Set([...tokenAthleteIds, ...pendingAthleteIds, ...pendingSaleAthleteIds])];
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

  const openSellDialog = (token: UserToken) => {
    const athlete = getAthleteInfo(token.athlete_id);
    setSelectedToken(token);
    setSellQuantity(1);
    setSellPrice(athlete?.tokenPrice?.toFixed(2) || "0");
    setSellDialogOpen(true);
  };

  const handleSell = async () => {
    if (!selectedToken) return;

    const price = parseFloat(sellPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Preço de venda inválido");
      return;
    }
    if (sellQuantity <= 0 || sellQuantity > selectedToken.quantity) {
      toast.error("Quantidade inválida");
      return;
    }

    setSelling(true);
    try {
      const { data, error } = await supabase.rpc('place_sell_order', {
        p_user_token_id: selectedToken.id,
        p_athlete_id: selectedToken.athlete_id,
        p_quantity: sellQuantity,
        p_sell_price: price
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.message || 'Erro ao criar ordem de venda');
        return;
      }

      const athlete = getAthleteInfo(selectedToken.athlete_id);
      const executed = data?.executed === true;

      if (executed) {
        toast.success(`Venda realizada! ${sellQuantity} tokens de ${athlete?.name || 'atleta'} por R$ ${(price * sellQuantity).toFixed(2)}`);
        setSellDialogOpen(false);
        await loadTokens();
      } else {
        toast.success(
          `Venda em espera! Seus ${sellQuantity} tokens de ${athlete?.name || 'atleta'} serão vendidos quando o preço chegar a R$ ${price.toFixed(2)}`
        );
        setSellDialogOpen(false);
        await loadTokens();
        await loadPendingSales();
      }
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
                        <img
                          src={athlete.avatar}
                          alt={athlete?.name || 'Atleta'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
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
                        <img
                          src={athlete.avatar}
                          alt={athlete?.name || 'Atleta'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
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

      {/* Tokens List */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Tokens</CardTitle>
          <CardDescription>Tokens que você comprou no marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Você ainda não comprou nenhum token. Visite o marketplace para começar!
            </p>
          ) : (
            <div className="space-y-4">
              {tokens.map((token) => {
                const athlete = getAthleteInfo(token.athlete_id);
                if (!athlete) return null;

                const priceChange = calculatePriceChange(token.purchase_price, athlete.tokenPrice);
                const currentValue = token.quantity * athlete.tokenPrice;

                return (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={athlete.avatar}
                        alt={athlete.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">{athlete.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {token.quantity} tokens • Compra: R$ {token.purchase_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">R$ {currentValue.toFixed(2)}</p>
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
                        onClick={() => openSellDialog(token)}
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

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vender Tokens</DialogTitle>
            <DialogDescription>
              {selectedToken && getAthleteInfo(selectedToken.athlete_id)
                ? `Vender tokens de ${getAthleteInfo(selectedToken.athlete_id).name}`
                : 'Defina o preço e a quantidade'}
            </DialogDescription>
          </DialogHeader>
          {selectedToken && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Você possui <span className="font-semibold text-foreground">{selectedToken.quantity}</span> tokens
              </p>
              <div className="space-y-2">
                <Label>Quantidade para vender</Label>
                <Input
                  type="number"
                  min={1}
                  max={selectedToken.quantity}
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(Math.max(1, Math.min(selectedToken.quantity, parseInt(e.target.value) || 1)))}
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
                  Preço atual: R$ {selectedToken && getAthleteInfo(selectedToken.athlete_id)?.tokenPrice?.toFixed(2)}.
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
