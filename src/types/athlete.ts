export interface Athlete {
  id: string;
  name: string;
  sport: string;
  avatar: string;
  tokenPrice: number;
  priceChange: number;
  totalTokens: number;
  availableTokens: number;
  marketCap: number;
  volume24h: number;
  description: string;
  achievements: string[];
  socialMedia: {
    twitter?: string;
    instagram?: string;
    twitch?: string;
    youtube?: string;
  };
}

export interface Transaction {
  id: string;
  athleteId: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: Date;
}
