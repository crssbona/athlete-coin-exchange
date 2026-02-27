import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Coins, Plus, DollarSign, Pencil } from "lucide-react";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

      // Se o atleta já existe, preenchemos os estados para o formulário de edição
      if (data) {
        setAthleteName(data.athlete_name || "");
        setSport(data.sport || "");
        setDescription(data.description || "");
        setAvatarUrl(data.avatar_url || "");
        setAchievements(data.achievements ? data.achievements.join('\n') : "");
        setTwitter(data.social_twitter || "");
        setInstagram(data.social_instagram || "");
        setTwitch(data.social_twitch || "");
        setYoutube(data.social_youtube || "");
      }
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

  const updateProfile = async () => {
    try {
      if (!athleteName || !sport || !description) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const achievementsArray = achievements.split('\n').filter(a => a.trim());

      const { error } = await supabase
        .from('athlete_tokens')
        .update({
          athlete_name: athleteName,
          sport: sport,
          description: description,
          avatar_url: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${athleteName}`,
          achievements: achievementsArray,
          social_twitter: twitter || null,
          social_instagram: instagram || null,
          social_twitch: twitch || null,
          social_youtube: youtube || null,
        })
        .eq('id', athleteToken?.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
      setIsEditDialogOpen(false);
      loadAthleteTokens();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
    }
  };

  const generateMoreTokens = async () => {
    if (!athleteToken) return;

    try {
      const remaining = 100 - athleteToken.total_tokens;

      if (remaining <= 0) {
        toast.error('Você já atingiu o limite de 100 tokens.');
        return;
      }

      // Verificação RIGOROSA: Trava a operação se o usuário pedir mais do que pode
      if (newTokens > remaining) {
        toast.error(`Você pode gerar no máximo mais ${remaining} tokens.`);
        setNewTokens(remaining); // Ajusta o campo para o máximo permitido
        return; // <-- O "return" cancela a operação aqui e não gera nada!
      }

      if (newTokens <= 0) {
        toast.error('A quantidade deve ser maior que zero.');
        setNewTokens(1);
        return;
      }

      const toGenerate = Math.floor(newTokens);
      const newTotal = athleteToken.total_tokens + toGenerate;

      const { error } = await supabase
        .from('athlete_tokens')
        .update({
          total_tokens: newTotal,
          available_tokens: athleteToken.available_tokens + toGenerate
        })
        .eq('id', athleteToken.id);

      if (error) throw error;

      toast.success(`${toGenerate} novos tokens gerados!`);
      setNewTokens(1); // Limpa o campo para evitar cliques duplicados
      loadAthleteTokens();
    } catch (error: any) {
      console.error('Error generating tokens:', error);
      toast.error(error.message || 'Erro ao gerar tokens');
    }
  };



  if (loading) {
    return <div>Carregando...</div>;
  }

  // TELA DE CRIAÇÃO DO ATLETA
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

  // TELA DE GERENCIAMENTO (ATLETA JÁ EXISTENTE)
  const soldTokens = athleteToken.total_tokens - athleteToken.available_tokens;
  const soldPercentage = (soldTokens / athleteToken.total_tokens) * 100;
  const revenue = soldTokens * athleteToken.price_per_token;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Visão Geral do seu Mercado
          </h2>
          <p className="text-muted-foreground">Aqui você acompanha o desempenho dos seus tokens.</p>
        </div>
        <Button onClick={() => setIsEditDialogOpen(true)} variant="outline">
          <Pencil className="w-4 h-4 mr-2" />
          Editar Perfil
        </Button>
      </div>

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
      {athleteToken.total_tokens < 100 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Mais Tokens</CardTitle>
              <CardDescription>
                Você ainda pode gerar até {100 - athleteToken.total_tokens} tokens.
              </CardDescription>
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
        </div>
      )}

      {/* Modal de Edição de Perfil */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil Público</DialogTitle>
            <DialogDescription>
              Atualize as informações que os patrocinadores verão no seu marketplace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editAthleteName">Nome do Atleta *</Label>
                <Input
                  id="editAthleteName"
                  value={athleteName}
                  onChange={(e) => setAthleteName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editSport">Modalidade *</Label>
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
              <Label htmlFor="editDescription">Descrição *</Label>
              <Textarea
                id="editDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="editAvatarUrl">URL da Foto</Label>
              <Input
                id="editAvatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="editAchievements">Conquistas (uma por linha)</Label>
              <Textarea
                id="editAchievements"
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                rows={3}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Redes Sociais</h3>
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

            <Button onClick={updateProfile} className="w-full mt-4">
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}