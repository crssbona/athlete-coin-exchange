import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, Image as ImageIcon, Clock, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// Interfaces
interface UserAssetToken { id: string; asset_id: string; quantity: number; average_purchase_price: number; updated_at: string; }
interface PendingPurchase { id: string; asset_id: string; quantity: number; limit_price: number; created_at: string; }
interface PendingSale { id: string; asset_id: string; quantity: number; limit_price: number; created_at: string; }
interface TransactionRecord { id: string; asset_id: string; type: 'buy' | 'sell'; quantity: number; price: number; created_at: string; }

export function SponsorPanel({ userId }: { userId: string }) {
  const [tokens, setTokens] = useState<UserAssetToken[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [assetsData, setAssetsData] = useState<Map<string, any>>(new Map());

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Estados do Dialog de Venda
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedWalletItem, setSelectedWalletItem] = useState<UserAssetToken | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellPrice, setSellPrice] = useState("");
  const [selling, setSelling] = useState(false);

  useEffect(() => { loadWalletAndTransactions(); }, [userId]);

  const loadWalletAndTransactions = async () => {
    setLoading(true);
    try {
      const { data: tokensData } = await supabase.from('user_asset_tokens').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
      setTokens(tokensData || []);

      const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      setTransactions(txData || []);

      const { data: pendingPurchasesData } = await supabase.from('pending_purchases').select('*').eq('user_id', userId).eq('status', 'pending').order('created_at', { ascending: false });
      setPendingPurchases(pendingPurchasesData || []);

      const { data: pendingSalesData } = await supabase.from('pending_sales').select('*').eq('user_id', userId).eq('status', 'pending').order('created_at', { ascending: false });
      setPendingSales(pendingSalesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokens.length > 0 || transactions.length > 0 || pendingPurchases.length > 0 || pendingSales.length > 0) {
      loadAssetsDetails();
    }
  }, [tokens, transactions, pendingPurchases, pendingSales]);

  const loadAssetsDetails = async () => {
    const assetIds = [...new Set([...tokens.map(t => t.asset_id), ...transactions.map(t => t.asset_id), ...pendingPurchases.map(p => p.asset_id), ...pendingSales.map(s => s.asset_id)])].filter(Boolean);
    if (assetIds.length === 0) return;

    const { data } = await supabase.from('athlete_assets').select('id, title, image_url, current_price, athlete_id').in('id', assetIds);
    const dataMap = new Map();
    if (data) data.forEach(asset => dataMap.set(asset.id, { title: asset.title, imageUrl: asset.image_url, currentPrice: Number(asset.current_price), athleteId: asset.athlete_id }));
    setAssetsData(dataMap);
  };

  const getAssetInfo = (assetId: string) => assetsData.get(assetId);

  // AÇÕES
  const handleCancelPending = async (pendingId: string, isSale: boolean = false) => {
    setCancellingId(pendingId);
    try {
      const rpcName = isSale ? 'cancel_pending_sale' : 'cancel_pending_purchase';
      const payload = isSale ? { p_pending_sale_id: pendingId } : { p_pending_purchase_id: pendingId };
      const { data, error } = await supabase.rpc(rpcName, payload);

      if (error) throw error;
      if (data?.success) {
        toast.success('Ordem cancelada com sucesso!');
        loadWalletAndTransactions();
      } else {
        toast.error(data?.message || 'Erro ao cancelar ordem');
      }
    } catch (error: any) {
      toast.error('Erro de conexão ao cancelar.');
    } finally {
      setCancellingId(null);
    }
  };

  const openSellDialog = (item: UserAssetToken) => {
    setSelectedWalletItem(item);
    setSellQuantity(1);
    const info = getAssetInfo(item.asset_id);
    setSellPrice(info?.currentPrice?.toFixed(2) || "0");
    setSellDialogOpen(true);
  };

  const handleSell = async () => {
    if (!selectedWalletItem) return;

    const priceNum = parseFloat(sellPrice);
    if (isNaN(priceNum) || priceNum <= 0) { toast.error("Preço de venda inválido."); return; }
    if (sellQuantity <= 0 || sellQuantity > selectedWalletItem.quantity) { toast.error("Quantidade inválida."); return; }

    setSelling(true);
    try {
      const { data, error } = await supabase.rpc('place_sell_order', {
        p_asset_id: selectedWalletItem.asset_id,
        p_quantity: sellQuantity,
        p_sell_price: priceNum
      });

      if (error) throw error;

      if (data && data.executed === false) {
        if (data.pending) {
          toast.info(data.message || "Ordem de venda colocada em espera.");
        } else {
          toast.error(data.message || "Erro ao realizar venda.");
          setSelling(false);
          return;
        }
      } else {
        toast.success(data.message || "Venda imediata realizada com sucesso!");
      }

      setSellDialogOpen(false);
      loadWalletAndTransactions();
    } catch (error: any) {
      toast.error(error.message || "Erro ao conectar com o mercado.");
    } finally {
      setSelling(false);
    }
  };

  // CÁLCULOS
  const getTotalInvested = () => tokens.reduce((sum, t) => sum + (t.quantity * t.average_purchase_price), 0);
  const getTotalValue = () => tokens.reduce((sum, t) => { const info = getAssetInfo(t.asset_id); return info ? sum + (t.quantity * info.currentPrice) : sum; }, 0);

  if (loading) return <div className="py-8 text-center text-muted-foreground animate-pulse">A carregar investimentos...</div>;

  const totalInvested = getTotalInvested();
  const totalValue = getTotalValue();
  const profit = totalValue - totalInvested;

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardDescription>Valor Investido</CardDescription><CardTitle className="text-2xl">R$ {totalInvested.toFixed(2)}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Valor Atual</CardDescription><CardTitle className="text-2xl">R$ {totalValue.toFixed(2)}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Lucro/Prejuízo</CardDescription><CardTitle className="text-2xl flex items-center gap-2">R$ {profit.toFixed(2)}{profit >= 0 ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}</CardTitle></CardHeader></Card>
      </div>

      {/* Ordens de Compra Pendentes */}
      {pendingPurchases.length > 0 && (
        <Card className="border-amber-500/30 shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2 text-amber-600"><Clock className="w-5 h-5" />Compras em Espera</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPurchases.map((order) => {
                const info = getAssetInfo(order.asset_id);
                if (!info) return null;
                return (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-amber-50/10 gap-4">
                    <div className="flex items-center gap-4">
                      {info.imageUrl ? <img src={info.imageUrl} className="w-12 h-12 rounded-md object-cover" /> : <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center"><ImageIcon className="w-5 h-5 opacity-50" /></div>}
                      <div><h4 className="font-semibold">{info.title}</h4><p className="text-sm text-muted-foreground">{order.quantity} cotas • Max: R$ {order.limit_price.toFixed(2)}</p></div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleCancelPending(order.id, false)} disabled={cancellingId === order.id}>{cancellingId === order.id ? 'A cancelar...' : 'Cancelar Ordem'}</Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ordens de Venda Pendentes */}
      {pendingSales.length > 0 && (
        <Card className="border-blue-500/30 shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2 text-blue-600"><ArrowUpRight className="w-5 h-5" />Vendas em Espera</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSales.map((sale) => {
                const info = getAssetInfo(sale.asset_id);
                if (!info) return null;
                return (
                  <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-blue-50/10 gap-4">
                    <div className="flex items-center gap-4">
                      {info.imageUrl ? <img src={info.imageUrl} className="w-12 h-12 rounded-md object-cover" /> : <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center"><ImageIcon className="w-5 h-5 opacity-50" /></div>}
                      <div><h4 className="font-semibold">{info.title}</h4><p className="text-sm text-muted-foreground">{sale.quantity} cotas • Min: R$ {sale.limit_price.toFixed(2)}</p></div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleCancelPending(sale.id, true)} disabled={cancellingId === sale.id}>{cancellingId === sale.id ? 'A cancelar...' : 'Cancelar Venda'}</Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Carteira de Ativos */}
      <Card className="mb-6 border-primary/20 shadow-md">
        <CardHeader><CardTitle>Meus Ativos</CardTitle></CardHeader>
        <CardContent>
          {tokens.length === 0 ? <p className="text-muted-foreground text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">A sua carteira está vazia.</p> : (
            <div className="space-y-4">
              {tokens.map((item) => {
                const info = getAssetInfo(item.asset_id);
                if (!info) return null;
                const currentValue = item.quantity * info.currentPrice;
                const priceChange = ((info.currentPrice - item.average_purchase_price) / item.average_purchase_price) * 100;

                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card hover:border-primary/50 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <Link to={`/asset/${item.asset_id}`} className="shrink-0">
                        {info.imageUrl ? <img src={info.imageUrl} className="w-16 h-12 rounded-md object-cover" /> : <div className="w-16 h-12 rounded-md bg-muted flex items-center justify-center"><ImageIcon className="w-6 h-6 text-muted-foreground/50" /></div>}
                      </Link>
                      <div>
                        <h4 className="font-semibold line-clamp-1">{info.title}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.quantity} cotas • PM: R$ {item.average_purchase_price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-lg">R$ {currentValue.toFixed(2)}</p>
                        <div className="flex items-center gap-1 justify-end mt-0.5"><Badge variant={priceChange >= 0 ? "default" : "destructive"} className="text-[10px] px-1.5 py-0 h-4">{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</Badge></div>
                      </div>
                      <Button variant="default" size="sm" onClick={() => openSellDialog(item)}>Vender</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Venda */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vender Cotas</DialogTitle>
            <DialogDescription>Defina a quantidade e o preço de venda das suas cotas.</DialogDescription>
          </DialogHeader>

          {selectedWalletItem && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/50 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">Disponível na sua carteira:</p>
                <p className="font-bold text-lg">{selectedWalletItem.quantity} cotas</p>
              </div>

              <div className="space-y-2">
                <Label>Quantidade a Vender</Label>
                <Input
                  type="number" min="1" max={selectedWalletItem.quantity}
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(Math.max(1, Math.min(selectedWalletItem.quantity, parseInt(e.target.value) || 1)))}
                />
              </div>

              <div className="space-y-2">
                <Label>Preço por Cota (R$)</Label>
                <Input
                  type="number" min="0.01" step="0.01"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Se vender a R$ {getAssetInfo(selectedWalletItem.asset_id)?.currentPrice?.toFixed(2)} ou menos, a venda é imediata. Um valor maior cria uma "Ordem em Espera".
                </p>
              </div>

              <div className="p-4 rounded-lg bg-secondary/50 border border-border mt-2">
                <p className="text-sm text-muted-foreground mb-1">Total a Receber</p>
                <p className="text-2xl font-bold text-primary">R$ {(sellQuantity * (parseFloat(sellPrice) || 0)).toFixed(2)}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSellDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSell} disabled={selling}>{selling ? 'Processando...' : 'Confirmar Venda'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}