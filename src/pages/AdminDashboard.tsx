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
    Loader2, Copy, History, Wallet, AlertTriangle, ArrowDownRight, ArrowUpRight, Coins, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Estados da Plataforma
    const [platformBalance, setPlatformBalance] = useState(0);
    const [processing, setProcessing] = useState(false);

    // Estados de Saque Admin
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [pixKey, setPixKey] = useState("");
    const [pixKeyType, setPixKeyType] = useState("CPF");
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    // Estados da Ficha do Usuário (CRM)
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [userDetailsLoading, setUserDetailsLoading] = useState(false);
    const [userTransactions, setUserTransactions] = useState<any[]>([]);
    const [userEmittedTokens, setUserEmittedTokens] = useState<any[]>([]);
    const [userPortfolio, setUserPortfolio] = useState<any[]>([]);

    // Estado para ajuste manual
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

            const { data, error } = await supabase.from('profiles').select(`
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

    const fetchUserDetails = async (userId: string) => {
        setUserDetailsLoading(true);
        try {
            // 1. Busca Transações 
            const { data: txData } = await supabase
                .from('fiat_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            setUserTransactions(txData || []);

            try {
                // 2. Busca Tokens Emitidos (Voltamos para a tabela correta com o user_id)
                const { data: emittedData } = await supabase
                    .from('athlete_tokens')
                    .select('*')
                    .eq('user_id', userId);

                setUserEmittedTokens(emittedData || []);

                // 3. Busca Portfólio
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

        setProcessing(true);
        try {
            toast.success(`${isCredit ? 'Crédito' : 'Débito'} de R$ ${amount.toFixed(2)} aplicado (Emulação).`);
            setAdjustAmount("");
            setAdjustReason("");
            loadAdminData();
            fetchUserDetails(selectedUser.id);
        } catch (error) {
            toast.error("Erro ao ajustar saldo.");
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total em Carteiras (Clientes)</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-muted-foreground">
                                R$ {usersList.reduce((acc, curr) => acc + (curr.wallets?.balance ?? curr.wallets?.[0]?.balance ?? 0), 0).toFixed(2)}
                            </div>
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
                                        <TableCell className="font-medium">{u.name || "Sem nome"}</TableCell>
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

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                        {selectedUser && (
                            <>
                                <SheetHeader className="mb-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <SheetTitle className="text-2xl">{selectedUser.name || "Usuário sem nome"}</SheetTitle>
                                            <SheetDescription className="flex items-center gap-2 mt-1">
                                                <span className="font-mono text-xs">{selectedUser.id}</span>
                                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(selectedUser.id)}>
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </SheetDescription>
                                        </div>
                                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">Conta Ativa</Badge>
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
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1"><History className="h-3 w-3" /> Em Ativos</span>
                                                    <span className="text-2xl font-bold mt-1 text-muted-foreground">R$ 0.00</span>
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
                                                                                <p className="text-sm font-medium capitalize">{tx.type.replace('_', ' ')}</p>
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
                                        {/* TOKENS EMITIDOS (ATLETAS) */}
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
                                                                    {token.avatar_url ? (
                                                                        <img src={token.avatar_url} alt="Capa do Ativo" className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-sm" />
                                                                    ) : (
                                                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
                                                                            <Coins className="w-6 h-6" />
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="font-bold text-base leading-none mb-1">{token.athlete_name || "Atleta sem nome"}</p>
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

                                        {/* INVENTÁRIO NA CARTEIRA (INVESTIDORES) */}
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

                                        <Card className="border-red-500/50">
                                            <CardHeader>
                                                <CardTitle className="text-sm text-red-500">Bloqueio de Conta</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-xs text-muted-foreground mb-4">
                                                    Suspende saques, depósitos e negociações imediatamente para este usuário.
                                                </p>
                                                <Button variant="destructive" className="w-full" onClick={() => toast.error("Função de bloqueio em desenvolvimento.")}>
                                                    Suspender Conta
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </>
                        )}
                    </SheetContent>
                </Sheet>

            </div>
        </div>
    );
}