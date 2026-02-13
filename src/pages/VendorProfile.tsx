import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Header } from '@/components/layout/Header';
import { QuoteModal } from '@/components/vendor/QuoteModal';
import { VendorProfileCoupons } from '@/components/vendor/VendorProfileCoupons';
import { StarRating } from '@/components/ui/star-rating';
import { AuthModal } from '@/components/auth/AuthModal';
import { AdminVendorEditModal } from '@/components/admin/AdminVendorEditModal';
import { RejectVendorModal } from '@/components/admin/RejectVendorModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { VENDOR_CATEGORIES, CATEGORY_COLORS } from '@/lib/constants';
import { MapPin, ArrowLeft, MessageCircle, Phone, Mail, CheckCircle, Loader2, Pencil, XCircle, Power, PowerOff, Crown, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface VendorData {
  id: string;
  profile_id: string;
  business_name: string;
  category: string;
  description: string | null;
  neighborhood: string | null;
  images: string[];
  is_approved?: boolean;
  approval_status?: string;
  rejection_reason?: string | null;
  subscription_status?: 'active' | 'inactive' | 'past_due';
  subscription_expiry?: string | null;
  profiles: {
    full_name: string;
    email?: string | null;
    whatsapp?: string | null;
  } | null;
}

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
}

function VendorProfileContent() {
  const { slug, id: legacyId } = useParams<{ slug?: string; id?: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [togglingSubscription, setTogglingSubscription] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [avgRating, setAvgRating] = useState(0);

  const handleApproveVendor = async () => {
    if (!vendor || !user) return;
    
    setApproving(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          is_approved: true,
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('profile_id', vendor.profile_id);

      if (error) throw error;

      setVendor({ ...vendor, is_approved: true, approval_status: 'approved' });
      toast.success('Fornecedor aprovado com sucesso!');
    } catch (error) {
      console.error('Error approving vendor:', error);
      toast.error('Erro ao aprovar fornecedor');
    } finally {
      setApproving(false);
    }
  };

  const handleToggleSubscription = async (activate: boolean) => {
    if (!vendor || !user) return;
    
    setTogglingSubscription(true);
    try {
      const updateData = activate
        ? {
            subscription_status: 'active' as const,
            subscription_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }
        : {
            subscription_status: 'inactive' as const,
            subscription_expiry: null,
          };

      const { error } = await supabase
        .from('vendors')
        .update(updateData)
        .eq('profile_id', vendor.profile_id);

      if (error) throw error;

      setVendor({
        ...vendor,
        subscription_status: updateData.subscription_status,
        subscription_expiry: updateData.subscription_expiry,
      });
      
      toast.success(
        activate 
          ? 'Assinatura ativada com sucesso!' 
          : 'Assinatura revogada com sucesso!'
      );
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('Erro ao alterar assinatura');
    } finally {
      setTogglingSubscription(false);
    }
  };

  const fetchVendor = useCallback(async () => {
    if ((!slug && !legacyId) || adminLoading) return;

    let data, error;

    if (isAdmin && legacyId) {
      // Admin pode ver qualquer vendor com dados de contato (RLS permite)
      const result = await supabase
        .from('vendors')
        .select('*, profiles(full_name, email, whatsapp)')
        .eq('profile_id', legacyId)
        .maybeSingle();
      data = result.data;
      error = result.error;
    } else if (slug) {
      // Buscar por slug na view pública
      const result = await supabase
        .from('vendors_public' as any)
        .select('*, profiles(full_name)')
        .eq('slug', slug)
        .maybeSingle();
      data = result.data;
      error = result.error;

      // Se admin, buscar dados completos com o profile_id encontrado
      if (!error && data && isAdmin) {
        const fullResult = await supabase
          .from('vendors')
          .select('*, profiles(full_name, email, whatsapp)')
          .eq('profile_id', (data as any).profile_id)
          .maybeSingle();
        if (!fullResult.error && fullResult.data) {
          data = fullResult.data;
        }
      }
    } else if (legacyId) {
      // Fallback: buscar por profile_id (URL antiga)
      const result = await supabase
        .from('vendors_public' as any)
        .select('*, profiles(full_name)')
        .eq('profile_id', legacyId)
        .maybeSingle();
      data = result.data;
      error = result.error;
    }

    if (error || !data) {
      navigate('/');
      return;
    }

    setVendor(data as unknown as VendorData);
    setLoading(false);

    // Fetch reviews for this vendor
    const profileId = (data as any).profile_id;
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer_id, profiles!reviews_reviewer_id_fkey(full_name)')
      .eq('target_id', profileId)
      .order('created_at', { ascending: false });

    if (reviewsData && reviewsData.length > 0) {
      const getInitials = (name: string | undefined | null): string => {
        if (!name) return 'C.';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0][0].toUpperCase() + '.';
        return parts[0][0].toUpperCase() + '. ' + parts[parts.length - 1][0].toUpperCase() + '.';
      };

      const mapped = reviewsData.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        reviewer_name: getInitials(r.profiles?.full_name),
      }));
      setReviews(mapped);
      const avg = mapped.reduce((sum: number, r: ReviewData) => sum + r.rating, 0) / mapped.length;
      setAvgRating(avg);
    }
  }, [slug, legacyId, navigate, isAdmin, adminLoading]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  // Dynamic SEO meta tags
  useEffect(() => {
    if (!vendor) return;
    const catLabel = VENDOR_CATEGORIES.find(c => c.value === vendor.category)?.label || vendor.category;
    const title = `${vendor.business_name} - ${catLabel} | JF Festas`;
    const description = vendor.description
      ? vendor.description.slice(0, 155)
      : `${vendor.business_name} - ${catLabel}${vendor.neighborhood ? ` em ${vendor.neighborhood}` : ''}. Solicite uma cotação no JF Festas.`;

    document.title = title;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        if (name.startsWith('og:')) {
          el.setAttribute('property', name);
        } else {
          el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('og:title', title);
    setMeta('og:description', description);
    if (vendor.images?.[0]) {
      setMeta('og:image', vendor.images[0]);
    }

    return () => {
      document.title = 'JF Festas - Encontre fornecedores para sua festa';
    };
  }, [vendor]);

  const handleQuoteClick = () => {
    if (!user) {
      setAuthModalOpen(true);
    } else if (user.id === vendor?.profile_id) {
      toast.error('Você não pode solicitar cotação para si mesmo');
    } else {
      setQuoteModalOpen(true);
    }
  };

  const categoryInfo = vendor
    ? VENDOR_CATEGORIES.find((c) => c.value === vendor.category)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="mb-4 h-8 w-32" />
          <Skeleton className="mb-8 h-80 w-full rounded-2xl" />
          <Skeleton className="mb-4 h-10 w-64" />
          <Skeleton className="h-24 w-full" />
        </main>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Back button */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para explorar
        </Link>

        {/* Image Gallery */}
        <div className="mb-8">
          {vendor.images && vendor.images.length > 0 ? (
            <Carousel className="mx-auto w-full max-w-4xl">
              <CarouselContent>
                {vendor.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-video overflow-hidden rounded-2xl">
                      <img
                        src={image}
                        alt={`${vendor.business_name} - Foto ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {vendor.images.length > 1 && (
                <>
                  <CarouselPrevious />
                  <CarouselNext />
                </>
              )}
            </Carousel>
          ) : (
            <div className="mx-auto flex aspect-video max-w-4xl items-center justify-center rounded-2xl bg-champagne">
              <span className="text-8xl">{categoryInfo?.emoji || '🎉'}</span>
            </div>
          )}
        </div>

        {/* Vendor Info */}
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge
                  className={cn(
                    'border-0',
                    CATEGORY_COLORS[vendor.category] || 'bg-muted text-muted-foreground'
                  )}
                >
                  {categoryInfo?.emoji} {categoryInfo?.label}
                </Badge>
                {isAdmin && vendor.approval_status === 'pending' && (
                  <Badge variant="outline" className="border-coral text-coral">
                    ⏳ Pendente de Aprovação
                  </Badge>
                )}
                {isAdmin && vendor.approval_status === 'rejected' && (
                  <Badge variant="destructive">
                    ❌ Rejeitado
                  </Badge>
                )}
                {isAdmin && vendor.subscription_status === 'active' && (
                  <Badge className="bg-sage text-sage-foreground border-0">
                    <Crown className="mr-1 h-3 w-3" />
                    Assinatura Ativa
                  </Badge>
                )}
                {isAdmin && vendor.subscription_status === 'inactive' && (
                  <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                    <PowerOff className="mr-1 h-3 w-3" />
                    Assinatura Inativa
                  </Badge>
                )}
                {isAdmin && vendor.subscription_status === 'past_due' && (
                  <Badge variant="outline" className="border-coral text-coral">
                    ⚠️ Pagamento Pendente
                  </Badge>
                )}
              </div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">
                {vendor.business_name}
              </h1>
              {vendor.neighborhood && (
                <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {vendor.neighborhood}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Admin Edit Button */}
              {isAdmin && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar Perfil
                </Button>
              )}

              {/* Admin Subscription Toggle */}
              {isAdmin && vendor.subscription_status !== 'active' && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-sage text-sage hover:bg-sage hover:text-sage-foreground"
                  onClick={() => handleToggleSubscription(true)}
                  disabled={togglingSubscription}
                >
                  {togglingSubscription ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Power className="mr-2 h-4 w-4" />
                  )}
                  Ativar Assinatura
                </Button>
              )}

              {isAdmin && vendor.subscription_status === 'active' && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleToggleSubscription(false)}
                  disabled={togglingSubscription}
                >
                  {togglingSubscription ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PowerOff className="mr-2 h-4 w-4" />
                  )}
                  Revogar Assinatura
                </Button>
              )}

              {/* Admin Approve Button */}
              {isAdmin && vendor.is_approved === false && (
                <>
                  <Button
                    size="lg"
                    onClick={handleApproveVendor}
                    disabled={approving}
                    variant="default"
                    className="bg-primary/90 hover:bg-primary"
                  >
                    {approving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Aprovar
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={() => setRejectModalOpen(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeitar
                  </Button>
                </>
              )}

              <Button
                size="lg"
                onClick={handleQuoteClick}
                className="bg-gradient-coral shadow-coral"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Solicitar Cotação
              </Button>
            </div>
          </div>

          {/* Admin Contact Info */}
          {isAdmin && vendor.profiles && (
            <Card className="mt-8 border-coral/20 bg-coral/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-coral">
                  <Phone className="h-4 w-4" />
                  Informações de Contato (Admin)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Nome:</span>
                  <span className="text-muted-foreground">{vendor.profiles.full_name}</span>
                </p>
                {vendor.profiles.whatsapp && (
                  <p className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">WhatsApp:</span>
                    <a
                      href={`https://wa.me/${vendor.profiles.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {vendor.profiles.whatsapp}
                    </a>
                  </p>
                )}
                {vendor.profiles.email && (
                  <p className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <a
                      href={`mailto:${vendor.profiles.email}`}
                      className="text-primary hover:underline"
                    >
                      {vendor.profiles.email}
                    </a>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason Card */}
          {isAdmin && vendor.approval_status === 'rejected' && vendor.rejection_reason && (
            <Card className="mt-4 border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                  <XCircle className="h-4 w-4" />
                  Motivo da Rejeição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{vendor.rejection_reason}</p>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {vendor.description && (
            <div className="mt-8">
              <h2 className="mb-3 font-display text-xl font-semibold">Sobre</h2>
              <p className="text-muted-foreground">{vendor.description}</p>
            </div>
          )}

          {/* Coupons Section - visible to everyone */}
          <VendorProfileCoupons vendorId={vendor.id} />

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 font-display text-xl font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                Avaliações de Clientes
              </h2>
              <div className="mb-4 flex items-center gap-3">
                <StarRating rating={avgRating} reviewCount={reviews.length} size="lg" />
              </div>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{review.reviewer_name}</p>
                          <StarRating rating={review.rating} showValue={false} size="sm" className="mt-1" />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(review.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <QuoteModal
        open={quoteModalOpen}
        onOpenChange={setQuoteModalOpen}
        vendorId={vendor.profile_id}
        vendorName={vendor.business_name}
      />

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        mode="client"
      />

      {isAdmin && (
        <AdminVendorEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          vendorData={{
            id: vendor.id,
            description: vendor.description,
            images: vendor.images,
          }}
          onSave={fetchVendor}
        />
      )}

      {isAdmin && (
        <RejectVendorModal
          open={rejectModalOpen}
          onOpenChange={setRejectModalOpen}
          vendorProfileId={vendor.profile_id}
          vendorName={vendor.business_name}
          onReject={fetchVendor}
        />
      )}
    </div>
  );
}

export default function VendorProfile() {
  return (
    <AuthProvider>
      <VendorProfileContent />
    </AuthProvider>
  );
}
