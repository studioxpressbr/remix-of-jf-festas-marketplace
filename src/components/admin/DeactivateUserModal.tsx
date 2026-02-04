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
import { AlertTriangle, UserX, Trash2, Loader2 } from 'lucide-react';

interface DeactivateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    full_name: string;
    email: string | null;
    role: 'vendor' | 'client';
  };
  mode: 'deactivate' | 'delete';
  onSuccess: () => void;
}

export function DeactivateUserModal({
  open,
  onOpenChange,
  user,
  mode,
  onSuccess,
}: DeactivateUserModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const isDelete = mode === 'delete';
  const confirmWord = isDelete ? 'EXCLUIR' : 'DESATIVAR';

  const handleAction = async () => {
    if (isDelete && confirmText !== confirmWord) {
      toast({
        title: 'Confirmação inválida',
        description: `Digite "${confirmWord}" para confirmar.`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      if (isDelete) {
        // Hard delete - mark as permanently deactivated
        const { error } = await supabase
          .from('profiles')
          .update({
            is_active: false,
            deactivated_at: new Date().toISOString(),
            deactivated_by: adminUser?.id,
            full_name: `[EXCLUÍDO] ${user.full_name}`,
          })
          .eq('id', user.id);

        if (error) throw error;

        toast({
          title: 'Usuário excluído',
          description: 'O usuário foi removido permanentemente.',
        });
      } else {
        // Soft delete - just deactivate
        const { error } = await supabase
          .from('profiles')
          .update({
            is_active: false,
            deactivated_at: new Date().toISOString(),
            deactivated_by: adminUser?.id,
          })
          .eq('id', user.id);

        if (error) throw error;

        toast({
          title: 'Usuário desativado',
          description: 'O usuário não poderá mais acessar a plataforma.',
        });
      }

      onSuccess();
      onOpenChange(false);
      setConfirmText('');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a ação. Tente novamente.',
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
            {isDelete ? (
              <Trash2 className="h-5 w-5 text-destructive" />
            ) : (
              <UserX className="h-5 w-5 text-destructive" />
            )}
            {isDelete ? 'Excluir Usuário' : 'Desativar Usuário'}
          </DialogTitle>
          <DialogDescription>
            {isDelete
              ? 'Esta ação é irreversível. O usuário será permanentemente removido.'
              : 'O usuário não poderá mais acessar a plataforma.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">{user.full_name}</p>
                <p className="text-sm text-muted-foreground">{user.email || 'Sem e-mail'}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {user.role === 'vendor' ? 'Fornecedor' : 'Cliente'}
                </p>
              </div>
            </div>
          </div>

          {isDelete && (
            <div className="space-y-2">
              <Label htmlFor="confirm">
                Digite <strong>{confirmWord}</strong> para confirmar:
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={confirmWord}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleAction}
            disabled={loading || (isDelete && confirmText !== confirmWord)}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isDelete ? (
              <Trash2 className="mr-2 h-4 w-4" />
            ) : (
              <UserX className="mr-2 h-4 w-4" />
            )}
            {isDelete ? 'Excluir Permanentemente' : 'Desativar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
