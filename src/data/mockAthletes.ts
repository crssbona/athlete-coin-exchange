import { Athlete } from "@/types/athlete";

export const mockAthletes: Athlete[] = [
  {
    id: "1",
    name: "Lucas 'Thunder' Silva",
    sport: "E-Sports - Valorant",
    avatar: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop",
    tokenPrice: 125.50,
    priceChange: 12.5,
    totalTokens: 10000,
    availableTokens: 3500,
    marketCap: 1255000,
    volume24h: 45000,
    description: "Campeão regional de Valorant com mais de 3 anos de experiência competitiva. Especialista em IGL e estratégia.",
    achievements: [
      "Campeão Regional VCT 2023",
      "Top 5 América Latina",
      "MVP Torneio Masters"
    ],
    socialMedia: {
      twitter: "thunder_val",
      twitch: "thundergaming",
      instagram: "lucas.thunder"
    }
  },
  {
    id: "2",
    name: "Marina 'Phoenix' Costa",
    sport: "E-Sports - League of Legends",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    tokenPrice: 89.20,
    priceChange: -3.2,
    totalTokens: 15000,
    availableTokens: 5200,
    marketCap: 1338000,
    volume24h: 32000,
    description: "Pro player de League of Legends, especialista em mid lane. Conhecida por suas plays mecânicas excepcionais.",
    achievements: [
      "Challenger BR",
      "Finalista CBLOL 2023",
      "Melhor Mid Laner do Split"
    ],
    socialMedia: {
      twitter: "phoenix_lol",
      twitch: "phoenixlol",
      instagram: "marina.phoenix"
    }
  },
  {
    id: "3",
    name: "Rafael 'Speed' Oliveira",
    sport: "Atletismo - 100m",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    tokenPrice: 210.00,
    priceChange: 8.7,
    totalTokens: 5000,
    availableTokens: 800,
    marketCap: 1050000,
    volume24h: 78000,
    description: "Velocista profissional com recordes nacionais. Em preparação para as próximas olimpíadas.",
    achievements: [
      "Recorde Sul-Americano Sub-23",
      "Medalha de Ouro Pan-Americano",
      "Top 20 Mundial"
    ],
    socialMedia: {
      instagram: "rafael.speed",
      twitter: "speedoliveira"
    }
  },
  {
    id: "4",
    name: "Carla 'Ace' Mendes",
    sport: "E-Sports - CS:GO",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    tokenPrice: 156.75,
    priceChange: 15.3,
    totalTokens: 8000,
    availableTokens: 2100,
    marketCap: 1254000,
    volume24h: 92000,
    description: "AWPer profissional com aim excepcional. Uma das poucas mulheres em times tier 1 masculinos.",
    achievements: [
      "Top 3 Brasil CS:GO",
      "Clutch Master IEM",
      "MVP Blast Premier"
    ],
    socialMedia: {
      twitter: "ace_csgo",
      twitch: "acecarla",
      instagram: "carla.ace"
    }
  },
  {
    id: "5",
    name: "Diego 'Tornado' Santos",
    sport: "Futebol",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    tokenPrice: 95.40,
    priceChange: 5.1,
    totalTokens: 20000,
    availableTokens: 12000,
    marketCap: 1908000,
    volume24h: 54000,
    description: "Promessa do futebol brasileiro, atacante com passes para Europa. Sub-20 da seleção.",
    achievements: [
      "Artilheiro Campeonato Sub-20",
      "Convocação Seleção Brasileira",
      "Melhor Jogador Jovem do Ano"
    ],
    socialMedia: {
      instagram: "diego.tornado",
      twitter: "tornado10"
    }
  },
  {
    id: "6",
    name: "Amanda 'Striker' Lima",
    sport: "MMA",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    tokenPrice: 178.90,
    priceChange: -1.8,
    totalTokens: 6000,
    availableTokens: 1500,
    marketCap: 1073400,
    volume24h: 41000,
    description: "Lutadora de MMA invicta na categoria peso-pena. Finalização excepcional e striking preciso.",
    achievements: [
      "Campeã Regional MMA",
      "10-0 Carreira Invicta",
      "Finalização da Noite UFC"
    ],
    socialMedia: {
      instagram: "amanda.striker",
      twitter: "striker_mma"
    }
  }
];
