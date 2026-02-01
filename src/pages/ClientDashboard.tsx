import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { ClientEditProfileModal } from '@/components/client/ClientEditProfileModal';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Quote {
  id: string;
  event_date: string;
  pax_count: number;
  description: string | null;
  status: 'open' | 'unlocked' | 'completed' | 'cancelled';
  created_at: string;
  vendor: {
    business_name: string;
    category: string;
    images: string[] | null;
  } | null;
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
    }
  }, [user]);

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

      // Fetch vendor details for each quote
      const quotesWithVendors = await Promise.all(
        (data || []).map(async (quote) => {
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('business_name, category, images')
            .eq('profile_id', quote.vendor_id)
            .single();

          return {
            ...quote,
            vendor: vendorData,
          };
        })
      );

      setQuotes(quotesWithVendors);
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
                      <Badge variant={statusLabels[quote.status]?.variant || 'secondary'}>
                        {statusLabels[quote.status]?.label || quote.status}
                      </Badge>
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
    </div>
  );
}
