import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';

function SuccessContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    async function verifyPayment() {
      if (!sessionId || !user) {
        setVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId },
        });

        if (error) throw error;

        if (data.success) {
          setSuccess(true);
          // Trigger subscription check
          await supabase.functions.invoke('check-subscription');
        } else {
          setError(data.message || 'Pagamento não confirmado');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao verificar pagamento');
      } finally {
        setVerifying(false);
      }
    }

    verifyPayment();
  }, [sessionId, user]);

  if (verifying) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <h2 className="font-display text-xl font-semibold">Verificando pagamento...</h2>
            <p className="mt-2 text-sm text-muted-foreground">Aguarde um momento</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <span className="mb-4 text-5xl">⚠️</span>
            <h2 className="font-display text-xl font-semibold">Ops, algo deu errado</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-6" onClick={() => navigate('/dashboard')}>
              Voltar ao painel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 rounded-full bg-sage/20 p-4">
            <CheckCircle className="h-12 w-12 text-sage" />
          </div>
          <h2 className="font-display text-2xl font-bold">Pagamento Confirmado!</h2>
          <p className="mt-2 text-muted-foreground">
            Sua assinatura foi ativada com sucesso. Agora você pode receber 
            cotações e conectar-se com clientes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button 
              className="bg-gradient-orange shadow-orange" 
              onClick={() => navigate('/dashboard')}
            >
              Ir para Minha Área
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Ver página inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PagamentoSucesso() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <SuccessContent />
        </main>
      </div>
    </AuthProvider>
  );
}
