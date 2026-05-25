import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-24 pb-12">
                <div className="container max-w-3xl mx-auto px-4">
                    <div className="mb-6">
                        <Link to="/auth?tab=signup">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Voltar para o Registo
                            </Button>
                        </Link>
                    </div>

                    <Card className="shadow-lg border-muted">
                        <CardHeader className="space-y-2 border-b border-border/50 pb-6">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-primary" />
                                <CardTitle className="text-3xl font-bold">Termos e Condições de Uso</CardTitle>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Última atualização: Maio de 2026
                            </p>
                        </CardHeader>

                        <CardContent className="pt-6 space-y-6 text-foreground/90 leading-relaxed text-sm md:text-base">
                            <p>
                                Bem-vindo(a) ao <strong>Opatrocinador</strong>. Estes Termos de Uso regulam o acesso e a utilização da plataforma web, que atua como um marketplace e exchange para a tokenização e negociação de ativos digitais atrelados a atletas e gamers.
                            </p>

                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">1. Aceitação dos Termos</h3>
                                <p className="text-muted-foreground text-sm md:text-base">
                                    Ao criar uma conta, acessar ou usar o Opatrocinador, você concorda expressamente com estes Termos de Uso e com nossa Política de Privacidade. Se não concordar com qualquer disposição aqui descrita, não utilize a plataforma.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">2. Natureza da Plataforma</h3>
                                <p className="text-muted-foreground text-sm md:text-base">
                                    O Opatrocinador fornece infraestrutura tecnológica para a emissão (Mercado Primário) e negociação (Mercado Secundário) de tokens digitais (ativos). O Opatrocinador não é uma instituição financeira, consultoria de investimentos ou corretora de valores mobiliários tradicional.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">3. Cadastro e Elegibilidade (KYC)</h3>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm md:text-base">
                                    <li><strong>Titularidade:</strong> O uso da plataforma exige cadastro prévio. É estritamente obrigatório o fornecimento de um CPF ou CNPJ válido, que passará por validações matemáticas e de segurança.</li>
                                    <li><strong>Unicidade de Conta:</strong> É permitida apenas uma conta por CPF/CNPJ. A criação de contas múltiplas para contornar limites, regras de taxas ou ocultar patrimônio resultará no bloqueio imediato de todas as contas associadas.</li>
                                    <li><strong>Menores de Idade:</strong> Usuários menores de 18 anos devem ser representados ou assistidos por seus responsáveis legais. O cadastro deve ser realizado no CPF do próprio usuário (menor) para fins de rastreabilidade fiscal.</li>
                                </ul>
                            </section>

                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">4. Depósitos, Saques e Custódia</h3>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm md:text-base">
                                    <li><strong>Processamento de Pagamentos:</strong> O processamento de depósitos e saques em Reais (BRL) via PIX é realizado através de parceiros de pagamento homologados (Asaas). O Opatrocinador não retém os fundos em contas próprias operacionais; os valores são mantidos em contas de custódia segregadas.</li>
                                    <li><strong>Regras de Saque:</strong> Saques só serão aprovados se a chave PIX de destino pertencer à mesma titularidade (CPF/CNPJ) cadastrada na plataforma, em conformidade com as regras de Prevenção à Lavagem de Dinheiro (PLD).</li>
                                </ul>
                            </section>

                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">5. Negociação, Taxas e Royalties</h3>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm md:text-base">
                                    <li><strong>Mercado Primário:</strong> A venda inicial de tokens (Atleta para Patrocinador) está sujeita a uma taxa de intermediação retida pela plataforma fixada em 5% sobre o valor bruto da operação.</li>
                                    <li><strong>Mercado Secundário:</strong> Negociações entre patrocinadores também estão sujeitas a taxas. Se o ativo possuir royalties ativados pelo criador, a taxa será dividida entre a plataforma (3%) e o atleta criador (2%). Se foi gerado sem royalties, a plataforma reterá o valor integral (5%).</li>
                                    <li><strong>Irreversibilidade:</strong> Todas as ordens de compra e venda executadas no livro de ofertas são definitivas, atômicas e irreversíveis.</li>
                                </ul>
                            </section>

                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">6. Riscos do Investimento e Isenção de Responsabilidade</h3>
                                <p className="text-muted-foreground text-sm md:text-base">
                                    O valor dos tokens negociados é determinado exclusivamente pela lei de oferta e demanda do mercado livre. Os preços podem subir ou cair drasticamente. O usuário reconhece que a negociação de ativos digitais envolve alto risco financeiro e concorda que o Opatrocinador não garante lucros, liquidez mínima ou proteção contra perdas de capital.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">7. Suspensão e Cancelamento</h3>
                                <p className="text-muted-foreground text-sm md:text-base">
                                    O Opatrocinador reserva-se o direito de suspender ou cancelar contas que apresentem atividades suspeitas, indícios de fraude, lavagem de dinheiro, uso de CPFs duplicados ou qualquer violação direta destes Termos, sem aviso prévio.
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}