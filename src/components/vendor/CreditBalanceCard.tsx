import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Coins, Plus, Minus, ArrowUpRight, Gift, RefreshCw, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LEAD_PRICE } from '@/lib/constants';

interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface CreditBalanceCardProps {
  balance: number;
  transactions: CreditTransaction[];
  loading: boolean;
  onPurchase: (quantity: number) => void;
  purchaseLoading: boolean;
}

const TRANSACTION_ICONS: Record<string, React.ReactNode> = {
  purchase: <Plus className="h-4 w-4" />,
  lead_unlock: <ArrowUpRight className="h-4 w-4" />,
  refund: <RefreshCw className="h-4 w-4" />,
  bonus: <Gift className="h-4 w-4" />,
};

const TRANSACTION_COLORS: Record<string, string> = {
  purchase: 'bg-sage/20 text-sage',
  lead_unlock: 'bg-coral-light/30 text-coral-dark',
  refund: 'bg-champagne text-secondary-foreground',
  bonus: 'bg-sage-light text-accent-foreground',
};

const TRANSACTION_LABELS: Record<string, string> = {
  purchase: 'Compra',
  lead_unlock: 'Liberação',
  refund: 'Estorno',
  bonus: 'Bônus',
};

export function CreditBalanceCard({
  balance,
  transactions,
  loading,
  onPurchase,
  purchaseLoading,
}: CreditBalanceCardProps) {
  const [showHistory, setShowHistory] = useState(false);

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
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
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
