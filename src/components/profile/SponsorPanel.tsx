import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { mockAthletes } from "@/data/mockAthletes";

interface UserToken {
  id: string;
  athlete_id: string;
  quantity: number;
  purchase_price: number;
  purchased_at: string;
}

interface SponsorPanelProps {
  userId: string;
}

export function SponsorPanel({ userId }: SponsorPanelProps) {
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTokens();
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

  const getAthleteInfo = (athleteId: string) => {
    return mockAthletes.find(a => a.id === athleteId);
  };

  const calculatePriceChange = (purchasePrice: number, currentPrice: number) => {
    const change = ((currentPrice - purchasePrice) / purchasePrice) * 100;
    return change;
  };

  const getTotalValue = () => {
    return tokens.reduce((sum, token) => {
      const athlete = getAthleteInfo(token.athlete_id);
      if (!athlete) return sum;
      return sum + (token.quantity * athlete.tokenPrice);
    }, 0);
  };

  const getTotalInvested = () => {
    return tokens.reduce((sum, token) => sum + (token.quantity * token.purchase_price), 0);
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
                const investedValue = token.quantity * token.purchase_price;

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
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
