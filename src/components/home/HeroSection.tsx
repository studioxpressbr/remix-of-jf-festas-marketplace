import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuthContext } from '@/contexts/AuthContext';
import { Sparkles, Heart, Star } from 'lucide-react';

export function HeroSection() {
  const { user, profile } = useAuthContext();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'client' | 'vendor'>('client');

  const openVendorAuth = () => {
    setAuthMode('vendor');
    setAuthModalOpen(true);
  };

  const openClientAuth = () => {
    setAuthMode('client');
    setAuthModalOpen(true);
  };

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
        {/* Decorative elements */}
        <div className="absolute left-10 top-20 animate-float text-4xl opacity-20">🎂</div>
        <div className="absolute right-20 top-32 animate-float text-3xl opacity-20" style={{ animationDelay: '1s' }}>🎈</div>
        <div className="absolute bottom-20 left-1/4 animate-float text-3xl opacity-20" style={{ animationDelay: '2s' }}>🍰</div>
        <div className="absolute bottom-32 right-1/3 animate-float text-4xl opacity-20" style={{ animationDelay: '0.5s' }}>✨</div>

        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-coral-light/20 px-4 py-2 text-sm font-medium text-coral-dark">
              <Sparkles className="h-4 w-4" />
              Marketplace de Eventos
            </div>

            {/* Heading */}
            <h1 className="animate-fade-in font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Encontre os melhores{' '}
              <span className="text-gradient-coral">fornecedores</span>{' '}
              para seu evento
            </h1>

            {/* Subheading */}
            <p className="mt-6 animate-fade-in text-lg text-muted-foreground md:text-xl" style={{ animationDelay: '0.2s' }}>
              Confeitarias, decorações, salgados e muito mais. 
              Conecte-se diretamente com os melhores profissionais da sua região.
            </p>

            {/* CTAs */}
            {!user && (
              <div className="mt-10 flex animate-fade-in flex-col items-center justify-center gap-4 sm:flex-row" style={{ animationDelay: '0.4s' }}>
                <Button
                  size="lg"
                  onClick={openVendorAuth}
                  className="min-w-48 bg-gradient-coral shadow-coral transition-all hover:shadow-strong"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Cadastrar Fornecedor
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={openClientAuth}
                  className="min-w-48 border-2"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Sou Cliente
                </Button>
              </div>
            )}

            {/* Trust badges */}
            <div className="mt-12 flex animate-fade-in flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground" style={{ animationDelay: '0.6s' }}>
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

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        mode={authMode}
      />
    </>
  );
}
