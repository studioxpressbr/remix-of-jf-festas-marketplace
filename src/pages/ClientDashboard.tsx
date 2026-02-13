import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { ClientEditProfileModal } from '@/components/client/ClientEditProfileModal';
import { ClientReviewVendorModal } from '@/components/client/ClientReviewVendorModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Users,
  FileText,
  Edit,
  Clock,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { StarRating } from '@/components/ui/star-rating';
import { ptBR } from 'date-fns/locale';

interface LeadAccess {
  quote_id: string;
  deal_closed: boolean;
  deal_value: number | null;
  vendor_id: string;
}

interface Quote {
  id: string;
  event_date: string;
  pax_count: number;
  description: string | null;
  status: 'open' | 'unlocked' | 'completed' | 'cancelled';
  created_at: string;
  vendor_id: string;
  vendor: {
    business_name: string;
    category: string;
    images: string[] | null;
  } | null;
  leadAccess?: LeadAccess | null;
  hasReview?: boolean;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  open: { label: 'Aguardando', variant: 'secondary' },
  unlocked: { label: 'Em Andamento', variant: 'default' },
  completed: { label: 'Concluída', variant: 'outline' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

const categoryLabels: Record<string, string> = {
  confeitaria: 'Confeitaria',
  doces: 'Doces',
  salgados: 'Salgados',
  decoracao: 'Decoração',
  outros: 'Outros',
};

export default function ClientDashboard() {
  const { user, profile, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedQuoteForReview, setSelectedQuoteForReview] = useState<Quote | null>(null);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
    if (!authLoading && profile?.role !== 'client') {
      navigate('/dashboard');
    }
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchQuotes();
      fetchClientRating();
    }
  }, [user]);

  const fetchClientRating = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('reviews')
        .select('rating')
        .eq('target_id', user.id);
      if (data && data.length > 0) {
        const avg = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
        setAvgRating(avg);
        setReviewCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching client rating:', error);
    }
  };

  const fetchQuotes = async () => {
    if (!user) return;

    setLoadingQuotes(true);
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id,
          event_date,
          pax_count,
          description,
          status,
          created_at,
          vendor_id
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch vendor details, leads_access, and reviews in parallel for each quote
      const quotesWithDetails = await Promise.all(
        (data || []).map(async (quote) => {
          const [vendorResult, leadResult, reviewResult] = await Promise.all([
            supabase
              .from('vendors')
              .select('business_name, category, images')
              .eq('profile_id', quote.vendor_id)
              .single(),
            supabase
              .from('leads_access')
              .select('quote_id, deal_closed, deal_value, vendor_id')
              .eq('quote_id', quote.id)
              .eq('deal_closed', true)
              .maybeSingle(),
            supabase
              .from('reviews')
              .select('id')
              .eq('quote_id', quote.id)
              .eq('reviewer_id', user.id)
              .maybeSingle(),
          ]);

          return {
            ...quote,
            vendor: vendorResult.data,
            leadAccess: leadResult.data as LeadAccess | null,
            hasReview: !!reviewResult.data,
          };
        })
      );

      setQuotes(quotesWithDetails);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleProfileUpdate = () => {
    // Refresh auth context by reloading profile data
    window.location.reload();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48 md:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <h1 className="mb-6 text-2xl font-bold">Minha Conta</h1>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Meus Dados</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{profile.full_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium">{profile.email || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                  <p className="font-medium">{profile.whatsapp || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avaliação</p>
                  <StarRating rating={avgRating} reviewCount={reviewCount} size="md" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quotes List */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Minhas Cotações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingQuotes ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : quotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Você ainda não solicitou nenhuma cotação.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate('/')}
                  >
                    Explorar Fornecedores
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {quote.vendor?.business_name || 'Fornecedor'}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[quote.vendor?.category || 'outros']}
                          </Badge>
                        </div>
                        {quote.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {quote.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(quote.event_date), "dd 'de' MMM, yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {quote.pax_count} pessoas
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Enviada em{' '}
                            {format(new Date(quote.created_at), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                        {/* Review button */}
                        {quote.leadAccess?.deal_closed &&
                          new Date(quote.event_date) < new Date() &&
                          !quote.hasReview && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => {
                                setSelectedQuoteForReview(quote);
                                setReviewModalOpen(true);
                              }}
                            >
                              <Star className="h-3.5 w-3.5" />
                              Avaliar
                            </Button>
                          )}
                        <Badge variant={statusLabels[quote.status]?.variant || 'secondary'}>
                          {statusLabels[quote.status]?.label || quote.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {profile && (
        <ClientEditProfileModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          profile={profile}
          onSuccess={handleProfileUpdate}
        />
      )}

      {selectedQuoteForReview && (
        <ClientReviewVendorModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          quoteId={selectedQuoteForReview.id}
          vendorProfileId={selectedQuoteForReview.vendor_id}
          vendorName={selectedQuoteForReview.vendor?.business_name || 'Fornecedor'}
          clientId={user!.id}
          eventDate={selectedQuoteForReview.event_date}
          dealValue={selectedQuoteForReview.leadAccess?.deal_value ?? null}
          onSuccess={fetchQuotes}
        />
      )}
    </div>
  );
}
