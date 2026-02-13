import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { VendorCard } from '@/components/home/VendorCard';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchFilters } from '@/components/search/SearchFilters';
import { supabase } from '@/integrations/supabase/client';
import { VENDOR_CATEGORIES } from '@/lib/constants';

interface Vendor {
  id: string;
  business_name: string;
  category: string;
  description: string | null;
  neighborhood: string | null;
  images: string[] | null;
  profile_id: string;
  active_coupons_count?: number;
  avg_rating?: number;
  review_count?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || 'all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(searchParams.get('bairro') || 'all');
  const [hasCoupons, setHasCoupons] = useState(searchParams.get('cupons') === '1');
  const [minRating, setMinRating] = useState(Number(searchParams.get('avaliacao')) || 0);
  
  // Data states
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories on mount - with fallback to constants
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_approved', true)
        .order('name');
      
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        // Fallback to constants when table is empty
        setCategories(VENDOR_CATEGORIES.map(cat => ({
          id: cat.value,
          name: cat.label,
          slug: cat.value,
          emoji: cat.emoji
        })));
      }
    }
    fetchCategories();
  }, []);

  // Fetch unique neighborhoods on mount
  useEffect(() => {
    async function fetchNeighborhoods() {
      const { data } = await supabase
        .from('vendors_search' as any)
        .select('neighborhood')
        .not('neighborhood', 'is', null);
      
      if (data) {
        const unique = [...new Set(data.map((v: any) => v.neighborhood as string))];
        setNeighborhoods(unique.filter(Boolean));
      }
    }
    fetchNeighborhoods();
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory && selectedCategory !== 'all') params.set('categoria', selectedCategory);
    if (selectedNeighborhood && selectedNeighborhood !== 'all') params.set('bairro', selectedNeighborhood);
    if (hasCoupons) params.set('cupons', '1');
    if (minRating > 0) params.set('avaliacao', String(minRating));
    setSearchParams(params, { replace: true });
  }, [searchTerm, selectedCategory, selectedNeighborhood, hasCoupons, minRating, setSearchParams]);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Search function
  const searchVendors = useCallback(async () => {
    setLoading(true);
    
    let query = supabase
      .from('vendors_search' as any)
      .select('*');

    // Text search
    if (debouncedSearchTerm) {
      const sanitizedTerm = debouncedSearchTerm
        .slice(0, 100)
        .replace(/[%_\\[\]]/g, '')
        .trim();
      
      if (sanitizedTerm.length > 0) {
        query = query.or(`business_name.ilike.%${sanitizedTerm}%,description.ilike.%${sanitizedTerm}%,neighborhood.ilike.%${sanitizedTerm}%`);
      }
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory as never);
    }

    // Neighborhood filter
    if (selectedNeighborhood && selectedNeighborhood !== 'all') {
      query = query.eq('neighborhood', selectedNeighborhood);
    }

    // Coupons filter
    if (hasCoupons) {
      query = query.not('active_coupons_count', 'is', null).gte('active_coupons_count', 1);
    }

    // Rating filter
    if (minRating > 0) {
      query = query.gte('avg_rating', minRating);
    }

    const { data } = await query.order('created_at', { ascending: false });
    setVendors((data as unknown as Vendor[]) || []);
    setLoading(false);
  }, [debouncedSearchTerm, selectedCategory, selectedNeighborhood, hasCoupons, minRating]);

  // Auto-search when any filter changes
  useEffect(() => {
    searchVendors();
  }, [searchVendors]);

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCategory('all');
    setSelectedNeighborhood('all');
    setHasCoupons(false);
    setMinRating(0);
  };

  const hasActiveFilters = Boolean(
    searchTerm || 
    (selectedCategory && selectedCategory !== 'all') || 
    (selectedNeighborhood && selectedNeighborhood !== 'all') || 
    hasCoupons || 
    minRating > 0
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-bold">Buscar Fornecedores</h1>
          <p className="text-muted-foreground">
            Encontre o fornecedor ideal para sua festa
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filters Sidebar */}
          <SearchFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedNeighborhood={selectedNeighborhood}
            setSelectedNeighborhood={setSelectedNeighborhood}
            hasCoupons={hasCoupons}
            setHasCoupons={setHasCoupons}
            minRating={minRating}
            setMinRating={setMinRating}
            neighborhoods={neighborhoods}
            categories={categories}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            onSearch={searchVendors}
          />

          {/* Results */}
          <div className="flex-1">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
                ))}
              </div>
            ) : vendors.length === 0 ? (
              <div className="py-16 text-center">
                <span className="mb-4 block text-5xl">🔍</span>
                <h3 className="font-display text-xl font-semibold">
                  Nenhum fornecedor encontrado
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Tente ajustar seus filtros ou termos de busca
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  {vendors.length} fornecedor{vendors.length !== 1 ? 'es' : ''} encontrado{vendors.length !== 1 ? 's' : ''}
                </p>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {vendors.map((vendor, index) => (
                    <VendorCard key={vendor.id} vendor={vendor} index={index} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-champagne/30 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 JF Festas. Todos os direitos reservados.</p>
          <div className="mt-2">
            <Link to="/termos" className="hover:underline">
              Termos e Condições
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <AuthProvider>
      <SearchPage />
    </AuthProvider>
  );
}
