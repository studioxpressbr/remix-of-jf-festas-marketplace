import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Loader2, ArrowRight, Coins } from 'lucide-react';

function CreditSuccessContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const quantityParam = searchParams.get('quantity');

  useEffect(() => {
    async function verifyPurchase() {
      if (!sessionId || !user) {
        setVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-credit-purchase', {
          body: { sessionId, quantity: quantityParam },
        });

        if (error) throw error;

        if (data.success) {
          setSuccess(true);
          setNewBalance(data.newBalance);
          setQuantity(data.quantity || parseInt(quantityParam || '1', 10));
        } else {
          setError(data.message || 'Compra não confirmada');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao verificar compra');
      } finally {
        setVerifying(false);
      }
    }

    verifyPurchase();
  }, [sessionId, quantityParam, user]);

  if (verifying) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <h2 className="font-display text-xl font-semibold">Adicionando créditos...</h2>
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
          <h2 className="font-display text-2xl font-bold">Créditos Adicionados!</h2>
          <p className="mt-2 text-muted-foreground">
            {quantity} crédito{quantity > 1 ? 's' : ''} {quantity > 1 ? 'foram adicionados' : 'foi adicionado'} à sua conta.
          </p>
          
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-sage-light/30 px-6 py-4">
            <Coins className="h-6 w-6 text-sage" />
            <span className="font-display text-2xl font-bold">{newBalance}</span>
            <span className="text-muted-foreground">créditos disponíveis</span>
          </div>

          <Button 
            className="mt-8 bg-gradient-orange shadow-orange" 
            onClick={() => navigate('/dashboard')}
          >
            Ir para Minha Área
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreditosSucesso() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <CreditSuccessContent />
        </main>
      </div>
    </AuthProvider>
  );
}
