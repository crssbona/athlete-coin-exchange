import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { Athlete } from "@/types/athlete";
import { CosmicAvatar } from "@/components/CosmicAvatar";

interface VitrineCardProps {
    athlete: Athlete;
}

export const VitrineCard = ({ athlete }: VitrineCardProps) => {
    return (
        <Card className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-300 bg-card hover:shadow-md h-full">
            <CardContent className="p-4 sm:p-5 flex flex-row items-start gap-5 sm:gap-7 h-full">

                {/* 1. Imagem Redonda à Esquerda (COM ANIMAÇÃO CÓSMICA SE VERIFICADO) */}
                <div className="shrink-0 relative">
                    <CosmicAvatar
                        src={athlete.avatar}
                        verified={athlete.isVerified}
                        className="w-32 h-32 sm:w-40 sm:h-40"
                    />
                </div>

                {/* 2. Coluna de Texto e Botão ao Lado da Foto */}
                <div className="flex-1 min-w-0 flex flex-col h-full py-1">

                    {/* Nome e Badges */}
                    <div className="flex flex-col gap-2 mb-3">
                        {/* Nome do Atleta */}
                        <h3 className="font-bold text-xl sm:text-2xl line-clamp-2 leading-tight" title={athlete.name}>
                            {athlete.name}
                        </h3>

                        {/* Container Flexível para os Crachás (Badges) */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Badge Padrão: Modalidade de Esporte */}
                            <Badge variant="secondary" className="w-fit text-[10px] sm:text-xs px-2 py-0.5">
                                <Trophy className="w-3 h-3 mr-1 inline-block" />
                                {athlete.sport}
                            </Badge>

                            {/* Badge Condicional: Apenas para Perfis Verificados */}
                            {athlete.isVerified && (
                                <Badge className="w-fit text-[10px] sm:text-xs px-2 py-0.5 bg-[#a62681] hover:bg-[#861d67] text-white border-transparent">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1 inline-block">
                                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                    </svg>
                                    Perfil Verificado
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Descrição */}
                    <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 mb-5 leading-relaxed flex-grow">
                        {athlete.description || "Este atleta ainda não adicionou uma descrição ao perfil."}
                    </p>

                    {/* Botão LARGO */}
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