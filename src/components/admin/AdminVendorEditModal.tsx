import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/vendor/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Loader2, Shield } from 'lucide-react';

const adminEditSchema = z.object({
  description: z
    .string()
    .trim()
    .min(20, 'Descrição deve ter pelo menos 20 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  images: z.array(z.string()).min(1, 'Adicione pelo menos 1 imagem'),
});

type AdminEditFormData = z.infer<typeof adminEditSchema>;

interface AdminVendorEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorData: {
    id: string;
    description: string | null;
    images: string[] | null;
  };
  onSave: () => void;
}

export function AdminVendorEditModal({
  open,
  onOpenChange,
  vendorData,
  onSave,
}: AdminVendorEditModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AdminEditFormData>({
    resolver: zodResolver(adminEditSchema),
    defaultValues: {
      description: vendorData.description || '',
      images: vendorData.images || [],
    },
    mode: 'onChange',
  });

  // Reset form when vendor data changes
  useEffect(() => {
    if (vendorData) {
      form.reset({
        description: vendorData.description || '',
        images: vendorData.images || [],
      });
    }
  }, [vendorData, form]);

  const onSubmit = async (data: AdminEditFormData) => {
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          description: data.description,
          images: data.images,
          // Admin edit does NOT reset approval status
        })
        .eq('id', vendorData.id);

      if (error) throw error;

      toast({
        title: 'Perfil atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      });

      onOpenChange(false);
      onSave();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Shield className="h-5 w-5 text-primary" />
            Edição Administrativa
          </DialogTitle>
          <DialogDescription>
            Edite a descrição e imagens do fornecedor. O status de aprovação será mantido.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o negócio, produtos/serviços oferecidos, diferenciais..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/500 caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fotos do trabalho *</FormLabel>
                  <FormControl>
                    <ImageUpload
                      images={field.value}
                      onChange={field.onChange}
                      maxImages={5}
                    />
                  </FormControl>
                  <FormDescription>
                    A primeira imagem será a capa do perfil.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-coral shadow-coral"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar alterações'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
