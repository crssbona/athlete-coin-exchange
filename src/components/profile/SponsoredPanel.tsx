import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, Plus, DollarSign, Pencil, Loader2, UploadCloud, User, X, ImageIcon, TrendingUp, TrendingDown } from "lucide-react";
import Cropper from 'react-easy-crop';
import { toast } from "sonner";

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
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg", 0.9);
  });
};
// ------------------------------------------------

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
  featured_video?: string;
  gallery_urls?: string[];
}

interface Asset {
  id: string;
  title: string;
  description: string;
  photo_url: string;
  youtube_link: string;
  total_tokens: number;
  available_tokens: number;
  price_per_token: number;
  price_change_24h: number;
}

interface SponsoredPanelProps {
  userId: string;
  profile: any;
}

export function SponsoredPanel({ userId, profile }: SponsoredPanelProps) {
  const [athleteToken, setAthleteToken] = useState<AthleteToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Estados dos Novos Ativos
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [newAssetTitle, setNewAssetTitle] = useState("");
  const [newAssetDescription, setNewAssetDescription] = useState("");
  const [newAssetTokens, setNewAssetTokens] = useState(100);
  const [newAssetPrice, setNewAssetPrice] = useState(10);
  const [newAssetYoutube, setNewAssetYoutube] = useState("");
  const [newAssetPhoto, setNewAssetPhoto] = useState("");
  const [uploadingAssetPhoto, setUploadingAssetPhoto] = useState(false);
  const assetPhotoInputRef = useRef<HTMLInputElement>(null);

  // Estados do Crop, Upload e Arquivo (Perfil)
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [featuredVideo, setFeaturedVideo] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
    loadProfileAndAssets();
  }, [userId]);

  const loadProfileAndAssets = async () => {
    try {
      // 1. Carrega o Perfil
      const { data: profileData, error: profileError } = await supabase
        .from('athlete_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      setAthleteToken(profileData);

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

        // 2. Carrega os Ativos vinculados a este perfil
        // (Supomos que criaremos a tabela 'athlete_assets' referenciando o athlete_id ou user_id)
        const { data: assetsData, error: assetsError } = await supabase
          .from('athlete_assets')
          .select('*')
          .eq('athlete_id', profileData.athlete_id);

        if (!assetsError && assetsData) {
          setAssets(assetsData);
        }
      }
    } catch (error) {
      console.error('Error loading profile or assets:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÕES DE UPLOAD E CORTE DO PERFIL (Mantidas intactas) ---
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, envie apenas imagens (JPG, PNG).');
        return;
      }
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setZoom(1);
      };
      e.target.value = '';
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const onGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        setUploadingGallery(true);
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
          toast.error('Por favor, envie apenas imagens.');
          return;
        }
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-gallery-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('athlete_gallery')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('athlete_gallery').getPublicUrl(filePath);
        setGalleryUrls(prev => [...prev, data.publicUrl]);
        toast.success('Imagem adicionada à galeria!');
      } catch (error) {
        console.error('Erro no upload:', error);
        toast.error('Erro ao enviar a imagem.');
      } finally {
        setUploadingGallery(false);
        e.target.value = '';
      }
    }
  };

  const handleCropConfirm = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    try {
      setUploadingAvatar(true);
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Falha ao gerar o corte da imagem.");
      const fileName = `${userId}-avatar-${Date.now()}.jpg`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      toast.success('Foto cortada e carregada com sucesso!');
      setImageToCrop(null);
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar a imagem. Tente novamente.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // --- FUNÇÕES DE GESTÃO DO PERFIL ---
  const createProfile = async () => {
    try {
      if (!athleteName || !sport || !description) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
      const athleteId = `athlete-${userId.substring(0, 8)}`;
      const achievementsArray = achievements.split('\n').filter(a => a.trim());

      const { error } = await supabase
        .from('athlete_tokens')
        .insert({
          athlete_id: athleteId,
          user_id: userId,
          total_tokens: 0,
          available_tokens: 0,
          price_per_token: 0,
          market_cap: 0,
          athlete_name: athleteName,
          sport: sport,
          description: description,
          avatar_url: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${athleteName}`,
          achievements: achievementsArray,
          social_twitter: twitter || null,
          social_instagram: instagram || null,
          social_twitch: twitch || null,
          social_youtube: youtube || null,
          volume_24h: 0,
          price_change_24h: 0,
          featured_video: featuredVideo || null,
          gallery_urls: galleryUrls,
        });

      if (error) throw error;
      toast.success('Perfil criado com sucesso!');
      loadProfileAndAssets();
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast.error(error.message || 'Erro ao criar perfil');
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
          featured_video: featuredVideo || null,
          gallery_urls: galleryUrls,
        })
        .eq('id', athleteToken?.id);

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
      setIsEditDialogOpen(false);
      loadProfileAndAssets();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
    }
  };

  // --- NOVA FUNÇÃO: UPLOAD DA FOTO DO ATIVO ---
  const onAssetPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        setUploadingAssetPhoto(true);
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
          toast.error('Por favor, envie apenas imagens.');
          return;
        }

        // Assumindo que você crie um bucket 'assets_images' no Supabase
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-asset-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('assets_images') // <- ATENÇÃO: Precisamos criar este bucket no painel do Supabase depois
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('assets_images').getPublicUrl(filePath);
        setNewAssetPhoto(data.publicUrl);
        toast.success('Foto do ativo carregada com sucesso!');
      } catch (error) {
        console.error('Erro no upload da foto do ativo:', error);
        toast.error('Erro ao enviar a imagem do ativo.');
      } finally {
        setUploadingAssetPhoto(false);
        e.target.value = '';
      }
    }
  };

  // --- NOVA FUNÇÃO: CRIAR NOVO ATIVO ---
  const createNewAsset = async () => {
    try {
      if (!newAssetTitle || !newAssetDescription || newAssetTokens <= 0 || newAssetPrice <= 0) {
        toast.error("Preencha título, descrição, quantidade e preço validamente.");
        return;
      }

      const marketCap = newAssetTokens * newAssetPrice;

      const { error } = await supabase
        .from('athlete_assets')
        .insert({
          athlete_id: athleteToken?.athlete_id,
          title: newAssetTitle,
          description: newAssetDescription,
          photo_url: newAssetPhoto,
          youtube_link: newAssetYoutube,
          total_tokens: newAssetTokens,
          available_tokens: newAssetTokens,
          price_per_token: newAssetPrice,
          market_cap: marketCap,
          price_change_24h: 0,
          volume_24h: 0
        });

      if (error) throw error;

      toast.success("Novo ativo gerado com sucesso!");
      setIsAssetModalOpen(false);

      // Limpar formulário do modal
      setNewAssetTitle("");
      setNewAssetDescription("");
      setNewAssetTokens(100);
      setNewAssetPrice(10);
      setNewAssetYoutube("");
      setNewAssetPhoto("");

      loadProfileAndAssets();
    } catch (error: any) {
      console.error('Erro ao criar ativo:', error);
      toast.error(error.message || "Falha ao criar o ativo");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // --- RENDERS DE ÁREAS (Perfil) ---
  const renderAvatarUploadArea = () => (
    <div className="flex flex-col gap-4">
      <Label className="text-base font-semibold">Foto de Perfil</Label>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-dashed border-border flex items-center justify-center bg-muted shrink-0 shadow-sm">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-muted-foreground opacity-50" />
          )}
          {uploadingAvatar && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            disabled={uploadingAvatar}
            className="hidden"
            ref={fileInputRef}
          />
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
              <UploadCloud className="w-4 h-4 mr-2" />
              Escolher foto
            </Button>
            <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">
              {selectedFileName ? selectedFileName : "Nenhum arquivo escolhido"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGalleryUploadArea = () => (
    <div className="flex flex-col gap-4 border-t pt-4 mt-2">
      <div>
        <Label className="text-base font-semibold">Galeria & Vídeo (Opcional)</Label>
        <p className="text-sm text-muted-foreground">Mostre mais do seu trabalho para seus investidores.</p>
      </div>
      <div>
        <Label htmlFor="featuredVideo">Link para vídeo de Destaque</Label>
        <Input id="featuredVideo" placeholder="Ex: https://www.youtube.com/watch?v=..." value={featuredVideo} onChange={(e) => setFeaturedVideo(e.target.value)} />
      </div>
      <div className="space-y-3">
        <Label>Fotos da Galeria</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {galleryUrls.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-border group">
              <img src={url} alt={`Galeria ${index}`} className="w-full h-full object-cover" />
              <button type="button" onClick={() => setGalleryUrls(prev => prev.filter((_, i) => i !== index))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {galleryUrls.length < 6 && (
            <div onClick={() => !uploadingGallery && galleryInputRef.current?.click()} className="aspect-square rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors">
              {uploadingGallery ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <><Plus className="w-6 h-6 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Adicionar foto</span></>}
            </div>
          )}
        </div>
        <input type="file" accept="image/*" className="hidden" ref={galleryInputRef} onChange={onGalleryFileChange} disabled={uploadingGallery} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* MODAL DE CORTE DE IMAGEM */}
      <Dialog open={!!imageToCrop} onOpenChange={(open) => !open && !uploadingAvatar && setImageToCrop(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cortar Foto de Perfil</DialogTitle></DialogHeader>
          <div className="relative w-full h-[300px] bg-black sm:h-[400px] rounded-md overflow-hidden">
            {imageToCrop && (
              <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            )}
          </div>
          <div className="py-4">
            <Label>Zoom</Label>
            <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full mt-2 cursor-ew-resize accent-primary" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImageToCrop(null)} disabled={uploadingAvatar}>Cancelar</Button>
            <Button onClick={handleCropConfirm} disabled={uploadingAvatar}>{uploadingAvatar ? 'Salvando...' : 'Cortar e Salvar'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* TELA DE CRIAÇÃO DO PERFIL INICIAL */}
      {!athleteToken ? (
        <Card>
          <CardHeader>
            <CardTitle>Criar Seu Perfil de Atleta</CardTitle>
            <CardDescription>Preencha seus dados para criar sua vitrine na plataforma!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="athleteName">Nome do Atleta *</Label>
                <Input id="athleteName" value={athleteName} onChange={(e) => setAthleteName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sport">Modalidade *</Label>
                <Select value={sport} onValueChange={setSport}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E-Sports">E-Sports</SelectItem>
                    <SelectItem value="Futebol">Futebol</SelectItem>
                    <SelectItem value="MMA">MMA</SelectItem>
                    <SelectItem value="Atletismo">Atletismo</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            {renderAvatarUploadArea()}
            {renderGalleryUploadArea()}

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

            <div className="border-t pt-4 mb-4">
              <h3 className="font-semibold mb-3">Redes Sociais (opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Twitter/X" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
                <Input placeholder="Instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                <Input placeholder="Twitch" value={twitch} onChange={(e) => setTwitch(e.target.value)} />
                <Input placeholder="YouTube" value={youtube} onChange={(e) => setYoutube(e.target.value)} />
              </div>
            </div>

            <Button onClick={createProfile} className="w-full" size="lg"><User className="w-4 h-4 mr-2" />Criar Perfil</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* VISÃO GERAL E EDIÇÃO DE PERFIL */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">Visão Geral do seu Mercado</h2>
              <p className="text-muted-foreground">Acompanhe e gerencie todos os seus ativos digitais abaixo.</p>
            </div>
            <Button onClick={() => setIsEditDialogOpen(true)} variant="outline">
              <Pencil className="w-4 h-4 mr-2" /> Editar Perfil
            </Button>
          </div>

          {/* LISTA DE ATIVOS DO ATLETA */}
          <Card className="mt-8">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  Meus Ativos
                </CardTitle>
                <CardDescription>Lista de todos os ativos, produtos ou NFTs que você gerou.</CardDescription>
              </div>
              <Button onClick={() => setIsAssetModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Gerar Novo Ativo
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Tokens Totais</TableHead>
                    <TableHead className="text-right">Disponíveis</TableHead>
                    <TableHead className="text-right">Vendidos</TableHead>
                    <TableHead className="text-right">Receita Total</TableHead>
                    <TableHead className="text-right">Variação (24h)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Você ainda não gerou nenhum ativo. Clique no botão acima para começar!
                      </TableCell>
                    </TableRow>
                  ) : (
                    assets.map((asset) => {
                      const soldTokens = asset.total_tokens - asset.available_tokens;
                      const revenue = soldTokens * asset.price_per_token;
                      const isPositive = asset.price_change_24h > 0;
                      const isNegative = asset.price_change_24h < 0;

                      return (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium flex items-center gap-3 py-4">
                            <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0 border">
                              {asset.photo_url ? (
                                <img src={asset.photo_url} alt={asset.title} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-6 h-6 m-3 text-muted-foreground/50" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span>{asset.title}</span>
                              <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{asset.description}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{asset.total_tokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{asset.available_tokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {soldTokens.toLocaleString()}
                            <div className="text-[10px] text-muted-foreground">
                              {((soldTokens / asset.total_tokens) * 100).toFixed(1)}%
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-500">
                            R$ {revenue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-muted-foreground'}`}>
                              {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : null}
                              {asset.price_change_24h > 0 ? '+' : ''}{asset.price_change_24h.toFixed(2)}%
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* MODAL: GERAR NOVO ATIVO */}
          <Dialog open={isAssetModalOpen} onOpenChange={setIsAssetModalOpen}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Gerar Novo Ativo</DialogTitle>
                <DialogDescription>Crie um novo produto, NFT ou cota de patrocínio para tokenizar.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">

                {/* Imagem do Ativo */}
                <div className="flex flex-col gap-2">
                  <Label>Foto do Ativo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed bg-muted flex items-center justify-center overflow-hidden">
                      {newAssetPhoto ? (
                        <img src={newAssetPhoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input type="file" accept="image/*" onChange={onAssetPhotoUpload} className="hidden" ref={assetPhotoInputRef} disabled={uploadingAssetPhoto} />
                      <Button type="button" variant="outline" onClick={() => assetPhotoInputRef.current?.click()} disabled={uploadingAssetPhoto}>
                        {uploadingAssetPhoto ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                        {uploadingAssetPhoto ? 'Enviando...' : 'Carregar Imagem'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="assetTitle">Nome / Título do Ativo *</Label>
                    <Input id="assetTitle" value={newAssetTitle} onChange={(e) => setNewAssetTitle(e.target.value)} placeholder="Ex: Cota de Viagem Campeonato 2024" />
                  </div>
                  <div>
                    <Label htmlFor="assetDesc">Descrição do Ativo *</Label>
                    <Textarea id="assetDesc" value={newAssetDescription} onChange={(e) => setNewAssetDescription(e.target.value)} placeholder="Detalhes do que representa este ativo..." rows={3} />
                  </div>
                  <div>
                    <Label htmlFor="assetYoutube">Link do YouTube (Opcional)</Label>
                    <Input id="assetYoutube" value={newAssetYoutube} onChange={(e) => setNewAssetYoutube(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <Label htmlFor="assetTokens">Quantidade de Tokens *</Label>
                    <Input id="assetTokens" type="number" min="1" value={newAssetTokens} onChange={(e) => setNewAssetTokens(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label htmlFor="assetPrice">Preço por Token (R$) *</Label>
                    <Input id="assetPrice" type="number" min="0.01" step="0.01" value={newAssetPrice} onChange={(e) => setNewAssetPrice(Number(e.target.value))} />
                  </div>
                </div>

              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssetModalOpen(false)}>Cancelar</Button>
                <Button onClick={createNewAsset}>Gerar Ativo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de Edição de Perfil */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Perfil Público</DialogTitle>
                <DialogDescription>
                  Atualize as informações que os patrocinadores verão na sua vitrine.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editAthleteName">Nome do Atleta *</Label>
                    <Input id="editAthleteName" value={athleteName} onChange={(e) => setAthleteName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="editSport">Modalidade *</Label>
                    <Select value={sport} onValueChange={setSport}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                  <Textarea id="editDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>

                {/* Renderiza as funções de upload de avatar e galeria que já existem no componente */}
                {renderAvatarUploadArea()}
                {renderGalleryUploadArea()}

                <div>
                  <Label htmlFor="editAchievements">Conquistas (uma por linha)</Label>
                  <Textarea id="editAchievements" value={achievements} onChange={(e) => setAchievements(e.target.value)} rows={3} />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Redes Sociais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Twitter/X" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
                    <Input placeholder="Instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                    <Input placeholder="Twitch" value={twitch} onChange={(e) => setTwitch(e.target.value)} />
                    <Input placeholder="YouTube" value={youtube} onChange={(e) => setYoutube(e.target.value)} />
                  </div>
                </div>

                <Button onClick={updateProfile} className="w-full mt-4">
                  Salvar Alterações
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}