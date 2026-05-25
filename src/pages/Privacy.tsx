import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
                                <Shield className="w-6 h-6 text-primary" />
                                <CardTitle className="text-3xl font-bold">Política de Privacidade</CardTitle>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Última atualização: Maio de 2026
                            </p>
                        </CardHeader>

                        <CardContent className="pt-6 space-y-6 text-foreground/90 leading-relaxed text-sm md:text-base">
                            <p>
                                O <strong>Opatrocinador</strong> tem o firme compromisso de proteger a sua privacidade e os seus dados pessoais, em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                            </p>

                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">1. Quais dados coletamos</h3>
                                <p className="text-muted-foreground mb-2 text-sm md:text-base">
                                    Para que você possa utilizar nossa exchange com segurança, coletamos:
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm md:text-base">
                                    <li><strong>Dados Cadastrais:</strong> Nome completo, e-mail, número de telefone/WhatsApp, e número de CPF ou CNPJ.</li>
                                    <li><strong>Dados Financeiros:</strong> Histórico de transações, saldos em carteira, quantidade e preços médios de tokens adquiridos, e chaves PIX fornecidas para saques.</li>
                                    <li><strong>Dados de Navegação:</strong> Endereço de IP, logs de acesso com data/hora, tipo de dispositivo e navegador, essenciais para auditorias de segurança contra fraudes.</li>
                                </ul>
                            </section>

                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">2. Como utilizamos seus dados</h3>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm md:text-base">
                                    <li>Autenticar o seu acesso e garantir a unicidade da sua conta (impedindo fraudes de documentos).</li>
                                    <li>Processar depósitos, saques e consolidar dados financeiros para relatórios de rendimento.</li>
                                    <li>Cumprir obrigações legais, especialmente as normas do Banco Central do Brasil ligadas à Prevenção à Lavagem de Dinheiro (KYC/AML).</li>
                                    <li>Fornecer suporte técnico e enviar alertas importantes sobre execuções de ordens de ativos.</li>
                                </ul>
                            </section>

                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">3. Com quem compartilhamos seus dados</h3>
                                <p className="text-muted-foreground text-sm md:text-base">
                                    Nós não vendemos ou comercializamos os seus dados pessoais. O compartilhamento ocorre estritamente com:
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm md:text-base">
                                    <li><strong>Gateways de Pagamento:</strong> Os dados necessários são transmitidos de forma criptografada para instituições parceiras de intermediação bancária (Asaas) exclusivamente para liquidar transações via PIX.</li>
                                    <li><strong>Autoridades Legais:</strong> Em resposta a ordens judiciais ou em conformidade com as regras fiscais de prestação de contas à Receita Federal.</li>
                                </ul>
                            </section>

                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">4. Retenção e Armazenamento</h3>
                                <p className="text-muted-foreground text-sm md:text-base">
                                    Os dados são armazenados em infraestrutura de nuvem segura e criptografada. Por força de obrigações legais brasileiras regulatórias do setor financeiro e fiscal, os dados vinculados a transações financeiras (histórico de saques/depósitos, negociações e dados de identificação do CPF) precisam ser retidos de forma segura por um período mínimo de <strong>5 (cinco) anos</strong>, mesmo que você decida excluir sua conta da plataforma.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">5. Seus Direitos (LGPD)</h3>
                                <p className="text-muted-foreground mb-2 text-sm md:text-base">
                                    Você possui plenos direitos previstos em lei, incluindo:
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm md:text-base">
                                    <li>Confirmar a existência do tratamento e solicitar acesso aos dados coletados.</li>
                                    <li>Corrigir dados incompletos, inexatos ou desatualizados nas suas definições de perfil.</li>
                                    <li>Solicitar a eliminação de dados não financeiros, respeitadas as restrições de retenção legal mencionadas no Item 4.</li>
                                </ul>
                            </section>

                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">6. Contato e Encarregado de Dados</h3>
                                <p className="text-muted-foreground text-sm md:text-base">
                                    Para esclarecer qualquer dúvida sobre esta Política de Privacidade ou exercer os seus direitos de titular dos dados, entre em contato direto com a nossa equipa de suporte através do nosso canal oficial de comunicação.
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}