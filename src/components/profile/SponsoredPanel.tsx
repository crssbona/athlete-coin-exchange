import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Coins, Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface AthleteToken {
  id: string;
  athlete_id: string;
  total_tokens: number;
  available_tokens: number;
  price_per_token: number;
}

interface SponsoredPanelProps {
  userId: string;
  profile: any;
}

export function SponsoredPanel({ userId, profile }: SponsoredPanelProps) {
  const [athleteToken, setAthleteToken] = useState<AthleteToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTokens, setNewTokens] = useState(10000);
  const [newPrice, setNewPrice] = useState(10);

  useEffect(() => {
    loadAthleteTokens();
  }, [userId]);

  const loadAthleteTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('athlete_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setAthleteToken(data);
    } catch (error) {
      console.error('Error loading athlete tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTokens = async () => {
    try {
      if (!profile?.name) {
        toast.error('Complete seu perfil antes de criar tokens');
        return;
      }

      const athleteId = `athlete-${userId.substring(0, 8)}`;
      
      const { error } = await supabase
        .from('athlete_tokens')
        .insert({
          athlete_id: athleteId,
          user_id: userId,
          total_tokens: newTokens,
          available_tokens: newTokens,
          price_per_token: newPrice
        });

      if (error) throw error;
      
      toast.success('Tokens criados com sucesso!');
      loadAthleteTokens();
    } catch (error: any) {
      console.error('Error creating tokens:', error);
      toast.error(error.message || 'Erro ao criar tokens');
    }
  };

  const generateMoreTokens = async () => {
    if (!athleteToken) return;

    try {
      const { error } = await supabase
        .from('athlete_tokens')
        .update({
          total_tokens: athleteToken.total_tokens + newTokens,
          available_tokens: athleteToken.available_tokens + newTokens
        })
        .eq('id', athleteToken.id);

      if (error) throw error;
      
      toast.success(`${newTokens} novos tokens gerados!`);
      loadAthleteTokens();
    } catch (error: any) {
      console.error('Error generating tokens:', error);
      toast.error(error.message || 'Erro ao gerar tokens');
    }
  };

  const updatePrice = async () => {
    if (!athleteToken) return;

    try {
      const { error } = await supabase
        .from('athlete_tokens')
        .update({ price_per_token: newPrice })
        .eq('id', athleteToken.id);

      if (error) throw error;
      
      toast.success('Preço atualizado!');
      loadAthleteTokens();
    } catch (error: any) {
      console.error('Error updating price:', error);
      toast.error(error.message || 'Erro ao atualizar preço');
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!athleteToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seus Tokens</CardTitle>
          <CardDescription>
            Você ainda não criou seus tokens. Crie agora para começar a ser patrocinado!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tokens">Quantidade de Tokens</Label>
            <Input
              id="tokens"
              type="number"
              value={newTokens}
              onChange={(e) => setNewTokens(Number(e.target.value))}
              min="1000"
              step="1000"
            />
          </div>
          <div>
            <Label htmlFor="price">Preço por Token (R$)</Label>
            <Input
              id="price"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              min="0.01"
              step="0.01"
            />
          </div>
          <Button onClick={createTokens} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Criar Tokens
          </Button>
        </CardContent>
      </Card>
    );
  }

  const soldTokens = athleteToken.total_tokens - athleteToken.available_tokens;
  const soldPercentage = (soldTokens / athleteToken.total_tokens) * 100;
  const revenue = soldTokens * athleteToken.price_per_token;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Tokens Totais</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Coins className="w-5 h-5" />
              {athleteToken.total_tokens.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Tokens Disponíveis</CardDescription>
            <CardTitle className="text-2xl">{athleteToken.available_tokens.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Tokens Vendidos</CardDescription>
            <CardTitle className="text-2xl">{soldTokens.toLocaleString()}</CardTitle>
            <p className="text-xs text-muted-foreground">{soldPercentage.toFixed(1)}% vendido</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Receita Total</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              R$ {revenue.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Gerar Mais Tokens</CardTitle>
            <CardDescription>Crie tokens adicionais para comercialização</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-tokens">Quantidade de Novos Tokens</Label>
              <Input
                id="new-tokens"
                type="number"
                value={newTokens}
                onChange={(e) => setNewTokens(Number(e.target.value))}
                min="1000"
                step="1000"
              />
            </div>
            <Button onClick={generateMoreTokens} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Gerar Tokens
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atualizar Preço</CardTitle>
            <CardDescription>Ajuste o preço por token</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-price">Preço Atual: R$ {athleteToken.price_per_token.toFixed(2)}</Label>
              <Input
                id="new-price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                min="0.01"
                step="0.01"
                placeholder="Novo preço"
              />
            </div>
            <Button onClick={updatePrice} className="w-full" variant="outline">
              Atualizar Preço
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
