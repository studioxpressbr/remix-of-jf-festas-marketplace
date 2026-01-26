import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { QuoteModal } from '@/components/vendor/QuoteModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { VENDOR_CATEGORIES, CATEGORY_COLORS } from '@/lib/constants';
import { MapPin, ArrowLeft, MessageCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  profiles: {
    full_name: string;
  } | null;
}

function VendorProfileContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    async function fetchVendor() {
      if (!id) return;

      const { data, error } = await supabase
        .from('vendors')
        .select('*, profiles(full_name)')
        .eq('profile_id', id)
        .maybeSingle();

      if (error || !data) {
        navigate('/');
        return;
      }

      setVendor(data);
      setLoading(false);
    }

    fetchVendor();
  }, [id, navigate]);

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
              <Badge
                className={cn(
                  'mb-3 border-0',
                  CATEGORY_COLORS[vendor.category] || 'bg-muted text-muted-foreground'
                )}
              >
                {categoryInfo?.emoji} {categoryInfo?.label}
              </Badge>
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

            <Button
              size="lg"
              onClick={handleQuoteClick}
              className="bg-gradient-coral shadow-coral"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Solicitar Cotação
            </Button>
          </div>

          {/* Description */}
          {vendor.description && (
            <div className="mt-8">
              <h2 className="mb-3 font-display text-xl font-semibold">Sobre</h2>
              <p className="text-muted-foreground">{vendor.description}</p>
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
