import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Asset } from "@/types/athlete";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AssetCardProps {
    asset: Asset;
}

export const AssetCard = ({ asset }: AssetCardProps) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleBuyClick = (e: React.MouseEvent) => {
        if (!user) {
            e.preventDefault();
            toast.info("Faça login ou crie uma conta para investir!");
            navigate("/auth");
        }
    };

    const soldTokens = asset.totalTokens - asset.availableTokens;
    const progressPercentage = (soldTokens / asset.totalTokens) * 100;

    return (
        <Link to={`/asset/${asset.id}`}>
            <Card className="group overflow-hidden border-border hover:border-primary transition-all duration-300">
                <CardHeader className="p-0">
                    <div className="relative h-48 bg-muted overflow-hidden flex items-center justify-center">
                        {asset.imageUrl ? (
                            <img
                                src={asset.imageUrl}
                                alt={asset.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                        )}
                        <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-primary flex items-center gap-1 border">
                            <TrendingUp className="w-3 h-3" />
                            R$ {asset.currentPrice.toFixed(2)}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                    <div>
                        <h3 className="font-bold text-lg line-clamp-1" title={asset.title}>{asset.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {asset.description}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progresso de Venda</span>
                            <span>{soldTokens} / {asset.totalTokens} cotas</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                                className="bg-primary h-1.5 rounded-full"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                    <Button variant="default" className="w-full bg-primary text-primary-foreground" onClick={handleBuyClick}>
                        Investir Agora
                    </Button>
                </CardFooter>
            </Card>
        </Link>
    );
};