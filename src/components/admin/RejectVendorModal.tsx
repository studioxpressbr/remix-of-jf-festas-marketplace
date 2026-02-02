import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const rejectSchema = z.object({
  rejection_reason: z
    .string()
    .trim()
    .min(10, 'O motivo deve ter pelo menos 10 caracteres')
    .max(500, 'O motivo deve ter no máximo 500 caracteres'),
});

type RejectFormData = z.infer<typeof rejectSchema>;

interface RejectVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorProfileId: string;
  vendorName: string;
  onReject: () => void;
}

export function RejectVendorModal({
  open,
  onOpenChange,
  vendorProfileId,
  vendorName,
  onReject,
}: RejectVendorModalProps) {
  const [saving, setSaving] = useState(false);

  const form = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      rejection_reason: '',
    },
  });

  const handleSubmit = async (data: RejectFormData) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          is_approved: false,
          approval_status: 'rejected',
          rejection_reason: data.rejection_reason,
        })
        .eq('profile_id', vendorProfileId);

      if (error) throw error;

      toast.success('Fornecedor rejeitado');
      form.reset();
      onOpenChange(false);
      onReject();
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      toast.error('Erro ao rejeitar fornecedor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Rejeitar Fornecedor
          </DialogTitle>
          <DialogDescription>
            Você está rejeitando o cadastro de <strong>{vendorName}</strong>. 
            Informe o motivo da rejeição para que o fornecedor possa corrigir os problemas.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rejection_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Rejeição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Imagens de baixa qualidade, descrição incompleta, categoria incorreta..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejeitando...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeitar Fornecedor
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
