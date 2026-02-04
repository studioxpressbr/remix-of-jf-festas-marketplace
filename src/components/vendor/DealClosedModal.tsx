import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign } from 'lucide-react';

interface DealClosedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadAccessId: string;
  clientName: string;
  onSuccess: () => void;
}

export function DealClosedModal({
  open,
  onOpenChange,
  leadAccessId,
  clientName,
  onSuccess,
}: DealClosedModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor válido para o negócio.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads_access')
        .update({
          deal_closed: true,
          deal_value: numericValue,
          deal_closed_at: new Date().toISOString(),
        })
        .eq('id', leadAccessId);

      if (error) throw error;

      toast({
        title: 'Negócio registrado! 🎉',
        description: `Parabéns pelo fechamento de R$ ${numericValue.toFixed(2)}`,
      });

      setValue('');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Erro ao registrar',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Negócio Fechado</DialogTitle>
          <DialogDescription>
            Cliente: <span className="font-medium">{clientName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="value">Valor do Negócio</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="value"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Informe o valor total do serviço contratado
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !value}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
