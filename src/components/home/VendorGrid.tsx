import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VendorCard } from './VendorCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

interface Vendor {
  id: string;
  profile_id: string;
  business_name: string;
  category: string;
  description: string | null;
  neighborhood: string | null;
  images: string[];
}

interface VendorGridProps {
  categoryFilter: string | null;
}

export function VendorGrid({ categoryFilter }: VendorGridProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1 },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    async function fetchVendors() {
      setLoading(true);
      
      // Use the public view which excludes sensitive fields
      let query = supabase
        .from('vendors_public' as any)
        .select('*')
        .limit(20);

      if (categoryFilter) {
        query = query.eq('category', categoryFilter as any);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Shuffle for random order
        const shuffled = (data as unknown as Vendor[]).sort(() => Math.random() - 0.5);
        setVendors(shuffled);
      }
      setLoading(false);
    }

    fetchVendors();
  }, [categoryFilter]);

  if (loading) {
    return (
      <div className="container pb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="h-72 w-full rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="container pb-16">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="mb-4 text-6xl">🔍</span>
          <h3 className="font-display text-2xl font-semibold">Nenhum fornecedor encontrado</h3>
          <p className="mt-2 text-muted-foreground">
            {categoryFilter
              ? 'Tente outra categoria ou aguarde novos cadastros.'
              : 'Seja o primeiro a se cadastrar!'}
          </p>
        </div>
      </div>
    );
  }

  // Limit to 4 vendors for carousel display
  const displayedVendors = vendors.slice(0, 4);

  return (
    <div className="container pb-16">
      <div className="relative">
        {/* Navigation Buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background shadow-md lg:flex"
          onClick={scrollPrev}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Anterior</span>
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background shadow-md lg:flex"
          onClick={scrollNext}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Próximo</span>
        </Button>

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {displayedVendors.map((vendor, index) => (
              <div 
                key={vendor.id} 
                className="min-w-0 flex-shrink-0 flex-grow-0 basis-full sm:basis-1/2 lg:basis-1/4"
              >
                <VendorCard vendor={vendor} index={index} />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="mt-4 flex justify-center gap-2 lg:hidden">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={scrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
