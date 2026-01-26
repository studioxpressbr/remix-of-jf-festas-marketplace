import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { Menu, X, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, profile, signOut } = useAuthContext();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'client' | 'vendor'>('client');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <span className="font-display text-xl font-semibold text-foreground">
              Evento
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Explorar
            </Link>
            {user && profile?.role === 'vendor' && (
              <Link
                to="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Minha Área
              </Link>
            )}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="hidden items-center gap-3 md:flex">
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
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={openClientAuth}>
                  Sou Cliente
                </Button>
                <Button size="sm" onClick={openVendorAuth}>
                  Sou Fornecedor
                </Button>
              </>
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
              {user && profile?.role === 'vendor' && (
                <Link
                  to="/dashboard"
                  className="text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Minha Área
                </Link>
              )}
              <div className="flex flex-col gap-2 pt-4">
                {user ? (
                  <Button variant="outline" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={openClientAuth}>
                      Sou Cliente
                    </Button>
                    <Button onClick={openVendorAuth}>
                      Sou Fornecedor
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        mode={authMode}
      />
    </>
  );
}
