import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, Landmark, History, TrendingUp, Clock, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SponsorPanel } from "@/components/profile/SponsorPanel";

export default function WalletPage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const [balance, setBalance] = useState<number>(0);
    const [blockedBalance, setBlockedBalance] = useState<number>(0);

    const [depositAmount, setDepositAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [pixKey, setPixKey] = useState("");
    const [processing, setProcessing] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);

    // ESTADOS DO ASAAS
    const [pixData, setPixData] = useState<{ encodedImage: string, payload: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [initialBalance, setInitialBalance] = useState<number | null>(null); // NOVO: Guarda o saldo para comparar

    useEffect(() => {
        if (!loading && !user) {
            navigate("/auth");
        } else if (user) {
            loadWalletData();
        }
    }, [user, loading, navigate]);

    // NOVO: O "Espião" que verifica o pagamento automaticamente
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const checkPayment = async () => {
            if (!user || initialBalance === null) return;

            const { data } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', user.id)
                .maybeSingle();

            // Se o saldo atual for maior que o saldo de antes de gerar o PIX...
            if (data && data.balance > initialBalance) {
                setPixData(null); // Esconde o QR Code
                setInitialBalance(null); // Reseta o verificador
                setDepositAmount(""); // Limpa o campo de valor
                toast.success("Pagamento aprovado! Saldo creditado na sua conta.");
                loadWalletData(); // Atualiza os números e o histórico na tela
            }
        };

        if (pixData) {
            // Se o QR Code está na tela, verifica o banco a cada 3 segundos
            interval = setInterval(checkPayment, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [pixData, user, initialBalance]);

    const loadWalletData = async () => {
        try {
            const { data: wallet } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', user?.id)
                .maybeSingle();

            setBalance(wallet?.balance || 0);

            const { data: pendingAssets } = await supabase
                .from('pending_asset_purchases')
                .select('quantity, limit_price')
                .eq('user_id', user?.id)
                .eq('status', 'pending');

            let blocked = 0;
            if (pendingAssets) {
                blocked += pendingAssets.reduce((acc, order) => acc + (order.quantity * order.limit_price), 0);
            }

            const { data: pendingAthletes } = await supabase
                .from('pending_purchases')
                .select('quantity, limit_price')
                .eq('user_id', user?.id)
                .eq('status', 'pending');

            if (pendingAthletes) {
                blocked += pendingAthletes.reduce((acc, order) => acc + (order.quantity * order.limit_price), 0);
            }

            setBlockedBalance(blocked);

            const { data: txs } = await supabase
                .from('fiat_transactions')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(10);

            setTransactions(txs || []);
        } catch (error) {
            console.error("Erro ao carregar carteira:", error);
        }
    };

    const handleTransaction = async (type: 'deposit' | 'withdraw') => {
        const amountStr = type === 'deposit' ? depositAmount : withdrawAmount;
        const amount = parseFloat(amountStr);

        if (isNaN(amount) || amount <= 0) {
            toast.error("Por favor, insira um valor válido.");
            return;
        }

        if (type === 'withdraw' && amount > balance) {
            toast.error("Saldo insuficiente para este saque.");
            return;
        }

        if (type === 'withdraw' && pixKey.length < 5) {
            toast.error("Por favor, insira uma chave PIX válida.");
            return;
        }

        setProcessing(true);
        try {
            if (type === 'deposit') {
                const { data, error } = await supabase.functions.invoke('create-asaas-payment', {
                    body: { amount: amount }
                });

                if (error) throw error;

                if (data?.success) {
                    setInitialBalance(balance); // Salva o saldo de agora para comparar depois
                    setPixData({
                        encodedImage: data.encodedImage,
                        payload: data.payload
                    });
                    toast.info("Aguardando o pagamento do PIX...");
                } else {
                    toast.error(data?.message || "Erro ao gerar PIX");
                }
            } else {
                await new Promise(resolve => setTimeout(resolve, 1500));

                const { data, error } = await supabase.rpc('handle_fiat_transaction', {
                    p_type: type,
                    p_amount: amount
                });

                if (error) throw error;

                if (data?.success) {
                    toast.success('Saque enviado para sua conta!');
                    setWithdrawAmount("");
                    setPixKey("");
                    loadWalletData();
                } else {
                    toast.error(data?.message || "Erro ao processar transação");
                }
            }
        } catch (error: any) {
            toast.error("Ocorreu um erro no sistema.");
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const copyToClipboard = () => {
        if (pixData) {
            navigator.clipboard.writeText(pixData.payload);
            setCopied(true);
            toast.success("Código PIX copiado!");
            setTimeout(() => setCopied(false), 3000);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-24 pb-12">
                <div className="container max-w-4xl mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                            <WalletIcon className="w-8 h-8 text-primary" />
                            Minha Carteira
                        </h1>
                        <p className="text-muted-foreground">
                            Gerencie os seus fundos para comprar e vender tokens de atletas.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">

                            <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-lg">
                                <CardContent className="p-8">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2">Saldo Disponível</p>
                                            <h2 className="text-5xl font-bold tracking-tight">
                                                R$ {balance.toFixed(2)}
                                            </h2>
                                        </div>

                                        {blockedBalance > 0 && (
                                            <div className="flex items-center gap-2 bg-muted/50 border rounded-lg p-3 text-sm">
                                                <Clock className="w-4 h-4 text-amber-500" />
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground text-xs font-medium">Reservado em Ordens</span>
                                                    <span className="font-bold text-foreground">R$ {blockedBalance.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Tabs defaultValue="deposit" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="deposit">Depositar</TabsTrigger>
                                    <TabsTrigger value="withdraw">Sacar</TabsTrigger>
                                </TabsList>

                                <TabsContent value="deposit">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <ArrowDownCircle className="w-5 h-5 text-green-500" />
                                                Adicionar Fundos
                                            </CardTitle>
                                            <CardDescription>
                                                Adicione saldo via PIX com processamento Asaas.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {!pixData ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label>Valor do Depósito (R$)</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={depositAmount}
                                                            onChange={(e) => setDepositAmount(e.target.value)}
                                                            disabled={processing}
                                                        />
                                                    </div>
                                                    <Button
                                                        className="w-full"
                                                        size="lg"
                                                        onClick={() => handleTransaction('deposit')}
                                                        disabled={processing || !depositAmount}
                                                    >
                                                        {processing ? 'A gerar...' : 'Gerar PIX Copia e Cola'}
                                                    </Button>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300">
                                                    <h3 className="font-semibold text-lg text-center">Leia o QR Code</h3>

                                                    <div className="bg-white p-2 rounded-xl">
                                                        <img
                                                            src={`data:image/jpeg;base64,${pixData.encodedImage}`}
                                                            alt="QR Code PIX"
                                                            className="w-48 h-48"
                                                        />
                                                    </div>

                                                    {/* NOVO: Feedback visual enquanto aguarda */}
                                                    <div className="flex items-center gap-2 text-amber-500 font-medium animate-pulse">
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        <span>Aguardando confirmação do pagamento...</span>
                                                    </div>

                                                    <div className="w-full space-y-2 mt-2">
                                                        <Label>Ou utilize o PIX Copia e Cola:</Label>
                                                        <div className="flex gap-2">
                                                            <Input value={pixData.payload} readOnly className="font-mono text-xs" />
                                                            <Button variant="secondary" onClick={copyToClipboard}>
                                                                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="flex w-full gap-2 mt-4">
                                                        <Button variant="outline" className="w-full" onClick={() => {
                                                            setPixData(null);
                                                            setInitialBalance(null);
                                                            loadWalletData();
                                                        }}>
                                                            Cancelar
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="withdraw">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <ArrowUpCircle className="w-5 h-5 text-blue-500" />
                                                Sacar Fundos
                                            </CardTitle>
                                            <CardDescription>
                                                Transfira o seu saldo disponível direto para a sua conta bancária.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Chave PIX (CPF, Email, Telemóvel ou Aleatória)</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="A sua chave PIX"
                                                    value={pixKey}
                                                    onChange={(e) => setPixKey(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Valor do Saque (R$)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={withdrawAmount}
                                                    max={balance}
                                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                                />
                                                <p className="text-xs text-muted-foreground text-right">
                                                    Disponível: R$ {balance.toFixed(2)}
                                                </p>
                                            </div>
                                            <Button
                                                className="w-full"
                                                size="lg"
                                                variant="secondary"
                                                onClick={() => handleTransaction('withdraw')}
                                                disabled={processing || balance <= 0}
                                            >
                                                {processing ? 'A processar...' : 'Solicitar Saque'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>

                        <div className="md:col-span-1">
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <History className="w-5 h-5" />
                                        Últimas Movimentações
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {transactions.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            Nenhuma movimentação financeira.
                                        </p>
                                    ) : (
                                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                                            {transactions.map((tx) => (
                                                <div key={tx.id} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                            {tx.type === 'deposit' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {tx.type === 'deposit' ? 'Depósito PIX' : 'Saque PIX'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className={`font-semibold ${tx.type === 'deposit' ? 'text-green-500' : 'text-foreground'}`}>
                                                        {tx.type === 'deposit' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                    </div>

                    <div className="mt-16 mb-6">
                        <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
                            <TrendingUp className="w-8 h-8 text-primary" />
                            Os meus Investimentos
                        </h2>
                        <p className="text-muted-foreground">
                            Acompanhe o seu rendimento, a sua carteira de tokens e o histórico de negociações.
                        </p>
                    </div>

                    {user && <SponsorPanel userId={user.id} />}
                </div>
            </main>
        </div>
    );
}