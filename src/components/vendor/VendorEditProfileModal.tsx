import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ImageUpload } from '@/components/vendor/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { VENDOR_CATEGORIES } from '@/lib/constants';
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
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

const editProfileSchema = z.object({
  business_name: z
    .string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  category: z.enum(['confeitaria', 'doces', 'salgados', 'decoracao', 'outros'], {
    required_error: 'Selecione uma categoria',
  }),
  custom_category: z.string().optional(),
  description: z
    .string()
    .trim()
    .min(20, 'Descrição deve ter pelo menos 20 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  neighborhood: z
    .string()
    .trim()
    .min(2, 'Bairro é obrigatório')
    .max(100, 'Bairro deve ter no máximo 100 caracteres'),
  images: z.array(z.string()).min(1, 'Adicione pelo menos 1 imagem'),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface VendorData {
  id: string;
  business_name: string;
  category: 'confeitaria' | 'doces' | 'salgados' | 'decoracao' | 'outros';
  custom_category: string | null;
  description: string | null;
  neighborhood: string | null;
  images: string[] | null;
}

interface VendorEditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorData: VendorData;
  onSave: () => void;
}

export function VendorEditProfileModal({
  open,
  onOpenChange,
  vendorData,
  onSave,
}: VendorEditProfileModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      business_name: vendorData.business_name || '',
      category: vendorData.category || 'outros',
      custom_category: vendorData.custom_category || '',
      description: vendorData.description || '',
      neighborhood: vendorData.neighborhood || '',
      images: vendorData.images || [],
    },
    mode: 'onChange',
  });

  const watchCategory = form.watch('category');

  // Reset form when vendor data changes
  useEffect(() => {
    if (vendorData) {
      form.reset({
        business_name: vendorData.business_name || '',
        category: vendorData.category || 'outros',
        custom_category: vendorData.custom_category || '',
        description: vendorData.description || '',
        neighborhood: vendorData.neighborhood || '',
        images: vendorData.images || [],
      });
    }
  }, [vendorData, form]);

  const onSubmit = async (data: EditProfileFormData) => {
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          business_name: data.business_name,
          category: data.category,
          custom_category: data.category === 'outros' ? data.custom_category : null,
          description: data.description,
          neighborhood: data.neighborhood,
          images: data.images,
          // Reset approval when editing - requires re-approval
          approval_status: 'pending',
          is_approved: false,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', vendorData.id);

      if (error) throw error;

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas alterações serão revisadas em até 48 horas.',
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
          <DialogTitle className="font-display text-xl">Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize as informações do seu negócio. As alterações passarão por revisão.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-coral-light bg-coral-light/20">
          <AlertCircle className="h-4 w-4 text-coral-dark" />
          <AlertDescription className="text-coral-dark">
            Ao editar o perfil, ele será enviado para revisão e ficará temporariamente
            invisível até a aprovação (24-48h).
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do negócio *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Doces da Maria" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                    >
                      {VENDOR_CATEGORIES.map((cat) => (
                        <Label
                          key={cat.value}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-colors hover:bg-muted',
                            field.value === cat.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border'
                          )}
                        >
                          <RadioGroupItem value={cat.value} />
                          <span>{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchCategory === 'outros' && (
              <FormField
                control={form.control}
                name="custom_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual é a sua categoria? *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Buffet, Fotografia, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro de atuação *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Centro, Zona Sul" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva seu negócio, produtos/serviços oferecidos, diferenciais..."
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
                  <FormLabel>Fotos do seu trabalho *</FormLabel>
                  <FormControl>
                    <ImageUpload
                      images={field.value}
                      onChange={field.onChange}
                      maxImages={5}
                    />
                  </FormControl>
                  <FormDescription>
                    A primeira imagem será a capa do seu perfil.
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
