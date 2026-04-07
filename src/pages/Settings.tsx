import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
    const { user } = useAuth();

    const handleCopyId = () => {
        if (user?.id) {
            navigator.clipboard.writeText(user.id);
            toast.success("ID de suporte copiado para a área de transferência!");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="container max-w-4xl mx-auto px-4 py-8 mt-16">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-primary" />
                        Configurações
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie as informações da sua conta e preferências do sistema.
                    </p>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Técnicas</CardTitle>
                            <CardDescription>
                                Dados da sua conta na plataforma.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 max-w-lg">
                                <Label htmlFor="userId">Seu ID de Suporte (UUID)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="userId"
                                        value={user?.id || "Carregando..."}
                                        readOnly
                                        className="font-mono text-muted-foreground bg-muted/50 cursor-default"
                                    />
                                    <Button
                                        variant="secondary"
                                        onClick={handleCopyId}
                                        disabled={!user?.id}
                                        className="shrink-0"
                                        title="Copiar ID"
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copiar
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Forneça este código ao atendimento caso precise de ajuda. Ele é a chave pública de identificação da sua conta.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pode adicionar mais cartões no futuro aqui (Ex: Mudar Senha, Notificações, etc.) */}
                </div>
            </main>
        </div>
    );
}