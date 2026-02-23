import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { AuthModal } from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  MEI_PLAN_PRICE,
  EMPRESARIAL_PLAN_PRICE,
} from '@/lib/constants';
import {
  Users,
  Star,
  TrendingUp,
  Camera,
  MessageSquare,
  Tag,
  BarChart3,
  Instagram,
  Check,
  ArrowRight,
  MapPin,
  Layers,
  Quote,
  Crown,
  Globe,
  Zap,
  Phone,
} from 'lucide-react';
import logoJfFestas from '@/assets/logo-jffestas.webp';

const STRIPE_MEI_LINK = 'https://buy.stripe.com/3cIaEZ6L0arK5OO66l8og00';
const STRIPE_EMPRESARIAL_LINK = 'https://buy.stripe.com/9B63cx9Xc1Ve2CCamB8og01';

const WHATSAPP_URL = 'https://wa.me/5521972093557?text=Ol%C3%A1%2C%20gostaria%20de%20agendar%20uma%20demonstra%C3%A7%C3%A3o%20da%20JF%20Festas';
const INSTAGRAM_URL = 'https://www.instagram.com/festasemjf/';

const stats = [
  { icon: Users, value: '500+', label: 'Clientes buscando fornecedores' },
  { icon: Layers, value: '16', label: 'Categorias de serviços' },
  { icon: MapPin, value: 'JF e região', label: 'Juiz de Fora e entorno' },
  { icon: TrendingUp, value: 'R$ 0', label: 'Taxa de agenciamento' },
];

const benefits = [
  {
    icon: Camera,
    title: 'Perfil profissional',
    description: 'Mostre seu trabalho com fotos, descrição e avaliações de clientes reais.',
  },
  {
    icon: MessageSquare,
    title: 'Cotações de clientes',
    description: 'Receba pedidos de orçamento diretamente de quem está organizando uma festa.',
  },
  {
    icon: TrendingUp,
    title: 'Sem taxa de agenciamento',
    description: 'Negocie e feche direto com o cliente. Sem intermediários, sem comissão.',
  },
  {
    icon: Tag,
    title: 'Cupons e promoções',
    description: 'Crie ofertas especiais para atrair mais clientes e se destacar.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard com relatórios',
    description: 'Acompanhe visualizações, cotações recebidas e negócios fechados.',
  },
  {
    icon: Instagram,
    title: 'Divulgação no @festasemjf',
    description: 'Sua marca divulgada no nosso Instagram com milhares de seguidores.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Cadastre-se gratuitamente',
    description: 'Crie sua conta em poucos minutos. Sem cartão de crédito para começar.',
  },
  {
    number: '02',
    title: 'Monte seu perfil',
    description: 'Adicione fotos, descrição e escolha sua categoria. Aguarde a aprovação.',
  },
  {
    number: '03',
    title: 'Receba cotações e feche negócios',
    description: 'Clientes entram em contato direto. Você negocia e fecha sem intermediários.',
  },
];

const testimonials = [
  {
    name: 'FunFesta',
    role: 'Fornecedor cadastrado',
    comment: 'Em dois meses já recebi mais de 15 cotações. A plataforma me conectou com clientes que eu nunca alcançaria sozinha.',
    rating: 5,
  },
  {
    name: 'Salgakits',
    role: 'Fornecedor cadastrado',
    comment: 'O investimento se paga no primeiro evento fechado. Fácil de usar e o suporte é excelente.',
    rating: 5,
  },
  {
    name: 'Maria Festerê',
    role: 'Fornecedor cadastrado',
    comment: 'Melhor decisão que tomei para o meu negócio. Os clientes chegam prontos para contratar.',
    rating: 5,
  },
];

const faqs = [
  {
    question: 'Preciso pagar para me cadastrar?',
    answer: 'O cadastro é gratuito. Você só paga quando escolher um dos planos para ter seu perfil visível e receber cotações.',
  },
  {
    question: 'Quanto tempo leva para ser aprovado?',
    answer: 'Nosso time analisa cada cadastro em até 48 horas úteis. Você recebe um email assim que for aprovado.',
  },
  {
    question: 'Existe taxa sobre os negócios fechados?',
    answer: 'Não! A JF Festas não cobra nenhuma comissão sobre os negócios que você fechar com seus clientes.',
  },
  {
    question: 'Posso cancelar meu plano a qualquer momento?',
    answer: 'Sim. Seus planos são anuais, mas você pode cancelar a renovação a qualquer momento sem multas.',
  },
];

const meiFeatures = [
  'Perfil na plataforma',
  'Receba cotações de clientes',
  'Sem taxas de agenciamento',
  'Avaliações de clientes',
  'Cupons e promoções',
  'Dashboard com relatórios',
];

const empresarialFeatures = [
  'Tudo do plano MEI',
  'Link do site oficial',
  'Prioridade em destaque',
  'Badge de Plano Empresarial',
  'Suporte prioritário',
];

export function VendorLandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="container relative py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/15 border-primary/20 px-4 py-1.5 text-sm font-medium">
              Para Fornecedores
            </Badge>
            <h1 className="mb-6 font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Aumente suas vendas com a{' '}
              <span className="text-gradient-orange">JF Festas</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Conecte-se com centenas de clientes em Juiz de Fora que estão procurando
              fornecedores como você para suas festas e eventos.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-gradient-coral shadow-coral text-lg px-8 py-6"
                onClick={() => setAuthModalOpen(true)}
              >
                Comece Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-2"
                asChild
              >
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <Phone className="mr-2 h-5 w-5" />
                  Agende uma Demonstração
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="border-b border-border bg-card py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-display text-2xl font-bold md:text-3xl">{stat.value}</span>
                  <span className="mt-1 text-sm text-muted-foreground">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
              Por que fornecedores escolhem a JF Festas?
            </h2>
            <p className="text-lg text-muted-foreground">
              Tudo o que você precisa para divulgar seu negócio e conquistar novos clientes.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title} className="hover-lift border-border/50 bg-gradient-card">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 font-display text-lg font-semibold">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
              Como funciona?
            </h2>
            <p className="text-lg text-muted-foreground">
              Em 3 passos simples você começa a receber cotações.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-coral shadow-coral">
                  <span className="font-display text-2xl font-bold text-primary-foreground">{step.number}</span>
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="absolute right-0 top-8 hidden h-0.5 w-full translate-x-1/2 bg-border md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
              Planos acessíveis para todo negócio
            </h2>
            <p className="text-lg text-muted-foreground">
              Escolha o plano ideal e comece a receber clientes hoje.
            </p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
            {/* MEI Plan */}
            <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-card hover-lift">
              <div className="absolute right-4 top-4">
                <Badge className="bg-primary/10 text-primary border-primary/20">Popular</Badge>
              </div>
              <CardContent className="p-6 pt-8">
                <div className="mb-1 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-xl font-bold">Plano MEI</h3>
                </div>
                <div className="mb-6">
                  <span className="font-display text-4xl font-bold">R$ {MEI_PLAN_PRICE}</span>
                  <span className="text-muted-foreground">/ano</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {meiFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-gradient-coral shadow-coral" size="lg" asChild>
                  <a href={STRIPE_MEI_LINK} target="_blank" rel="noopener noreferrer">
                    Começar Agora
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Empresarial Plan */}
            <Card className="relative overflow-hidden border-2 border-secondary/20 bg-gradient-card hover-lift">
              <div className="absolute right-4 top-4">
                <Badge className="bg-secondary/10 text-secondary border-secondary/20">Completo</Badge>
              </div>
              <CardContent className="p-6 pt-8">
                <div className="mb-1 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-secondary" />
                  <h3 className="font-display text-xl font-bold">Plano Empresarial</h3>
                </div>
                <div className="mb-6">
                  <span className="font-display text-4xl font-bold">R$ {EMPRESARIAL_PLAN_PRICE}</span>
                  <span className="text-muted-foreground">/ano</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {empresarialFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-secondary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-gradient-teal shadow-teal" size="lg" asChild>
                  <a href={STRIPE_EMPRESARIAL_LINK} target="_blank" rel="noopener noreferrer">
                    Começar Agora
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
              O que dizem nossos fornecedores
            </h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="bg-background hover-lift">
                <CardContent className="p-6">
                  <Quote className="mb-4 h-8 w-8 text-primary/20" />
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">"{t.comment}"</p>
                  <div className="mb-2 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-center font-display text-3xl font-bold md:text-4xl">
              Perguntas frequentes
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-coral py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Pronto para crescer seu negócio?
            </h2>
            <p className="mb-8 text-lg text-primary-foreground/80">
              Junte-se aos fornecedores que já estão fechando mais negócios com a JF Festas.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6"
                onClick={() => setAuthModalOpen(true)}
              >
                Comece Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                className="text-lg px-8 py-6 border-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <Phone className="mr-2 h-5 w-5" />
                  Agende uma Demonstração
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <img src={logoJfFestas} alt="JF Festas" className="h-8 w-auto" />
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Instagram className="h-4 w-4" />
                @festasemjf
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} JF Festas. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        mode="vendor"
      />
    </div>
  );
}
