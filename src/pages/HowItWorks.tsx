import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Users, Wallet, ShieldCheck, Trophy, Coins, ListFilter, ArrowRight, Percent } from "lucide-react";

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h1 className="text-5xl font-extrabold mb-6 text-center tracking-tight">
              Como funciona o{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                <br /> Opatrocinador
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A primeira bolsa de valores esportiva que conecta patrocinadores a atletas e gamers através de ativos digitais exclusivos.
            </p>
          </div>

          {/* Main Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="border-border hover:border-primary/50 transition-colors shadow-sm">
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-xl">1. Atletas Criam Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Atletas e gamers criam "Ativos Digitais" (tokens) vinculados à sua carreira. Eles definem a quantidade, o preço inicial e se o ativo pagará Royalties nas revendas futuras.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-success/50 transition-colors shadow-sm">
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
                  <Wallet className="w-7 h-7 text-success" />
                </div>
                <CardTitle className="text-xl">2. Patrocinadores Investem</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Investidores acessam a Vitrine, depositam saldo instantâneo via PIX e compram tokens dos ativos em que acreditam. O capital vai direto para o atleta.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-premium/50 transition-colors shadow-sm">
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-premium/10 flex items-center justify-center mb-4">
                  <ListFilter className="w-7 h-7 text-premium" />
                </div>
                <CardTitle className="text-xl">3. Mercado Secundário</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Através de um Livro de Ofertas dinâmico, os patrocinadores negociam os tokens entre si, definindo seus próprios preços de venda e gerando lucro.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Sections */}
          <div className="space-y-12 max-w-4xl mx-auto">
            {/* For Athletes */}
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                Para Atletas e Gamers
              </h2>
              <Card className="shadow-md">
                <CardContent className="p-8 space-y-8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-lg">1</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Crie a sua Vitrine</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Crie o seu perfil público destacando o seu esporte, conquistas, vídeos e redes sociais. Mostre ao mercado o seu potencial e por que você merece ser patrocinado.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-lg">2</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Gere Ativos Digitais com Royalties</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Precisa de um PC novo? Vai viajar para um campeonato? Crie um ativo, defina os tokens e escolha se quer ativar os Royalties para ganhar comissões passivas para sempre.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-lg">3</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Financie sua Carreira e Lucre no Passivo</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Receba o dinheiro das vendas iniciais para financiar seus projetos. Se você ativou os Royalties, receberá 2% de comissão toda vez que seus patrocinadores negociarem seus tokens no mercado secundário!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* For Investors */}
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 mt-16">
                <TrendingUp className="w-8 h-8 text-success" />
                Para Patrocinadores / Investidores
              </h2>
              <Card className="shadow-md">
                <CardContent className="p-8 space-y-8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-success font-bold text-lg">1</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Explore e Adicione à Watchlist</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Navegue pela Vitrine para descobrir atletas promissores. Adicione os ativos que mais chamam a sua atenção à sua Watchlist para acompanhar os preços de perto.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-success font-bold text-lg">2</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Compre e Construa a sua Carteira</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Adicione saldo via PIX de forma segura e rápida. Compre tokens e o nosso sistema calculará automaticamente o seu preço médio de compra e o lucro da sua carteira em tempo real.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-success font-bold text-lg">3</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Bolsa P2P (Livro de Ofertas)</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Quer lucrar? Coloque seus tokens à venda pelo preço que desejar. O nosso Livro de Ofertas cruza automaticamente compradores e vendedores. Quando o ativo valoriza, você pode vender e sacar via PIX.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security */}
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 mt-16">
                <ShieldCheck className="w-8 h-8 text-premium" />
                Segurança e Transparência
              </h2>
              <Card className="bg-muted/20 border-border">
                <CardContent className="p-8">
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                      <div className="p-2 bg-background rounded-lg border shadow-sm mt-1">
                        <Coins className="w-5 h-5 text-premium" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Retenção Automática de Saldo</h3>
                        <p className="text-muted-foreground">
                          Quando você cria uma ordem de compra ou venda em espera, seus fundos ou tokens são retidos de forma segura e atômica. Cancelou a ordem? Tudo retorna instantaneamente à sua carteira.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="p-2 bg-background rounded-lg border shadow-sm mt-1">
                        <ListFilter className="w-5 h-5 text-premium" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Proteção de Preço</h3>
                        <p className="text-muted-foreground">
                          O nosso Motor de Cruzamento P2P garante que você compre pelo menor preço disponível e venda pelo maior, devolvendo sempre a diferença (troco) direto para o seu saldo.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="p-2 bg-background rounded-lg border shadow-sm mt-1">
                        <Percent className="w-5 h-5 text-premium" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Taxas Claras e Royalties</h3>
                        <p className="text-muted-foreground">
                          Sem surpresas. A plataforma cobra uma taxa fixa de 5% sobre as vendas para manter a infraestrutura. No mercado secundário, essa taxa pode ser dividida para recompensar o atleta (2%) em ativos com royalties ativados.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="p-2 bg-background rounded-lg border shadow-sm mt-1">
                        <TrendingUp className="w-5 h-5 text-premium" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Extrato e Histórico Precisos</h3>
                        <p className="text-muted-foreground">
                          Cada centavo é rastreado. Acompanhe a variação das últimas 24h, seus saques e depósitos via PIX, e tenha um histórico completo com seu preço médio para fins de declaração fiscal.
                        </p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-20 p-10 bg-muted/30 rounded-3xl border border-border">
            <h2 className="text-3xl font-bold mb-4">Pronto para entrar em campo?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se ao Opatrocinador, apoie o talento real e faça parte da primeira bolsa de valores focada no sucesso esportivo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?tab=signup">
                <Button size="lg" className="h-14 px-8 text-lg">
                  Criar Conta Grátis
                </Button>
              </Link>
              <Link to="/vitrine">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg bg-background">
                  Explorar a Vitrine <ArrowRight className="w-5 h-5 ml-2" />
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