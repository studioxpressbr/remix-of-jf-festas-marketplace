import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { AuthModal } from "@/components/auth/AuthModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
  DollarSign,
  ShieldCheck,
  Tag,
  Star,
  MessageCircle,
  Users,
  ThumbsUp,
  UserPlus,
  Send,
  CheckCircle,
} from "lucide-react";

const heroSlides = [
  {
    image: "/1.png",
    title: "Encontre os melhores fornecedores",
    subtitle: "Profissionais verificados para tornar sua festa inesquecível",
  },
  {
    image: "/2.png",
    title: "Cadastro gratuito, sem compromisso",
    subtitle: "Crie sua conta em menos de 1 minuto e comece a receber cotações",
  },
  {
    image: "/3.png",
    title: "Promoções exclusivas para você",
    subtitle: "Cupons e ofertas especiais disponíveis apenas para clientes cadastrados",
  },
];

const advantages = [
  {
    icon: DollarSign,
    title: "Cadastro 100% gratuito",
    description: "Crie sua conta sem nenhum custo. Você não paga nada para usar a plataforma.",
  },
  {
    icon: ThumbsUp,
    title: "Sem obrigação de aceitar cotações",
    description: "Receba propostas de fornecedores e escolha apenas se fizer sentido para você.",
  },
  {
    icon: Tag,
    title: "Promoções e ofertas exclusivas",
    description: "Clientes cadastrados têm acesso a cupons e condições especiais dos fornecedores.",
  },
  {
    icon: ShieldCheck,
    title: "Fornecedores verificados",
    description: "Todos os fornecedores passam por aprovação antes de aparecer na plataforma.",
  },
  {
    icon: MessageCircle,
    title: "Contato direto com profissionais",
    description: "Converse diretamente com os fornecedores e tire todas as suas dúvidas.",
  },
  {
    icon: Users,
    title: "Avaliações reais de outros clientes",
    description: "Veja opiniões genuínas de quem já contratou antes de tomar sua decisão.",
  },
];

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: "Cadastre-se",
    description: "Crie sua conta gratuita em menos de 1 minuto.",
  },
  {
    number: 2,
    icon: Send,
    title: "Solicite cotações",
    description: "Encontre fornecedores e peça orçamentos sem compromisso.",
  },
  {
    number: 3,
    icon: CheckCircle,
    title: "Escolha o melhor",
    description: "Compare propostas, avaliações e ofertas. Contrate com segurança.",
  },
];

function ParaClientesPage() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Carousel */}
        <section>
          <Carousel
            plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]}
            opts={{ loop: true }}
            className="w-full"
          >
            <CarouselContent>
              {heroSlides.map((slide, index) => (
                <CarouselItem key={index}>
                  <div
                    className="relative bg-cover bg-center bg-no-repeat py-16 md:py-24"
                    style={{ backgroundImage: `url(${slide.image})` }}
                  >
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="container relative text-center">
                      {index === 0 && (
                        <Badge variant="secondary" className="mb-4">
                          Para Clientes
                        </Badge>
                      )}
                      <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
                        {slide.title}
                      </h1>
                      <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
                        {slide.subtitle}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </section>

        {/* Vantagens */}
        <section className="py-16">
          <div className="container">
            <h2 className="mb-10 text-center font-display text-2xl font-semibold text-foreground md:text-3xl">
              Vantagens para você
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {advantages.map((item) => (
                <Card key={item.title} className="border-border/60">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="bg-muted/50 py-16">
          <div className="container">
            <h2 className="mb-10 text-center font-display text-2xl font-semibold text-foreground md:text-3xl">
              Como funciona
            </h2>
            <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container text-center">
            <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
              Pronto para encontrar o fornecedor ideal?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Cadastre-se gratuitamente e comece a receber cotações dos melhores profissionais de Juiz de Fora.
            </p>
            <Button size="lg" className="mt-6" onClick={() => setAuthOpen(true)}>
              Cadastre-se Gratuitamente
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-champagne/30 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 JF Festas. Todos os direitos reservados.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link to="/termos" className="hover:underline">
              Termos e Condições
            </Link>
            <a
              href="https://www.instagram.com/festasemjf/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Instagram
            </a>
          </div>
        </div>
      </footer>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode="client" />
    </div>
  );
}

export default function ParaClientes() {
  return (
    <AuthProvider>
      <ParaClientesPage />
    </AuthProvider>
  );
}
