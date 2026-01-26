import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VendorCard } from './VendorCard';
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
        .from('vendors')
        .select('*')
        .eq('subscription_status', 'active')
        .limit(20);

      if (categoryFilter) {
        query = query.eq('category', categoryFilter as any);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Shuffle for random order
        const shuffled = data.sort(() => Math.random() - 0.5);
        setVendors(shuffled);
      }
      setLoading(false);
    }

    fetchVendors();
  }, [categoryFilter]);

  if (loading) {
    return (
      <div className="container pb-16">
        <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={`w-full rounded-xl ${['h-64', 'h-72', 'h-80'][i % 3]}`}
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

  return (
    <div className="container pb-16">
      <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {vendors.map((vendor, index) => (
          <div key={vendor.id} className="break-inside-avoid">
            <VendorCard vendor={vendor} index={index} />
          </div>
        ))}
      </div>
    </div>
  );
}
