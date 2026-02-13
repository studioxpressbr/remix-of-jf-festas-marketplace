import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuthContext } from "@/contexts/AuthContext";
import { Sparkles, Heart, Star, Search } from "lucide-react";
import { Link } from "react-router-dom";
import logoJfFestas from "@/assets/logo-jffestas.webp";

export function HeroSection() {
  const { user } = useAuthContext();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"client" | "vendor">("client");

  const openVendorAuth = () => {
    setAuthMode("vendor");
    setAuthModalOpen(true);
  };

  const openClientAuth = () => {
    setAuthMode("client");
    setAuthModalOpen(true);
  };

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero py-16 md:py-24 lg:py-32">
        {/* Decorative elements */}
        <div className="absolute left-10 top-20 animate-float text-4xl opacity-15">🎂</div>
        <div className="absolute right-20 top-32 animate-float text-3xl opacity-15" style={{ animationDelay: "1s" }}>
          🎈
        </div>
        <div className="absolute bottom-20 left-1/4 animate-float text-3xl opacity-15" style={{ animationDelay: "2s" }}>
          🍰
        </div>
        <div
          className="absolute bottom-32 right-1/3 animate-float text-4xl opacity-15"
          style={{ animationDelay: "0.5s" }}
        >
          ✨
        </div>

        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            {/* Logo display */}
            <div className="mb-8 flex justify-center">
              <img src={logoJfFestas} alt="JF Festas" className="h-20 w-auto md:h-24 lg:h-28" />
            </div>

            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary/15 px-4 py-2 text-sm font-medium text-secondary">
              <Sparkles className="h-4 w-4" />
              Marketplace de Festas em Juiz de Fora
            </div>

            {/* Heading */}
            <h1 className="animate-fade-in font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
              Encontre os melhores <span className="text-gradient-orange">fornecedores</span> para sua festa
            </h1>

            {/* Subheading */}
            <p
              className="mt-6 animate-fade-in text-base text-muted-foreground sm:text-lg md:text-xl"
              style={{ animationDelay: "0.2s" }}
            >
              Confeitarias, decorações, salgados e muito mais. Conecte-se diretamente com as melhores empresas e
              profissionais de festas e eventos em Juiz de Fora.
            </p>

            {/* Search button */}
            <div className="mt-8 flex animate-fade-in justify-center" style={{ animationDelay: "0.3s" }}>
              <Link to="/buscar">
                <Button
                  size="lg"
                  variant="outline"
                  className="min-w-64 gap-2 border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                >
                  <Search className="h-5 w-5" />
                  Buscar fornecedores
                </Button>
              </Link>
            </div>

            {/* CTAs */}
            {!user && (
              <div
                className="mt-8 flex animate-fade-in flex-col items-center justify-center gap-4 sm:flex-row"
                style={{ animationDelay: "0.4s" }}
              >
                <Button
                  size="lg"
                  onClick={openVendorAuth}
                  className="min-w-48 bg-gradient-orange shadow-orange transition-all hover:shadow-strong"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Cadastrar Fornecedor
                </Button>
                <Button size="lg" variant="outline" onClick={openClientAuth} className="min-w-48 border-2">
                  <Heart className="mr-2 h-4 w-4" />
                  Sou Cliente
                </Button>
              </div>
            )}

            {/* Trust badges */}
            <div
              className="mt-12 flex animate-fade-in flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
              style={{ animationDelay: "0.6s" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span>Fornecedores verificados</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                <span>Contato direto</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span>Avaliações reais</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} mode={authMode} />
    </>
  );
}
