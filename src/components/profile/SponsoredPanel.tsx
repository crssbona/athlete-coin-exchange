import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Coins, Plus, DollarSign, Pencil, Loader2, UploadCloud, User, X, Trash2, Video, Image as ImageIcon } from "lucide-react";
import Cropper from 'react-easy-crop';
import { toast } from "sonner";
import { Asset } from "@/types/athlete"; // Tipagem nova que criamos na Fase 1

// --- FUNÇÕES AJUDANTES PARA O CORTE DA IMAGEM ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob | null> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
  });
};
// ------------------------------------------------

interface SponsoredPanelProps {
  userId: string;
  profile: any;
}

export function SponsoredPanel({ userId, profile }: SponsoredPanelProps) {
  // Estados do Perfil (Storefront)
  const [athleteProfile, setAthleteProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);

  // Estados dos Ativos (Assets)
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isCreateAssetDialogOpen, setIsCreateAssetDialogOpen] = useState(false);
  const [creatingAsset, setCreatingAsset] = useState(false);

  // Formulário de Novo Ativo
  const [assetTitle, setAssetTitle] = useState("");
  const [assetDescription, setAssetDescription] = useState("");
  const [assetYoutubeUrl, setAssetYoutubeUrl] = useState("");
  const [assetTokens, setAssetTokens] = useState(100);
  const [assetPrice, setAssetPrice] = useState(10);
  const [assetImageFile, setAssetImageFile] = useState<File | null>(null);

  // Estados do Crop e Perfil
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assetImageInputRef = useRef<HTMLInputElement>(null);
  const [featuredVideo, setFeaturedVideo] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Campos do Perfil
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
    loadAthleteProfileAndAssets();
  }, [userId]);

  const loadAthleteProfileAndAssets = async () => {
    try {
      // 1. Carrega o Perfil (usando a tabela antiga como base de perfil)
      const { data: profileData, error: profileError } = await supabase
        .from('athlete_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      setAthleteProfile(profileData);
      if (profileData) {
        setAthleteName(profileData.athlete_name || "");
        setSport(profileData.sport || "");
        setDescription(profileData.description || "");
        setAvatarUrl(profileData.avatar_url || "");
        setAchievements(profileData.achievements ? profileData.achievements.join('\n') : "");
        setTwitter(profileData.social_twitter || "");
        setInstagram(profileData.social_instagram || "");
        setTwitch(profileData.social_twitch || "");
        setYoutube(profileData.social_youtube || "");
        setFeaturedVideo(profileData.featured_video || "");
        setGalleryUrls(profileData.gallery_urls || []);
      }

      // 2. Carrega os Ativos criados por este atleta
      const { data: assetsData, error: assetsError } = await supabase
        .from('athlete_assets')
        .select('*')
        .eq('athlete_id', userId)
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;

      if (assetsData) {
        const mappedAssets: Asset[] = assetsData.map(a => ({
          id: a.id,
          athleteId: a.athlete_id,
          title: a.title,
          description: a.description,
          imageUrl: a.image_url,
          youtubeUrl: a.youtube_url,
          totalTokens: a.total_tokens,
          availableTokens: a.available_tokens,
          initialPrice: Number(a.initial_price),
          currentPrice: Number(a.current_price),
          priceChange: Number(a.price_change_24h || 0),
          marketCap: Number(a.market_cap || 0),
          volume24h: Number(a.volume_24h || 0),
          createdAt: new Date(a.created_at)
        }));
        setAssets(mappedAssets);
      } else {
        setAssets([]);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÕES DE PERFIL (MANTIDAS E ADAPTADAS) ---
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mesma lógica de antes para avatar
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => { setImageToCrop(reader.result as string); setZoom(1); };
      e.target.value = '';
    }
  };

  const handleCropConfirm = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    try {
      setUploadingAvatar(true);
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Falha ao gerar o corte da imagem.");
      const filePath = `${userId}-avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, croppedBlob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      toast.success('Foto cortada e carregada!');
      setImageToCrop(null);
    } catch (error) {
      toast.error('Erro ao enviar a imagem.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    try {
      if (!athleteName || !sport || !description) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const achievementsArray = achievements.split('\n').filter(a => a.trim());
      const profileData = {
        athlete_name: athleteName,
        sport: sport,
        description: description,
        avatar_url: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${athleteName}`,
        achievements: achievementsArray,
        social_twitter: twitter || null,
        social_instagram: instagram || null,
        social_twitch: twitch || null,
        social_youtube: youtube || null,
        featured_video: featuredVideo || null,
        gallery_urls: galleryUrls,
        // Mantemos valores default para os campos antigos não quebrarem
        user_id: userId,
        athlete_id: `athlete-${userId.substring(0, 8)}`,
        total_tokens: 1,
        available_tokens: 1,
        price_per_token: 0
      };

      if (athleteProfile) {
        const { error } = await supabase.from('athlete_tokens').update(profileData).eq('id', athleteProfile.id);
        if (error) throw error;
        toast.success('Perfil atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('athlete_tokens').insert([profileData]);
        if (error) throw error;
        toast.success('Perfil criado! Você já pode criar ativos.');
      }
      setIsEditProfileDialogOpen(false);
      loadAthleteProfileAndAssets();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar perfil');
    }
  };

  // --- FUNÇÕES DE ATIVOS (NOVAS) ---
  const handleCreateAsset = async () => {
    if (!assetTitle || !assetDescription || !assetYoutubeUrl || !assetImageFile) {
      toast.error('Preencha todos os campos e selecione uma imagem para o ativo.');
      return;
    }

    try {
      setCreatingAsset(true);

      // 1. Upload da imagem do ativo
      const fileExt = assetImageFile.name.split('.').pop();
      const filePath = `${userId}-asset-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('assets-images')
        .upload(filePath, assetImageFile);

      if (uploadError) throw uploadError;
      const { data: imgData } = supabase.storage.from('assets-images').getPublicUrl(filePath);

      // 2. Salvar no banco
      const { error: dbError } = await supabase.from('athlete_assets').insert({
        athlete_id: userId,
        title: assetTitle,
        description: assetDescription,
        image_url: imgData.publicUrl,
        youtube_url: assetYoutubeUrl,
        total_tokens: assetTokens,
        available_tokens: assetTokens,
        initial_price: assetPrice,
        current_price: assetPrice
      });

      if (dbError) throw dbError;

      toast.success('Ativo criado com sucesso!');
      setIsCreateAssetDialogOpen(false);

      // Limpar formulário
      setAssetTitle(""); setAssetDescription(""); setAssetYoutubeUrl("");
      setAssetImageFile(null); setAssetTokens(100); setAssetPrice(10);

      loadAthleteProfileAndAssets();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao criar ativo.');
    } finally {
      setCreatingAsset(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      const { error } = await supabase.from('athlete_assets').delete().eq('id', assetId);
      if (error) throw error;
      toast.success('Ativo excluído com sucesso!');
      loadAthleteProfileAndAssets();
    } catch (error) {
      toast.error('Erro ao excluir. Verifique se o ativo já possui compradores.');
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">

      {/* SE O USUÁRIO AINDA NÃO TEM PERFIL */}
      {!athleteProfile ? (
        <Card>
          <CardHeader>
            <CardTitle>Crie seu Perfil no Marketplace</CardTitle>
            <CardDescription>Para criar ativos negociáveis, primeiro defina como sua vitrine será exibida.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Atleta *</Label>
                <Input value={athleteName} onChange={(e) => setAthleteName(e.target.value)} />
              </div>
              <div>
                <Label>Modalidade *</Label>
                <Input value={sport} onChange={(e) => setSport(e.target.value)} placeholder="Ex: Futebol, E-Sports" />
              </div>
            </div>
            <div>
              <Label>Descrição da sua Trajetória *</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <Button onClick={saveProfile} className="w-full mt-4">Criar Vitrine</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* DASHBOARD DO ATLETA: PERFIL E ATIVOS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-4">
              <img src={athleteProfile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover border" />
              <div>
                <h2 className="text-2xl font-bold">{athleteProfile.athlete_name}</h2>
                <p className="text-muted-foreground">{athleteProfile.sport} • {assets.length} Ativos criados</p>
              </div>
            </div>
            <Button onClick={() => setIsEditProfileDialogOpen(true)} variant="outline">
              <Pencil className="w-4 h-4 mr-2" /> Editar Vitrine
            </Button>
          </div>

          <div className="flex justify-between items-center mt-8 mb-4">
            <div>
              <h3 className="text-xl font-bold">Meus Ativos (Projetos)</h3>
              <p className="text-sm text-muted-foreground">Estes são os ativos que os patrocinadores podem comprar frações.</p>
            </div>
            <Button onClick={() => setIsCreateAssetDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Novo Ativo
            </Button>
          </div>

          {/* LISTA DE ATIVOS */}
          {assets.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground bg-muted/20 border-dashed">
              <p>Você ainda não criou nenhum ativo.</p>
              <Button variant="link" onClick={() => setIsCreateAssetDialogOpen(true)}>Criar meu primeiro ativo</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => {
                const soldTokens = asset.totalTokens - asset.availableTokens;
                const canDelete = soldTokens === 0; // Regra de exclusão

                return (
                  <Card key={asset.id} className="overflow-hidden flex flex-col">
                    <div className="h-40 w-full bg-muted relative">
                      {asset.imageUrl ? (
                        <img src={asset.imageUrl} alt={asset.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full"><ImageIcon className="opacity-20 w-12 h-12" /></div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg line-clamp-1">{asset.title}</CardTitle>
                      <CardDescription className="font-semibold text-primary">R$ {asset.currentPrice ? asset.currentPrice.toFixed(2) : '0.00'} / cota</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-2">
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{asset.description}</p>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Cotas vendidas:</span>
                        <span className="font-medium">{soldTokens} / {asset.totalTokens}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${(soldTokens / asset.totalTokens) * 100}%` }}></div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 border-t bg-muted/10 flex justify-end">
                      {canDelete ? (
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteAsset(asset.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir Ativo
                        </Button>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Não pode ser excluído (possui investidores)</p>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}

          {/* MODAL DE CRIAR NOVO ATIVO */}
          <Dialog open={isCreateAssetDialogOpen} onOpenChange={setIsCreateAssetDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Lançar Novo Ativo</DialogTitle>
                <DialogDescription>Crie um projeto específico, determine a quantidade de cotas e o preço inicial.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div>
                  <Label>Título do Ativo *</Label>
                  <Input placeholder="Ex: Rumo às Olimpíadas 2028" value={assetTitle} onChange={(e) => setAssetTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Descrição do Projeto *</Label>
                  <Textarea placeholder="Explique por que os patrocinadores devem investir neste ativo..." value={assetDescription} onChange={(e) => setAssetDescription(e.target.value)} rows={3} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Link do Vídeo (YouTube) *</Label>
                    <div className="flex relative">
                      <Video className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="https://youtube.com/watch?v=..." value={assetYoutubeUrl} onChange={(e) => setAssetYoutubeUrl(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Imagem de Capa *</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setAssetImageFile(e.target.files?.[0] || null)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                  <div>
                    <Label>Total de Cotas *</Label>
                    <Input type="number" min="1" value={assetTokens} onChange={(e) => setAssetTokens(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Preço Inicial (R$) *</Label>
                    <Input type="number" min="0.01" step="0.01" value={assetPrice} onChange={(e) => setAssetPrice(Number(e.target.value))} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateAssetDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateAsset} disabled={creatingAsset}>
                  {creatingAsset ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  {creatingAsset ? 'Criando...' : 'Lançar Ativo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}