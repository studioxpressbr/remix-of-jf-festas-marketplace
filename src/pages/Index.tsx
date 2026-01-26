import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryFilter } from '@/components/home/CategoryFilter';
import { VendorGrid } from '@/components/home/VendorGrid';

function HomePage() {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CategoryFilter selected={categoryFilter} onSelect={setCategoryFilter} />
        <VendorGrid categoryFilter={categoryFilter} />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border bg-champagne/30 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 Evento Marketplace. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  );
}
