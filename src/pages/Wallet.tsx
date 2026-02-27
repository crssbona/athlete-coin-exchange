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
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, Landmark, History, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { SponsorPanel } from "@/components/profile/SponsorPanel";

export default function WalletPage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [balance, setBalance] = useState<number>(0);
    const [depositAmount, setDepositAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [pixKey, setPixKey] = useState("");
    const [processing, setProcessing] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        if (!loading && !user) {
            navigate("/auth");
        } else if (user) {
            loadWalletData();
        }
    }, [user, loading, navigate]);

    const loadWalletData = async () => {
        try {
            // Busca o saldo
            const { data: wallet } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', user?.id)
                .maybeSingle();

            setBalance(wallet?.balance || 0);

            // Busca histórico de depósitos/saques
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
            // Simulação de delay de gateway de pagamento (Futuro Mercado Pago)
            await new Promise(resolve => setTimeout(resolve, 1500));

            const { data, error } = await supabase.rpc('handle_fiat_transaction', {
                p_type: type,
                p_amount: amount
            });

            if (error) throw error;

            if (data?.success) {
                toast.success(type === 'deposit' ? 'Depósito realizado com sucesso!' : 'Saque enviado para sua conta!');
                setDepositAmount("");
                setWithdrawAmount("");
                setPixKey("");
                loadWalletData();
            } else {
                toast.error(data?.message || "Erro ao processar transação");
            }
        } catch (error: any) {
            toast.error("Ocorreu um erro no sistema.");
            console.error(error);
        } finally {
            setProcessing(false);
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
                            Gerencie seus fundos para comprar e vender tokens de atletas.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Coluna Esquerda: Saldo e Ações */}
                        <div className="md:col-span-2 space-y-6">

                            {/* Card de Saldo */}
                            <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-lg">
                                <CardContent className="p-8">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Saldo Disponível</p>
                                    <h2 className="text-5xl font-bold tracking-tight">
                                        R$ {balance.toFixed(2)}
                                    </h2>
                                </CardContent>
                            </Card>

                            {/* Abas de Operação */}
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
                                                Adicione saldo via PIX para começar a investir em atletas. (Integração Mercado Pago em breve)
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Valor do Depósito (R$)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={depositAmount}
                                                    onChange={(e) => setDepositAmount(e.target.value)}
                                                />
                                            </div>
                                            <Button
                                                className="w-full"
                                                size="lg"
                                                onClick={() => handleTransaction('deposit')}
                                                disabled={processing}
                                            >
                                                {processing ? 'Processando...' : 'Gerar PIX Copia e Cola'}
                                            </Button>
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
                                                Transfira seu saldo disponível direto para sua conta bancária.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Chave PIX (CPF, Email, Telefone ou Aleatória)</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Sua chave PIX"
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
                                                {processing ? 'Processando...' : 'Solicitar Saque'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Coluna Direita: Histórico Recente */}
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
                                        <div className="space-y-4">
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
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* ... (todo o código da carteira que já fizemos fica aqui intacto) ... */}
                    </div>

                    {/* NOVO: Seção de Investimentos (SponsorPanel) */}
                    <div className="mt-16 mb-6">
                        <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
                            <TrendingUp className="w-8 h-8 text-primary" />
                            Meus Investimentos
                        </h2>
                        <p className="text-muted-foreground">
                            Acompanhe seu rendimento, sua carteira de tokens e o histórico de negociações.
                        </p>
                    </div>

                    {user && <SponsorPanel userId={user.id} />}
                </div>
            </main>
        </div>
    );
}