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
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Users, Search, DollarSign, ShieldCheck, ArrowLeft, Landmark,
    Loader2, Copy, History, Wallet, AlertTriangle, ArrowDownRight, ArrowUpRight, Coins, Image as ImageIcon, Clock
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [platformBalance, setPlatformBalance] = useState(0);
    const [totalInvested, setTotalInvested] = useState(0);
    const [processing, setProcessing] = useState(false);

    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [pixKey, setPixKey] = useState("");
    const [pixKeyType, setPixKeyType] = useState("CPF");
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    const [approveDialogTx, setApproveDialogTx] = useState<any>(null);
    const [rejectDialogTxId, setRejectDialogTxId] = useState<string | null>(null);

    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [userDetailsLoading, setUserDetailsLoading] = useState(false);
    const [userTransactions, setUserTransactions] = useState<any[]>([]);
    const [userEmittedTokens, setUserEmittedTokens] = useState<any[]>([]);
    const [userPortfolio, setUserPortfolio] = useState<any[]>([]);

    const [adjustAmount, setAdjustAmount] = useState("");
    const [adjustType, setAdjustType] = useState("credit");
    const [adjustReason, setAdjustReason] = useState("");

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

            const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user?.id).single();
            if (!profile?.is_admin) {
                toast.error("Acesso negado.");
                navigate("/");
                return;
            }

            const { data: settings } = await supabase.from('platform_settings').select('treasury_balance').single();
            setPlatformBalance(settings?.treasury_balance || 0);

            // 👇 ADICIONADO: is_verified no select
            const { data, error } = await supabase.from('profiles').select(`
                id, name, document, phone, is_blocked, is_verified,
                wallets (balance)
            `);

            if (error) throw error;
            setUsersList(data || []);

            const { data: assetsData, error: assetsError } = await supabase
                .from('user_asset_tokens')
                .select(`
                    quantity,
                    athlete_assets ( price_per_token )
                `);

            if (!assetsError && assetsData) {
                const totalInvestedCalc = assetsData.reduce((acc, curr: any) => {
                    const price = curr.athlete_assets?.price_per_token || 0;
                    return acc + (Number(curr.quantity) * Number(price));
                }, 0);
                setTotalInvested(totalInvestedCalc);
            }

            const { data: withdrawalsData } = await supabase
                .from('fiat_transactions')
                .select(`
                    id, amount, created_at, pix_key, pix_type, status,
                    user_id,
                    profiles ( name, document, phone )
                `)
                .eq('type', 'withdraw')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            setPendingWithdrawals(withdrawalsData || []);

        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados do painel.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (userId: string) => {
        setUserDetailsLoading(true);
        try {
            const { data: txData } = await supabase
                .from('fiat_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            setUserTransactions(txData || []);

            try {
                const { data: athleteProfile } = await supabase
                    .from('athlete_tokens')
                    .select('athlete_id')
                    .eq('user_id', userId)
                    .single();

                if (athleteProfile?.athlete_id) {
                    const { data: emittedData } = await supabase
                        .from('athlete_assets')
                        .select('*')
                        .eq('athlete_id', athleteProfile.athlete_id);

                    setUserEmittedTokens(emittedData || []);
                } else {
                    setUserEmittedTokens([]);
                }

                const { data: portfolioData } = await supabase
                    .from('user_asset_tokens')
                    .select(`
                        quantity,
                        average_purchase_price,
                        athlete_assets ( title, price_per_token, photo_url )
                    `)
                    .eq('user_id', userId);
                setUserPortfolio(portfolioData || []);
            } catch (e) {
                console.log("Erro ao buscar dados do portfólio:", e);
            }

        } catch (error) {
            console.error("Erro ao buscar detalhes:", error);
            toast.error("Alguns detalhes podem não ter sido carregados.");
        } finally {
            setUserDetailsLoading(false);
        }
    };

    const openUserProfile = (userData: any) => {
        setSelectedUser(userData);
        setIsSheetOpen(true);
        fetchUserDetails(userData.id);
    };

    const handleManualAdjustment = async () => {
        if (!adjustAmount || Number(adjustAmount) <= 0 || !adjustReason) {
            toast.error("Preencha o valor e o motivo.");
            return;
        }

        const amount = Number(adjustAmount);
        const isCredit = adjustType === "credit";
        const txType = isCredit ? 'deposit' : 'withdraw';

        setProcessing(true);
        try {
            const { data: walletData, error: walletError } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', selectedUser.id)
                .maybeSingle();

            if (walletError) throw walletError;

            const currentBalance = walletData ? Number(walletData.balance) : 0;
            const newBalance = isCredit ? currentBalance + amount : currentBalance - amount;

            const { error: updateError } = await supabase
                .from('wallets')
                .upsert({
                    user_id: selectedUser.id,
                    balance: newBalance
                }, { onConflict: 'user_id' });

            if (updateError) throw updateError;

            const { error: txError } = await supabase
                .from('fiat_transactions')
                .insert({
                    user_id: selectedUser.id,
                    type: txType,
                    amount: isCredit ? amount : -amount,
                    status: 'completed',
                    description: adjustReason
                });

            if (txError) throw txError;

            toast.success(`${isCredit ? 'Crédito' : 'Débito'} de R$ ${amount.toFixed(2)} aplicado com sucesso.`);
            setAdjustAmount("");
            setAdjustReason("");

            loadAdminData();
            fetchUserDetails(selectedUser.id);

            setSelectedUser({
                ...selectedUser,
                wallets: { balance: newBalance }
            });

        } catch (error) {
            console.error("Erro completo:", error);
            toast.error("Erro ao ajustar saldo. Verifique o console.");
        } finally {
            setProcessing(false);
        }
    };

    const handleToggleBlock = async () => {
        const newStatus = !!!selectedUser.is_blocked;

        setProcessing(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({ is_blocked: newStatus })
                .eq('id', selectedUser.id)
                .select();

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error("A atualização foi rejeitada pelas políticas de segurança do banco (RLS).");
            }

            toast.success(newStatus ? "Conta bloqueada com sucesso." : "Conta desbloqueada com sucesso.");

            setSelectedUser({ ...selectedUser, is_blocked: newStatus });
            loadAdminData();

        } catch (error: any) {
            console.error("Catch error handleToggleBlock:", error);
            toast.error(error.message || "Erro ao alterar o status da conta. Verifique o console.");
        } finally {
            setProcessing(false);
        }
    };

    // 👇 NOVA FUNÇÃO: Toggle para verificação manual do perfil
    const handleToggleVerify = async () => {
        const newStatus = !!!selectedUser.is_verified;

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_verified: newStatus })
                .eq('id', selectedUser.id);

            if (error) throw error;

            toast.success(newStatus ? "Perfil verificado com sucesso!" : "Selo de verificação removido.");

            setSelectedUser({ ...selectedUser, is_verified: newStatus });
            loadAdminData(); // Atualiza a tabela no fundo

        } catch (error: any) {
            console.error("Erro ao verificar:", error);
            toast.error("Erro ao alterar verificação do perfil.");
        } finally {
            setProcessing(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado para a área de transferência!");
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(dateString));
    };

    const filteredUsers = usersList.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.document?.includes(searchTerm) ||
        u.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRejectWithdrawal = async () => {
        if (!rejectDialogTxId) return;

        setProcessing(true);
        try {
            const { error } = await supabase.rpc('reject_withdrawal', { p_tx_id: rejectDialogTxId });
            if (error) throw error;

            toast.success("Saque rejeitado. O saldo foi devolvido ao usuário.");
            setRejectDialogTxId(null);
            loadAdminData();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao rejeitar saque.");
        } finally {
            setProcessing(false);
        }
    };

    const handleApproveWithdrawal = async () => {
        if (!approveDialogTx) return;

        setProcessing(true);
        try {
            const { data, error } = await supabase.functions.invoke('process-admin-withdrawal', {
                body: {
                    txId: approveDialogTx.id,
                    amount: Math.abs(approveDialogTx.amount),
                    pixKey: approveDialogTx.pix_key,
                    pixKeyType: approveDialogTx.pix_type
                }
            });

            if (error) throw new Error("Falha na comunicação com o servidor de pagamentos.");
            if (!data?.success) throw new Error(data?.message || "Erro desconhecido na API do Asaas.");

            toast.success("Saque aprovado e transferido via PIX com sucesso!");
            setApproveDialogTx(null);
            loadAdminData();

        } catch (error: any) {
            console.error("Erro na aprovação:", error);
            toast.error(error.message || "Erro ao processar a aprovação do saque.");
        } finally {
            setProcessing(false);
        }
    };

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
                                placeholder="Buscar nome, CPF ou UUID..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total em Carteiras (Livre)</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-muted-foreground">
                                R$ {usersList.reduce((acc, curr) => acc + (curr.wallets?.balance ?? curr.wallets?.[0]?.balance ?? 0), 0).toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Investido (Em Ativos)</CardTitle>
                            <Coins className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-500">
                                R$ {totalInvested.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Valor alocado em tokens
                            </p>
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
                            </div>
                            <Button size="sm" variant="default" onClick={() => setIsWithdrawOpen(true)}>Sacar Lucro</Button>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="users" className="w-full">
                    <TabsList className="grid w-full md:w-[600px] grid-cols-2 mb-6">
                        <TabsTrigger value="users">
                            Usuários Ativos
                        </TabsTrigger>
                        <TabsTrigger value="withdrawals" className="relative">
                            Solicitações de Saque
                            {pendingWithdrawals.length > 0 && (
                                <Badge variant="destructive" className="ml-2 h-5 text-[10px]">{pendingWithdrawals.length}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users">
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
                                            <TableHead className="w-[100px]">ID</TableHead>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>CPF</TableHead>
                                            <TableHead>Telefone</TableHead>
                                            <TableHead>Saldo Livre</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="font-mono text-xs bg-muted/50 text-muted-foreground hover:bg-muted/80 transition-colors px-2 py-1 rounded cursor-help">
                                                                    {u.id?.substring(0, 8)}...
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                <p className="font-mono text-sm">{u.id}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                {/* 👇 ADICIONADO: Ícone de Verificado na Tabela de Usuários */}
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    {u.name || "Sem nome"}
                                                    {u.is_verified && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#a62681]">
                                                            <title>Verificado</title>
                                                            <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                    {u.is_blocked && (
                                                        <Badge variant="destructive" className="ml-2 text-[10px] h-5 px-1.5">Bloqueado</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>{u.document || "---"}</TableCell>
                                                <TableCell>{u.phone || "---"}</TableCell>
                                                <TableCell>R$ {(u.wallets?.balance ?? u.wallets?.[0]?.balance ?? 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => openUserProfile(u)}>
                                                        Ver Ficha
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="withdrawals">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl text-amber-500 flex items-center gap-2">
                                    <Clock className="w-5 h-5" /> Saques Aguardando Aprovação
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {pendingWithdrawals.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">Nenhuma solicitação de saque pendente.</div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Usuário</TableHead>
                                                <TableHead>Chave PIX</TableHead>
                                                <TableHead>Data</TableHead>
                                                <TableHead className="text-right">Valor</TableHead>
                                                <TableHead className="text-center">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingWithdrawals.map((tx) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell>
                                                        <p className="font-medium">{tx.profiles?.name || 'Desconhecido'}</p>
                                                        <p className="text-xs text-muted-foreground">Doc: {tx.profiles?.document}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="font-mono text-sm">{tx.pix_key}</p>
                                                        <Badge variant="secondary" className="text-[10px] mt-1">{tx.pix_type}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{formatDate(tx.created_at)}</TableCell>
                                                    <TableCell className="text-right font-bold text-red-500">
                                                        R$ {Math.abs(tx.amount).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={processing} onClick={() => setApproveDialogTx(tx)}>
                                                                Aprovar
                                                            </Button>
                                                            <Button size="sm" variant="destructive" disabled={processing} onClick={() => setRejectDialogTxId(tx.id)}>
                                                                Rejeitar
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                        {selectedUser && (
                            <>
                                <SheetHeader className="mb-6">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-3">
                                            {/* 👇 ADICIONADO: Ícone de Verificado no Título da Ficha */}
                                            <SheetTitle className="text-2xl flex items-center gap-2">
                                                {selectedUser.name || "Usuário sem nome"}
                                                {selectedUser.is_verified && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#a62681]">
                                                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </SheetTitle>

                                            {selectedUser.is_blocked ? (
                                                <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 shadow-sm">
                                                    Conta Bloqueada
                                                </Badge>
                                            ) : (
                                                <Badge variant="default" className="bg-green-500 hover:bg-green-600 shadow-sm">
                                                    Conta Ativa
                                                </Badge>
                                            )}
                                        </div>

                                        <SheetDescription className="flex items-center gap-2 mt-2">
                                            <span className="font-mono text-xs">{selectedUser.id}</span>
                                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(selectedUser.id)}>
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </SheetDescription>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground block text-xs">CPF</span>
                                            <span className="font-medium">{selectedUser.document || "Não informado"}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-xs">Telefone</span>
                                            <span className="font-medium">{selectedUser.phone || "Não informado"}</span>
                                        </div>
                                    </div>
                                </SheetHeader>

                                <Tabs defaultValue="overview" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                                        <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
                                        <TabsTrigger value="actions">Ações de Risco</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="space-y-4 mt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card>
                                                <CardContent className="p-4 flex flex-col justify-center">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" /> Saldo Livre</span>
                                                    <span className="text-2xl font-bold mt-1">R$ {(selectedUser.wallets?.balance ?? selectedUser.wallets?.[0]?.balance ?? 0).toFixed(2)}</span>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="p-4 flex flex-col justify-center">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <History className="h-3 w-3" /> Em Ativos
                                                    </span>
                                                    <span className="text-2xl font-bold mt-1">
                                                        R$ {userPortfolio.reduce((acc, item) => {
                                                            const precoAtual = item.athlete_assets?.price_per_token || 0;
                                                            return acc + (Number(item.quantity || 0) * Number(precoAtual));
                                                        }, 0).toFixed(2)}
                                                    </span>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-semibold mb-3">Últimas Transações</h3>
                                            <ScrollArea className="h-[250px] w-full rounded-md border p-4">
                                                {userDetailsLoading ? (
                                                    <div className="flex justify-center items-center h-full"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                                                ) : userTransactions.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {userTransactions.map((tx) => {
                                                            const isCredit = tx.amount > 0 || tx.type === 'deposit';
                                                            return (
                                                                <div key={tx.id}>
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`${isCredit ? 'bg-green-500/20' : 'bg-red-500/20'} p-2 rounded-full`}>
                                                                                {isCredit ? <ArrowDownRight className="h-4 w-4 text-green-500" /> : <ArrowUpRight className="h-4 w-4 text-red-500" />}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-medium capitalize">
                                                                                    {tx.type === 'deposit' ? 'Crédito / Depósito' : 'Débito / Saque'}
                                                                                </p>
                                                                                {tx.description && (
                                                                                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                                                                                        Motivo: {tx.description}
                                                                                    </p>
                                                                                )}
                                                                                <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                                                                            </div>
                                                                        </div>
                                                                        <span className={`text-sm font-bold ${isCredit ? 'text-green-500' : 'text-foreground'}`}>
                                                                            {isCredit ? '+ ' : '- '}R$ {Math.abs(tx.amount).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                    <Separator className="my-3" />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-sm text-muted-foreground pt-4">Nenhuma transação encontrada.</div>
                                                )}
                                            </ScrollArea>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="portfolio" className="space-y-4 mt-4">
                                        <Card className="border-primary/20 shadow-sm">
                                            <CardHeader className="pb-3 border-b bg-muted/20">
                                                <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
                                                    <Coins className="h-4 w-4" /> Tokens Emitidos
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-4">
                                                {userDetailsLoading ? (
                                                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                                                ) : userEmittedTokens.length > 0 ? (
                                                    <ul className="space-y-3">
                                                        {userEmittedTokens.map(token => (
                                                            <li key={token.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                                                <div className="flex items-center gap-4">
                                                                    {token.photo_url ? (
                                                                        <img src={token.photo_url} alt="Capa do Ativo" className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-sm" />
                                                                    ) : (
                                                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
                                                                            <Coins className="w-6 h-6" />
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="font-bold text-base leading-none mb-1">{token.title || "Ativo sem título"}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Disp: <span className="font-medium text-foreground">{token.available_tokens ?? 0}</span> / {token.total_tokens ?? 0}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-primary text-base leading-none mb-1">R$ {Number(token.price_per_token || 0).toFixed(2)}</p>
                                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Valor Unitário</p>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="text-center py-6 text-muted-foreground">
                                                        <Coins className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                        <p className="text-sm">O usuário não gerou seus próprios tokens.</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card className="shadow-sm">
                                            <CardHeader className="pb-3 border-b">
                                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                    <Wallet className="h-4 w-4 text-muted-foreground" /> Inventário na Carteira
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-4">
                                                {userDetailsLoading ? (
                                                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                                                ) : userPortfolio.length > 0 ? (
                                                    <ul className="space-y-3">
                                                        {userPortfolio.map(item => (
                                                            <li key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                                                <div className="flex items-center gap-4">
                                                                    {item.athlete_assets?.photo_url ? (
                                                                        <img src={item.athlete_assets.photo_url} alt="Capa" className="w-10 h-10 rounded-md object-cover border shadow-sm" />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground border">
                                                                            <ImageIcon className="w-5 h-5" />
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="font-semibold text-sm leading-none mb-2">{item.athlete_assets?.title || "Ativo Desconhecido"}</p>
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">Qtd: {item.quantity ?? 0}</Badge>
                                                                            <span className="text-[11px] text-muted-foreground">Preço Médio: R$ {Number(item.average_purchase_price || 0).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-foreground text-sm leading-none mb-1">
                                                                        R$ {(Number(item.quantity || 0) * Number(item.athlete_assets?.price_per_token || 0)).toFixed(2)}
                                                                    </p>
                                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Atual</p>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="text-center py-6 text-muted-foreground">
                                                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                        <p className="text-sm">O usuário não possui ativos de outros atletas.</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="actions" className="space-y-4 mt-4">
                                        {/* 👇 ADICIONADO: Card de Verificação de Perfil */}
                                        <Card className="border-purple-500/50 mb-4">
                                            <CardHeader>
                                                <CardTitle className="text-sm flex items-center gap-2 text-purple-600">
                                                    Status de Verificação Oficial
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-xs text-muted-foreground mb-4">
                                                    {selectedUser.is_verified
                                                        ? "Este perfil já possui o selo de verificação oficial da plataforma."
                                                        : "Aprove este perfil para receber a animação cósmica e o selo de verificado na vitrine."}
                                                </p>
                                                <Button
                                                    variant={selectedUser.is_verified ? "outline" : "default"}
                                                    className={`w-full ${!selectedUser.is_verified ? "bg-[#a62681] hover:bg-[#861d67] text-white" : ""}`}
                                                    onClick={handleToggleVerify}
                                                    disabled={processing}
                                                >
                                                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedUser.is_verified ? "Remover Verificação" : "Verificar Perfil")}
                                                </Button>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-yellow-500/50">
                                            <CardHeader>
                                                <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
                                                    <AlertTriangle className="h-4 w-4" /> Ajuste Manual de Saldo
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Valor (R$)</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={adjustAmount}
                                                            onChange={(e) => setAdjustAmount(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Operação</Label>
                                                        <Select value={adjustType} onValueChange={setAdjustType}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="credit">Creditar (+)</SelectItem>
                                                                <SelectItem value="debit">Debitar (-)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Motivo do Ajuste (Log Auditoria)</Label>
                                                    <Input
                                                        placeholder="Ex: Bônus, Estorno..."
                                                        value={adjustReason}
                                                        onChange={(e) => setAdjustReason(e.target.value)}
                                                    />
                                                </div>
                                                <Button
                                                    className="w-full"
                                                    variant="outline"
                                                    onClick={handleManualAdjustment}
                                                    disabled={processing}
                                                >
                                                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar Ajuste"}
                                                </Button>
                                            </CardContent>
                                        </Card>

                                        <Card className={selectedUser.is_blocked ? "border-green-500/50" : "border-red-500/50"}>
                                            <CardHeader>
                                                <CardTitle className={`text-sm ${selectedUser.is_blocked ? "text-green-500" : "text-red-500"}`}>
                                                    {selectedUser.is_blocked ? "Desbloqueio de Conta" : "Bloqueio de Conta"}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-xs text-muted-foreground mb-4">
                                                    {selectedUser.is_blocked
                                                        ? "Restabelece todas as funções do usuário na plataforma (saques, depósitos e trade)."
                                                        : "Suspende saques, depósitos e negociações imediatamente para este usuário."
                                                    }
                                                </p>
                                                <Button
                                                    variant={selectedUser.is_blocked ? "default" : "destructive"}
                                                    className={`w-full ${selectedUser.is_blocked ? "bg-green-600 hover:bg-green-700" : ""}`}
                                                    onClick={handleToggleBlock}
                                                    disabled={processing}
                                                >
                                                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedUser.is_blocked ? "Desbloquear Conta" : "Suspender Conta")}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </>
                        )}
                    </SheetContent>
                </Sheet>

                <Dialog open={!!approveDialogTx} onOpenChange={(open) => !open && setApproveDialogTx(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Aprovar Transferência PIX</DialogTitle>
                            <DialogDescription className="pt-4 text-base">
                                Você está prestes a transferir <strong className="text-foreground">R$ {approveDialogTx ? Math.abs(approveDialogTx.amount).toFixed(2) : '0.00'}</strong> para a conta de <strong className="text-foreground">{approveDialogTx?.profiles?.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="bg-muted/50 p-4 rounded-lg my-2 border">
                            <p className="text-xs text-muted-foreground mb-1">Chave de Destino ({approveDialogTx?.pix_type})</p>
                            <p className="font-mono text-sm font-semibold">{approveDialogTx?.pix_key}</p>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 mt-2">
                            <Button variant="outline" onClick={() => setApproveDialogTx(null)} disabled={processing}>
                                Cancelar
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApproveWithdrawal} disabled={processing}>
                                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Confirmar e Transferir
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!rejectDialogTxId} onOpenChange={(open) => !open && setRejectDialogTxId(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-red-500 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> Rejeitar Solicitação
                            </DialogTitle>
                            <DialogDescription className="pt-2">
                                Tem certeza que deseja rejeitar esta solicitação de saque? O valor descontado será integralmente devolvido para a carteira do usuário na plataforma.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0 mt-4">
                            <Button variant="outline" onClick={() => setRejectDialogTxId(null)} disabled={processing}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleRejectWithdrawal} disabled={processing}>
                                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Sim, Rejeitar Saque
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}