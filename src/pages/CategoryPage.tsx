import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { VendorCard } from '@/components/home/VendorCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';

interface Vendor {
  id: string;
  business_name: string;
  slug?: string | null;
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

function CategoryPageContent() {
  const { slug } = useParams<{ slug: string }>();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;

      setLoading(true);

      // Fetch category info
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_approved', true)
        .maybeSingle();

      if (categoryData) {
        setCategory(categoryData);
      }

      // Fetch vendors in this category
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('*')
        .eq('category', slug as never) // Cast to handle enum type
        .eq('subscription_status', 'active')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      setVendors(vendorsData || []);
      setLoading(false);
    }

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <>
        <Skeleton className="mb-8 h-16 w-64" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  if (!category) {
    return (
      <div className="py-16 text-center">
        <span className="mb-4 block text-5xl">🔍</span>
        <h2 className="font-display text-2xl font-bold">Categoria não encontrada</h2>
        <p className="mt-2 text-muted-foreground">
          Esta categoria não existe ou foi removida.
        </p>
        <Link to="/">
          <Button variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{category.emoji}</span>
          <div>
            <h1 className="font-display text-3xl font-bold">{category.name}</h1>
            <p className="text-muted-foreground">
              {vendors.length} fornecedor{vendors.length !== 1 ? 'es' : ''} disponíve{vendors.length !== 1 ? 'is' : 'l'}
            </p>
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      {vendors.length === 0 ? (
        <div className="py-16 text-center">
          <span className="mb-4 block text-5xl">📭</span>
          <h3 className="font-display text-xl font-semibold">
            Nenhum fornecedor nesta categoria
          </h3>
          <p className="mt-2 text-muted-foreground">
            Em breve teremos novos profissionais aqui!
          </p>
          <Link to="/buscar">
            <Button variant="outline" className="mt-6">
              Ver todos os fornecedores
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vendors.map((vendor, index) => (
            <VendorCard key={vendor.id} vendor={vendor} index={index} />
          ))}
        </div>
      )}
    </>
  );
}

export default function CategoryPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <CategoryPageContent />
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
    </AuthProvider>
  );
}
