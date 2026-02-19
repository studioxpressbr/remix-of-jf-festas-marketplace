import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MEI_PLAN_PRICE,
  EMPRESARIAL_PLAN_PRICE,
  LEAD_PRICE,
  STRIPE_MEI_PLAN,
  STRIPE_EMPRESARIAL_PLAN,
  STRIPE_LEAD_CREDITS,
} from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, Sparkles, Users, Star, Shield, Zap, Lock, Globe } from "lucide-react";

function PrecosContent() {
  const { user, profile } = useAuthContext();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<"mei" | "empresarial">("mei");

  const handleSubscribe = async (planType: "mei" | "empresarial") => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login como fornecedor para assinar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const plan = planType === "empresarial" ? STRIPE_EMPRESARIAL_PLAN : STRIPE_MEI_PLAN;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId: plan.priceId,
          mode: "subscription",
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      toast({
        title: "Erro ao processar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleBuyCredits = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login como fornecedor para comprar créditos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId: STRIPE_LEAD_CREDITS.priceId,
          mode: "payment",
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      toast({
        title: "Erro ao processar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const meiFeatures = [
    { icon: Crown, text: "Perfil destacado na plataforma" },
    { icon: Users, text: "Receba cotações de clientes" },
    { icon: Users, text: "Sem taxas de agenciamento" },
    { icon: Users, text: "Negocie direto com o cliente" },
    { icon: Star, text: "Avaliações de clientes" },
    { icon: Zap, text: "Acesso a bônus exclusivos" },
  ];

  const empresarialFeatures = [
    { icon: Crown, text: "Tudo do plano MEI" },
    { icon: Globe, text: "Link do site oficial da empresa" },
    { icon: Users, text: "Prioridade em destaque" },
    { icon: Star, text: "Badge de Plano Empresarial" },
    { icon: Crown, text: "Relatório gerencial avançado" },
    { icon: Zap, text: "Divulgação semanal no Instagram" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12">
        {/* Hero Section */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="mr-1 h-3 w-3" />
            Preços Transparentes
          </Badge>
          <h1 className="mb-4 font-display text-4xl font-bold md:text-5xl">
            Cresça seu negócio com a <span className="text-coral">JF Festas</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Conecte-se com clientes que estão buscando exatamente o que você oferece.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {/* MEI Plan */}
          <Card className="relative overflow-hidden border-2 border-coral-light bg-gradient-card">
            <CardHeader className="pb-4">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-coral">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="font-display text-2xl">Plano MEI</CardTitle>
              <CardDescription>Ideal para negócios iniciantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">R$ {MEI_PLAN_PRICE}</span>
                <span className="text-muted-foreground">/ano</span>
              </div>

              <ul className="space-y-3">
                {meiFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-light flex-shrink-0">
                      <Check className="h-4 w-4 text-sage" />
                    </div>
                    <span className="text-sm">{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe("mei")}
                className="w-full bg-gradient-coral shadow-coral"
                size="lg"
              >
                Começar Agora
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Pagamento seguro via Stripe. Cancele quando quiser.
              </p>
            </CardContent>
          </Card>

          {/* Empresarial Plan */}
          <Card className="relative overflow-hidden border-2 border-amber-400 bg-gradient-card md:scale-105">
            <div className="absolute right-0 top-0 bg-amber-500 px-3 py-1 text-xs font-medium text-white">
              Recomendado
            </div>
            <CardHeader className="pb-4">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <Crown className="h-6 w-6 text-amber-700" />
              </div>
              <CardTitle className="font-display text-2xl">Plano Empresarial</CardTitle>
              <CardDescription>Para empresas e profissionais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">R$ {EMPRESARIAL_PLAN_PRICE}</span>
                <span className="text-muted-foreground">/ano</span>
              </div>

              <ul className="space-y-3">
                {empresarialFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 flex-shrink-0">
                      <Check className="h-4 w-4 text-amber-700" />
                    </div>
                    <span className="text-sm">{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe("empresarial")}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                size="lg"
              >
                Começar Agora
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Pagamento seguro via Stripe. Cancele quando quiser.
              </p>
            </CardContent>
          </Card>

          {/* Lead Credits */}
          <Card className="border-2 border-border bg-gradient-card">
            <CardHeader className="pb-4">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-champagne">
                <Lock className="h-6 w-6 text-secondary-foreground" />
              </div>
              <CardTitle className="font-display text-2xl">Créditos de Contato</CardTitle>
              <CardDescription>Pague apenas quando quiser ver os dados de um cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">R$ {LEAD_PRICE}</span>
                <span className="text-muted-foreground">/contato</span>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-light flex-shrink-0">
                    <Check className="h-4 w-4 text-sage" />
                  </div>
                  <span className="text-sm">Nome completo do cliente</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-light flex-shrink-0">
                    <Check className="h-4 w-4 text-sage" />
                  </div>
                  <span className="text-sm">WhatsApp para contato direto</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-light flex-shrink-0">
                    <Check className="h-4 w-4 text-sage" />
                  </div>
                  <span className="text-sm">E-mail do cliente</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-light flex-shrink-0">
                    <Check className="h-4 w-4 text-sage" />
                  </div>
                  <span className="text-sm">Detalhes do evento</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-light flex-shrink-0">
                    <Check className="h-4 w-4 text-sage" />
                  </div>
                  <span className="text-sm">Enviar proposta com contrato</span>
                </li>
              </ul>

              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-center text-sm text-muted-foreground">
                  💡 O crédito é cobrado apenas quando você opta por ver os dados de um cliente específico.
                </p>
              </div>

              <Button onClick={handleBuyCredits} variant="outline" className="w-full" size="lg">
                Comprar Créditos
              </Button>

              <p className="text-center text-xs text-muted-foreground">Requer assinatura ativa do Plano Anual.</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-8 text-center font-display text-2xl font-semibold">Perguntas Frequentes</h2>
          <div className="space-y-4">
            <Card className="bg-gradient-card">
              <CardContent className="py-4">
                <h3 className="font-semibold">Como funciona a aprovação?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Após o cadastro, nossa equipe revisa seu perfil em até 24 horas. Você receberá um e-mail quando for
                  aprovado.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card">
              <CardContent className="py-4">
                <h3 className="font-semibold">Qual a diferença entre MEI e Empresarial?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  O plano Empresarial permite adicionar o link do site oficial da sua empresa e oferece prioridade em
                  destaque. Ideal para empresas que querem maior visibilidade.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card">
              <CardContent className="py-4">
                <h3 className="font-semibold">Posso cancelar a assinatura?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sim! Você pode cancelar a qualquer momento. O acesso continua até o fim do período pago.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card">
              <CardContent className="py-4">
                <h3 className="font-semibold">Como recebo as cotações?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  As cotações aparecem no seu painel de fornecedor. Você escolhe quais contatos deseja liberar pagando o
                  crédito.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Precos() {
  return (
    <AuthProvider>
      <PrecosContent />
    </AuthProvider>
  );
}
