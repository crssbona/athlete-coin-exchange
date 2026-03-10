// src/types/athlete.ts

// 1. O Perfil do Atleta (Storefront)
// Removemos as informações de tokens/preço daqui. Ele é apenas o "Criador".
export interface Athlete {
  id: string; // ID do usuário (auth.users)
  name: string;
  sport: string;
  avatar: string;
  description: string;
  achievements: string[];
  featuredVideo?: string; // Vídeo de destaque do perfil
  galleryUrls?: string[];
  socialMedia: {
    twitter?: string;
    instagram?: string;
    twitch?: string;
    youtube?: string;
  };
}

// 2. O Novo Ativo (O que realmente é comprado/vendido)
export interface Asset {
  id: string;
  athleteId: string; // Relacionamento: quem criou este ativo
  title: string; // Ex: "Treino para as Olimpíadas"
  description: string;
  imageUrl: string; // Imagem armazenada no Supabase Bucket
  youtubeUrl: string; // O link do vídeo principal do ativo

  // Dados Financeiros do Ativo
  totalTokens: number; // Quantidade total criada
  availableTokens: number; // Quantos ainda estão disponíveis
  initialPrice: number; // Preço de lançamento
  currentPrice: number; // Preço atualizado pelo mercado
  priceChange: number; // Variação em %
  marketCap: number;
  volume24h: number;

  createdAt: Date;
}

// 3. Transações (Agora apontam para o Ativo, não mais para o Atleta)
export interface Transaction {
  id: string;
  assetId: string; // Mudou de athleteId para assetId
  userId: string; // Quem comprou/vendeu
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: Date;
}