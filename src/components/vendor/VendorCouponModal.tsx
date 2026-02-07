import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const couponSchema = z.object({
  code: z.string().min(3, 'Código deve ter pelo menos 3 caracteres').max(20, 'Código muito longo'),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().positive('Valor deve ser maior que zero'),
  max_uses: z.number().int().positive().optional().nullable(),
  min_order_value: z.number().positive().optional().nullable(),
});

type CouponFormData = z.infer<typeof couponSchema>;

interface VendorCouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  onSuccess: () => void;
}

export function VendorCouponModal({
  open,
  onOpenChange,
  vendorId,
  onSuccess,
}: VendorCouponModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      discount_type: 'percentage',
      discount_value: undefined,
      max_uses: null,
      min_order_value: null,
    },
  });

  const discountType = watch('discount_type');

  const onSubmit = async (data: CouponFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('coupons').insert({
        vendor_id: vendorId,
        code: data.code.toUpperCase().trim(),
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        max_uses: data.max_uses || null,
        min_order_value: data.min_order_value || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Código já existe',
            description: 'Este código de cupom já está em uso.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: 'Cupom criado!',
        description: 'Seu cupom está ativo e expira em 7 dias.',
      });

      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Erro ao criar cupom',
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
          <DialogTitle>Novo Cupom de Desconto</DialogTitle>
          <DialogDescription>
            Cupons expiram automaticamente em 7 dias.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código do Cupom</Label>
            <Input
              id="code"
              placeholder="EX: DESCONTO10"
              {...register('code')}
              className="uppercase"
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount_type">Tipo de Desconto</Label>
            <Select
              value={discountType}
              onValueChange={(value: 'percentage' | 'fixed') =>
                setValue('discount_type', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentual (%)</SelectItem>
                <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount_value">
              Valor do Desconto {discountType === 'percentage' ? '(%)' : '(R$)'}
            </Label>
            <Input
              id="discount_value"
              type="number"
              step={discountType === 'percentage' ? '1' : '0.01'}
              min="0"
              placeholder={discountType === 'percentage' ? '10' : '50.00'}
              {...register('discount_value', { valueAsNumber: true })}
            />
            {errors.discount_value && (
              <p className="text-sm text-destructive">
                {errors.discount_value.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_uses">Limite de Usos (opcional)</Label>
            <Input
              id="max_uses"
              type="number"
              min="1"
              placeholder="Ilimitado"
              {...register('max_uses', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para uso ilimitado
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_order_value">Pedido Mínimo (R$) (opcional)</Label>
            <Input
              id="min_order_value"
              type="number"
              step="0.01"
              min="0"
              placeholder="Sem valor mínimo"
              {...register('min_order_value', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco se não houver valor mínimo
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Cupom'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
