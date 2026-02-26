import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight, Trophy } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Athlete } from "@/types/athlete";
import { supabase } from "@/lib/supabase";

interface AthleteCardProps {
  athlete: Athlete;
}

export const AthleteCard = ({ athlete }: AthleteCardProps) => {
  const [realPriceChange, setRealPriceChange] = useState<number>(0);

  useEffect(() => {
    const fetch24hChange = async () => {
      if (!athlete?.id || !athlete?.tokenPrice) return;

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      try {
        let { data: pastTx } = await supabase
          .from('transactions')
          .select('price')
          .eq('athlete_id', athlete.id)
          .lte('created_at', twentyFourHoursAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let oldPrice = pastTx?.price;

        if (!oldPrice) {
          const { data: firstTx24h } = await supabase
            .from('transactions')
            .select('price')
            .eq('athlete_id', athlete.id)
            .gte('created_at', twentyFourHoursAgo)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          oldPrice = firstTx24h?.price;
        }

        if (oldPrice && oldPrice > 0) {
          const change = ((athlete.tokenPrice - oldPrice) / oldPrice) * 100;
          setRealPriceChange(change);
        } else {
          setRealPriceChange(0);
        }
      } catch (error) {
        console.error("Erro ao calcular variação de 24h para", athlete.name, error);
      }
    };

    fetch24hChange();
  }, [athlete.id, athlete.tokenPrice]);

  const isPositive = realPriceChange > 0;
  const isNegative = realPriceChange < 0;

  return (
    <Link to={`/athlete/${athlete.id}`}>
      <Card className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:glow-primary">
        <CardHeader className="p-0">
          <div className="relative h-48 overflow-hidden">
            <img
              src={athlete.avatar}
              alt={athlete.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            <Badge className="absolute top-3 right-3 bg-secondary/80 backdrop-blur-sm border-border">
              <Trophy className="w-3 h-3 mr-1" />
              {athlete.sport}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-lg mb-1">{athlete.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {athlete.description}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Preço do Token</p>
              <p className="text-2xl font-bold">
                ${athlete.tokenPrice.toFixed(2)}
              </p>
            </div>
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' :
              isNegative ? 'text-red-500' :
                'text-muted-foreground'
              }`}>
              {isPositive ? (
                <TrendingUp className="w-5 h-5" />
              ) : isNegative ? (
                <TrendingDown className="w-5 h-5" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {isPositive ? '+' : ''}{realPriceChange.toFixed(2)}%
              </span>
              <span className="text-[10px] opacity-70 ml-0.5 mt-1 font-normal">24h</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Disponíveis</p>
              <p className="font-semibold">{athlete.availableTokens.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Vol. 24h</p>
              <p className="font-semibold">${(athlete.volume24h / 1000).toFixed(0)}k</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2">
          <Button variant="buy" size="sm" className="w-full">
            Comprar
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            Ver Perfil
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};
