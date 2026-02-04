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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Gift, Loader2, AlertCircle, Users } from 'lucide-react';

interface AddBonusCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetVendor?: {
    id: string;
    full_name: string;
  } | null;
  onSuccess: () => void;
}

export function AddBonusCreditsModal({
  open,
  onOpenChange,
  targetVendor,
  onSuccess,
}: AddBonusCreditsModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<5 | 10>(5);
  const [allVendors, setAllVendors] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('add-bonus-credits', {
        body: allVendors
          ? { all: true, amount }
          : { vendorId: targetVendor?.id, amount },
      });

      if (error) throw error;

      toast({
        title: 'Créditos adicionados!',
        description: data.message,
      });

      onSuccess();
      onOpenChange(false);
      setAllVendors(false);
      setAmount(5);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar os créditos. Tente novamente.',
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
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-sage" />
            Adicionar Créditos Bônus
          </DialogTitle>
          <DialogDescription>
            Créditos bônus expiram em 10 dias após serem adicionados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Target selection */}
          <div className="space-y-3">
            <Label>Destinatário</Label>

            {targetVendor && !allVendors && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="font-medium">{targetVendor.full_name}</p>
                <p className="text-xs text-muted-foreground">Fornecedor individual</p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-vendors"
                checked={allVendors}
                onCheckedChange={(checked) => setAllVendors(checked === true)}
              />
              <label
                htmlFor="all-vendors"
                className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                Todos os fornecedores ativos
              </label>
            </div>
          </div>

          {/* Amount selection */}
          <div className="space-y-3">
            <Label>Quantidade de créditos</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={amount === 5 ? 'default' : 'outline'}
                onClick={() => setAmount(5)}
                className={amount === 5 ? 'bg-sage hover:bg-sage/90' : ''}
              >
                5 créditos
              </Button>
              <Button
                type="button"
                variant={amount === 10 ? 'default' : 'outline'}
                onClick={() => setAmount(10)}
                className={amount === 10 ? 'bg-sage hover:bg-sage/90' : ''}
              >
                10 créditos
              </Button>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm">
              Os créditos bônus expiram automaticamente após <strong>10 dias</strong>. 
              Use-os para incentivar fornecedores a liberarem contatos de clientes.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (!targetVendor && !allVendors)}
            className="bg-sage hover:bg-sage/90"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Gift className="mr-2 h-4 w-4" />
            )}
            Adicionar {amount} Créditos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
