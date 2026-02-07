import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Header } from '@/components/layout/Header';
import { QuoteModal } from '@/components/vendor/QuoteModal';
import { VendorProfileCoupons } from '@/components/vendor/VendorProfileCoupons';
import { AuthModal } from '@/components/auth/AuthModal';
import { AdminVendorEditModal } from '@/components/admin/AdminVendorEditModal';
import { RejectVendorModal } from '@/components/admin/RejectVendorModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { VENDOR_CATEGORIES, CATEGORY_COLORS } from '@/lib/constants';
import { MapPin, ArrowLeft, MessageCircle, Phone, Mail, CheckCircle, Loader2, Pencil, XCircle, Power, PowerOff, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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

function VendorProfileContent() {
  const { id } = useParams<{ id: string }>();
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
    if (!id || adminLoading) return;

    let data, error;

    if (isAdmin) {
      // Admin pode ver qualquer vendor com dados de contato (RLS permite)
      const result = await supabase
        .from('vendors')
        .select('*, profiles(full_name, email, whatsapp)')
        .eq('profile_id', id)
        .maybeSingle();
      data = result.data;
      error = result.error;
    } else {
      // Usuários normais só veem vendors aprovados
      const result = await supabase
        .from('vendors_public' as any)
        .select('*, profiles(full_name)')
        .eq('profile_id', id)
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
  }, [id, navigate, isAdmin, adminLoading]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  const handleQuoteClick = () => {
    if (!user) {
      setAuthModalOpen(true);
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
