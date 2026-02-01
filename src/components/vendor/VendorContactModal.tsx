import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, User, Phone, Mail } from 'lucide-react';

const contactSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  whatsapp: z
    .string()
    .trim()
    .min(10, 'WhatsApp deve ter pelo menos 10 dígitos')
    .max(20, 'WhatsApp deve ter no máximo 20 caracteres')
    .regex(/^[\d\s()+-]+$/, 'Formato de telefone inválido'),
  email: z
    .string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ProfileData {
  id: string;
  full_name: string;
  whatsapp: string | null;
  email: string | null;
}

interface VendorContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: ProfileData;
  onSave: () => void;
}

export function VendorContactModal({
  open,
  onOpenChange,
  profileData,
  onSave,
}: VendorContactModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      full_name: profileData.full_name || '',
      whatsapp: profileData.whatsapp || '',
      email: profileData.email || '',
    },
    mode: 'onChange',
  });

  // Reset form when profile data changes
  useEffect(() => {
    if (profileData) {
      form.reset({
        full_name: profileData.full_name || '',
        whatsapp: profileData.whatsapp || '',
        email: profileData.email || '',
      });
    }
  }, [profileData, form]);

  const onSubmit = async (data: ContactFormData) => {
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          whatsapp: data.whatsapp,
          email: data.email,
        })
        .eq('id', profileData.id);

      if (error) throw error;

      toast({
        title: 'Contato atualizado!',
        description: 'Seus dados de contato foram salvos com sucesso.',
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Dados de Contato</DialogTitle>
          <DialogDescription>
            Atualize suas informações de contato. Esses dados serão compartilhados com os clientes quando você liberar uma cotação.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome completo
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    WhatsApp
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
                  </FormControl>
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
                  'Salvar'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
