import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditBalanceCard } from '@/components/vendor/CreditBalanceCard';
import { PendingApprovalCard } from '@/components/vendor/PendingApprovalCard';
import { VendorEditProfileModal } from '@/components/vendor/VendorEditProfileModal';
import { VendorContactModal } from '@/components/vendor/VendorContactModal';
import { VendorCouponsSection } from '@/components/vendor/VendorCouponsSection';
import { DealClosedModal } from '@/components/vendor/DealClosedModal';
import { VendorReviewClientModal } from '@/components/vendor/VendorReviewClientModal';
import { DeleteAccountModal } from '@/components/vendor/DeleteAccountModal';
import { VendorProposalModal } from '@/components/vendor/VendorProposalModal';
import { supabase } from '@/integrations/supabase/client';
import { MEI_PLAN_PRICE, EMPRESARIAL_PLAN_PRICE, STRIPE_MEI_PLAN, STRIPE_EMPRESARIAL_PLAN } from '@/lib/constants';
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
  Pencil,
  UserCog,
  Handshake,
  Star,
  Trash2,
  DollarSign,
  Send,
  Clock,
} from 'lucide-react';
import { cn, formatBRL } from '@/lib/utils';
import { StarRating } from '@/components/ui/star-rating';

interface LeadAccess {
  id: string;
  payment_status: string;
  deal_closed: boolean;
  deal_value: number | null;
  deal_closed_at: string | null;
}

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
  leads_access: LeadAccess[] | null;
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
  website_url: string | null;
  instagram_url: string | null;
  images: string[] | null;
  approval_status: string;
  is_approved: boolean;
  submitted_at: string | null;
  created_at: string;
  vendor_type: 'mei' | 'empresarial';
}

interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface ClientReview {
  quote_id: string;
  rating: number;
}

interface ClientRating {
  client_id: string;
  avg_rating: number;
  review_count: number;
}

function DashboardContent() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [clientReviews, setClientReviews] = useState<ClientReview[]>([]);
  const [clientRatings, setClientRatings] = useState<ClientRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [dealModal, setDealModal] = useState<{ leadAccessId: string; clientName: string } | null>(null);
  const [reviewModal, setReviewModal] = useState<{
    quoteId: string;
    clientId: string;
    clientName: string;
    eventDate: string;
  } | null>(null);
  const [proposalModal, setProposalModal] = useState<{
    quoteId: string;
    clientName: string;
  } | null>(null);
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

  const fetchData = async () => {
    if (!user) return;
    
    // Fetch vendor info with all fields needed for pending state
    const { data: vendorData } = await supabase
      .from('vendors')
      .select('id, subscription_status, subscription_expiry, business_name, category, custom_category, description, neighborhood, images, approval_status, is_approved, submitted_at, created_at, vendor_type')
      .eq('profile_id', user.id)
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
        leads_access(id, payment_status, deal_closed, deal_value, deal_closed_at)
      `)
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (quotesData) {
      setQuotes(quotesData as Quote[]);
    }

    // Fetch client reviews made by this vendor
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('quote_id, rating')
      .eq('reviewer_id', user.id);

    if (reviewsData) {
      setClientReviews(reviewsData);
    }

    // Fetch ratings received by clients (reviews where target_id = client_id)
    if (quotesData && quotesData.length > 0) {
      const clientIds = [...new Set(quotesData.map((q: any) => q.client_id))];
      const { data: ratingsData } = await supabase
        .from('reviews')
        .select('target_id, rating')
        .in('target_id', clientIds);

      if (ratingsData && ratingsData.length > 0) {
        const grouped = ratingsData.reduce((acc: Record<string, number[]>, r: any) => {
          if (!acc[r.target_id]) acc[r.target_id] = [];
          acc[r.target_id].push(r.rating);
          return acc;
        }, {});
        const ratings: ClientRating[] = Object.entries(grouped).map(([client_id, vals]) => ({
          client_id,
          avg_rating: (vals as number[]).reduce((a, b) => a + b, 0) / (vals as number[]).length,
          review_count: (vals as number[]).length,
        }));
        setClientRatings(ratings);
      }
    }

    // Fetch credits
    await fetchCredits(user.id);

    setLoading(false);
  };

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If no user, redirect to home
    if (!user) {
      navigate('/');
      return;
    }

    // If profile is loaded and not a vendor, redirect
    if (profile && profile.role !== 'vendor') {
      navigate('/');
      return;
    }

    // If we have a user and profile is vendor (or still loading profile), fetch data
    if (profile?.role === 'vendor') {
      fetchData();
    }
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
            leads_access(id, payment_status, deal_closed, deal_value, deal_closed_at)
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
      const planType = vendorInfo?.vendor_type || 'mei';
      const plan = planType === 'empresarial' ? STRIPE_EMPRESARIAL_PLAN : STRIPE_MEI_PLAN;
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: plan.priceId,
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

  // Show loading state while auth or data is loading
  if (authLoading || loading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="mb-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Carregando sua área...
            </p>
          </div>
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
            {/* Profile Visibility Banner */}
            {vendorInfo && (
              <div className={cn(
                'mb-6 flex items-center gap-3 rounded-lg border px-4 py-3',
                vendorInfo.is_approved && vendorInfo.subscription_status === 'active'
                  ? 'border-sage/30 bg-sage/10 text-sage'
                  : 'border-coral/30 bg-coral/10 text-coral'
              )}>
                {vendorInfo.is_approved && vendorInfo.subscription_status === 'active' ? (
                  <>
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">
                      ✅ Seu perfil está visível na plataforma. Clientes podem encontrar e solicitar cotações.
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">
                      {!vendorInfo.is_approved
                        ? '⏳ Seu perfil está oculto — aguardando aprovação do administrador.'
                        : '⚠️ Seu perfil está oculto — ative sua assinatura para aparecer na plataforma.'}
                    </p>
                  </>
                )}
              </div>
            )}

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
                  <div className="flex items-start justify-between gap-4">
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
                        {vendorInfo?.subscription_status === 'active' && vendorInfo?.subscription_expiry && (
                          <p className="text-xs text-muted-foreground">
                            Válido até: {format(new Date(vendorInfo.subscription_expiry), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setContactModalOpen(true)}
                      >
                        <UserCog className="mr-2 h-4 w-4" />
                        Contato
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditModalOpen(true)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Perfil
                      </Button>
                    </div>
                  </div>
                    {vendorInfo?.subscription_status !== 'active' && (
                    <Button
                      onClick={handleActivateSubscription}
                      className="bg-gradient-coral shadow-coral"
                    >
                      Ativar Plano
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
                vendorId={user?.id}
              />
            </div>

            {/* Coupons Section */}
            <div className="mb-8">
              <VendorCouponsSection vendorId={vendorInfo.id} />
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
              const leadAccess = quote.leads_access?.find(la => la.payment_status === 'paid');
              const dealClosed = leadAccess?.deal_closed;
              const dealValue = leadAccess?.deal_value;
              const hasReviewed = clientReviews.some(r => r.quote_id === quote.id);

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
                            {unlocked && (() => {
                              const cr = clientRatings.find(r => r.client_id === quote.client_id);
                              return cr ? (
                                <StarRating rating={cr.avg_rating} reviewCount={cr.review_count} size="sm" />
                              ) : (
                                <StarRating rating={0} reviewCount={0} size="sm" />
                              );
                            })()}
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
                          <>
                            {dealClosed ? (
                              <Badge className="bg-primary text-primary-foreground border-0">
                                <DollarSign className="mr-1 h-3 w-3" />
                                {formatBRL(dealValue ?? 0)}
                              </Badge>
                            ) : (
                              <Badge className="bg-sage text-sage-foreground border-0">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Liberado
                              </Badge>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {!dealClosed && leadAccess && !(quote as any).proposed_at && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setProposalModal({
                                    quoteId: quote.id,
                                    clientName: quote.profiles?.full_name || 'Cliente',
                                  })}
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  Enviar Proposta
                                </Button>
                              )}
                              {!dealClosed && (quote as any).proposed_at && (
                                <>
                                  {(quote as any).client_response === 'accepted' ? (
                                    <Badge className="text-xs bg-green-600 hover:bg-green-600/90">
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Proposta Aceita
                                    </Badge>
                                  ) : (quote as any).client_response === 'rejected' ? (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertCircle className="mr-1 h-3 w-3" />
                                      Proposta Recusada
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      <Clock className="mr-1 h-3 w-3" />
                                      Aguardando Resposta
                                    </Badge>
                                  )}
                                  {(quote as any).proposed_value && (
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {formatBRL((quote as any).proposed_value)}
                                    </span>
                                  )}
                                </>
                              )}
                              {!dealClosed && leadAccess && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDealModal({
                                    leadAccessId: leadAccess.id,
                                    clientName: quote.profiles?.full_name || 'Cliente',
                                  })}
                                >
                                  <Handshake className="mr-2 h-4 w-4" />
                                  Fechei negócio
                                </Button>
                              )}
                              {dealClosed && !hasReviewed && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setReviewModal({
                                    quoteId: quote.id,
                                    clientId: quote.client_id,
                                    clientName: quote.profiles?.full_name || 'Cliente',
                                    eventDate: quote.event_date,
                                  })}
                                >
                                  <Star className="mr-2 h-4 w-4" />
                                  Avaliar cliente
                                </Button>
                              )}
                              {hasReviewed && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />
                                  Avaliado
                                </Badge>
                              )}
                            </div>
                          </>
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

        {/* Danger Zone - Delete Account */}
        <Card className="mt-8 border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <Trash2 className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Esta ação é irreversível e removerá todos os seus dados da plataforma.
            </p>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir minha conta
            </Button>
          </CardContent>
        </Card>
        </>
        )}

        {/* Edit Profile Modal */}
        {vendorInfo && (
          <VendorEditProfileModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            vendorData={{
              id: vendorInfo.id,
              business_name: vendorInfo.business_name,
              category: vendorInfo.category as 'confeitaria' | 'doces' | 'salgados' | 'decoracao' | 'outros',
              custom_category: vendorInfo.custom_category,
              description: vendorInfo.description,
               neighborhood: vendorInfo.neighborhood,
              website_url: vendorInfo.website_url,
              instagram_url: vendorInfo.instagram_url,
              images: vendorInfo.images,
            }}
            onSave={fetchData}
          />
        )}

        {/* Edit Contact Modal */}
        {profile && (
          <VendorContactModal
            open={contactModalOpen}
            onOpenChange={setContactModalOpen}
            profileData={{
              id: profile.id,
              full_name: profile.full_name,
              whatsapp: profile.whatsapp,
              email: profile.email,
            }}
            onSave={fetchData}
          />
        )}

        {/* Delete Account Modal */}
        {vendorInfo && (
          <DeleteAccountModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            vendorId={vendorInfo.id}
            businessName={vendorInfo.business_name}
          />
        )}

        {/* Deal Closed Modal */}
        {dealModal && (
          <DealClosedModal
            open={!!dealModal}
            onOpenChange={(open) => !open && setDealModal(null)}
            leadAccessId={dealModal.leadAccessId}
            clientName={dealModal.clientName}
            onSuccess={fetchData}
          />
        )}

        {/* Review Client Modal */}
        {reviewModal && user && (
          <VendorReviewClientModal
            open={!!reviewModal}
            onOpenChange={(open) => !open && setReviewModal(null)}
            quoteId={reviewModal.quoteId}
            clientId={reviewModal.clientId}
            clientName={reviewModal.clientName}
            vendorId={user.id}
            eventDate={reviewModal.eventDate}
            onSuccess={fetchData}
          />
        )}

        {/* Proposal Modal */}
        {proposalModal && (
          <VendorProposalModal
            open={!!proposalModal}
            onOpenChange={(open) => !open && setProposalModal(null)}
            quoteId={proposalModal.quoteId}
            clientName={proposalModal.clientName}
            onSuccess={fetchData}
          />
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
