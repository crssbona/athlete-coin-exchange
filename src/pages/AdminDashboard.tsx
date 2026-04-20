import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Search, DollarSign, ShieldCheck, ArrowLeft, Landmark, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // ESTADOS FINANCEIROS DA PLATAFORMA
    const [platformBalance, setPlatformBalance] = useState(0);
    const [processing, setProcessing] = useState(false);

    // ESTADOS DE SAQUE ADMIN
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [pixKey, setPixKey] = useState("");
    const [pixKeyType, setPixKeyType] = useState("CPF");
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate("/");
            return;
        }
        loadAdminData();
    }, [user, authLoading, navigate]);

    const loadAdminData = async () => {
        try {
            setLoading(true);

            // 1. Verifica se o usuário é admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user?.id)
                .single();

            if (!profile?.is_admin) {
                toast.error("Acesso negado.");
                navigate("/");
                return;
            }

            // 2. Busca o lucro arrecadado da plataforma
            const { data: settings } = await supabase
                .from('platform_settings')
                .select('treasury_balance')
                .single();

            setPlatformBalance(settings?.treasury_balance || 0);

            // 3. Busca lista de usuários e saldos
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id, name, document, phone,
                    wallets (balance)
                `);

            if (error) throw error;
            setUsersList(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados do painel.");
        } finally {
            setLoading(false);
        }
    };

    const handlePlatformWithdrawal = async () => {
        const amount = parseFloat(withdrawAmount);

        if (!amount || amount < 5) {
            toast.error("O valor mínimo para saque é de R$ 5,00.");
            return;
        }
        if (amount > platformBalance) {
            toast.error("Saldo de lucro insuficiente.");
            return;
        }

        setProcessing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mwumwryacppddvfwulok.supabase.co';

            // Chamamos a mesma lógica de saque via Edge Function
            const response = await fetch(`${supabaseUrl}/functions/v1/create-withdrawal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    amount: amount,
                    pixKey: pixKey,
                    pixKeyType: pixKeyType,
                    isPlatformWithdrawal: true // Sinalizamos que o débito deve ser na tesouraria
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Saque de lucro solicitado com sucesso!");
                setIsWithdrawOpen(false);
                setWithdrawAmount("");
                setPixKey("");
                loadAdminData(); // Recarrega os saldos
            } else {
                toast.error(result.message || "Erro ao solicitar saque.");
            }
        } catch (error) {
            toast.error("Erro de conexão ao processar saque.");
        } finally {
            setProcessing(false);
        }
    };

    const filteredUsers = usersList.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.document?.includes(searchTerm)
    );

    if (loading) return <div className="flex h-screen items-center justify-center">A carregar painel...</div>;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Button variant="ghost" onClick={() => navigate("/")} className="mb-2 pl-0">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o site
                        </Button>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <ShieldCheck className="text-primary" /> Painel Administrativo
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome ou CPF..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* PLACAR FINANCEIRO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total em Carteiras (Clientes)</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-muted-foreground">
                                R$ {usersList.reduce((acc, curr) => acc + (curr.wallets?.[0]?.balance || 0), 0).toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">Soma de todo o saldo virtual dos utilizadores</p>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/50 bg-primary/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Lucro Arrecadado (Taxas)</CardTitle>
                            <Landmark className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent className="flex justify-between items-end">
                            <div>
                                <div className="text-3xl font-bold text-primary">
                                    R$ {platformBalance.toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">Valor disponível para os sócios</p>
                            </div>

                            {/* MODAL DE SAQUE ADMINISTRATIVO */}
                            <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="default">Sacar Lucro</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Sacar Lucro da Plataforma</DialogTitle>
                                        <DialogDescription>
                                            O valor será debitado do saldo de taxas e enviado via PIX.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Valor do Saque (R$)</Label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tipo de Chave PIX</Label>
                                            <Select value={pixKeyType} onValueChange={setPixKeyType}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CPF">CPF</SelectItem>
                                                    <SelectItem value="EMAIL">E-mail</SelectItem>
                                                    <SelectItem value="PHONE">Telefone</SelectItem>
                                                    <SelectItem value="EVP">Chave Aleatória</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Chave PIX</Label>
                                            <Input
                                                placeholder="Sua chave aqui"
                                                value={pixKey}
                                                onChange={(e) => setPixKey(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            className="w-full"
                                            onClick={handlePlatformWithdrawal}
                                            disabled={processing}
                                        >
                                            {processing ? <Loader2 className="animate-spin mr-2" /> : "Confirmar Saque PIX"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" /> Usuários Ativos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>CPF</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Saldo em Conta</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium">{u.name || "Sem nome"}</TableCell>
                                        <TableCell>{u.document || "---"}</TableCell>
                                        <TableCell>{u.phone || "---"}</TableCell>
                                        <TableCell>R$ {u.wallets?.[0]?.balance?.toFixed(2) || "0,00"}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => toast.info("Ver detalhes (Fase 2)")}>
                                                Ver Ficha
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}