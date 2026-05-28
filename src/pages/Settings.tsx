import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Settings as SettingsIcon, Share2, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
    const { user } = useAuth();
    const [invites, setInvites] = useState<any[]>([]);
    const [loadingInvites, setLoadingInvites] = useState(true);

    // 👇 BUSCA OS CONVITES DO UTILIZADOR NA BASE DE DADOS
    useEffect(() => {
        if (!user?.id) return;

        const fetchInvites = async () => {
            try {
                const { data, error } = await supabase
                    .from('invite_codes')
                    .select('*')
                    .eq('owner_id', user.id)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                if (data) setInvites(data);
            } catch (error) {
                console.error("Erro ao procurar convites:", error);
            } finally {
                setLoadingInvites(false);
            }
        };

        fetchInvites();
    }, [user?.id]);

    const handleCopyId = () => {
        if (user?.id) {
            navigator.clipboard.writeText(user.id);
            toast.success("ID de suporte copiado para a área de transferência!");
        }
    };

    const handleCopyInvite = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success("Código de convite copiado!", {
            description: "Envie este código para o seu amigo se registar."
        });
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
                        Faça a gestão das informações da sua conta e preferências do sistema.
                    </p>
                </div>

                <div className="grid gap-6">
                    {/* 👇 NOVO: CARTÃO DE CONVITES VIP */}
                    <Card className="border-primary/20 shadow-sm">
                        <CardHeader className="bg-muted/30 border-b pb-4">
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <Share2 className="w-5 h-5" /> Seus Convites VIP
                            </CardTitle>
                            <CardDescription>
                                Convide os seus amigos para a plataforma. Cada utilizador recebe 3 convites exclusivos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {loadingInvites ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : invites.length === 0 ? (
                                <div className="text-center p-6 border border-dashed rounded-lg">
                                    <Ticket className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        Nenhum convite gerado para esta conta.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {invites.map((invite) => (
                                        <div
                                            key={invite.id}
                                            className={`flex flex-col justify-between p-4 border rounded-xl relative overflow-hidden transition-all ${invite.status === 'available'
                                                    ? 'bg-card border-primary/30 shadow-sm hover:border-primary/60'
                                                    : 'bg-muted/50 border-muted opacity-70'
                                                }`}
                                        >
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <Badge
                                                        variant={invite.status === 'available' ? 'default' : 'secondary'}
                                                        className={invite.status === 'available' ? 'bg-green-500 hover:bg-green-600' : ''}
                                                    >
                                                        {invite.status === 'available' ? 'Disponível' : 'Utilizado'}
                                                    </Badge>
                                                </div>
                                                <p className={`font-mono font-bold text-xl tracking-wider ${invite.status !== 'available' && 'line-through text-muted-foreground'}`}>
                                                    {invite.code}
                                                </p>
                                            </div>

                                            <Button
                                                variant={invite.status === 'available' ? 'default' : 'outline'}
                                                className="w-full"
                                                disabled={invite.status !== 'available'}
                                                onClick={() => handleCopyInvite(invite.code)}
                                            >
                                                <Copy className="h-4 w-4 mr-2" />
                                                {invite.status === 'available' ? 'Copiar Código' : 'Já Resgatado'}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Cartão Original de ID do Utilizador */}
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
                                        value={user?.id || "A carregar..."}
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
                </div>
            </main>
        </div>
    );
}