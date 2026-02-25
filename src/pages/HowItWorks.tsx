import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Users, Wallet, ShieldCheck, LineChart, Trophy } from "lucide-react";

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 text-center">
              Como Funciona o{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                <br /> Opatrocinador
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Conectando investidores a atletas e gamers de forma transparente e segura
            </p>
          </div>

          {/* Main Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg gradient-primary glow-primary flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>1. Atletas Criam Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Atletas e gamers definem quantos tokens querem criar e o preço inicial.
                  Eles têm controle total sobre sua oferta inicial.
                </p>
              </CardContent>
            </Card>

            <Card className="border-success/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-success glow-success flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-success-foreground" />
                </div>
                <CardTitle>2. Investidores Compram</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Patrocinadores compram tokens dos atletas que acreditam.
                  Não é necessário comprar grandes quantidades - você investe o quanto quiser.
                </p>
              </CardContent>
            </Card>

            <Card className="border-premium/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg gradient-premium glow-premium flex items-center justify-center mb-4">
                  <LineChart className="w-6 h-6 text-premium-foreground" />
                </div>
                <CardTitle>3. Mercado Define Valor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Após a venda inicial, o mercado determina o valor.
                  Tokens podem ser negociados livremente entre investidores.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Sections */}
          <div className="space-y-12 max-w-4xl mx-auto">
            {/* For Athletes */}
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Trophy className="w-8 h-8 text-primary" />
                Para Atletas e Gamers
              </h2>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Defina Sua Oferta</h3>
                      <p className="text-muted-foreground">
                        Você decide quantos tokens criar e o preço inicial. Pode ser 1.000 tokens a $10,
                        10.000 a $50, ou qualquer combinação que faça sentido para sua carreira.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Receba Investimento</h3>
                      <p className="text-muted-foreground">
                        Quando investidores compram seus tokens, você recebe o valor diretamente.
                        Use esse capital para equipamentos, treinamento, ou participação em campeonatos.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Cresça Com Apoio</h3>
                      <p className="text-muted-foreground">
                        Seus investidores ganham quando você ganha. Conquistas e resultados
                        aumentam o valor dos tokens, criando um ciclo positivo.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* For Investors */}
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-success" />
                Para Investidores
              </h2>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-success font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Explore o Marketplace</h3>
                      <p className="text-muted-foreground">
                        Navegue por centenas de atletas e gamers. Veja estatísticas, conquistas
                        e histórico de performance antes de investir.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-success font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Compre Tokens</h3>
                      <p className="text-muted-foreground">
                        Invista em quem você acredita. Não há valor mínimo - compre 1 token
                        ou 1.000, você decide baseado no seu orçamento e confiança.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-success font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Negocie Livremente</h3>
                      <p className="text-muted-foreground">
                        Venda seus tokens quando quiser. Se o atleta se valorizar, você pode
                        vender com lucro. É um mercado livre e transparente.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security */}
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-premium" />
                Segurança e Transparência
              </h2>
              <Card>
                <CardContent className="p-6">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-success mt-1" />
                      <div>
                        <h3 className="font-semibold mb-1">Transações Seguras</h3>
                        <p className="text-muted-foreground">
                          Todas as transações são processadas de forma segura e transparente
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-success mt-1" />
                      <div>
                        <h3 className="font-semibold mb-1">Preços em Tempo Real</h3>
                        <p className="text-muted-foreground">
                          Veja o valor atualizado dos tokens e o volume de negociações a qualquer momento
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-success mt-1" />
                      <div>
                        <h3 className="font-semibold mb-1">Histórico Completo</h3>
                        <p className="text-muted-foreground">
                          Acesse todo o histórico de performance e negociações de cada atleta
                        </p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold mb-4">Pronto para Começar?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Junte-se à revolução do patrocínio esportivo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button variant="hero" size="lg">
                  Criar Conta Grátis
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button variant="outline" size="lg">
                  Explorar Atletas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;
