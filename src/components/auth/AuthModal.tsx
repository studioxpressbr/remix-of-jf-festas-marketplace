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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_PRICE } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'client' | 'vendor';
}

type Step = 'auth' | 'forgot-password';

export function AuthModal({ open, onOpenChange, mode }: AuthModalProps) {
  const [step, setStep] = useState<Step>('auth');
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setIsLogin(false);
    setEmail('');
    setPassword('');
    setFullName('');
    setWhatsapp('');
    setResetEmailSent(false);
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
              role: mode,
            },
          },
        });
        if (error) throw error;

        toast({ title: 'Cadastro realizado com sucesso!' });
        handleClose();
        
        // Redirect vendors to complete their profile later
        if (mode === 'vendor' && data.user) {
          navigate('/cadastro-fornecedor');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro. Tente novamente.',
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
        description: error.message || 'Não foi possível enviar o email.',
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
              isLogin ? 'Entrar' : mode === 'vendor' ? 'Cadastro de Fornecedor' : 'Cadastro de Cliente'
            ) : (
              'Recuperar Senha'
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'auth' ? (
              mode === 'vendor' ? (
                <>Plano anual por apenas <strong>R$ {SUBSCRIPTION_PRICE}</strong></>
              ) : (
                'Encontre os melhores fornecedores gratuitamente'
              )
            ) : (
              'Digite seu email para receber o link de recuperação'
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 'auth' ? (
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
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-primary hover:underline"
              >
                {isLogin ? 'Cadastre-se' : 'Entrar'}
              </button>
            </p>
          </form>
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
