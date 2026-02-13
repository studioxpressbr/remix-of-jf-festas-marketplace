import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoryFilter } from "@/components/home/CategoryFilter";
import { VendorGrid } from "@/components/home/VendorGrid";

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
          <p>© 2026 JF Festas. Todos os direitos reservados.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link to="/termos" className="hover:underline">
              Termos e Condições
            </Link>
            <a
              href="https://www.instagram.com/festasemjf/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Instagram
            </a>
          </div>
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
