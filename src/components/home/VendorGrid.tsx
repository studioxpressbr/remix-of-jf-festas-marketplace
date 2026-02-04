import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VendorThumbnail } from './VendorThumbnail';
import { Skeleton } from '@/components/ui/skeleton';

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

  useEffect(() => {
    async function fetchVendors() {
      setLoading(true);
      
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="aspect-square w-full rounded-xl"
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

  // Limit to 4 vendors for display
  const displayedVendors = vendors.slice(0, 4);

  return (
    <div className="container pb-16">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {displayedVendors.map((vendor) => (
          <VendorThumbnail key={vendor.id} vendor={vendor} />
        ))}
      </div>
    </div>
  );
}
