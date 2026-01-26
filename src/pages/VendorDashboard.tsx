import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { LEAD_PRICE, SUBSCRIPTION_PRICE } from '@/lib/constants';
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
  subscription_status: string;
  subscription_expiry: string | null;
  business_name: string;
}

function DashboardContent() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user || profile?.role !== 'vendor') {
      navigate('/');
      return;
    }

    async function fetchData() {
      // Fetch vendor info
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('subscription_status, subscription_expiry, business_name')
        .eq('profile_id', user!.id)
        .maybeSingle();

      if (vendorData) {
        setVendorInfo(vendorData);
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

      setLoading(false);
    }

    fetchData();
  }, [user, profile, authLoading, navigate]);

  const handleUnlock = async (quoteId: string) => {
    setUnlocking(quoteId);
    
    try {
      // In a real app, this would integrate with Stripe/PIX
      // For now, we'll simulate a successful payment
      const { error } = await supabase.from('leads_access').insert({
        quote_id: quoteId,
        vendor_id: user!.id,
        payment_status: 'paid',
        unlocked_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Contato liberado!',
        description: 'Agora você pode ver os dados do cliente.',
      });

      // Refresh quotes
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
    } catch (error: any) {
      toast({
        title: 'Erro no pagamento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUnlocking(null);
    }
  };

  const handleActivateSubscription = async () => {
    // In a real app, this would redirect to Stripe checkout
    toast({
      title: 'Em desenvolvimento',
      description: 'Integração com pagamento em breve!',
    });
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Subscription Status Card */}
        <Card className={cn(
          'mb-8 border-2',
          vendorInfo?.subscription_status === 'active'
            ? 'border-sage bg-sage-light/20'
            : 'border-coral-light bg-coral-light/10'
        )}>
          <CardContent className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
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
                            disabled={unlocking === quote.id || vendorInfo?.subscription_status !== 'active'}
                            className="bg-gradient-coral shadow-coral"
                          >
                            {unlocking === quote.id ? (
                              'Processando...'
                            ) : (
                              <>
                                <Lock className="mr-2 h-4 w-4" />
                                Liberar (R$ {LEAD_PRICE})
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
