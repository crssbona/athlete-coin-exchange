import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Users, Wallet, ShieldCheck, Trophy, Coins, ListFilter, ArrowRight } from "lucide-react";

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
              A primeira bolsa de valores desportiva que conecta patrocinadores a atletas e gamers através de ativos digitais exclusivos.
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
                  Atletas e gamers criam "Ativos Digitais" (tokens) vinculados à sua carreira, projetos ou NFTs. Eles definem a quantidade total e o preço inicial de lançamento.
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
                  Investidores acedem à Vitrine e compram tokens dos ativos em que acreditam. O capital vai para o atleta e os tokens vão para a Carteira do patrocinador.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-premium/50 transition-colors shadow-sm">
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-premium/10 flex items-center justify-center mb-4">
                  <ListFilter className="w-7 h-7 text-premium" />
                </div>
                <CardTitle className="text-xl">3. Mercado P2P Define o Valor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Através de um Livro de Ofertas dinâmico, os patrocinadores negociam os tokens entre si, definindo os seus próprios preços de venda e gerando lucro.
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
                        Crie o seu perfil público destacando o seu desporto, conquistas, vídeos e redes sociais. Mostre ao mercado o seu potencial e por que merece ser patrocinado.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-lg">2</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Gere Ativos Digitais</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Em vez de vender uma parte de si, crie "Ativos" específicos. Precisa de um PC novo? Vai viajar para um campeonato? Crie um ativo, defina o número de tokens e lance para o mercado.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-lg">3</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Financie a sua Carreira</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        À medida que os patrocinadores compram os seus tokens na plataforma, o valor é disponibilizado para si. O seu sucesso desportivo aumenta a procura pelos seus ativos!
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
                        Navegue pela Vitrine para descobrir atletas promissores. Adicione os ativos que lhe interessam à sua Watchlist para acompanhar o seu progresso de perto.
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
                        Deposite saldo via PIX e comece a comprar tokens. O sistema calcula automaticamente o seu preço médio, valorização e o lucro da sua carteira em tempo real.
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
                        Quer lucrar? Coloque os seus tokens à venda pelo preço que desejar. O nosso Livro de Ofertas cruza automaticamente compradores e vendedores. Se o ativo valorizar, você ganha.
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
                Segurança Nível Exchange
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
                          Quando cria uma ordem de compra ou venda em espera, os seus fundos ou tokens são retidos de forma segura. Cancelou a ordem? Tudo regressa instantaneamente à sua carteira.
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
                          O nosso Motor de Cruzamento P2P garante que compre pelo menor preço disponível e venda pelo maior, devolvendo sempre a diferença (troco) para a sua conta.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="p-2 bg-background rounded-lg border shadow-sm mt-1">
                        <TrendingUp className="w-5 h-5 text-premium" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Gráficos e Histórico Transparentes</h3>
                        <p className="text-muted-foreground">
                          Cada transação alimenta o gráfico de mercado do ativo. Acompanhe a variação das últimas 24h, o Market Cap total e o volume negociado com total transparência.
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
              Junte-se ao Opatrocinador, apoie o talento real e faça parte da primeira bolsa de valores focada no sucesso desportivo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
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