import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { MEI_PLAN_PRICE } from '@/lib/constants';
import { Loader2 } from 'lucide-react';
import { translateAuthError } from '@/lib/auth-errors';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'client' | 'vendor';
  defaultToLogin?: boolean;
}

type Step = 'auth' | 'role-select' | 'forgot-password';

export function AuthModal({ open, onOpenChange, mode, defaultToLogin }: AuthModalProps) {
  const [step, setStep] = useState<Step>('auth');
  const [isLogin, setIsLogin] = useState(defaultToLogin ?? !!mode ? false : true);
  const [selectedRole, setSelectedRole] = useState<'client' | 'vendor'>(mode || 'client');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const resetForm = () => {
    setStep('auth');
    setIsLogin(defaultToLogin ?? !mode);
    setSelectedRole(mode || 'client');
    setEmail('');
    setPassword('');
    setFullName('');
    setWhatsapp('');
    setResetEmailSent(false);
    setGoogleLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({
          title: 'Erro',
          description: translateAuthError(error.message) || 'Não foi possível fazer login com Google.',
          variant: 'destructive',
        });
        setGoogleLoading(false);
      }
      // Note: if successful, the page will redirect, so we don't need to handle success here
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: translateAuthError(error.message) || 'Não foi possível fazer login com Google.',
        variant: 'destructive',
      });
      setGoogleLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: 'Login realizado com sucesso!' });
        handleClose();
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
              whatsapp,
              role: selectedRole,
            },
          },
        });
        if (error) throw error;

        toast({ title: 'Cadastro realizado com sucesso!' });
        handleClose();
        
        if (selectedRole === 'vendor' && data.user) {
          navigate('/cadastro-fornecedor');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: translateAuthError(error.message) || 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: translateAuthError(error.message) || 'Não foi possível enviar o email.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {step === 'auth' ? (
              isLogin ? 'Entrar' : selectedRole === 'vendor' ? 'Cadastro de Fornecedor' : 'Cadastro de Cliente'
            ) : step === 'role-select' ? (
              'Como deseja se cadastrar?'
            ) : (
              'Recuperar Senha'
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'auth' ? (
              isLogin ? 'Acesse sua conta' : selectedRole === 'vendor' ? (
                <>Plano a partir de <strong>R$ {MEI_PLAN_PRICE}</strong>/ano</>
              ) : (
                'Encontre os melhores fornecedores gratuitamente'
              )
            ) : step === 'role-select' ? (
              'Escolha seu perfil para continuar'
            ) : (
              'Digite seu email para receber o link de recuperação'
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 'role-select' ? (
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-16 text-left flex flex-col items-start gap-0.5"
              onClick={() => { setSelectedRole('client'); setIsLogin(false); setStep('auth'); }}
            >
              <span className="font-semibold">Sou Cliente</span>
              <span className="text-xs text-muted-foreground">Quero encontrar fornecedores</span>
            </Button>
            <Button
              variant="outline"
              className="w-full h-16 text-left flex flex-col items-start gap-0.5"
              onClick={() => { setSelectedRole('vendor'); setIsLogin(false); setStep('auth'); }}
            >
              <span className="font-semibold">Sou Fornecedor</span>
              <span className="text-xs text-muted-foreground">Quero divulgar meu negócio</span>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <button type="button" onClick={() => { setIsLogin(true); setStep('auth'); }} className="font-medium text-primary hover:underline">
                Entrar
              </button>
            </p>
          </div>
        ) : step === 'auth' ? (
          <div className="space-y-4">
            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continuar com Google
            </Button>

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  ou
                </span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? 'Entrar' : 'Continuar'}
            </Button>

            {isLogin && (
              <p className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('forgot-password')}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </p>
            )}

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
              <button
                type="button"
                onClick={() => {
                  if (isLogin && !mode) {
                    // Go to role selection before signup
                    setStep('role-select');
                  } else {
                    setIsLogin(!isLogin);
                  }
                }}
                className="font-medium text-primary hover:underline"
              >
              {isLogin ? 'Cadastre-se' : 'Entrar'}
              </button>
            </p>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {resetEmailSent ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStep('auth');
                    setResetEmailSent(false);
                  }}
                >
                  Voltar ao login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar link de recuperação
                </Button>

                <p className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep('auth')}
                    className="text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    Voltar ao login
                  </button>
                </p>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
