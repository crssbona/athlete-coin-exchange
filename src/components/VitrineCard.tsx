import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { Athlete } from "@/types/athlete";

interface VitrineCardProps {
    athlete: Athlete;
}

export const VitrineCard = ({ athlete }: VitrineCardProps) => {
    return (
        <Card className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-300 bg-card hover:shadow-md">
            <CardContent className="p-4 sm:p-5 flex flex-row items-center sm:items-start gap-5 sm:gap-7 h-full">

                {/* 1. Imagem AINDA Maior e Redonda à Esquerda */}
                <div className="shrink-0 relative">
                    <img
                        src={athlete.avatar}
                        alt={athlete.name}
                        // Aumentámos para w-32 no mobile e w-40 no PC 👇
                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-muted group-hover:border-primary/40 transition-colors shadow-sm"
                    />
                </div>

                {/* 2. Coluna de Texto e Botão ao Lado da Foto */}
                <div className="flex-1 min-w-0 flex flex-col h-full py-1">

                    {/* Nome e Desporto */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                        <h3 className="font-bold text-xl sm:text-2xl truncate" title={athlete.name}>
                            {athlete.name}
                        </h3>
                        <Badge variant="secondary" className="w-fit text-[10px] sm:text-xs px-2 py-0.5">
                            <Trophy className="w-3 h-3 mr-1 inline-block" />
                            {athlete.sport}
                        </Badge>
                    </div>

                    {/* Descrição (com limite de linhas mantido) */}
                    <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 mb-5 leading-relaxed flex-grow">
                        {athlete.description || "Este atleta ainda não adicionou uma descrição ao perfil."}
                    </p>

                    {/* 👇 Botão LARGO (Largura Total da Descrição) 👇 */}
                    <div className="mt-auto">
                        <Link to={`/vitrine-atleta/${athlete.id}`} className="w-full">
                            <Button variant="outline" className="w-full">
                                Ver perfil
                            </Button>
                        </Link>
                    </div>

                </div>

            </CardContent>
        </Card>
    );
};