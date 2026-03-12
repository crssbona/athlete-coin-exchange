import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Athlete } from "@/types/athlete";

interface VitrineCardProps {
    athlete: Athlete;
}

export const VitrineCard = ({ athlete }: VitrineCardProps) => {
    return (
        <Card className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:glow-primary flex flex-col h-full">
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

            <CardContent className="p-4 flex-grow">
                <h3 className="font-bold text-xl mb-2">{athlete.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-4">
                    {athlete.description || "Nenhuma descrição informada."}
                </p>
            </CardContent>

            <CardFooter className="p-4 pt-0 mt-auto">
                <Link to={`/vitrine-atleta/${athlete.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                        Ver perfil
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
};