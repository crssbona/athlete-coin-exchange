import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Coins, Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface AthleteToken {
  id: string;
  athlete_id: string;
  total_tokens: number;
  available_tokens: number;
  price_per_token: number;
  athlete_name?: string;
  sport?: string;
  description?: string;
  avatar_url?: string;
  achievements?: string[];
  social_twitter?: string;
  social_instagram?: string;
  social_twitch?: string;
  social_youtube?: string;
}

interface SponsoredPanelProps {
  userId: string;
  profile: any;
}

export function SponsoredPanel({ userId, profile }: SponsoredPanelProps) {
  const [athleteToken, setAthleteToken] = useState<AthleteToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTokens, setNewTokens] = useState(100);
  const [newPrice, setNewPrice] = useState(10);
  
  // Profile fields
  const [athleteName, setAthleteName] = useState("");
  const [sport, setSport] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [achievements, setAchievements] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitch, setTwitch] = useState("");
  const [youtube, setYoutube] = useState("");

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
      if (!athleteName || !sport || !description) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const clampedTokens = Math.min(Math.max(Math.floor(newTokens), 1), 100);

      if (clampedTokens !== newTokens) {
        setNewTokens(clampedTokens);
      }

      const athleteId = `athlete-${userId.substring(0, 8)}`;
      const achievementsArray = achievements.split('\n').filter(a => a.trim());
      const marketCap = clampedTokens * newPrice;
      
      const { error } = await supabase
        .from('athlete_tokens')
        .insert({
          athlete_id: athleteId,
          user_id: userId,
          total_tokens: clampedTokens,
          available_tokens: clampedTokens,
          price_per_token: newPrice,
          athlete_name: athleteName,
          sport: sport,
          description: description,
          avatar_url: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${athleteName}`,
          achievements: achievementsArray,
          social_twitter: twitter || null,
          social_instagram: instagram || null,
          social_twitch: twitch || null,
          social_youtube: youtube || null,
          market_cap: marketCap,
          volume_24h: 0,
          price_change_24h: 0
        });

      if (error) throw error;
      
      toast.success('Tokens criados com sucesso! Você já aparece no marketplace!');
      loadAthleteTokens();
    } catch (error: any) {
      console.error('Error creating tokens:', error);
      toast.error(error.message || 'Erro ao criar tokens');
    }
  };

  const generateMoreTokens = async () => {
    if (!athleteToken) return;

    try {
      const clamped = Math.min(Math.max(Math.floor(newTokens), 1), 100);
      const remaining = 100 - athleteToken.total_tokens;
      if (remaining <= 0) {
        toast.error('Você já atingiu o limite de 100 tokens.');
        return;
      }
      const toGenerate = Math.min(clamped, remaining);
      const newTotal = athleteToken.total_tokens + toGenerate;

      const { error } = await supabase
        .from('athlete_tokens')
        .update({
          total_tokens: newTotal,
          available_tokens: athleteToken.available_tokens + toGenerate
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
          <CardTitle>Criar Seu Perfil de Atleta</CardTitle>
          <CardDescription>
            Preencha seus dados para aparecer no marketplace e começar a ser patrocinado!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="athleteName">Nome do Atleta *</Label>
              <Input
                id="athleteName"
                value={athleteName}
                onChange={(e) => setAthleteName(e.target.value)}
                placeholder="Seu nome artístico"
              />
            </div>
            <div>
              <Label htmlFor="sport">Modalidade *</Label>
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="E-Sports">E-Sports</SelectItem>
                  <SelectItem value="Futebol">Futebol</SelectItem>
                  <SelectItem value="MMA">MMA</SelectItem>
                  <SelectItem value="Atletismo">Atletismo</SelectItem>
                  <SelectItem value="Basquete">Basquete</SelectItem>
                  <SelectItem value="Vôlei">Vôlei</SelectItem>
                  <SelectItem value="Natação">Natação</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Conte sua história, suas especialidades..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="avatarUrl">URL da Foto (opcional)</Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se deixar em branco, um avatar será gerado automaticamente
            </p>
          </div>

          <div>
            <Label htmlFor="achievements">Conquistas (uma por linha)</Label>
            <Textarea
              id="achievements"
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              placeholder="Campeão Regional 2023&#10;Top 10 Nacional&#10;500+ horas de jogo"
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Redes Sociais (opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Twitter/X"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
              />
              <Input
                placeholder="Instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
              <Input
                placeholder="Twitch"
                value={twitch}
                onChange={(e) => setTwitch(e.target.value)}
              />
              <Input
                placeholder="YouTube"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Configuração de Tokens</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tokens">Quantidade de Tokens *</Label>
                <Input
                  id="tokens"
                  type="number"
                  value={newTokens}
                  onChange={(e) => setNewTokens(Number(e.target.value))}
                  min="1"
                  max="100"
                  step="1"
                  onBlur={() => { if (newTokens > 100) setNewTokens(100); if (newTokens < 1) setNewTokens(1); }}
                />
              </div>
              <div>
                <Label htmlFor="price">Preço por Token (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <Button onClick={createTokens} className="w-full" size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Criar Perfil e Tokens
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
                min="1"
                max={100 - athleteToken.total_tokens}
                step="1"
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
