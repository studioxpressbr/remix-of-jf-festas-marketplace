import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Coins, Plus, ArrowUpRight, Gift, RefreshCw, History, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LEAD_PRICE } from '@/lib/constants';

interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
  expires_at?: string | null;
}

interface ExpiringBonus {
  amount: number;
  expires_at: string;
  days_remaining: number;
}

interface CreditBalanceCardProps {
  balance: number;
  transactions: CreditTransaction[];
  loading: boolean;
  onPurchase: (quantity: number) => void;
  purchaseLoading: boolean;
  vendorId?: string;
}

const TRANSACTION_ICONS: Record<string, React.ReactNode> = {
  purchase: <Plus className="h-4 w-4" />,
  lead_unlock: <ArrowUpRight className="h-4 w-4" />,
  refund: <RefreshCw className="h-4 w-4" />,
  bonus: <Gift className="h-4 w-4" />,
  bonus_expiration: <Clock className="h-4 w-4" />,
};

const TRANSACTION_COLORS: Record<string, string> = {
  purchase: 'bg-sage/20 text-sage',
  lead_unlock: 'bg-coral-light/30 text-coral-dark',
  refund: 'bg-champagne text-secondary-foreground',
  bonus: 'bg-sage-light text-accent-foreground',
  bonus_expiration: 'bg-destructive/20 text-destructive',
};

const TRANSACTION_LABELS: Record<string, string> = {
  purchase: 'Compra',
  lead_unlock: 'Liberação',
  refund: 'Estorno',
  bonus: 'Bônus',
  bonus_expiration: 'Expirado',
};

export function CreditBalanceCard({
  balance,
  transactions,
  loading,
  onPurchase,
  purchaseLoading,
  vendorId,
}: CreditBalanceCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [expiringCredits, setExpiringCredits] = useState<ExpiringBonus[]>([]);

  useEffect(() => {
    if (vendorId) {
      fetchExpiringCredits();
    }
  }, [vendorId, transactions]);

  const fetchExpiringCredits = async () => {
    if (!vendorId) return;

    // Find bonus transactions that haven't expired yet
    const bonusTransactions = transactions.filter(
      (tx) =>
        tx.transaction_type === 'bonus' &&
        tx.expires_at &&
        new Date(tx.expires_at) > new Date()
    );

    const expiring = bonusTransactions.map((tx) => {
      const expiresAt = new Date(tx.expires_at!);
      const now = new Date();
      const diffTime = expiresAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        amount: tx.amount,
        expires_at: tx.expires_at!,
        days_remaining: diffDays,
      };
    });

    setExpiringCredits(expiring.filter((e) => e.days_remaining > 0 && e.days_remaining <= 10));
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card">
        <CardContent className="py-6">
          <Skeleton className="mb-4 h-20 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  const totalExpiringAmount = expiringCredits.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Card className="overflow-hidden border-2 border-sage/30 bg-gradient-to-br from-sage-light/30 to-background">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="h-5 w-5 text-sage" />
          Saldo de Créditos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold">{balance}</span>
          <span className="text-muted-foreground">
            crédito{balance !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Expiring Credits Warning */}
        {expiringCredits.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <Gift className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">
                {totalExpiringAmount} crédito{totalExpiringAmount !== 1 ? 's' : ''} bônus expirando
              </p>
              <p className="text-xs opacity-80">
                {expiringCredits.map((e, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    {e.amount} em {e.days_remaining} dia{e.days_remaining !== 1 ? 's' : ''}
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Cada crédito libera o contato de 1 cliente (R$ {LEAD_PRICE} por crédito)
        </p>

        {/* Purchase Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPurchase(5)}
            disabled={purchaseLoading}
            className="border-sage hover:bg-sage/20"
          >
            +5 créditos
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPurchase(10)}
            disabled={purchaseLoading}
            className="border-sage hover:bg-sage/20"
          >
            +10 créditos
          </Button>
          <Button
            size="sm"
            onClick={() => onPurchase(20)}
            disabled={purchaseLoading}
            className="bg-gradient-coral shadow-coral"
          >
            +20 créditos
          </Button>
        </div>

        {/* Toggle History */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <History className="mr-2 h-4 w-4" />
          {showHistory ? 'Ocultar extrato' : 'Ver extrato completo'}
        </Button>

        {/* Transaction History */}
        {showHistory && (
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-3">
            {transactions.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma transação ainda
              </p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-md bg-background p-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn('rounded-full p-1.5', TRANSACTION_COLORS[tx.transaction_type] || 'bg-muted')}>
                      {TRANSACTION_ICONS[tx.transaction_type] || <Coins className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {tx.description || TRANSACTION_LABELS[tx.transaction_type] || tx.transaction_type}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {tx.transaction_type === 'bonus' && tx.expires_at && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            Expira {format(new Date(tx.expires_at), "dd/MM", { locale: ptBR })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-mono',
                        tx.amount > 0 ? 'border-sage text-sage' : 'border-coral-light text-coral-dark'
                      )}
                    >
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Saldo: {tx.balance_after}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
