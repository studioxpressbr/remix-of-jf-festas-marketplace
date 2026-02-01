import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VendorCard } from '@/components/home/VendorCard';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, Filter } from 'lucide-react';

interface Vendor {
  id: string;
  business_name: string;
  category: string;
  description: string | null;
  neighborhood: string | null;
  images: string[] | null;
  profile_id: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || '');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_approved', true)
        .order('name');
      if (data) setCategories(data);
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function searchVendors() {
      setLoading(true);
      
      // Use the public view which excludes sensitive fields
      let query = supabase
        .from('vendors_public' as any)
        .select('*');

      if (searchTerm) {
        // Sanitize search term: remove special SQL/ILIKE characters and limit length
        const sanitizedTerm = searchTerm
          .slice(0, 100) // Limit length
          .replace(/[%_\\[\]]/g, '') // Remove ILIKE special chars
          .trim();
        
        if (sanitizedTerm.length > 0) {
          query = query.or(`business_name.ilike.%${sanitizedTerm}%,description.ilike.%${sanitizedTerm}%,neighborhood.ilike.%${sanitizedTerm}%`);
        }
      }

      if (selectedCategory) {
        // Cast to any to handle enum type
        query = query.eq('category', selectedCategory as never);
      }

      const { data } = await query.order('created_at', { ascending: false });
      setVendors((data as unknown as Vendor[]) || []);
      setLoading(false);
    }

    searchVendors();
  }, [searchTerm, selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory) params.set('categoria', selectedCategory);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSearchParams({});
  };

  const hasActiveFilters = searchTerm || selectedCategory;

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

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome, descrição ou bairro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" className="bg-gradient-orange shadow-orange">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </form>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrar por categoria:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={!selectedCategory ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-105"
              onClick={() => setSelectedCategory('')}
            >
              Todas
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.slug ? "default" : "outline"}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => setSelectedCategory(cat.slug)}
              >
                {cat.emoji} {cat.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                "{searchTerm}"
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpar tudo
            </Button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {vendors.length} fornecedor{vendors.length !== 1 ? 'es' : ''} encontrado{vendors.length !== 1 ? 's' : ''}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {vendors.map((vendor, index) => (
                <VendorCard key={vendor.id} vendor={vendor} index={index} />
              ))}
            </div>
          </>
        )}
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
