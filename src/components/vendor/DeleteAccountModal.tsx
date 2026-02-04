import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  businessName: string;
}

export function DeleteAccountModal({
  open,
  onOpenChange,
  vendorId,
  businessName,
}: DeleteAccountModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  const isConfirmed = confirmation === 'EXCLUIR';

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setLoading(true);
    try {
      // Soft delete: deactivate vendor record
      const { error: vendorError } = await supabase
        .from('vendors')
        .update({
          is_approved: false,
          subscription_status: 'inactive',
          approval_status: 'deleted',
        })
        .eq('id', vendorId);

      if (vendorError) throw vendorError;

      // Deactivate all coupons
      await supabase
        .from('coupons')
        .update({ is_active: false })
        .eq('vendor_id', vendorId);

      // Sign out
      await supabase.auth.signOut();

      toast({
        title: 'Conta excluída',
        description: 'Sua conta foi desativada com sucesso.',
      });

      navigate('/');
    } catch (error) {
      toast({
        title: 'Erro ao excluir conta',
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">
            Excluir Conta Permanentemente
          </DialogTitle>
          <DialogDescription className="text-center">
            Esta ação é irreversível. Sua conta{' '}
            <span className="font-medium">{businessName}</span> será desativada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Você perderá acesso a:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Todas as cotações recebidas</li>
              <li>• Histórico de créditos</li>
              <li>• Cupons ativos</li>
              <li>• Avaliações recebidas</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Digite <span className="font-mono font-bold">EXCLUIR</span> para
              confirmar
            </Label>
            <Input
              id="confirmation"
              type="text"
              placeholder="EXCLUIR"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setConfirmation('');
              onOpenChange(false);
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || !isConfirmed}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir Conta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
