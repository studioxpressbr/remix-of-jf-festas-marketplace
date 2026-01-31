import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditBalanceCard } from '@/components/vendor/CreditBalanceCard';
import { PendingApprovalCard } from '@/components/vendor/PendingApprovalCard';
import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_PRICE, STRIPE_ANNUAL_PLAN } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Users,
  Phone,
  Mail,
  User,
  Lock,
  CheckCircle,
  AlertCircle,
  Crown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Quote {
  id: string;
  client_id: string;
  event_date: string;
  pax_count: number;
  description: string | null;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    whatsapp: string | null;
    email: string | null;
  } | null;
  leads_access: {
    payment_status: string;
  }[] | null;
}

interface VendorInfo {
  id: string;
  subscription_status: string;
  subscription_expiry: string | null;
  business_name: string;
  category: string;
  custom_category: string | null;
  description: string | null;
  neighborhood: string | null;
  images: string[] | null;
  approval_status: string;
  is_approved: boolean;
  submitted_at: string | null;
  created_at: string;
}

interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

function DashboardContent() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const fetchCredits = async (userId: string) => {
    // Fetch credit balance and transactions
    const { data: creditsData } = await supabase
      .from('vendor_credits')
      .select('*')
      .eq('vendor_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (creditsData && creditsData.length > 0) {
      setCreditBalance(creditsData[0].balance_after);
      setCreditTransactions(creditsData);
    } else {
      setCreditBalance(0);
      setCreditTransactions([]);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user || profile?.role !== 'vendor') {
      navigate('/');
      return;
    }

    async function fetchData() {
      // Fetch vendor info with all fields needed for pending state
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, subscription_status, subscription_expiry, business_name, category, custom_category, description, neighborhood, images, approval_status, is_approved, submitted_at, created_at')
        .eq('profile_id', user!.id)
        .maybeSingle();

      if (vendorData) {
        setVendorInfo(vendorData as VendorInfo);
      }

      // Fetch quotes
      const { data: quotesData } = await supabase
        .from('quotes')
        .select(`
          *,
          profiles!quotes_client_id_fkey(full_name, whatsapp, email),
          leads_access(payment_status)
        `)
        .eq('vendor_id', user!.id)
        .order('created_at', { ascending: false });

      if (quotesData) {
        setQuotes(quotesData as Quote[]);
      }

      // Fetch credits
      await fetchCredits(user!.id);

      setLoading(false);
    }

    fetchData();
  }, [user, profile, authLoading, navigate]);

  const handleUnlock = async (quoteId: string) => {
    setUnlocking(quoteId);
    
    try {
      // Use credit to unlock lead
      const { data, error } = await supabase.functions.invoke('use-credit', {
        body: { quoteId },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Contato liberado!',
          description: 'Agora você pode ver os dados do cliente.',
        });
        
        // Update local state
        setCreditBalance(data.newBalance);
        
        // Refresh quotes to show unlocked state
        const { data: updatedQuotes } = await supabase
          .from('quotes')
          .select(`
            *,
            profiles!quotes_client_id_fkey(full_name, whatsapp, email),
            leads_access(payment_status)
          `)
          .eq('vendor_id', user!.id)
          .order('created_at', { ascending: false });

        if (updatedQuotes) {
          setQuotes(updatedQuotes as Quote[]);
        }

        // Refresh credit transactions
        await fetchCredits(user!.id);
      } else if (data?.needsCredits) {
        toast({
          title: 'Saldo insuficiente',
          description: 'Compre créditos para liberar este contato.',
          variant: 'destructive',
        });
      } else {
        throw new Error(data?.message || 'Erro ao liberar contato');
      }
    } catch (error: unknown) {
      toast({
        title: 'Erro ao processar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setUnlocking(null);
    }
  };

  const handlePurchaseCredits = async (quantity: number) => {
    setPurchaseLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { quantity },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      toast({
        title: 'Erro ao processar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
      setPurchaseLoading(false);
    }
  };

  const handleActivateSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: STRIPE_ANNUAL_PLAN.priceId,
          mode: 'subscription',
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: unknown) {
      toast({
        title: 'Erro ao processar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  const isContactUnlocked = (quote: Quote) => {
    return quote.leads_access?.some((la) => la.payment_status === 'paid');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="mb-8 h-32 w-full rounded-xl" />
          <Skeleton className="mb-4 h-8 w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Show pending approval state if vendor is not approved
  const isPendingApproval = vendorInfo && !vendorInfo.is_approved;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Show pending approval card if not approved */}
        {isPendingApproval ? (
          <PendingApprovalCard vendor={vendorInfo} />
        ) : !vendorInfo ? (
          // No vendor record found - redirect to onboarding
          <Card className="bg-gradient-card">
            <CardContent className="py-12 text-center">
              <span className="mb-4 block text-5xl">📝</span>
              <h3 className="font-display text-lg font-semibold">
                Complete seu cadastro
              </h3>
              <p className="mt-2 text-sm text-muted-foreground mb-4">
                Você ainda não completou o cadastro do seu negócio.
              </p>
              <Button 
                onClick={() => navigate('/cadastro-fornecedor')}
                className="bg-gradient-coral shadow-coral"
              >
                Completar Cadastro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Two-column layout for subscription and credits */}
            <div className="mb-8 grid gap-6 md:grid-cols-2">
              {/* Subscription Status Card */}
              <Card className={cn(
                'border-2',
                vendorInfo?.subscription_status === 'active'
                  ? 'border-sage bg-sage-light/20'
                  : 'border-coral-light bg-coral-light/10'
              )}>
                <CardContent className="flex flex-col gap-4 py-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'rounded-full p-3',
                      vendorInfo?.subscription_status === 'active'
                        ? 'bg-sage'
                        : 'bg-coral-light'
                    )}>
                      <Crown className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-semibold">
                        {vendorInfo?.business_name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {vendorInfo?.subscription_status === 'active' ? (
                          <>
                            <CheckCircle className="mr-1 inline h-4 w-4 text-sage" />
                            Assinatura ativa
                          </>
                        ) : (
                          <>
                            <AlertCircle className="mr-1 inline h-4 w-4 text-coral" />
                            Assinatura inativa
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  {vendorInfo?.subscription_status !== 'active' && (
                    <Button
                      onClick={handleActivateSubscription}
                      className="bg-gradient-coral shadow-coral"
                    >
                      Ativar por R$ {SUBSCRIPTION_PRICE}/ano
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Credit Balance Card */}
              <CreditBalanceCard
                balance={creditBalance}
                transactions={creditTransactions}
                loading={loading}
                onPurchase={handlePurchaseCredits}
                purchaseLoading={purchaseLoading}
              />
            </div>

        {/* Quotes Section */}
        <h2 className="mb-4 font-display text-2xl font-semibold">
          Cotações Recebidas
        </h2>

        {quotes.length === 0 ? (
          <Card className="bg-gradient-card">
            <CardContent className="py-12 text-center">
              <span className="mb-4 block text-5xl">📭</span>
              <h3 className="font-display text-lg font-semibold">
                Nenhuma cotação ainda
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                As solicitações dos clientes aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => {
              const unlocked = isContactUnlocked(quote);

              return (
                <Card key={quote.id} className="overflow-hidden bg-gradient-card">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      {/* Quote Info */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(quote.event_date), "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {quote.pax_count} pessoas
                          </span>
                        </div>

                        {quote.description && (
                          <p className="max-w-xl text-sm">{quote.description}</p>
                        )}

                        {/* Contact Info (blurred or visible) */}
                        <div className={cn(
                          'mt-4 space-y-2 rounded-lg border p-4 transition-all',
                          unlocked ? 'border-sage bg-sage-light/30' : 'border-border bg-muted/50'
                        )}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className={cn(!unlocked && 'blur-sm select-none')}>
                              {quote.profiles?.full_name || 'Cliente'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className={cn(!unlocked && 'blur-sm select-none')}>
                              {quote.profiles?.whatsapp || '(11) 99999-9999'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className={cn(!unlocked && 'blur-sm select-none')}>
                              {quote.profiles?.email || 'email@exemplo.com'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex flex-col items-end gap-2">
                        {unlocked ? (
                          <Badge className="bg-sage text-sage-foreground border-0">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Liberado
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => handleUnlock(quote.id)}
                            disabled={
                              unlocking === quote.id || 
                              vendorInfo?.subscription_status !== 'active' ||
                              creditBalance < 1
                            }
                            className="bg-gradient-coral shadow-coral"
                          >
                            {unlocking === quote.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Liberando...
                              </>
                            ) : creditBalance < 1 ? (
                              'Sem créditos'
                            ) : (
                              <>
                                <Lock className="mr-2 h-4 w-4" />
                                Usar 1 crédito
                              </>
                            )}
                          </Button>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Recebido em {format(new Date(quote.created_at), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}

export default function VendorDashboard() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
