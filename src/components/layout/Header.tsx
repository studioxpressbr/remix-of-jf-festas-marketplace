import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { Menu, X, User, LogOut, Instagram, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logoJfFestas from '@/assets/logo-jffestas.webp';

export function Header() {
  const { user, profile, signOut } = useAuthContext();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top bar with Instagram */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="container flex h-8 items-center justify-between text-xs">
          <span>Marketplace de Festas em Juiz de Fora</span>
          <a
            href="https://www.instagram.com/festasemjf/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
          >
            <Instagram className="h-3.5 w-3.5" />
            <span>@festasemjf</span>
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={logoJfFestas} 
              alt="JF Festas" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Explorar
            </Link>
            <Link
              to="/buscar"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Search className="h-4 w-4" />
              Buscar
            </Link>
            <Link
              to="/precos"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Preços
            </Link>
            {user && profile?.role === 'vendor' && (
              <Link
                to="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Minha Área
              </Link>
            )}
            {user && profile?.role === 'client' && (
              <Link
                to="/minha-conta"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Minha Conta
              </Link>
            )}
            {!user && (
              <Link
                to="/cadastro-fornecedor"
                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Seja Fornecedor
              </Link>
            )}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="hidden items-center gap-3 md:flex">
            {user && <NotificationBell />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="max-w-32 truncate">{profile?.full_name || 'Usuário'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {profile?.role === 'vendor' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard">Minha Área</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {profile?.role === 'client' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/minha-conta">Minha Conta</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => setAuthModalOpen(true)}>
                Entrar
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="animate-slide-up border-t border-border bg-background p-4 md:hidden">
            <nav className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explorar
              </Link>
              <Link
                to="/buscar"
                className="flex items-center gap-1.5 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search className="h-4 w-4" />
                Buscar
              </Link>
              <Link
                to="/precos"
                className="text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Preços
              </Link>
              {user && profile?.role === 'vendor' && (
                <Link
                  to="/dashboard"
                  className="text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Minha Área
                </Link>
              )}
              {user && profile?.role === 'client' && (
                <Link
                  to="/minha-conta"
                  className="text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Minha Conta
                </Link>
              )}
              {!user && (
                <Link
                  to="/cadastro-fornecedor"
                  className="text-sm font-medium text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Seja Fornecedor
                </Link>
              )}
              <a
                href="https://www.instagram.com/festasemjf/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-secondary"
              >
                <Instagram className="h-4 w-4" />
                @festasemjf
              </a>
              <div className="flex flex-col gap-2 pt-4">
                {user ? (
                  <Button variant="outline" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                ) : (
                    <Button className="w-full" onClick={() => { setMobileMenuOpen(false); setAuthModalOpen(true); }}>
                      Entrar
                    </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultToLogin
      />
    </>
  );
}
